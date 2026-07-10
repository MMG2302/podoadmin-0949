import { Hono } from 'hono';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';
import { database } from '../database';
import {
  checkoutHandoffs,
  clinicalSessions,
  patients,
  createdUsers,
} from '../database/schema';
import { sanitizePathParam } from '../utils/sanitization';
import { getPatientAccessDeniedReason } from '../utils/tenant-isolation';
import {
  enrichHandoffsWithNames,
  getCheckoutHandoffAccessDeniedReason,
  listAccessiblePodiatristIds,
  mapCheckoutHandoffRow,
  notifyReceptionistsCheckoutReady,
} from '../utils/checkout-handoffs-service';
import {
  assertCanReadTariffs,
  getPatientName,
  notifyPodiatristAmountRequested,
  resolveCheckoutTariffs,
  resolvePodiatristClinicId,
  saveCheckoutTariffs,
  normalizeCheckoutTariffs,
} from '../utils/checkout-tariffs';
import { logAuditEvent } from '../utils/audit-log';
import { getClientIP } from '../utils/ip-tracking';
import { getSafeUserAgent } from '../utils/request-headers';

const checkoutHandoffsRoutes = new Hono();

checkoutHandoffsRoutes.use('*', requireAuth);
checkoutHandoffsRoutes.use('*', requirePermission('view_checkout_handoffs'));

const generateId = () => `chk_${crypto.randomUUID().replace(/-/g, '')}`;

const createSchema = z.object({
  patientId: z.string().min(1),
  sessionId: z.string().optional(),
  appointmentId: z.string().optional(),
  amountCents: z.number().int().min(0),
  currency: z.string().min(3).max(3).optional(),
  notes: z.string().max(500).optional(),
  podiatristId: z.string().optional(),
});

const updateSchema = z.object({
  amountCents: z.number().int().min(0).optional(),
  notes: z.string().max(500).optional(),
  status: z.enum(['awaiting_amount', 'ready_for_payment', 'paid', 'cancelled']).optional(),
});

const listQuerySchema = z.object({
  status: z.string().optional(),
  podiatristId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

async function resolvePodiatristIdForCreate(
  user: { userId: string; role: string; clinicId?: string | null },
  body: z.infer<typeof createSchema>
): Promise<{ podiatristId: string } | { error: string; status: 403 | 400 }> {
  if (user.role === 'podiatrist') {
    return { podiatristId: user.userId };
  }
  if (user.role === 'receptionist' || user.role === 'clinic_admin') {
    const podiatristId = body.podiatristId?.trim();
    if (!podiatristId) {
      return { error: 'podiatristId es obligatorio', status: 400 };
    }
    const allowed = await listAccessiblePodiatristIds(user as Parameters<typeof listAccessiblePodiatristIds>[0]);
    if (allowed !== 'all' && !allowed.includes(podiatristId)) {
      return { error: 'No puedes crear handoffs para ese podólogo', status: 403 };
    }
    return { podiatristId };
  }
  return { error: 'No autorizado', status: 403 };
}

const tariffsBodySchema = z.object({
  podiatristId: z.string().optional(),
  tariffs: z.array(
    z.object({
      id: z.string().min(1).max(40),
      label: z.string().min(1).max(80),
      amountCents: z.number().int().min(0),
    })
  ),
});

/** GET /checkout-handoffs/tariffs */
checkoutHandoffsRoutes.get('/tariffs', async (c) => {
  const user = c.get('user')!;
  const podiatristId =
    c.req.query('podiatristId')?.trim() ||
    (user.role === 'podiatrist' ? user.userId : '');

  if (!podiatristId) {
    return c.json({ success: false, error: 'podiatristId es obligatorio' }, 400);
  }

  const denied = await assertCanReadTariffs(user, podiatristId);
  if (denied) return c.json({ success: false, error: denied }, 403);

  const clinicId = await resolvePodiatristClinicId(podiatristId);
  const tariffs = await resolveCheckoutTariffs(podiatristId, clinicId);

  return c.json({ success: true, tariffs, podiatristId, clinicId });
});

/** PUT /checkout-handoffs/tariffs */
checkoutHandoffsRoutes.put('/tariffs', requirePermission('manage_checkout_handoffs'), async (c) => {
  const user = c.get('user')!;
  const body = await c.req.json().catch(() => ({}));
  const parsed = tariffsBodySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: 'Datos inválidos' }, 400);
  }

  const result = await saveCheckoutTariffs(
    user,
    normalizeCheckoutTariffs(parsed.data.tariffs),
    parsed.data.podiatristId
  );

  if ('error' in result) {
    return c.json({ success: false, error: result.error }, 403);
  }

  return c.json({ success: true, scope: result.scope, tariffs: result.tariffs });
});

/** POST /checkout-handoffs/:id/request-amount */
checkoutHandoffsRoutes.post('/:id/request-amount', requirePermission('manage_checkout_handoffs'), async (c) => {
  const user = c.get('user')!;
  if (user.role !== 'receptionist' && user.role !== 'clinic_admin') {
    return c.json({ success: false, error: 'Solo recepción puede solicitar importe' }, 403);
  }

  const id = sanitizePathParam(c.req.param('id'));
  const rows = await database.select().from(checkoutHandoffs).where(eq(checkoutHandoffs.id, id)).limit(1);
  const existing = rows[0];
  if (!existing) {
    return c.json({ success: false, error: 'Handoff no encontrado' }, 404);
  }

  const accessDenied = await getCheckoutHandoffAccessDeniedReason(user, existing);
  if (accessDenied) {
    return c.json({ success: false, error: accessDenied }, 403);
  }

  if (existing.status !== 'awaiting_amount') {
    return c.json({ success: false, error: 'Este cobro ya tiene importe o está cerrado' }, 400);
  }

  const requesterRows = await database
    .select({ name: createdUsers.name })
    .from(createdUsers)
    .where(eq(createdUsers.userId, user.userId))
    .limit(1);

  const patientName = await getPatientName(existing.patientId);
  await notifyPodiatristAmountRequested({
    handoffId: id,
    podiatristUserId: existing.podiatristId,
    patientId: existing.patientId,
    patientName,
    requestedByName: requesterRows[0]?.name || 'Recepción',
  });

  await logAuditEvent({
    userId: user.userId,
    action: 'REQUEST_AMOUNT',
    resourceType: 'checkout_handoff',
    resourceId: id,
    details: { patientId: existing.patientId },
    ipAddress: getClientIP(c),
    userAgent: getSafeUserAgent(c),
    clinicId: existing.clinicId ?? user.clinicId ?? undefined,
  });

  return c.json({ success: true });
});

/** GET /checkout-handoffs */
checkoutHandoffsRoutes.get('/', async (c) => {
  const user = c.get('user')!;
  const parsed = listQuerySchema.safeParse({
    status: c.req.query('status'),
    podiatristId: c.req.query('podiatristId'),
    limit: c.req.query('limit'),
  });
  if (!parsed.success) {
    return c.json({ success: false, error: 'Parámetros inválidos' }, 400);
  }

  const allowedPodiatrists = await listAccessiblePodiatristIds(user);
  if (allowedPodiatrists !== 'all' && allowedPodiatrists.length === 0) {
    return c.json({ success: true, handoffs: [] });
  }

  const statusFilter = parsed.data.status
    ? parsed.data.status.split(',').map((s) => s.trim()).filter(Boolean)
    : ['awaiting_amount', 'ready_for_payment'];

  const conditions = [inArray(checkoutHandoffs.status, statusFilter)];

  if (parsed.data.podiatristId) {
    if (allowedPodiatrists !== 'all' && !allowedPodiatrists.includes(parsed.data.podiatristId)) {
      return c.json({ success: false, error: 'No autorizado' }, 403);
    }
    conditions.push(eq(checkoutHandoffs.podiatristId, parsed.data.podiatristId));
  } else if (allowedPodiatrists !== 'all') {
    conditions.push(inArray(checkoutHandoffs.podiatristId, allowedPodiatrists));
  }

  if (user.role === 'clinic_admin' && user.clinicId) {
    conditions.push(eq(checkoutHandoffs.clinicId, user.clinicId));
  }

  const rows = await database
    .select()
    .from(checkoutHandoffs)
    .where(and(...conditions))
    .orderBy(desc(checkoutHandoffs.createdAt))
    .limit(parsed.data.limit ?? 100);

  const mapped = rows.map(mapCheckoutHandoffRow);
  const enriched = await enrichHandoffsWithNames(mapped);

  return c.json({ success: true, handoffs: enriched });
});

/** GET /checkout-handoffs/pending-count */
checkoutHandoffsRoutes.get('/pending-count', async (c) => {
  const user = c.get('user')!;
  const allowedPodiatrists = await listAccessiblePodiatristIds(user);
  if (allowedPodiatrists !== 'all' && allowedPodiatrists.length === 0) {
    return c.json({ success: true, count: 0 });
  }

  const conditions = [
    inArray(checkoutHandoffs.status, ['awaiting_amount', 'ready_for_payment']),
  ];

  if (allowedPodiatrists !== 'all') {
    conditions.push(inArray(checkoutHandoffs.podiatristId, allowedPodiatrists));
  }
  if (user.role === 'clinic_admin' && user.clinicId) {
    conditions.push(eq(checkoutHandoffs.clinicId, user.clinicId));
  }

  const rows = await database
    .select({ id: checkoutHandoffs.id })
    .from(checkoutHandoffs)
    .where(and(...conditions));

  return c.json({ success: true, count: rows.length });
});

/** POST /checkout-handoffs */
checkoutHandoffsRoutes.post('/', requirePermission('manage_checkout_handoffs'), async (c) => {
  const user = c.get('user')!;
  const body = await c.req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: 'Datos inválidos', details: parsed.error.flatten() }, 400);
  }

  const podiatristResolved = await resolvePodiatristIdForCreate(user, parsed.data);
  if ('error' in podiatristResolved) {
    return c.json({ success: false, error: podiatristResolved.error }, podiatristResolved.status);
  }

  const patientRows = await database
    .select()
    .from(patients)
    .where(eq(patients.id, parsed.data.patientId))
    .limit(1);
  const patient = patientRows[0];
  if (!patient) {
    return c.json({ success: false, error: 'Paciente no encontrado' }, 404);
  }

  const accessDenied = await getPatientAccessDeniedReason(user, patient);
  if (accessDenied) {
    return c.json({ success: false, error: accessDenied }, 403);
  }

  if (patient.createdBy !== podiatristResolved.podiatristId) {
    return c.json({ success: false, error: 'El paciente no pertenece a ese podólogo' }, 400);
  }

  if (parsed.data.sessionId) {
    const sessionRows = await database
      .select()
      .from(clinicalSessions)
      .where(eq(clinicalSessions.id, parsed.data.sessionId))
      .limit(1);
    const session = sessionRows[0];
    if (!session || session.patientId !== parsed.data.patientId) {
      return c.json({ success: false, error: 'Sesión inválida' }, 400);
    }
  }

  const now = new Date().toISOString();
  const id = generateId();
  const amountCents = parsed.data.amountCents;
  const status = amountCents > 0 ? 'ready_for_payment' : 'awaiting_amount';

  await database.insert(checkoutHandoffs).values({
    id,
    clinicId: patient.clinicId ?? user.clinicId ?? null,
    podiatristId: podiatristResolved.podiatristId,
    patientId: parsed.data.patientId,
    sessionId: parsed.data.sessionId ?? null,
    appointmentId: parsed.data.appointmentId ?? null,
    amountCents,
    currency: (parsed.data.currency ?? 'MXN').toUpperCase(),
    notes: parsed.data.notes?.trim() || null,
    status,
    createdBy: user.userId,
    paidAt: null,
    paidBy: null,
    createdAt: now,
    updatedAt: now,
  });

  const podiatristRows = await database
    .select({ name: createdUsers.name })
    .from(createdUsers)
    .where(eq(createdUsers.userId, podiatristResolved.podiatristId))
    .limit(1);

  const patientName = `${patient.firstName} ${patient.lastName}`.trim();
  const podiatristName = podiatristRows[0]?.name || 'Podólogo';

  if (status === 'ready_for_payment') {
    await notifyReceptionistsCheckoutReady({
      handoffId: id,
      podiatristUserId: podiatristResolved.podiatristId,
      podiatristName,
      patientId: parsed.data.patientId,
      patientName,
      amountCents,
      currency: (parsed.data.currency ?? 'MXN').toUpperCase(),
    });
  }

  await logAuditEvent({
    userId: user.userId,
    action: 'CREATE',
    resourceType: 'checkout_handoff',
    resourceId: id,
    details: {
      patientId: parsed.data.patientId,
      sessionId: parsed.data.sessionId,
      amountCents,
      status,
    },
    ipAddress: getClientIP(c),
    userAgent: getSafeUserAgent(c),
    clinicId: patient.clinicId ?? user.clinicId ?? undefined,
  });

  const row = await database.select().from(checkoutHandoffs).where(eq(checkoutHandoffs.id, id)).limit(1);
  const mapped = mapCheckoutHandoffRow(row[0]!);
  const [enriched] = await enrichHandoffsWithNames([mapped]);

  return c.json({ success: true, handoff: enriched });
});

/** PATCH /checkout-handoffs/:id */
checkoutHandoffsRoutes.patch('/:id', requirePermission('manage_checkout_handoffs'), async (c) => {
  const user = c.get('user')!;
  const id = sanitizePathParam(c.req.param('id'));
  const body = await c.req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: 'Datos inválidos' }, 400);
  }

  const rows = await database.select().from(checkoutHandoffs).where(eq(checkoutHandoffs.id, id)).limit(1);
  const existing = rows[0];
  if (!existing) {
    return c.json({ success: false, error: 'Handoff no encontrado' }, 404);
  }

  const accessDenied = await getCheckoutHandoffAccessDeniedReason(user, existing);
  if (accessDenied) {
    return c.json({ success: false, error: accessDenied }, 403);
  }

  if (existing.status === 'paid' && parsed.data.status !== 'paid') {
    return c.json({ success: false, error: 'No se puede modificar un cobro ya pagado' }, 400);
  }

  const now = new Date().toISOString();
  const nextAmount =
    parsed.data.amountCents !== undefined ? parsed.data.amountCents : existing.amountCents;
  let nextStatus = parsed.data.status ?? existing.status;

  if (parsed.data.status === 'paid') {
    if (user.role !== 'receptionist' && user.role !== 'clinic_admin' && user.role !== 'podiatrist') {
      return c.json({ success: false, error: 'No autorizado para marcar cobrado' }, 403);
    }
    nextStatus = 'paid';
  } else if (parsed.data.amountCents !== undefined && nextAmount != null && nextAmount > 0) {
    if (existing.status === 'awaiting_amount') {
      nextStatus = 'ready_for_payment';
    }
  }

  const updatePayload: Partial<typeof checkoutHandoffs.$inferInsert> = {
    updatedAt: now,
    status: nextStatus,
  };

  if (parsed.data.amountCents !== undefined) updatePayload.amountCents = parsed.data.amountCents;
  if (parsed.data.notes !== undefined) updatePayload.notes = parsed.data.notes.trim() || null;

  if (nextStatus === 'paid') {
    updatePayload.paidAt = now;
    updatePayload.paidBy = user.userId;
  }

  await database.update(checkoutHandoffs).set(updatePayload).where(eq(checkoutHandoffs.id, id));

  if (
    nextStatus === 'ready_for_payment' &&
    existing.status === 'awaiting_amount' &&
    nextAmount != null &&
    nextAmount > 0
  ) {
    const patientRows = await database
      .select({ firstName: patients.firstName, lastName: patients.lastName })
      .from(patients)
      .where(eq(patients.id, existing.patientId))
      .limit(1);
    const podiatristRows = await database
      .select({ name: createdUsers.name })
      .from(createdUsers)
      .where(eq(createdUsers.userId, existing.podiatristId))
      .limit(1);
    const patientName = patientRows[0]
      ? `${patientRows[0].firstName} ${patientRows[0].lastName}`.trim()
      : 'Paciente';
    await notifyReceptionistsCheckoutReady({
      handoffId: id,
      podiatristUserId: existing.podiatristId,
      podiatristName: podiatristRows[0]?.name || 'Podólogo',
      patientId: existing.patientId,
      patientName,
      amountCents: nextAmount,
      currency: existing.currency,
    });
  }

  await logAuditEvent({
    userId: user.userId,
    action: 'UPDATE',
    resourceType: 'checkout_handoff',
    resourceId: id,
    details: { status: nextStatus, amountCents: nextAmount },
    ipAddress: getClientIP(c),
    userAgent: getSafeUserAgent(c),
    clinicId: existing.clinicId ?? user.clinicId ?? undefined,
  });

  const updated = await database.select().from(checkoutHandoffs).where(eq(checkoutHandoffs.id, id)).limit(1);
  const mapped = mapCheckoutHandoffRow(updated[0]!);
  const [enriched] = await enrichHandoffsWithNames([mapped]);

  return c.json({ success: true, handoff: enriched });
});

export default checkoutHandoffsRoutes;
