import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { database } from '../database';
import {
  professionalInfo as professionalInfoTable,
  professionalLicenses as professionalLicensesTable,
  professionalCredentials as professionalCredentialsTable,
  professionalLogos as professionalLogosTable,
  patients as patientsTable,
} from '../database/schema';
import { logAuditEvent } from '../utils/audit-log';
import { getClientIP } from '../utils/ip-tracking';
import { validateLogoPayload } from '../utils/logo-upload';
import { getSafeUserAgent } from '../utils/request-headers';
import { sanitizePathParam } from '../utils/sanitization';
import { checkLogoUploadRateLimit } from '../utils/action-rate-limit';

const professionalsRoutes = new Hono();

/** Valida userId del path; devuelve null si es inválido (evita inyección / log forging). */
function getValidatedUserId(c: { req: { param: (name: string) => string } }): string | null {
  return sanitizePathParam(c.req.param('userId'), 128);
}

professionalsRoutes.use('*', requireAuth);

function canAccessProfessional(user: { userId: string; role: string; clinicId?: string }, targetUserId: string): boolean {
  if (user.role === 'super_admin' || user.role === 'admin') return true;
  return user.userId === targetUserId;
}

/**
 * GET /api/professionals/info/:userId
 */
professionalsRoutes.get('/info/:userId', async (c) => {
  const userId = getValidatedUserId(c);
  if (!userId) return c.json({ error: 'userId inválido' }, 400);
  const user = c.get('user');
  if (!user || !canAccessProfessional(user, userId)) {
    return c.json({ error: 'Acceso denegado' }, 403);
  }
  const rows = await database.select().from(professionalInfoTable).where(eq(professionalInfoTable.userId, userId)).limit(1);
  const row = rows[0];
  if (!row) return c.json({ success: true, info: null });
  return c.json({
    success: true,
    info: {
      name: row.name,
      phone: row.phone ?? '',
      email: row.email ?? '',
      address: row.address ?? '',
      city: row.city ?? '',
      postalCode: row.postalCode ?? '',
      licenseNumber: row.licenseNumber ?? '',
      professionalLicense: row.professionalLicense ?? '',
      consentText: row.consentText ?? '',
      consentTextVersion: row.consentTextVersion ?? 0,
    },
  });
});

/**
 * PUT /api/professionals/info/:userId
 */
professionalsRoutes.put('/info/:userId', async (c) => {
  const userId = getValidatedUserId(c);
  if (!userId) return c.json({ error: 'userId inválido' }, 400);
  const user = c.get('user');
  if (!user || !canAccessProfessional(user, userId)) {
    return c.json({ error: 'Acceso denegado' }, 403);
  }
  const body = (await c.req.json().catch(() => ({}))) as Record<string, string>;
  const consentText = body.consentText !== undefined ? (String(body.consentText || '').trim() || null) : undefined;
  const existing = await database.select().from(professionalInfoTable).where(eq(professionalInfoTable.userId, userId)).limit(1);
  let consentTextVersion: number | undefined;
  if (consentText !== undefined) {
    const currentText = existing[0]?.consentText ?? null;
    if (String(consentText || '') !== String(currentText || '')) {
      const newVersion = (existing[0]?.consentTextVersion ?? 0) + 1;
      consentTextVersion = newVersion;
      // Pacientes del podólogo independiente que dieron consentimiento a versión antigua: borrar DNI y resetear consentimiento
      const podPatients = await database.select().from(patientsTable).where(eq(patientsTable.createdBy, userId));
      for (const p of podPatients) {
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
  const data = {
    userId,
    name: body.name ?? '',
    phone: body.phone ?? '',
    email: body.email ?? '',
    address: body.address ?? '',
    city: body.city ?? '',
    postalCode: body.postalCode ?? '',
    licenseNumber: body.licenseNumber ?? '',
    professionalLicense: body.professionalLicense ?? '',
    ...(consentText !== undefined && { consentText }),
    ...(consentTextVersion !== undefined && { consentTextVersion }),
  };
  const setData: Record<string, unknown> = {
    name: data.name,
    phone: data.phone,
    email: data.email,
    address: data.address,
    city: data.city,
    postalCode: data.postalCode,
    licenseNumber: data.licenseNumber,
    professionalLicense: data.professionalLicense,
  };
  if (consentText !== undefined) setData.consentText = consentText;
  if (consentTextVersion !== undefined) setData.consentTextVersion = consentTextVersion;
  await database.insert(professionalInfoTable).values(data).onConflictDoUpdate({
    target: professionalInfoTable.userId,
    set: setData,
  });
  await logAuditEvent({
    userId: user.userId,
    action: 'UPDATE',
    resourceType: 'professional_info',
    resourceId: userId,
    details: { action: 'professional_info_update', name: data.name },
    ipAddress: getClientIP(c.req.raw.headers),
    userAgent: getSafeUserAgent(c),
  });
  return c.json({ success: true });
});

/**
 * GET /api/professionals/license/:userId
 */
professionalsRoutes.get('/license/:userId', async (c) => {
  const userId = getValidatedUserId(c);
  if (!userId) return c.json({ error: 'userId inválido' }, 400);
  const user = c.get('user');
  if (!user || !canAccessProfessional(user, userId)) {
    return c.json({ error: 'Acceso denegado' }, 403);
  }
  const rows = await database.select().from(professionalLicensesTable).where(eq(professionalLicensesTable.userId, userId)).limit(1);
  const license = rows[0]?.license ?? null;
  return c.json({ success: true, license });
});

/**
 * PUT /api/professionals/license/:userId
 */
professionalsRoutes.put('/license/:userId', async (c) => {
  const userId = getValidatedUserId(c);
  if (!userId) return c.json({ error: 'userId inválido' }, 400);
  const user = c.get('user');
  if (!user || !canAccessProfessional(user, userId)) {
    return c.json({ error: 'Acceso denegado' }, 403);
  }
  const body = (await c.req.json().catch(() => ({}))) as { license?: string };
  const license = body.license ?? '';
  await database.insert(professionalLicensesTable).values({ userId, license }).onConflictDoUpdate({
    target: professionalLicensesTable.userId,
    set: { license },
  });
  await logAuditEvent({
    userId: user.userId,
    action: 'UPDATE',
    resourceType: 'professional_credentials',
    resourceId: userId,
    details: { action: 'license_update' },
    ipAddress: getClientIP(c.req.raw.headers),
    userAgent: getSafeUserAgent(c),
  });
  return c.json({ success: true });
});

/**
 * GET /api/professionals/credentials/:userId
 */
professionalsRoutes.get('/credentials/:userId', async (c) => {
  const userId = getValidatedUserId(c);
  if (!userId) return c.json({ error: 'userId inválido' }, 400);
  const user = c.get('user');
  if (!user || !canAccessProfessional(user, userId)) {
    return c.json({ error: 'Acceso denegado' }, 403);
  }
  const rows = await database.select().from(professionalCredentialsTable).where(eq(professionalCredentialsTable.userId, userId)).limit(1);
  const row = rows[0];
  if (!row) return c.json({ success: true, credentials: null });
  return c.json({ success: true, credentials: { cedula: row.cedula ?? '', registro: row.registro ?? '' } });
});

/**
 * PUT /api/professionals/credentials/:userId
 */
professionalsRoutes.put('/credentials/:userId', async (c) => {
  const userId = getValidatedUserId(c);
  if (!userId) return c.json({ error: 'userId inválido' }, 400);
  const user = c.get('user');
  if (!user || !canAccessProfessional(user, userId)) {
    return c.json({ error: 'Acceso denegado' }, 403);
  }
  const body = (await c.req.json().catch(() => ({}))) as { cedula?: string; registro?: string };
  const cedula = body.cedula ?? '';
  const registro = body.registro ?? '';
  await database.insert(professionalCredentialsTable).values({ userId, cedula, registro }).onConflictDoUpdate({
    target: professionalCredentialsTable.userId,
    set: { cedula, registro },
  });
  await logAuditEvent({
    userId: user.userId,
    action: 'UPDATE',
    resourceType: 'professional_credentials',
    resourceId: userId,
    details: { action: 'credentials_update' },
    ipAddress: getClientIP(c.req.raw.headers),
    userAgent: getSafeUserAgent(c),
  });
  return c.json({ success: true });
});

/**
 * GET /api/professionals/logo/:userId
 */
professionalsRoutes.get('/logo/:userId', async (c) => {
  const userId = getValidatedUserId(c);
  if (!userId) return c.json({ error: 'userId inválido' }, 400);
  const user = c.get('user');
  if (!user || !canAccessProfessional(user, userId)) {
    return c.json({ error: 'Acceso denegado' }, 403);
  }
  const rows = await database.select().from(professionalLogosTable).where(eq(professionalLogosTable.userId, userId)).limit(1);
  const logo = rows[0]?.logo ?? null;
  return c.json({ success: true, logo });
});

/**
 * PUT /api/professionals/logo/:userId
 */
professionalsRoutes.put('/logo/:userId', async (c) => {
  const user = c.get('user');
  const userId = c.req.param('userId');
  if (!user || !canAccessProfessional(user, userId)) {
    return c.json({ error: 'Acceso denegado' }, 403);
  }
  const body = (await c.req.json().catch(() => ({}))) as { logo: string };
  if (!body.logo) return c.json({ error: 'Campo logo requerido' }, 400);

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
      resourceId: userId,
      details: { reason: validation.error },
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
    });
    return c.json({ error: validation.error, message: validation.message }, 400);
  }
  await database.insert(professionalLogosTable).values({ userId, logo: validation.sanitized }).onConflictDoUpdate({
    target: professionalLogosTable.userId,
    set: { logo: validation.sanitized },
  });
  await logAuditEvent({
    userId: user.userId,
    action: 'UPDATE',
    resourceType: 'logo',
    resourceId: userId,
    details: { action: 'professional_logo_upload' },
    ipAddress: getClientIP(c.req.raw.headers),
    userAgent: getSafeUserAgent(c),
  });
  return c.json({ success: true });
});

/**
 * DELETE /api/professionals/logo/:userId
 */
professionalsRoutes.delete('/logo/:userId', async (c) => {
  const userId = getValidatedUserId(c);
  if (!userId) return c.json({ error: 'userId inválido' }, 400);
  const user = c.get('user');
  if (!user || !canAccessProfessional(user, userId)) {
    return c.json({ error: 'Acceso denegado' }, 403);
  }
  await database.delete(professionalLogosTable).where(eq(professionalLogosTable.userId, userId));
  await logAuditEvent({
    userId: user.userId,
    action: 'DELETE',
    resourceType: 'logo',
    resourceId: userId,
    details: { action: 'professional_logo_remove' },
    ipAddress: getClientIP(c.req.raw.headers),
    userAgent: getSafeUserAgent(c),
  });
  return c.json({ success: true });
});

export default professionalsRoutes;
