import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { database } from '../database';
import { clinics as clinicsTable, patients as patientsTable } from '../database/schema';
import { logAuditEvent } from '../utils/audit-log';
import { getClientIP } from '../utils/ip-tracking';
import { validateLogoPayload } from '../utils/logo-upload';
import { getSafeUserAgent } from '../utils/request-headers';
import { sanitizePathParam } from '../utils/sanitization';
import { checkLogoUploadRateLimit } from '../utils/action-rate-limit';

const clinicsRoutes = new Hono();

/** Valida clinicId del path; devuelve null si es inválido (evita inyección / log forging). */
function getValidatedClinicId(c: { req: { param: (name: string) => string } }): string | null {
  return sanitizePathParam(c.req.param('clinicId'), 64);
}

clinicsRoutes.use('*', requireAuth);

function canAccessClinic(user: { role: string; clinicId?: string }, clinicId: string): boolean {
  if (user.role === 'super_admin' || user.role === 'admin') return true;
  return user.clinicId === clinicId;
}

function canEditClinic(user: { role: string; clinicId?: string }, clinicId: string): boolean {
  if (user.role === 'super_admin') return true;
  return user.role === 'clinic_admin' && user.clinicId === clinicId;
}

/**
 * GET /api/clinics/:clinicId
 * Obtiene una clínica por ID
 */
clinicsRoutes.get('/:clinicId', async (c) => {
  const clinicId = getValidatedClinicId(c);
  if (!clinicId) return c.json({ error: 'clinicId inválido' }, 400);
  const user = c.get('user');
  if (!user || !canAccessClinic(user, clinicId)) {
    return c.json({ error: 'Acceso denegado' }, 403);
  }
  const rows = await database.select().from(clinicsTable).where(eq(clinicsTable.clinicId, clinicId)).limit(1);
  const row = rows[0];
  if (!row) return c.json({ error: 'Clínica no encontrada' }, 404);
  return c.json({
    success: true,
    clinic: {
      clinicId: row.clinicId,
      clinicName: row.clinicName,
      clinicCode: row.clinicCode,
      ownerId: row.ownerId,
      phone: row.phone ?? '',
      email: row.email ?? '',
      address: row.address ?? '',
      city: row.city ?? '',
      postalCode: row.postalCode ?? '',
      licenseNumber: row.licenseNumber ?? '',
      website: row.website ?? '',
      consentText: row.consentText ?? '',
      consentTextVersion: row.consentTextVersion ?? 0,
    },
  });
});

/**
 * PATCH /api/clinics/:clinicId
 * Actualiza datos de la clínica (sin logo)
 */
clinicsRoutes.patch('/:clinicId', async (c) => {
  const clinicId = getValidatedClinicId(c);
  if (!clinicId) return c.json({ error: 'clinicId inválido' }, 400);
  const user = c.get('user');
  if (!user || !canEditClinic(user, clinicId)) {
    return c.json({ error: 'Acceso denegado' }, 403);
  }
  const body = await c.req.json().catch(() => ({})) as Record<string, unknown>;
  const updates: Record<string, unknown> = {};
  const allowed = ['phone', 'email', 'address', 'city', 'postalCode', 'licenseNumber', 'website', 'consentText'];
  for (const k of allowed) {
    if (body[k] !== undefined) updates[k] = body[k];
  }
  if (updates.consentText !== undefined) {
    updates.consentText = String(updates.consentText ?? '').trim() || null;
    const current = await database.select({ consentText: clinicsTable.consentText, consentTextVersion: clinicsTable.consentTextVersion }).from(clinicsTable).where(eq(clinicsTable.clinicId, clinicId)).limit(1);
    const cur = current[0];
    if (String(updates.consentText || '') !== String(cur?.consentText ?? '')) {
      const newVersion = (cur?.consentTextVersion ?? 0) + 1;
      updates.consentTextVersion = newVersion;
      // Pacientes que dieron consentimiento a versión antigua: borrar DNI y resetear consentimiento
      const clinicPatients = await database.select().from(patientsTable).where(eq(patientsTable.clinicId, clinicId));
      for (const p of clinicPatients) {
        let consentedToVersion: number | null = null;
        try {
          const parsed = p.consent ? JSON.parse(p.consent) : {};
          consentedToVersion = parsed.consentedToVersion ?? null;
        } catch { /* ignore */ }
        if (consentedToVersion != null && consentedToVersion < newVersion) {
          await database.update(patientsTable).set({
            idNumber: '',
            consent: JSON.stringify({ given: false, date: null, consentedToVersion: null }),
            updatedAt: new Date().toISOString(),
          }).where(eq(patientsTable.id, p.id));
        }
      }
    }
  }
  if (Object.keys(updates).length === 0) {
    return c.json({ success: true, clinic: (await database.select().from(clinicsTable).where(eq(clinicsTable.clinicId, clinicId)).limit(1))[0] });
  }
  const rows = await database.select().from(clinicsTable).where(eq(clinicsTable.clinicId, clinicId)).limit(1);
  if (!rows[0]) return c.json({ error: 'Clínica no encontrada' }, 404);
  // Si consentTextVersion se calcula después del select, aplicar updates
  await database.update(clinicsTable).set(updates as Record<string, unknown>).where(eq(clinicsTable.clinicId, clinicId));
  await logAuditEvent({
    userId: user.userId,
    action: 'UPDATE',
    resourceType: 'clinic',
    resourceId: clinicId,
    details: { action: 'clinic_info_update', clinicId, ...updates },
    ipAddress: getClientIP(c.req.raw.headers),
    userAgent: getSafeUserAgent(c),
    clinicId,
  });
  const updated = (await database.select().from(clinicsTable).where(eq(clinicsTable.clinicId, clinicId)).limit(1))[0];
  return c.json({
    success: true,
    clinic: {
      clinicId: updated.clinicId,
      clinicName: updated.clinicName,
      clinicCode: updated.clinicCode,
      ownerId: updated.ownerId,
      phone: updated.phone ?? '',
      email: updated.email ?? '',
      address: updated.address ?? '',
      city: updated.city ?? '',
      postalCode: updated.postalCode ?? '',
      licenseNumber: updated.licenseNumber ?? '',
      website: updated.website ?? '',
      consentText: updated.consentText ?? '',
      consentTextVersion: updated.consentTextVersion ?? 0,
    },
  });
});

/**
 * GET /api/clinics/:clinicId/logo
 * Obtiene el logo de la clínica
 */
clinicsRoutes.get('/:clinicId/logo', async (c) => {
  const clinicId = getValidatedClinicId(c);
  if (!clinicId) return c.json({ error: 'clinicId inválido' }, 400);
  const user = c.get('user');
  if (!user || !canAccessClinic(user, clinicId)) {
    return c.json({ error: 'Acceso denegado' }, 403);
  }
  const rows = await database.select({ logo: clinicsTable.logo }).from(clinicsTable).where(eq(clinicsTable.clinicId, clinicId)).limit(1);
  const logo = rows[0]?.logo ?? null;
  return c.json({ success: true, logo });
});

/**
 * PUT /api/clinics/:clinicId/logo
 * Establece el logo de la clínica (body: { logo: string })
 */
clinicsRoutes.put('/:clinicId/logo', async (c) => {
  const clinicId = getValidatedClinicId(c);
  if (!clinicId) return c.json({ error: 'clinicId inválido' }, 400);
  const user = c.get('user');
  if (!user || !canEditClinic(user, clinicId)) {
    return c.json({ error: 'Acceso denegado' }, 403);
  }
  const body = await c.req.json().catch(() => ({})) as { logo?: string };
  if (body.logo === undefined) return c.json({ error: 'Campo logo requerido' }, 400);

  const logoRateLimit = await checkLogoUploadRateLimit(user.userId);
  if (!logoRateLimit.allowed) {
    c.header('Retry-After', String(logoRateLimit.retryAfterSeconds ?? 60));
    return c.json(
      { error: 'rate_limit', message: 'Demasiadas subidas de logo. Espera un momento.' },
      429
    );
  }

  const validation = validateLogoPayload(body.logo);
  if (!validation.valid) {
    await logAuditEvent({
      userId: user.userId,
      action: 'LOGO_UPLOAD_REJECTED',
      resourceType: 'logo',
      resourceId: clinicId,
      details: { reason: validation.error, clinicId },
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
      clinicId: user.clinicId ?? undefined,
    });
    return c.json({ error: validation.error, message: validation.message }, 400);
  }
  const rows = await database.select().from(clinicsTable).where(eq(clinicsTable.clinicId, clinicId)).limit(1);
  if (!rows[0]) return c.json({ error: 'Clínica no encontrada' }, 404);
  await database.update(clinicsTable).set({ logo: validation.sanitized }).where(eq(clinicsTable.clinicId, clinicId));
  await logAuditEvent({
    userId: user.userId,
    action: 'UPDATE',
    resourceType: 'logo',
    resourceId: clinicId,
    details: { action: 'clinic_logo_upload', clinicId },
    ipAddress: getClientIP(c.req.raw.headers),
    userAgent: getSafeUserAgent(c),
    clinicId,
  });
  return c.json({ success: true });
});

/**
 * DELETE /api/clinics/:clinicId/logo
 * Elimina el logo de la clínica
 */
clinicsRoutes.delete('/:clinicId/logo', async (c) => {
  const clinicId = getValidatedClinicId(c);
  if (!clinicId) return c.json({ error: 'clinicId inválido' }, 400);
  const user = c.get('user');
  if (!user || !canEditClinic(user, clinicId)) {
    return c.json({ error: 'Acceso denegado' }, 403);
  }
  const rows = await database.select().from(clinicsTable).where(eq(clinicsTable.clinicId, clinicId)).limit(1);
  if (!rows[0]) return c.json({ error: 'Clínica no encontrada' }, 404);
  await database.update(clinicsTable).set({ logo: null }).where(eq(clinicsTable.clinicId, clinicId));
  await logAuditEvent({
    userId: user.userId,
    action: 'DELETE',
    resourceType: 'logo',
    resourceId: clinicId,
    details: { action: 'clinic_logo_remove', clinicId },
    ipAddress: getClientIP(c.req.raw.headers),
    userAgent: getSafeUserAgent(c),
    clinicId,
  });
  return c.json({ success: true });
});

export default clinicsRoutes;
