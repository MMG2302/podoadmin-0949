import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/authorization';
import { database } from '../database';
import { clinics as clinicsTable, patients as patientsTable, clinicCredits as clinicCreditsTable, createdUsers as createdUsersTable } from '../database/schema';
import { logAuditEvent } from '../utils/audit-log';
import { getClientIP } from '../utils/ip-tracking';
import { validateLogoPayload } from '../utils/logo-upload';
import { getR2Bucket, resolveLogoForClient, persistLogoPayload } from '../utils/r2-media';
import { purgeLogoR2 } from '../utils/r2-purge';
import { getSafeUserAgent } from '../utils/request-headers';
import { sanitizePathParam } from '../utils/sanitization';
import { checkLogoUploadRateLimit } from '../utils/action-rate-limit';
import {
  EDIT_COOLDOWN_MS,
  canBypassEditCooldown,
  getNextEditAllowedAt,
  isWithinEditCooldown,
  parseEditCooldownScopes,
} from '../utils/edit-cooldown';
import { validateData, createClinicSchema } from '../utils/validation';

const clinicsRoutes = new Hono();

/** @deprecated use edit-cooldown utils */
const COOLDOWN_DAYS = 15;
const COOLDOWN_MS = EDIT_COOLDOWN_MS;

function canBypassCooldown(user: { role: string }): boolean {
  return canBypassEditCooldown(user);
}

function isWithinCooldown(lastUpdatedAt: string | null | undefined): boolean {
  return isWithinEditCooldown(lastUpdatedAt);
}

function getNextAllowedAt(lastUpdatedAt: string | null | undefined): string | null {
  return getNextEditAllowedAt(lastUpdatedAt);
}

/** Valida clinicId del path; devuelve null si es inválido (evita inyección / log forging). */
function getValidatedClinicId(c: { req: { param: (name: string) => string } }): string | null {
  return sanitizePathParam(c.req.param('clinicId'), 64);
}

clinicsRoutes.use('*', requireAuth);

/**
 * GET /api/clinics
 * Lista todas las clínicas (solo super_admin, admin)
 */
clinicsRoutes.get('/', requireRole('super_admin', 'admin'), async (c) => {
  try {
    const rows = await database.select().from(clinicsTable).orderBy(clinicsTable.clinicName);
    // Contar podólogos por clínica (solo para super_admin)
    const clinicIds = rows.map((r) => r.clinicId);
    let podiatristCounts: Record<string, number> = {};
    if (clinicIds.length > 0) {
      const podiatristRows = await database
        .select({ clinicId: createdUsersTable.clinicId })
        .from(createdUsersTable)
        .where(and(eq(createdUsersTable.role, 'podiatrist')));
      for (const p of podiatristRows) {
        if (p.clinicId) podiatristCounts[p.clinicId] = (podiatristCounts[p.clinicId] ?? 0) + 1;
      }
    }
    return c.json({
      success: true,
      clinics: rows.map((r) => ({
        clinicId: r.clinicId,
        clinicName: r.clinicName,
        clinicCode: r.clinicCode,
        ownerId: r.ownerId,
        phone: r.phone ?? '',
        email: r.email ?? '',
        address: r.address ?? '',
        city: r.city ?? '',
        postalCode: r.postalCode ?? '',
        countryCode: r.countryCode ?? 'MX',
        podiatristLimit: r.podiatristLimit ?? null,
        podiatristCount: podiatristCounts[r.clinicId] ?? 0,
      })),
    });
  } catch (error) {
    console.error('Error listando clínicas:', error);
    return c.json({ error: 'Error interno', message: 'Error al listar clínicas' }, 500);
  }
});

/**
 * POST /api/clinics
 * Crea una nueva clínica (solo super_admin)
 */
clinicsRoutes.post('/', requireRole('super_admin'), async (c) => {
  try {
    const rawBody = await c.req.json().catch(() => ({}));
    const validation = validateData(createClinicSchema, rawBody);
    if (!validation.success) {
      return c.json({ error: 'Datos inválidos', message: validation.error, issues: validation.issues }, 400);
    }

    const { ownerId, phone, email, address, city, postalCode, countryCode, licenseNumber, website, podiatristLimit } = validation.data;
    const user = c.get('user');

    let clinicId = (validation.data.clinicId || '').trim();
    if (!clinicId) {
      const existingIds = await database.select({ clinicId: clinicsTable.clinicId }).from(clinicsTable);
      const numbers = existingIds
        .map((r) => {
          const m = r.clinicId.match(/^clinic_(\d+)$/);
          return m ? parseInt(m[1], 10) : 0;
        })
        .filter((n) => n > 0);
      const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
      clinicId = `clinic_${String(nextNum).padStart(3, '0')}`;
    }

    const existing = await database.select().from(clinicsTable).where(eq(clinicsTable.clinicId, clinicId)).limit(1);
    if (existing.length) {
      return c.json({ error: 'Datos inválidos', message: 'Ya existe una clínica con este ID' }, 400);
    }

    let clinicName = (validation.data.clinicName || '').trim();
    let clinicCode = (validation.data.clinicCode || '').trim();
    if (!clinicName) clinicName = 'Clínica pendiente de configuración';
    if (!clinicCode) {
      const existingCodes = await database.select({ clinicCode: clinicsTable.clinicCode }).from(clinicsTable);
      const codeNums = existingCodes
        .map((r) => {
          const m = (r.clinicCode || '').match(/^C(\d+)$/);
          return m ? parseInt(m[1], 10) : 0;
        })
        .filter((n) => n > 0);
      const nextCodeNum = codeNums.length > 0 ? Math.max(...codeNums) + 1 : 1;
      clinicCode = `C${String(nextCodeNum).padStart(3, '0')}`;
    }

    const existingCode = await database.select().from(clinicsTable).where(eq(clinicsTable.clinicCode, clinicCode)).limit(1);
    if (existingCode.length) {
      return c.json({ error: 'Datos inválidos', message: 'Ya existe una clínica con este código' }, 400);
    }

    const { defaultPodiatristLimitForNewClinic } = await import('../utils/billing-pricing');
    const now = new Date().toISOString();
    const pl =
      podiatristLimit != null && !Number.isNaN(Number(podiatristLimit))
        ? Math.max(0, Math.floor(Number(podiatristLimit)))
        : defaultPodiatristLimitForNewClinic();
    await database.insert(clinicsTable).values({
      clinicId,
      clinicName,
      clinicCode,
      ownerId,
      logo: null,
      podiatristLimit: pl,
      phone: (phone || '').trim() || null,
      email: (email || '').trim() || null,
      address: (address || '').trim() || null,
      city: (city || '').trim() || null,
      postalCode: (postalCode || '').trim() || null,
      countryCode: countryCode ?? 'MX',
      licenseNumber: (licenseNumber || '').trim() || null,
      website: (website || '').trim() || null,
      consentText: null,
      consentTextVersion: 0,
      createdAt: now,
    });

    await database.insert(clinicCreditsTable).values({
      clinicId,
      totalCredits: 0,
      distributedToDate: 0,
      createdAt: now,
      updatedAt: now,
    });

    await logAuditEvent({
      userId: user!.userId,
      action: 'CREATE',
      resourceType: 'clinic',
      resourceId: clinicId,
      details: { clinicName, clinicCode, ownerId },
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
      clinicId,
    });

    const row = (await database.select().from(clinicsTable).where(eq(clinicsTable.clinicId, clinicId)).limit(1))[0]!;
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
      },
    }, 201);
  } catch (error: any) {
    console.error('Error creando clínica:', error);
    return c.json({ error: 'Error al crear clínica', message: error.message || 'Error desconocido' }, 400);
  }
});

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
  const canEdit = canEditClinic(user, clinicId);
  const podiatristCount = (await database.select().from(createdUsersTable).where(and(eq(createdUsersTable.clinicId, clinicId), eq(createdUsersTable.role, 'podiatrist')))).length;
  const clinicRow = row as typeof row & { podiatristLimit?: number | null };
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
      countryCode: row.countryCode ?? 'MX',
      licenseNumber: row.licenseNumber ?? '',
      legalName: row.legalName ?? '',
      rfc: row.rfc ?? '',
      clues: row.clues ?? '',
      establishmentType: row.establishmentType ?? 'private_office',
      cofeprisRegistration: row.cofeprisRegistration ?? '',
      website: row.website ?? '',
      consentText: row.consentText ?? '',
      consentTextVersion: row.consentTextVersion ?? 0,
      podiatristLimit: clinicRow.podiatristLimit ?? null,
      podiatristCount,
    },
    ...(canEdit && {
      infoBlockedUntil: isWithinCooldown(row.infoUpdatedAt) ? getNextAllowedAt(row.infoUpdatedAt) : null,
      logoBlockedUntil: isWithinCooldown(row.logoUpdatedAt) ? getNextAllowedAt(row.logoUpdatedAt) : null,
    }),
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
  let clinicRows = await database.select().from(clinicsTable).where(eq(clinicsTable.clinicId, clinicId)).limit(1);
  if (!clinicRows[0]) return c.json({ error: 'Clínica no encontrada' }, 404);
  if (!canBypassCooldown(user) && isWithinCooldown(clinicRows[0].infoUpdatedAt)) {
    const nextAt = getNextAllowedAt(clinicRows[0].infoUpdatedAt);
    c.header('Retry-After', String(Math.ceil((new Date(nextAt!).getTime() - Date.now()) / 1000)));
    return c.json({
      error: 'cooldown',
      message: `Los datos de la clínica solo pueden modificarse cada ${COOLDOWN_DAYS} días. Próximo cambio permitido: ${nextAt}`,
      infoBlockedUntil: nextAt,
    }, 429);
  }
  const body = await c.req.json().catch(() => ({})) as Record<string, unknown>;
  const updates: Record<string, unknown> = {};
  const allowed = ['clinicName', 'clinicCode', 'phone', 'email', 'address', 'city', 'postalCode', 'countryCode', 'licenseNumber', 'website', 'consentText', 'legalName', 'rfc', 'clues', 'establishmentType', 'cofeprisRegistration'];
  for (const k of allowed) {
    if (body[k] !== undefined) updates[k] = body[k];
  }
  // podiatrist_limit: solo super_admin
  if (user.role === 'super_admin' && body.podiatristLimit !== undefined) {
    const v = body.podiatristLimit;
    if (v === null || v === '') updates.podiatristLimit = null;
    else {
      const n = typeof v === 'number' ? v : parseInt(String(v), 10);
      if (!Number.isNaN(n) && n >= 0) updates.podiatristLimit = n;
    }
  }
  if (updates.countryCode !== undefined) {
    const { isTenantCountryCode } = await import('../../lib/phone-country');
    const code = String(updates.countryCode || 'MX');
    updates.countryCode = isTenantCountryCode(code) ? code : 'MX';
  }
  if (updates.clinicName !== undefined && String(updates.clinicName || '').trim() === '') {
    return c.json({ error: 'Datos inválidos', message: 'El nombre de la clínica no puede estar vacío' }, 400);
  }
  if (updates.clinicCode !== undefined) {
    const code = String(updates.clinicCode || '').trim();
    if (!code) return c.json({ error: 'Datos inválidos', message: 'El código de la clínica no puede estar vacío' }, 400);
    const existingCode = await database.select().from(clinicsTable).where(eq(clinicsTable.clinicCode, code)).limit(1);
    if (existingCode.length && existingCode[0].clinicId !== clinicId) {
      return c.json({ error: 'Datos inválidos', message: 'Ya existe otra clínica con este código' }, 400);
    }
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
    return c.json({ success: true, clinic: clinicRows[0] });
  }
  updates.infoUpdatedAt = new Date().toISOString();
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
  const updated = (await database.select().from(clinicsTable).where(eq(clinicsTable.clinicId, clinicId)).limit(1))[0]!;
  const nextInfoAt = new Date(Date.now() + COOLDOWN_MS).toISOString();
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
      countryCode: updated.countryCode ?? 'MX',
      licenseNumber: updated.licenseNumber ?? '',
      legalName: updated.legalName ?? '',
      rfc: updated.rfc ?? '',
      clues: updated.clues ?? '',
      establishmentType: updated.establishmentType ?? 'private_office',
      cofeprisRegistration: updated.cofeprisRegistration ?? '',
      website: updated.website ?? '',
      consentText: updated.consentText ?? '',
      consentTextVersion: updated.consentTextVersion ?? 0,
    },
    infoBlockedUntil: nextInfoAt,
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
  const rows = await database.select({ logo: clinicsTable.logo, logoUpdatedAt: clinicsTable.logoUpdatedAt }).from(clinicsTable).where(eq(clinicsTable.clinicId, clinicId)).limit(1);
  const row = rows[0];
  const logo = resolveLogoForClient(row?.logo ?? null, 'clinic', clinicId, row?.logoUpdatedAt);
  return c.json({ success: true, logo, logoUpdatedAt: row?.logoUpdatedAt ?? null });
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
  const logoRows = await database.select({ logoUpdatedAt: clinicsTable.logoUpdatedAt }).from(clinicsTable).where(eq(clinicsTable.clinicId, clinicId)).limit(1);
  if (!logoRows[0]) return c.json({ error: 'Clínica no encontrada' }, 404);
  if (!canBypassCooldown(user) && isWithinCooldown(logoRows[0].logoUpdatedAt)) {
    const nextAt = getNextAllowedAt(logoRows[0].logoUpdatedAt);
    c.header('Retry-After', String(Math.ceil((new Date(nextAt!).getTime() - Date.now()) / 1000)));
    return c.json({
      error: 'cooldown',
      message: `El logo solo puede modificarse cada ${COOLDOWN_DAYS} días. Próximo cambio permitido: ${nextAt}`,
      logoBlockedUntil: nextAt,
    }, 429);
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
  const logoUpdateRows = await database.select().from(clinicsTable).where(eq(clinicsTable.clinicId, clinicId)).limit(1);
  if (!logoUpdateRows[0]) return c.json({ error: 'Clínica no encontrada' }, 404);
  const storedLogo = await persistLogoPayload(
    validation.sanitized,
    'clinic',
    clinicId,
    getR2Bucket(c.env as { BUCKET?: R2Bucket }),
    logoUpdateRows[0].logo
  );
  await database.update(clinicsTable).set({ logo: storedLogo, logoUpdatedAt: new Date().toISOString() }).where(eq(clinicsTable.clinicId, clinicId));
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
  const nextLogoAt = new Date(Date.now() + COOLDOWN_MS).toISOString();
  return c.json({ success: true, logoBlockedUntil: nextLogoAt });
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
  const delLogoRows = await database.select({ logo: clinicsTable.logo, logoUpdatedAt: clinicsTable.logoUpdatedAt }).from(clinicsTable).where(eq(clinicsTable.clinicId, clinicId)).limit(1);
  if (!delLogoRows[0]) return c.json({ error: 'Clínica no encontrada' }, 404);
  if (!canBypassCooldown(user) && isWithinCooldown(delLogoRows[0].logoUpdatedAt)) {
    const nextAt = getNextAllowedAt(delLogoRows[0].logoUpdatedAt);
    c.header('Retry-After', String(Math.ceil((new Date(nextAt!).getTime() - Date.now()) / 1000)));
    return c.json({
      error: 'cooldown',
      message: `El logo solo puede modificarse cada ${COOLDOWN_DAYS} días. Próximo cambio permitido: ${nextAt}`,
      logoBlockedUntil: nextAt,
    }, 429);
  }
  await purgeLogoR2(delLogoRows[0].logo, getR2Bucket(c.env as { BUCKET?: R2Bucket }));
  await database.update(clinicsTable).set({ logo: null, logoUpdatedAt: new Date().toISOString() }).where(eq(clinicsTable.clinicId, clinicId));
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
  const nextLogoAt = new Date(Date.now() + COOLDOWN_MS).toISOString();
  return c.json({ success: true, logoBlockedUntil: nextLogoAt });
});

/**
 * POST /api/clinics/:clinicId/reset-edit-cooldown
 * Super admin: autoriza cambios excepcionales de datos/logo de clínica antes de 15 días.
 */
clinicsRoutes.post('/:clinicId/reset-edit-cooldown', requireRole('super_admin'), async (c) => {
  const clinicId = getValidatedClinicId(c);
  if (!clinicId) return c.json({ error: 'clinicId inválido' }, 400);
  const user = c.get('user')!;
  const body = await c.req.json().catch(() => ({})) as { scopes?: unknown; reason?: string };
  const scopes = parseEditCooldownScopes(body.scopes);
  const rows = await database.select().from(clinicsTable).where(eq(clinicsTable.clinicId, clinicId)).limit(1);
  if (!rows[0]) return c.json({ error: 'Clínica no encontrada' }, 404);

  const updates: { infoUpdatedAt?: null; logoUpdatedAt?: null } = {};
  if (scopes.includes('info')) updates.infoUpdatedAt = null;
  if (scopes.includes('logo')) updates.logoUpdatedAt = null;
  await database.update(clinicsTable).set(updates).where(eq(clinicsTable.clinicId, clinicId));

  await logAuditEvent({
    userId: user.userId,
    action: 'RESET_EDIT_COOLDOWN',
    resourceType: 'clinic',
    resourceId: clinicId,
    details: {
      action: 'reset_clinic_edit_cooldown',
      clinicId,
      scopes,
      reason: typeof body.reason === 'string' && body.reason.trim() ? body.reason.trim().slice(0, 500) : null,
    },
    ipAddress: getClientIP(c.req.raw.headers),
    userAgent: getSafeUserAgent(c),
    clinicId,
  });

  return c.json({
    success: true,
    message: 'Autorización excepcional aplicada. La clínica puede editar de nuevo.',
    resetScopes: scopes,
  });
});

export default clinicsRoutes;
