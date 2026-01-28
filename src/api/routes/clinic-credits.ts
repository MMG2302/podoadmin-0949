import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/authorization';
import { database } from '../database';
import {
  clinicCredits as clinicCreditsTable,
  clinicCreditDistributions as distributionsTable,
  userCredits as userCreditsTable,
  creditTransactions as creditTransactionsTable,
} from '../database/schema';
import { logAuditEvent } from '../utils/audit-log';
import { getClientIP } from '../utils/ip-tracking';

const clinicCreditsRoutes = new Hono();

clinicCreditsRoutes.use('*', requireAuth);

function canAccessClinicCredits(user: { role: string; clinicId?: string }, clinicId: string): boolean {
  if (user.role === 'super_admin') return true;
  return user.role === 'clinic_admin' && user.clinicId === clinicId;
}

async function getOrCreateClinicCredits(clinicId: string) {
  const rows = await database.select().from(clinicCreditsTable).where(eq(clinicCreditsTable.clinicId, clinicId)).limit(1);
  if (rows.length > 0) return rows[0];
  const now = new Date().toISOString();
  await database.insert(clinicCreditsTable).values({
    clinicId,
    totalCredits: 0,
    distributedToDate: 0,
    createdAt: now,
    updatedAt: now,
  });
  const [inserted] = await database.select().from(clinicCreditsTable).where(eq(clinicCreditsTable.clinicId, clinicId)).limit(1);
  return inserted;
}

async function getOrCreateUserCredits(userId: string) {
  const rows = await database.select().from(userCreditsTable).where(eq(userCreditsTable.userId, userId)).limit(1);
  if (rows.length > 0) return rows[0];
  const now = new Date().toISOString();
  await database.insert(userCreditsTable).values({
    userId,
    totalCredits: 0,
    usedCredits: 0,
    createdAt: now,
    updatedAt: now,
  });
  const [inserted] = await database.select().from(userCreditsTable).where(eq(userCreditsTable.userId, userId)).limit(1);
  return inserted;
}

/**
 * GET /api/clinic-credits/:clinicId
 * Créditos de la clínica (totalCredits, distributedToDate, available)
 */
clinicCreditsRoutes.get('/:clinicId', async (c) => {
  const user = c.get('user');
  const clinicId = c.req.param('clinicId');
  if (!user || !canAccessClinicCredits(user, clinicId)) {
    return c.json({ error: 'Acceso denegado' }, 403);
  }
  const row = await getOrCreateClinicCredits(clinicId);
  const total = row.totalCredits ?? 0;
  const distributed = row.distributedToDate ?? 0;
  return c.json({
    success: true,
    credits: {
      clinicId: row.clinicId,
      totalCredits: total,
      distributedToDate: distributed,
      available: total - distributed,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
  });
});

/**
 * PUT /api/clinic-credits/:clinicId
 * Inicializar o añadir créditos. Body: { amount?: number, initialTotal?: number }
 * amount = añade al total actual; initialTotal = establece el total (solo si no existe).
 */
clinicCreditsRoutes.put('/:clinicId', requireRole('super_admin', 'clinic_admin'), async (c) => {
  const user = c.get('user');
  const clinicId = c.req.param('clinicId');
  if (!user || !canAccessClinicCredits(user, clinicId)) {
    return c.json({ error: 'Acceso denegado' }, 403);
  }
  const body = (await c.req.json().catch(() => ({}))) as { amount?: number; initialTotal?: number };
  const row = await getOrCreateClinicCredits(clinicId);
  const add = Number(body.amount) || 0;
  const initial = body.initialTotal != null ? Number(body.initialTotal) : null;
  let newTotal = (row.totalCredits ?? 0) + add;
  if (initial != null && (row.totalCredits ?? 0) === 0 && row.distributedToDate === 0) {
    newTotal = initial;
  }
  const now = new Date().toISOString();
  await database.update(clinicCreditsTable).set({
    totalCredits: newTotal,
    updatedAt: now,
  }).where(eq(clinicCreditsTable.clinicId, clinicId));
  await logAuditEvent({
    userId: user.userId,
    action: 'UPDATE',
    resourceType: 'clinic_credits',
    resourceId: clinicId,
    details: { clinicId, amount: add, initialTotal: initial, newTotal },
    ipAddress: getClientIP(c.req.raw.headers),
    userAgent: c.req.header('User-Agent') ?? undefined,
    clinicId,
  });
  const updated = await getOrCreateClinicCredits(clinicId);
  return c.json({
    success: true,
    credits: {
      clinicId: updated.clinicId,
      totalCredits: updated.totalCredits ?? 0,
      distributedToDate: updated.distributedToDate ?? 0,
      available: (updated.totalCredits ?? 0) - (updated.distributedToDate ?? 0),
    },
  });
});

/**
 * GET /api/clinic-credits/:clinicId/distributions
 * Historial de distribuciones de la clínica
 */
clinicCreditsRoutes.get('/:clinicId/distributions', async (c) => {
  const user = c.get('user');
  const clinicId = c.req.param('clinicId');
  if (!user || !canAccessClinicCredits(user, clinicId)) {
    return c.json({ error: 'Acceso denegado' }, 403);
  }
  const rows = await database.select().from(distributionsTable)
    .where(eq(distributionsTable.clinicId, clinicId))
    .orderBy(desc(distributionsTable.createdAt))
    .limit(200);
  const list = rows.map((r) => ({
    id: r.id,
    clinicId: r.clinicId,
    userId: r.userId,
    toPodiatrist: r.userId,
    fromClinicAdmin: r.distributedBy,
    amount: r.amount,
    reason: '',
    createdAt: r.createdAt,
  }));
  return c.json({ success: true, distributions: list });
});

/**
 * POST /api/clinic-credits/:clinicId/distribute
 * Asignar créditos a un podólogo. Body: { userId, amount, reason? }
 */
clinicCreditsRoutes.post('/:clinicId/distribute', requireRole('clinic_admin'), async (c) => {
  const user = c.get('user');
  const clinicId = c.req.param('clinicId');
  if (!user || !canAccessClinicCredits(user, clinicId)) {
    return c.json({ error: 'Acceso denegado' }, 403);
  }
  const body = (await c.req.json().catch(() => ({}))) as { userId?: string; amount?: number; reason?: string };
  const toUserId = body.userId;
  const amount = Number(body.amount) || 0;
  const reason = String(body.reason ?? '').trim() || 'Distribución de créditos';
  if (!toUserId || amount <= 0) {
    return c.json({ error: 'userId y amount positivo requeridos' }, 400);
  }
  const clinicRow = await getOrCreateClinicCredits(clinicId);
  const available = (clinicRow.totalCredits ?? 0) - (clinicRow.distributedToDate ?? 0);
  if (amount > available) {
    return c.json({ error: `No hay suficientes créditos. Disponibles: ${available}` }, 400);
  }
  const now = new Date().toISOString();
  const distId = `dist_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  await database.update(clinicCreditsTable).set({
    distributedToDate: (clinicRow.distributedToDate ?? 0) + amount,
    updatedAt: now,
  }).where(eq(clinicCreditsTable.clinicId, clinicId));

  const podCredits = await getOrCreateUserCredits(toUserId);
  const newTotal = (podCredits.totalCredits ?? 0) + amount;
  await database.update(userCreditsTable).set({
    totalCredits: newTotal,
    updatedAt: now,
  }).where(eq(userCreditsTable.userId, toUserId));

  await database.insert(distributionsTable).values({
    id: distId,
    clinicId,
    userId: toUserId,
    amount,
    distributedBy: user.userId,
    createdAt: now,
  });

  const txId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  await database.insert(creditTransactionsTable).values({
    id: txId,
    userId: toUserId,
    amount,
    type: 'earned',
    description: `Créditos distribuidos por administrador: ${reason}`,
    sessionId: null,
    createdAt: now,
    clinicId,
  });

  await logAuditEvent({
    userId: user.userId,
    action: 'CREDIT_DISTRIBUTION',
    resourceType: 'credit',
    resourceId: distId,
    details: { clinicId, toPodiatrist: toUserId, amount, reason },
    ipAddress: getClientIP(c.req.raw.headers),
    userAgent: c.req.header('User-Agent') ?? undefined,
    clinicId,
  });

  return c.json({
    success: true,
    distribution: {
      id: distId,
      clinicId,
      toPodiatrist: toUserId,
      fromClinicAdmin: user.userId,
      amount,
      reason,
      createdAt: now,
    },
  });
});

/**
 * POST /api/clinic-credits/:clinicId/subtract
 * Quitar créditos a un podólogo y devolver al pool. Body: { userId, amount, reason? }
 */
clinicCreditsRoutes.post('/:clinicId/subtract', requireRole('clinic_admin'), async (c) => {
  const user = c.get('user');
  const clinicId = c.req.param('clinicId');
  if (!user || !canAccessClinicCredits(user, clinicId)) {
    return c.json({ error: 'Acceso denegado' }, 403);
  }
  const body = (await c.req.json().catch(() => ({}))) as { userId?: string; amount?: number; reason?: string };
  const fromUserId = body.userId;
  const amount = Number(body.amount) || 0;
  const reason = String(body.reason ?? '').trim() || 'Retiro de créditos';
  if (!fromUserId || amount <= 0) {
    return c.json({ error: 'userId y amount positivo requeridos' }, 400);
  }
  const podCredits = await getOrCreateUserCredits(fromUserId);
  const available = (podCredits.totalCredits ?? 0) - (podCredits.usedCredits ?? 0);
  if (amount > available) {
    return c.json({ error: `El podólogo no tiene suficientes créditos. Disponibles: ${available}` }, 400);
  }
  const clinicRow = await getOrCreateClinicCredits(clinicId);
  const now = new Date().toISOString();
  const distId = `dist_sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  await database.update(clinicCreditsTable).set({
    distributedToDate: Math.max(0, (clinicRow.distributedToDate ?? 0) - amount),
    updatedAt: now,
  }).where(eq(clinicCreditsTable.clinicId, clinicId));

  const newTotal = Math.max(0, (podCredits.totalCredits ?? 0) - amount);
  await database.update(userCreditsTable).set({
    totalCredits: newTotal,
    updatedAt: now,
  }).where(eq(userCreditsTable.userId, fromUserId));

  await database.insert(distributionsTable).values({
    id: distId,
    clinicId,
    userId: fromUserId,
    amount: -amount,
    distributedBy: user.userId,
    createdAt: now,
  });

  await logAuditEvent({
    userId: user.userId,
    action: 'CREDIT_SUBTRACTION',
    resourceType: 'credit',
    resourceId: distId,
    details: { clinicId, fromPodiatrist: fromUserId, amount, reason },
    ipAddress: getClientIP(c.req.raw.headers),
    userAgent: c.req.header('User-Agent') ?? undefined,
    clinicId,
  });

  return c.json({
    success: true,
    distribution: {
      id: distId,
      clinicId,
      toPodiatrist: fromUserId,
      fromClinicAdmin: user.userId,
      amount: -amount,
      reason,
      createdAt: now,
    },
  });
});

export default clinicCreditsRoutes;
