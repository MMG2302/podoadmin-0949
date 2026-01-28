import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { requirePermission, requireRole } from '../middleware/authorization';
import { database } from '../database';
import { userCredits as userCreditsTable, creditTransactions as creditTransactionsTable, createdUsers } from '../database/schema';
import { eq, desc } from 'drizzle-orm';
import { logAuditEvent } from '../utils/audit-log';
import { getClientIP } from '../utils/ip-tracking';

const creditsRoutes = new Hono();

creditsRoutes.use('*', requireAuth);

/**
 * GET /api/credits/summary
 * Resumen de créditos en el sistema (solo super_admin)
 */
creditsRoutes.get('/summary', requireRole('super_admin'), async (c) => {
  try {
    const rows = await database.select().from(userCreditsTable);
    const totalCreditsInSystem = rows.reduce((s, r) => s + (r.totalCredits ?? 0), 0);
    const byUser: Record<string, number> = {};
    for (const r of rows) {
      byUser[r.userId] = (r.totalCredits ?? 0) - (r.usedCredits ?? 0);
    }
    return c.json({ success: true, totalCreditsInSystem, byUser });
  } catch (error) {
    console.error('Error obteniendo resumen de créditos:', error);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * GET /api/credits/balances
 * Devuelve saldos por usuario para una clínica (clinic_admin) o global (super_admin).
 * Query: clinicId? (requerido para clinic_admin)
 */
creditsRoutes.get('/balances', requireRole('super_admin', 'clinic_admin'), async (c) => {
  try {
    const user = c.get('user');
    const clinicId = c.req.query('clinicId') || undefined;

    if (user.role === 'clinic_admin') {
      if (!clinicId || clinicId !== user.clinicId) {
        return c.json({ error: 'Acceso denegado' }, 403);
      }
    }

    // Usuarios objetivo: podiatrist de la clínica (o todos si super_admin sin clinicId)
    let userRows = await database.select().from(createdUsers);
    if (clinicId) userRows = userRows.filter((u) => u.clinicId === clinicId);
    userRows = userRows.filter((u) => u.role === 'podiatrist');

    const creditRows = await database.select().from(userCreditsTable);
    const byUser: Record<string, number> = {};
    for (const u of userRows) {
      const cr = creditRows.find((c) => c.userId === u.id || c.userId === u.userId);
      const total = cr?.totalCredits ?? 0;
      const used = cr?.usedCredits ?? 0;
      byUser[u.id] = total - used;
    }

    return c.json({ success: true, clinicId: clinicId ?? null, byUser });
  } catch (error) {
    console.error('Error obteniendo balances:', error);
    return c.json({ error: 'Error interno' }, 500);
  }
});

type DbUserCredits = typeof userCreditsTable.$inferSelect;
type DbCreditTx = typeof creditTransactionsTable.$inferSelect;

// Mapea los créditos de usuario de la DB al shape esperado por el frontend (UserCredits)
function mapUserCredits(row: DbUserCredits) {
  const total = row.totalCredits ?? 0;
  const used = row.usedCredits ?? 0;

  return {
    userId: row.userId,
    monthlyCredits: total, // tratamos totalCredits como saldo mensual actual
    extraCredits: 0,
    reservedCredits: used,
    lastMonthlyReset: row.createdAt,
    monthlyRenewalAmount: total,
  };
}

// Mapea la transacción de créditos al shape del frontend (CreditTransaction)
function mapCreditTransaction(tx: DbCreditTx) {
  return {
    id: tx.id,
    userId: tx.userId,
    type: tx.type,
    amount: tx.amount,
    description: tx.description || '',
    sessionId: tx.sessionId || undefined,
    createdAt: tx.createdAt,
  };
}

async function getOrCreateUserCreditsRow(userId: string): Promise<DbUserCredits> {
  const existing = await database
    .select()
    .from(userCreditsTable)
    .where(eq(userCreditsTable.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const now = new Date().toISOString();
  await database.insert(userCreditsTable).values({
    userId,
    totalCredits: 0,
    usedCredits: 0,
    createdAt: now,
    updatedAt: now,
  });

  const [created] = await database
    .select()
    .from(userCreditsTable)
    .where(eq(userCreditsTable.userId, userId))
    .limit(1);

  return created;
}

/**
 * Calcula el límite mensual (10% de monthlyRenewalAmount) y el total ajustado este mes
 * usando exclusivamente los datos de la base de datos.
 */
async function getCreditsLimitInfo(userId: string): Promise<{ monthlyLimit: number; adjustedThisMonth: number }> {
  const creditsRow = await getOrCreateUserCreditsRow(userId);
  const credits = mapUserCredits(creditsRow);

  const base = credits.monthlyRenewalAmount ?? credits.monthlyCredits ?? 0;
  const monthlyLimit = Math.floor(base * 0.1);

  const txRows = await database
    .select()
    .from(creditTransactionsTable)
    .where(eq(creditTransactionsTable.userId, userId));

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const adjustedThisMonth = txRows
    .filter((tx) => {
      if (tx.type !== 'earned') return false;
      if (!tx.description || !tx.description.startsWith('Ajuste de soporte')) return false;
      const d = new Date(tx.createdAt);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    })
    .reduce((sum, tx) => sum + (tx.amount ?? 0), 0);

  return { monthlyLimit, adjustedThisMonth };
}

/**
 * GET /api/credits/limits/:userId
 * Devuelve límite mensual (10% de monthlyRenewalAmount) y total ajustado este mes.
 * Solo accesible para super_admin y admin.
 */
creditsRoutes.get('/limits/:userId', requireRole('super_admin', 'admin'), async (c) => {
  try {
    const userId = c.req.param('userId');
    const { monthlyLimit, adjustedThisMonth } = await getCreditsLimitInfo(userId);
    return c.json({ success: true, userId, monthlyLimit, adjustedThisMonth });
  } catch (error) {
    console.error('Error obteniendo límites de créditos:', error);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * GET /api/credits/me
 * Devuelve los créditos y transacciones del usuario autenticado
 * Requiere: cualquier usuario autenticado
 */
creditsRoutes.get('/me', async (c) => {
  try {
    const user = c.get('user');
    const userId = user.userId;

    const creditsRow = await getOrCreateUserCreditsRow(userId);
    const credits = mapUserCredits(creditsRow);

    const txRows = await database
      .select()
      .from(creditTransactionsTable)
      .where(eq(creditTransactionsTable.userId, userId))
      .orderBy(desc(creditTransactionsTable.createdAt))
      .limit(100);

    const transactions = txRows.map(mapCreditTransaction);

    return c.json({
      success: true,
      credits,
      transactions,
    });
  } catch (error) {
    console.error('Error obteniendo créditos del usuario:', error);
    return c.json(
      { error: 'Error interno', message: 'Error al obtener créditos' },
      500
    );
  }
});

/**
 * POST /api/credits/purchase
 * Añade créditos extra al usuario autenticado y registra una transacción
 * Requiere: permiso purchase_credits
 */
creditsRoutes.post(
  '/purchase',
  requirePermission('purchase_credits'),
  async (c) => {
    try {
      const user = c.get('user');
      const userId = user.userId;

      const body = await c.req.json().catch(() => ({} as any));
      const amount = Number(body.amount);

      if (!amount || !Number.isFinite(amount) || amount <= 0) {
        return c.json(
          {
            error: 'Datos inválidos',
            message: 'La cantidad debe ser un número positivo',
          },
          400
        );
      }

      const now = new Date().toISOString();

      // Obtener o crear registro de créditos
      const current = await getOrCreateUserCreditsRow(userId);
      const newTotal = (current.totalCredits || 0) + amount;

      await database
        .update(userCreditsTable)
        .set({
          totalCredits: newTotal,
          updatedAt: now,
        })
        .where(eq(userCreditsTable.userId, userId));

      const creditsRow = await getOrCreateUserCreditsRow(userId);
      const credits = mapUserCredits(creditsRow);

      // Registrar transacción
      const txId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      await database.insert(creditTransactionsTable).values({
        id: txId,
        userId,
        amount,
        type: 'purchase',
        description: `Compra de ${amount} créditos extra`,
        sessionId: null,
        createdAt: now,
        clinicId: user.clinicId || null,
      });

      const [txRow] = await database
        .select()
        .from(creditTransactionsTable)
        .where(eq(creditTransactionsTable.id, txId))
        .limit(1);

      const transaction = mapCreditTransaction(txRow);

      return c.json({
        success: true,
        credits,
        transaction,
      });
    } catch (error) {
      console.error('Error al comprar créditos:', error);
      return c.json(
        { error: 'Error interno', message: 'Error al procesar la compra de créditos' },
        500
      );
    }
  }
);

/**
 * POST /api/credits/adjust
 * Ajuste de créditos por administrador (admin o super_admin). Body: { userId, amount, reason }
 */
creditsRoutes.post(
  '/adjust',
  requireRole('super_admin', 'admin'),
  async (c) => {
    try {
      const admin = c.get('user');
      const body = (await c.req.json().catch(() => ({}))) as { userId?: string; amount?: number; reason?: string };
      const targetUserId = body.userId;
      const amount = Number(body.amount) || 0;
      const reason = String(body.reason ?? '').trim() || 'Ajuste de soporte';

      if (!targetUserId || amount <= 0) {
        return c.json({ error: 'userId y amount positivo requeridos' }, 400);
      }

      // Validar límites contra el estado REAL de la DB (protección fuerte en backend)
      const { monthlyLimit, adjustedThisMonth } = await getCreditsLimitInfo(targetUserId);
      const remaining = monthlyLimit - adjustedThisMonth;
      if (amount > remaining) {
        return c.json(
          {
            error: 'limit_exceeded',
            message: `Límite excedido. Este usuario solo puede recibir ${remaining} créditos más este mes (${adjustedThisMonth}/${monthlyLimit} ya asignados por todos los admins)`,
            monthlyLimit,
            adjustedThisMonth,
          },
          400
        );
      }

      const current = await getOrCreateUserCreditsRow(targetUserId);
      const newTotal = (current.totalCredits ?? 0) + amount;
      const now = new Date().toISOString();

      await database
        .update(userCreditsTable)
        .set({ totalCredits: newTotal, updatedAt: now })
        .where(eq(userCreditsTable.userId, targetUserId));

      const txId = `tx_adj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      await database.insert(creditTransactionsTable).values({
        id: txId,
        userId: targetUserId,
        amount,
        type: 'earned',
        description: `Ajuste de soporte: ${reason}`,
        sessionId: null,
        createdAt: now,
        clinicId: admin.clinicId || null,
      });

      await logAuditEvent({
        userId: admin.userId,
        action: 'ADMIN_CREDIT_ADJUSTMENT',
        resourceType: 'credit',
        resourceId: targetUserId,
        details: { targetUserId, amount, reason },
        ipAddress: getClientIP(c.req.raw.headers),
        userAgent: c.req.header('User-Agent') ?? undefined,
        clinicId: admin.clinicId ?? undefined,
      });

      return c.json({
        success: true,
        credits: { userId: targetUserId, totalCredits: newTotal, usedCredits: current.usedCredits ?? 0 },
      });
    } catch (error) {
      console.error('Error en ajuste de créditos:', error);
      return c.json({ error: 'Error interno', message: 'Error al ajustar créditos' }, 500);
    }
  }
);

export default creditsRoutes;

