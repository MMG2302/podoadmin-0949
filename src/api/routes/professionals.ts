import { Hono } from 'hono';
import { eq, inArray } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/authorization';
import { database } from '../database';
import {
  createdUsers,
  professionalInfo as professionalInfoTable,
  professionalLicenses as professionalLicensesTable,
  professionalCredentials as professionalCredentialsTable,
  professionalLogos as professionalLogosTable,
  patients as patientsTable,
} from '../database/schema';
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
  editCooldownErrorMessage,
  editCooldownInfoErrorMessage,
  getEditCooldownBlockedUntil,
  getEditCooldownRetryAfterSeconds,
  getNextEditAllowedAt,
  isWithinEditCooldown,
  parseEditCooldownScopes,
} from '../utils/edit-cooldown';

const professionalsRoutes = new Hono();

/** Valida userId del path; devuelve null si es inválido (evita inyección / log forging). */
function getValidatedUserId(c: { req: { param: (name: string) => string } }): string | null {
  return sanitizePathParam(c.req.param('userId'), 128);
}

professionalsRoutes.use('*', requireAuth);

async function canAccessProfessional(
  user: { userId: string; role: string; clinicId?: string },
  targetUserId: string
): Promise<boolean> {
  if (user.role === 'super_admin' || user.role === 'admin') return true;
  if (user.userId === targetUserId) return true;
  if (user.role === 'clinic_admin' && user.clinicId) {
    const rows = await database
      .select({ clinicId: createdUsers.clinicId, role: createdUsers.role })
      .from(createdUsers)
      .where(eq(createdUsers.userId, targetUserId))
      .limit(1);
    const target = rows[0];
    return Boolean(
      target &&
        target.clinicId === user.clinicId &&
        (target.role === 'podiatrist' || target.role === 'receptionist')
    );
  }
  return false;
}

/**
 * GET /api/professionals/info/:userId
 */
professionalsRoutes.get('/info/:userId', async (c) => {
  const userId = getValidatedUserId(c);
  if (!userId) return c.json({ error: 'userId inválido' }, 400);
  const user = c.get('user');
  if (!user || !(await canAccessProfessional(user, userId))) {
    return c.json({ error: 'Acceso denegado' }, 403);
  }
  const rows = await database.select().from(professionalInfoTable).where(eq(professionalInfoTable.userId, userId)).limit(1);
  const row = rows[0];
  if (!row) return c.json({ success: true, info: null, infoBlockedUntil: null });
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
      countryCode: row.countryCode ?? 'MX',
      consentText: row.consentText ?? '',
      consentTextVersion: row.consentTextVersion ?? 0,
    },
    infoBlockedUntil: getEditCooldownBlockedUntil(row.infoUpdatedAt),
  });
});

/**
 * PUT /api/professionals/info/:userId
 */
professionalsRoutes.put('/info/:userId', async (c) => {
  const userId = getValidatedUserId(c);
  if (!userId) return c.json({ error: 'userId inválido' }, 400);
  const user = c.get('user');
  if (!user || !(await canAccessProfessional(user, userId))) {
    return c.json({ error: 'Acceso denegado' }, 403);
  }
  const body = (await c.req.json().catch(() => ({}))) as Record<string, string>;
  const consentText = body.consentText !== undefined ? (String(body.consentText || '').trim() || null) : undefined;
  const existing = await database.select().from(professionalInfoTable).where(eq(professionalInfoTable.userId, userId)).limit(1);
  const existingRow = existing[0];
  if (!canBypassEditCooldown(user) && isWithinEditCooldown(existingRow?.infoUpdatedAt)) {
    const nextAt = getNextEditAllowedAt(existingRow?.infoUpdatedAt)!;
    c.header('Retry-After', String(getEditCooldownRetryAfterSeconds(nextAt)));
    return c.json(
      {
        error: 'cooldown',
        message: editCooldownInfoErrorMessage(nextAt),
        infoBlockedUntil: nextAt,
      },
      429,
    );
  }
  let consentTextVersion: number | undefined;
  if (consentText !== undefined) {
    const currentText = existingRow?.consentText ?? null;
    if (String(consentText || '') !== String(currentText || '')) {
      const newVersion = (existingRow?.consentTextVersion ?? 0) + 1;
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
    countryCode: body.countryCode ? String(body.countryCode).trim().toUpperCase().slice(0, 2) : 'MX',
    ...(consentText !== undefined && { consentText }),
    ...(consentTextVersion !== undefined && { consentTextVersion }),
  };
  const now = new Date().toISOString();
  const setData: Record<string, unknown> = {
    name: data.name,
    phone: data.phone,
    email: data.email,
    address: data.address,
    city: data.city,
    postalCode: data.postalCode,
    licenseNumber: data.licenseNumber,
    professionalLicense: data.professionalLicense,
    countryCode: data.countryCode,
    infoUpdatedAt: now,
  };
  if (consentText !== undefined) setData.consentText = consentText;
  if (consentTextVersion !== undefined) setData.consentTextVersion = consentTextVersion;
  await database.insert(professionalInfoTable).values({ ...data, infoUpdatedAt: now }).onConflictDoUpdate({
    target: professionalInfoTable.userId,
    set: setData,
  });
  const nextInfoAt = new Date(Date.now() + EDIT_COOLDOWN_MS).toISOString();
  await logAuditEvent({
    userId: user.userId,
    action: 'UPDATE',
    resourceType: 'professional_info',
    resourceId: userId,
    details: { action: 'professional_info_update', name: data.name },
    ipAddress: getClientIP(c.req.raw.headers),
    userAgent: getSafeUserAgent(c),
  });
  return c.json({ success: true, infoBlockedUntil: nextInfoAt });
});

/**
 * GET /api/professionals/licenses?ids=id1,id2
 */
professionalsRoutes.get('/licenses', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'No autenticado' }, 401);
  const raw = c.req.query('ids')?.trim() ?? '';
  const ids = raw
    .split(',')
    .map((id) => sanitizePathParam(id.trim(), 128))
    .filter((id): id is string => Boolean(id));
  if (ids.length === 0) return c.json({ success: true, licenses: {} });
  if (ids.length > 100) return c.json({ error: 'Demasiados IDs' }, 400);

  for (const id of ids) {
    if (!(await canAccessProfessional(user, id))) {
      return c.json({ error: 'Acceso denegado' }, 403);
    }
  }

  const rows = await database
    .select()
    .from(professionalLicensesTable)
    .where(inArray(professionalLicensesTable.userId, ids));
  const licenses: Record<string, string | null> = {};
  for (const id of ids) licenses[id] = null;
  for (const row of rows) {
    licenses[row.userId] = row.license?.trim() ? row.license.trim() : null;
  }
  return c.json({ success: true, licenses });
});

/**
 * GET /api/professionals/license/:userId
 */
professionalsRoutes.get('/license/:userId', async (c) => {
  const userId = getValidatedUserId(c);
  if (!userId) return c.json({ error: 'userId inválido' }, 400);
  const user = c.get('user');
  if (!user || !(await canAccessProfessional(user, userId))) {
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
  if (!user || !(await canAccessProfessional(user, userId))) {
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
  if (!user || !(await canAccessProfessional(user, userId))) {
    return c.json({ error: 'Acceso denegado' }, 403);
  }
  const rows = await database.select().from(professionalCredentialsTable).where(eq(professionalCredentialsTable.userId, userId)).limit(1);
  const row = rows[0];
  const infoRows = await database
    .select({ infoUpdatedAt: professionalInfoTable.infoUpdatedAt })
    .from(professionalInfoTable)
    .where(eq(professionalInfoTable.userId, userId))
    .limit(1);
  const infoBlockedUntil = getEditCooldownBlockedUntil(infoRows[0]?.infoUpdatedAt);
  if (!row) return c.json({ success: true, credentials: null, infoBlockedUntil });
  return c.json({ success: true, credentials: { cedula: row.cedula ?? '', registro: row.registro ?? '' }, infoBlockedUntil });
});

/**
 * PUT /api/professionals/credentials/:userId
 */
professionalsRoutes.put('/credentials/:userId', async (c) => {
  const userId = getValidatedUserId(c);
  if (!userId) return c.json({ error: 'userId inválido' }, 400);
  const user = c.get('user');
  if (!user || !(await canAccessProfessional(user, userId))) {
    return c.json({ error: 'Acceso denegado' }, 403);
  }
  const body = (await c.req.json().catch(() => ({}))) as { cedula?: string; registro?: string };
  const cedula = body.cedula ?? '';
  const registro = body.registro ?? '';

  const infoRows = await database
    .select({ infoUpdatedAt: professionalInfoTable.infoUpdatedAt, name: professionalInfoTable.name })
    .from(professionalInfoTable)
    .where(eq(professionalInfoTable.userId, userId))
    .limit(1);
  const infoRow = infoRows[0];
  if (!canBypassEditCooldown(user) && isWithinEditCooldown(infoRow?.infoUpdatedAt)) {
    const nextAt = getNextEditAllowedAt(infoRow?.infoUpdatedAt)!;
    c.header('Retry-After', String(getEditCooldownRetryAfterSeconds(nextAt)));
    return c.json(
      {
        error: 'cooldown',
        message: editCooldownInfoErrorMessage(nextAt),
        infoBlockedUntil: nextAt,
      },
      429,
    );
  }

  const now = new Date().toISOString();
  await database.insert(professionalCredentialsTable).values({ userId, cedula, registro }).onConflictDoUpdate({
    target: professionalCredentialsTable.userId,
    set: { cedula, registro },
  });
  await database
    .insert(professionalInfoTable)
    .values({ userId, name: infoRow?.name ?? '', infoUpdatedAt: now })
    .onConflictDoUpdate({
      target: professionalInfoTable.userId,
      set: { infoUpdatedAt: now },
    });
  const nextInfoAt = new Date(Date.now() + EDIT_COOLDOWN_MS).toISOString();
  await logAuditEvent({
    userId: user.userId,
    action: 'UPDATE',
    resourceType: 'professional_credentials',
    resourceId: userId,
    details: { action: 'credentials_update' },
    ipAddress: getClientIP(c.req.raw.headers),
    userAgent: getSafeUserAgent(c),
  });
  return c.json({ success: true, infoBlockedUntil: nextInfoAt });
});

/**
 * GET /api/professionals/logo/:userId
 */
professionalsRoutes.get('/logo/:userId', async (c) => {
  const userId = getValidatedUserId(c);
  if (!userId) return c.json({ error: 'userId inválido' }, 400);
  const user = c.get('user');
  if (!user || !(await canAccessProfessional(user, userId))) {
    return c.json({ error: 'Acceso denegado' }, 403);
  }
  const rows = await database.select().from(professionalLogosTable).where(eq(professionalLogosTable.userId, userId)).limit(1);
  const row = rows[0];
  const storedLogo = row?.logo?.trim() ? row.logo : null;
  const logo = resolveLogoForClient(storedLogo, 'professional', userId, row?.updatedAt);
  const logoBlockedUntil = getEditCooldownBlockedUntil(row?.updatedAt);
  return c.json({ success: true, logo, logoUpdatedAt: row?.updatedAt ?? null, logoBlockedUntil });
});

/**
 * PUT /api/professionals/logo/:userId
 */
professionalsRoutes.put('/logo/:userId', async (c) => {
  const user = c.get('user');
  const userId = sanitizePathParam(c.req.param('userId'), 128);
  if (!userId) return c.json({ error: 'ID de usuario inválido' }, 400);
  if (!user || !(await canAccessProfessional(user, userId))) {
    return c.json({ error: 'Acceso denegado' }, 403);
  }
  const body = (await c.req.json().catch(() => ({}))) as { logo: string };
  if (!body.logo) return c.json({ error: 'Campo logo requerido' }, 400);

  const existingRows = await database
    .select({ logo: professionalLogosTable.logo, updatedAt: professionalLogosTable.updatedAt })
    .from(professionalLogosTable)
    .where(eq(professionalLogosTable.userId, userId))
    .limit(1);
  const existing = existingRows[0];
  if (!canBypassEditCooldown(user) && isWithinEditCooldown(existing?.updatedAt)) {
    const nextAt = getNextEditAllowedAt(existing?.updatedAt)!;
    c.header('Retry-After', String(getEditCooldownRetryAfterSeconds(nextAt)));
    return c.json(
      {
        error: 'cooldown',
        message: editCooldownErrorMessage(nextAt),
        logoBlockedUntil: nextAt,
      },
      429
    );
  }

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
  const storedLogo = await persistLogoPayload(
    validation.sanitized,
    'professional',
    userId,
    getR2Bucket(c.env as { BUCKET?: R2Bucket }),
    existing?.logo?.trim() ? existing.logo : null
  );
  const updatedAt = new Date().toISOString();
  await database.insert(professionalLogosTable).values({ userId, logo: storedLogo, updatedAt }).onConflictDoUpdate({
    target: professionalLogosTable.userId,
    set: { logo: storedLogo, updatedAt },
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
  return c.json({
    success: true,
    logo: resolveLogoForClient(storedLogo, 'professional', userId, updatedAt),
    logoUpdatedAt: updatedAt,
    logoBlockedUntil: new Date(Date.now() + EDIT_COOLDOWN_MS).toISOString(),
  });
});

/**
 * DELETE /api/professionals/logo/:userId
 */
professionalsRoutes.delete('/logo/:userId', async (c) => {
  const userId = getValidatedUserId(c);
  if (!userId) return c.json({ error: 'userId inválido' }, 400);
  const user = c.get('user');
  if (!user || !(await canAccessProfessional(user, userId))) {
    return c.json({ error: 'Acceso denegado' }, 403);
  }
  const existingRows = await database
    .select({ logo: professionalLogosTable.logo, updatedAt: professionalLogosTable.updatedAt })
    .from(professionalLogosTable)
    .where(eq(professionalLogosTable.userId, userId))
    .limit(1);
  const existing = existingRows[0];
  if (!existing?.logo?.trim()) {
    return c.json({ success: true, logoBlockedUntil: getEditCooldownBlockedUntil(existing?.updatedAt) });
  }
  if (!canBypassEditCooldown(user) && isWithinEditCooldown(existing.updatedAt)) {
    const nextAt = getNextEditAllowedAt(existing.updatedAt)!;
    c.header('Retry-After', String(getEditCooldownRetryAfterSeconds(nextAt)));
    return c.json(
      {
        error: 'cooldown',
        message: editCooldownErrorMessage(nextAt),
        logoBlockedUntil: nextAt,
      },
      429
    );
  }
  await purgeLogoR2(existing.logo, getR2Bucket(c.env as { BUCKET?: R2Bucket }));
  const updatedAt = new Date().toISOString();
  await database
    .update(professionalLogosTable)
    .set({ logo: '', updatedAt })
    .where(eq(professionalLogosTable.userId, userId));
  await logAuditEvent({
    userId: user.userId,
    action: 'DELETE',
    resourceType: 'logo',
    resourceId: userId,
    details: { action: 'professional_logo_remove' },
    ipAddress: getClientIP(c.req.raw.headers),
    userAgent: getSafeUserAgent(c),
  });
  return c.json({
    success: true,
    logoBlockedUntil: new Date(Date.now() + EDIT_COOLDOWN_MS).toISOString(),
  });
});

/**
 * POST /api/professionals/:userId/reset-edit-cooldown
 * Super admin: autoriza cambios excepcionales de datos/logo profesional antes de 15 días.
 */
professionalsRoutes.post('/:userId/reset-edit-cooldown', requireRole('super_admin'), async (c) => {
  const userId = getValidatedUserId(c);
  if (!userId) return c.json({ error: 'userId inválido' }, 400);
  const user = c.get('user')!;
  const body = await c.req.json().catch(() => ({})) as { scopes?: unknown; reason?: string };
  const scopes = parseEditCooldownScopes(body.scopes);

  const targetRows = await database
    .select({ role: createdUsers.role })
    .from(createdUsers)
    .where(eq(createdUsers.id, userId))
    .limit(1);
  if (!targetRows[0]) return c.json({ error: 'Usuario no encontrado' }, 404);
  if (targetRows[0].role !== 'podiatrist') {
    return c.json({
      error: 'invalid_role',
      message: 'El reinicio profesional aplica a podólogos. Para administradores de clínica use el reinicio de clínica.',
    }, 400);
  }

  if (scopes.includes('info')) {
    await database
      .update(professionalInfoTable)
      .set({ infoUpdatedAt: null })
      .where(eq(professionalInfoTable.userId, userId));
  }
  if (scopes.includes('logo')) {
    await database
      .update(professionalLogosTable)
      .set({ updatedAt: null })
      .where(eq(professionalLogosTable.userId, userId));
  }

  await logAuditEvent({
    userId: user.userId,
    action: 'RESET_EDIT_COOLDOWN',
    resourceType: 'professional',
    resourceId: userId,
    details: {
      action: 'reset_professional_edit_cooldown',
      targetUserId: userId,
      scopes,
      reason: typeof body.reason === 'string' && body.reason.trim() ? body.reason.trim().slice(0, 500) : null,
    },
    ipAddress: getClientIP(c.req.raw.headers),
    userAgent: getSafeUserAgent(c),
  });

  return c.json({
    success: true,
    message: 'Autorización excepcional aplicada. El profesional puede editar de nuevo.',
    resetScopes: scopes,
  });
});

export default professionalsRoutes;
