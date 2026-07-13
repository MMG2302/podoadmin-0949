import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';
import { requireActiveSubscription } from '../middleware/subscription';
import { database } from '../database';
import { prescriptions, clinicalSessions, patients } from '../database/schema';
import { sanitizePathParam } from '../utils/sanitization';
import { getSessionAccessDeniedReason } from '../utils/tenant-isolation';
import { logAuditEvent } from '../utils/audit-log';
import { getClientIP } from '../utils/ip-tracking';
import { getSafeUserAgent } from '../utils/request-headers';

const prescriptionsRoutes = new Hono();
prescriptionsRoutes.use('*', requireAuth, requireActiveSubscription);

const createSchema = z.object({
  sessionId: z.string().min(1).max(128),
  prescriptionText: z.string().min(1).max(10000),
  medications: z.string().max(5000).optional(),
  nextVisitDate: z.string().max(32).optional().nullable(),
  notes: z.string().max(5000).optional(),
  patientName: z.string().min(1).max(200),
  patientDob: z.string().max(32).optional().nullable(),
  patientDni: z.string().max(64).optional().nullable(),
  patientAgeYears: z.number().int().min(0).max(130).optional().nullable(),
  patientWeightKg: z.string().max(16).optional().nullable(),
  patientHeightCm: z.string().max(16).optional().nullable(),
  podiatristName: z.string().min(1).max(200),
  podiatristLicense: z.string().max(128).optional().nullable(),
  podiatristCedula: z.string().max(128).optional().nullable(),
});

function mapPrescription(row: typeof prescriptions.$inferSelect) {
  return {
    id: row.id,
    sessionId: row.sessionId,
    patientId: row.patientId,
    patientName: row.patientName,
    patientDob: row.patientDob,
    patientDni: row.patientDni,
    podiatristId: row.podiatristId,
    podiatristName: row.podiatristName,
    podiatristLicense: row.podiatristLicense,
    prescriptionDate: row.prescriptionDate,
    prescriptionText: row.prescriptionText,
    medications: row.medications,
    nextVisitDate: row.nextVisitDate,
    notes: row.notes,
    folio: row.folio,
    patientAgeYears: row.patientAgeYears ?? null,
    patientWeightKg: row.patientWeightKg ?? null,
    patientHeightCm: row.patientHeightCm ?? null,
    podiatristCedula: row.podiatristCedula ?? null,
    createdAt: row.createdAt,
    createdBy: row.createdBy,
  };
}

async function generateFolio(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `RX-${year}-`;
  const rows = await database.select({ folio: prescriptions.folio }).from(prescriptions);
  const seq = rows.filter((r) => r.folio.startsWith(prefix)).length + 1;
  return `${prefix}${seq.toString().padStart(5, '0')}`;
}

prescriptionsRoutes.get(
  '/',
  requirePermission('view_sessions', 'manage_sessions'),
  async (c) => {
    const user = c.get('user')!;
    const sessionId = c.req.query('sessionId');
    const patientId = c.req.query('patientId');

    let rows = await database.select().from(prescriptions).orderBy(desc(prescriptions.createdAt));

    if (sessionId) {
      const sid = sanitizePathParam(sessionId);
      const sessionRows = await database.select().from(clinicalSessions).where(eq(clinicalSessions.id, sid)).limit(1);
      const session = sessionRows[0];
      if (!session) return c.json({ error: 'Sesión no encontrada' }, 404);
      const denied = await getSessionAccessDeniedReason(user, session);
      if (denied) return c.json({ error: 'Acceso denegado', message: denied }, 403);
      rows = rows.filter((r) => r.sessionId === sid);
    } else if (patientId) {
      const pid = sanitizePathParam(patientId);
      rows = rows.filter((r) => r.patientId === pid);
    } else if (user.role === 'podiatrist') {
      rows = rows.filter((r) => r.podiatristId === user.userId);
    }

    return c.json({ success: true, prescriptions: rows.map(mapPrescription) });
  }
);

prescriptionsRoutes.get(
  '/session/:sessionId',
  requirePermission('view_sessions', 'manage_sessions'),
  async (c) => {
    const user = c.get('user')!;
    const sessionId = sanitizePathParam(c.req.param('sessionId'));
    const sessionRows = await database.select().from(clinicalSessions).where(eq(clinicalSessions.id, sessionId)).limit(1);
    const session = sessionRows[0];
    if (!session) return c.json({ error: 'Sesión no encontrada' }, 404);
    const denied = await getSessionAccessDeniedReason(user, session);
    if (denied) return c.json({ error: 'Acceso denegado', message: denied }, 403);

    const rows = await database
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.sessionId, sessionId))
      .orderBy(desc(prescriptions.createdAt));

    return c.json({ success: true, prescriptions: rows.map(mapPrescription) });
  }
);

prescriptionsRoutes.post(
  '/',
  requirePermission('manage_sessions'),
  async (c) => {
    const user = c.get('user')!;
    const raw = await c.req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(raw);
    if (!parsed.success) {
      return c.json({ error: 'Datos inválidos', issues: parsed.error.flatten() }, 400);
    }

    const { sessionId, ...data } = parsed.data;
    const sessionRows = await database.select().from(clinicalSessions).where(eq(clinicalSessions.id, sessionId)).limit(1);
    const session = sessionRows[0];
    if (!session) return c.json({ error: 'Sesión no encontrada' }, 404);
    const denied = await getSessionAccessDeniedReason(user, session);
    if (denied) return c.json({ error: 'Acceso denegado', message: denied }, 403);

    const id = crypto.randomUUID();
    const folio = await generateFolio();
    const iso = new Date().toISOString();
    const prescriptionDate = new Date().toISOString().split('T')[0];

    await database.insert(prescriptions).values({
      id,
      sessionId,
      patientId: session.patientId,
      patientName: data.patientName,
      patientDob: data.patientDob?.trim() || '—',
      patientDni: data.patientDni?.trim() || '—',
      podiatristId: user.userId,
      podiatristName: data.podiatristName,
      podiatristLicense: data.podiatristLicense ?? null,
      prescriptionDate,
      prescriptionText: data.prescriptionText,
      medications: data.medications ?? '',
      nextVisitDate: data.nextVisitDate ?? null,
      notes: data.notes ?? '',
      folio,
      patientAgeYears: data.patientAgeYears ?? null,
      patientWeightKg: data.patientWeightKg?.trim() || null,
      patientHeightCm: data.patientHeightCm?.trim() || null,
      podiatristCedula: data.podiatristCedula?.trim() || null,
      createdAt: iso,
      createdBy: user.userId,
      clinicId: session.clinicId ?? null,
    });

    await logAuditEvent({
      userId: user.userId,
      action: 'PRESCRIPTION_CREATE',
      resourceType: 'prescription',
      resourceId: id,
      clinicId: session.clinicId ?? undefined,
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
      details: { sessionId, folio },
    });

    const row = await database.select().from(prescriptions).where(eq(prescriptions.id, id)).limit(1);
    return c.json({ success: true, prescription: mapPrescription(row[0]!) }, 201);
  }
);

prescriptionsRoutes.delete(
  '/:id',
  requirePermission('manage_sessions'),
  async (c) => {
    const user = c.get('user')!;
    const id = sanitizePathParam(c.req.param('id'));
    const rows = await database.select().from(prescriptions).where(eq(prescriptions.id, id)).limit(1);
    const row = rows[0];
    if (!row) return c.json({ error: 'No encontrada' }, 404);
    if (user.role === 'podiatrist' && row.podiatristId !== user.userId) {
      return c.json({ error: 'Acceso denegado' }, 403);
    }

    await database.delete(prescriptions).where(eq(prescriptions.id, id));
    return c.json({ success: true });
  }
);

export default prescriptionsRoutes;
