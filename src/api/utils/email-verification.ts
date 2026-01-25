import { database } from '../database';
import { emailVerificationTokens } from '../database/schema';
import { eq, and, lt } from 'drizzle-orm';

/**
 * Utilidades para tokens de verificación de email
 */

const TOKEN_EXPIRY_HOURS = 24;
const TOKEN_LENGTH = 32;

/**
 * Genera un token único para verificación de email
 */
export function generateVerificationToken(): string {
  // Generar bytes aleatorios usando Web Crypto API
  const randomArray = new Uint8Array(TOKEN_LENGTH);
  crypto.getRandomValues(randomArray);
  
  // Convertir a string hexadecimal
  return Array.from(randomArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Crea un token de verificación para un usuario
 */
export async function createVerificationToken(
  userId: string
): Promise<string> {
  const token = generateVerificationToken();
  const now = Date.now();
  const expiresAt = now + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000; // 24 horas
  const createdAt = new Date().toISOString();

  await database.insert(emailVerificationTokens).values({
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    token,
    expiresAt,
    used: false,
    createdAt,
  });

  return token;
}

/**
 * Verifica y consume un token de verificación
 */
export async function verifyEmailToken(
  token: string
): Promise<{ valid: boolean; userId?: string; error?: string }> {
  try {
    const now = Date.now();

    const result = await database
      .select()
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.token, token),
          eq(emailVerificationTokens.used, false),
          // Note: SQLite doesn't have native date comparison, so we filter in memory
        )
      )
      .limit(1);

    if (result.length === 0) {
      return { valid: false, error: 'Token no encontrado o ya usado' };
    }

    const tokenRecord = result[0];

    // Verificar expiración
    if (tokenRecord.expiresAt < now) {
      return { valid: false, error: 'Token expirado' };
    }

    // Marcar como usado
    await database
      .update(emailVerificationTokens)
      .set({ used: true })
      .where(eq(emailVerificationTokens.id, tokenRecord.id));

    return { valid: true, userId: tokenRecord.userId };
  } catch (error) {
    console.error('Error verificando token:', error);
    return { valid: false, error: 'Error al verificar token' };
  }
}

/**
 * Limpia tokens expirados o usados
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const now = Date.now();

  try {
    // Nota: SQLite no tiene comparación de fechas nativa, así que filtramos en memoria
    const allTokens = await database.select().from(emailVerificationTokens);
    
    const expiredOrUsed = allTokens.filter(
      (t) => t.expiresAt < now || t.used
    );

    let deleted = 0;
    for (const token of expiredOrUsed) {
      await database
        .delete(emailVerificationTokens)
        .where(eq(emailVerificationTokens.id, token.id));
      deleted++;
    }

    return deleted;
  } catch (error) {
    console.error('Error limpiando tokens expirados:', error);
    return 0;
  }
}
