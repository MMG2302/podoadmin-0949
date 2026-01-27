import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';
import { database } from '../database';
import { userCredits as userCreditsTable, creditTransactions as creditTransactionsTable } from '../database/schema';
import { eq, desc } from 'drizzle-orm';

const creditsRoutes = new Hono();

creditsRoutes.use('*', requireAuth);

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

export default creditsRoutes;

