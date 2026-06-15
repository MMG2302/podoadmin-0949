import { Hono } from 'hono';
import { eq, desc, count } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { requirePermission, requireRole } from '../middleware/authorization';
import { database } from '../database';
import { recordAccessLog, legalHolds, patientConsentSignatures, patients } from '../database/schema';
import { sanitizePathParam } from '../utils/sanitization';
import { getClientIP } from '../utils/ip-tracking';
import { getSafeUserAgent } from '../utils/request-headers';
import { buildPatientClinicalExport } from '../utils/clinical-admin';
import { retentionSummary } from '../utils/retention-policy';
import { applyLegalHoldToPatient, releaseLegalHold } from '../utils/legal-hold';
import { logAuditEvent } from '../utils/audit-log';

const complianceRoutes = new Hono();
complianceRoutes.use('*', requireAuth);

complianceRoutes.get('/retention-policy', async (c) => {
  return c.json({ success: true, policy: retentionSummary() });
});

complianceRoutes.post('/record-access', requirePermission('view_patients', 'manage_patients'), async (c) => {
  const user = c.get('user')!;
  const schema = z.object({
    patientId: z.string().uuid(),
    action: z.enum(['view', 'export', 'print']).default('view'),
  });
  const parsed = schema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: 'Datos inválidos' }, 400);

  const id = crypto.randomUUID();
  await database.insert(recordAccessLog).values({
    id,
    userId: user.userId,
    patientId: parsed.data.patientId,
    action: parsed.data.action,
    ipAddress: getClientIP(c.req.raw.headers),
    userAgent: getSafeUserAgent(c),
    clinicId: user.clinicId ?? null,
    createdAt: new Date().toISOString(),
  });
  return c.json({ success: true });
});

complianceRoutes.get('/record-access', requireRole('super_admin', 'admin', 'clinic_admin'), async (c) => {
  const patientId = c.req.query('patientId');
  let rows = await database.select().from(recordAccessLog).orderBy(desc(recordAccessLog.createdAt)).limit(500);
  if (patientId) rows = rows.filter((r) => r.patientId === sanitizePathParam(patientId));
  return c.json({ success: true, logs: rows });
});

complianceRoutes.get('/legal-holds', requireRole('super_admin', 'admin'), async (c) => {
  const rows = await database
    .select()
    .from(legalHolds)
    .where(eq(legalHolds.active, true))
    .orderBy(desc(legalHolds.createdAt));
  return c.json({ success: true, holds: rows });
});

complianceRoutes.post('/legal-holds', requireRole('super_admin', 'admin'), async (c) => {
  const user = c.get('user')!;
  const schema = z.object({
    resourceType: z.string().min(1).max(64),
    resourceId: z.string().min(1).max(128),
    reason: z.string().min(1).max(2000),
    expiresAt: z.number().optional(),
  });
  const parsed = schema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: 'Datos inválidos' }, 400);
  const id = crypto.randomUUID();
  await database.insert(legalHolds).values({
    id,
    resourceType: parsed.data.resourceType,
    resourceId: parsed.data.resourceId,
    reason: parsed.data.reason,
    createdBy: user.userId,
    createdAt: new Date().toISOString(),
    expiresAt: parsed.data.expiresAt ?? null,
    active: true,
  });

  if (parsed.data.resourceType === 'patient') {
    await applyLegalHoldToPatient(parsed.data.resourceId, true);
  }

  await logAuditEvent({
    userId: user.userId,
    action: 'LEGAL_HOLD_CREATED',
    resourceType: parsed.data.resourceType,
    resourceId: parsed.data.resourceId,
    ipAddress: getClientIP(c.req.raw.headers),
    userAgent: getSafeUserAgent(c),
    details: { reason: parsed.data.reason },
  });

  return c.json({ success: true, id }, 201);
});

complianceRoutes.post('/legal-holds/:holdId/release', requireRole('super_admin', 'admin'), async (c) => {
  const user = c.get('user')!;
  const holdId = sanitizePathParam(c.req.param('holdId'), 64);
  if (!holdId) return c.json({ error: 'ID inválido' }, 400);
  const released = await releaseLegalHold(holdId, user.userId);
  if (!released) return c.json({ error: 'Bloqueo no encontrado o ya liberado' }, 404);
  return c.json({ success: true });
});

complianceRoutes.get('/evidence/summary', requireRole('super_admin', 'admin'), async (c) => {
  const [patientCount] = await database.select({ n: count() }).from(patients);
  const [holdCount] = await database
    .select({ n: count() })
    .from(legalHolds)
    .where(eq(legalHolds.active, true));
  return c.json({
    success: true,
    policy: retentionSummary(),
    counts: {
      patients: patientCount?.n ?? 0,
      activeLegalHolds: holdCount?.n ?? 0,
    },
    generatedAt: new Date().toISOString(),
  });
});

complianceRoutes.post('/consent-signatures', requirePermission('manage_patients'), async (c) => {
  const user = c.get('user')!;
  const schema = z.object({
    patientId: z.string().uuid(),
    sessionId: z.string().uuid().optional(),
    consentVersion: z.number().int().positive(),
    signatureData: z.string().min(10).max(500000),
    signedByName: z.string().max(200).optional(),
    deviceInfo: z.string().max(500).optional(),
  });
  const parsed = schema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: 'Datos inválidos' }, 400);
  const id = crypto.randomUUID();
  const iso = new Date().toISOString();
  await database.insert(patientConsentSignatures).values({
    id,
    patientId: parsed.data.patientId,
    sessionId: parsed.data.sessionId ?? null,
    consentVersion: parsed.data.consentVersion,
    signatureData: parsed.data.signatureData,
    signedAt: iso,
    signedByName: parsed.data.signedByName ?? null,
    deviceInfo: parsed.data.deviceInfo ?? null,
    createdBy: user.userId,
    clinicId: user.clinicId ?? null,
  });
  await database
    .update(patients)
    .set({
      consent: JSON.stringify({ given: true, date: iso, consentedToVersion: parsed.data.consentVersion }),
      updatedAt: iso,
    })
    .where(eq(patients.id, parsed.data.patientId));
  return c.json({ success: true, id }, 201);
});

complianceRoutes.get('/patients/:patientId/portable-export', requirePermission('export_data', 'manage_patients'), async (c) => {
  const user = c.get('user')!;
  const patientId = sanitizePathParam(c.req.param('patientId'));
  const patientRows = await database.select().from(patients).where(eq(patients.id, patientId)).limit(1);
  if (!patientRows[0]) return c.json({ error: 'Paciente no encontrado' }, 404);

  const exportData = await buildPatientClinicalExport(patientId, user.email);
  if (!exportData) return c.json({ error: 'Paciente no encontrado' }, 404);

  return c.json({
    success: true,
    export: exportData,
    patientId,
    exportedAt: new Date().toISOString(),
  });
});

complianceRoutes.post('/data-rights/deletion-request', async (c) => {
  const user = c.get('user')!;
  const schema = z.object({
    reason: z.string().max(2000).optional(),
  });
  const parsed = schema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: 'Datos inválidos' }, 400);

  await logAuditEvent({
    userId: user.userId,
    action: 'DATA_RIGHTS_DELETION_REQUEST',
    resourceType: 'user',
    resourceId: user.userId,
    ipAddress: getClientIP(c.req.raw.headers),
    userAgent: getSafeUserAgent(c),
    details: { reason: parsed.data.reason ?? null },
  });

  return c.json({
    success: true,
    message:
      'Hemos registrado tu solicitud de supresión. El equipo de soporte la revisará conforme a la legislación aplicable (LFPDPPP, LGPD, GDPR u otra normativa local).',
  });
});

export default complianceRoutes;
