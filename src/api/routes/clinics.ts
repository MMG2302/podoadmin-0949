import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { database } from '../database';
import { clinics as clinicsTable } from '../database/schema';
import { logAuditEvent } from '../utils/audit-log';
import { getClientIP } from '../utils/ip-tracking';

const clinicsRoutes = new Hono();

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
  const user = c.get('user');
  const clinicId = c.req.param('clinicId');
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
    },
  });
});

/**
 * PATCH /api/clinics/:clinicId
 * Actualiza datos de la clínica (sin logo)
 */
clinicsRoutes.patch('/:clinicId', async (c) => {
  const user = c.get('user');
  const clinicId = c.req.param('clinicId');
  if (!user || !canEditClinic(user, clinicId)) {
    return c.json({ error: 'Acceso denegado' }, 403);
  }
  const body = await c.req.json().catch(() => ({})) as Record<string, unknown>;
  const updates: Record<string, unknown> = {};
  const allowed = ['phone', 'email', 'address', 'city', 'postalCode', 'licenseNumber', 'website'];
  for (const k of allowed) {
    if (body[k] !== undefined) updates[k] = body[k];
  }
  if (Object.keys(updates).length === 0) {
    return c.json({ success: true, clinic: (await database.select().from(clinicsTable).where(eq(clinicsTable.clinicId, clinicId)).limit(1))[0] });
  }
  const rows = await database.select().from(clinicsTable).where(eq(clinicsTable.clinicId, clinicId)).limit(1);
  if (!rows[0]) return c.json({ error: 'Clínica no encontrada' }, 404);
  await database.update(clinicsTable).set(updates as any).where(eq(clinicsTable.clinicId, clinicId));
  await logAuditEvent({
    userId: user.userId,
    action: 'UPDATE',
    resourceType: 'clinic',
    resourceId: clinicId,
    details: { action: 'clinic_info_update', clinicId, ...updates },
    ipAddress: getClientIP(c.req.raw.headers),
    userAgent: c.req.header('User-Agent') ?? undefined,
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
    },
  });
});

/**
 * GET /api/clinics/:clinicId/logo
 * Obtiene el logo de la clínica
 */
clinicsRoutes.get('/:clinicId/logo', async (c) => {
  const user = c.get('user');
  const clinicId = c.req.param('clinicId');
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
  const user = c.get('user');
  const clinicId = c.req.param('clinicId');
  if (!user || !canEditClinic(user, clinicId)) {
    return c.json({ error: 'Acceso denegado' }, 403);
  }
  const body = await c.req.json().catch(() => ({})) as { logo?: string };
  if (body.logo === undefined) return c.json({ error: 'Campo logo requerido' }, 400);
  const rows = await database.select().from(clinicsTable).where(eq(clinicsTable.clinicId, clinicId)).limit(1);
  if (!rows[0]) return c.json({ error: 'Clínica no encontrada' }, 404);
  await database.update(clinicsTable).set({ logo: body.logo }).where(eq(clinicsTable.clinicId, clinicId));
  await logAuditEvent({
    userId: user.userId,
    action: 'UPDATE',
    resourceType: 'logo',
    resourceId: clinicId,
    details: { action: 'clinic_logo_upload', clinicId },
    ipAddress: getClientIP(c.req.raw.headers),
    userAgent: c.req.header('User-Agent') ?? undefined,
    clinicId,
  });
  return c.json({ success: true });
});

/**
 * DELETE /api/clinics/:clinicId/logo
 * Elimina el logo de la clínica
 */
clinicsRoutes.delete('/:clinicId/logo', async (c) => {
  const user = c.get('user');
  const clinicId = c.req.param('clinicId');
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
    userAgent: c.req.header('User-Agent') ?? undefined,
    clinicId,
  });
  return c.json({ success: true });
});

export default clinicsRoutes;
