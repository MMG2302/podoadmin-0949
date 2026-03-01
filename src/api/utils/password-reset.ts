import { database } from '../database';
import { passwordResetTokens } from '../database/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Utilidades para tokens de recuperación de contraseña
 */

const TOKEN_EXPIRY_HOURS = 1; // 1 hora para mayor seguridad
const TOKEN_LENGTH = 32;

function generateResetToken(): string {
  const randomArray = new Uint8Array(TOKEN_LENGTH);
  crypto.getRandomValues(randomArray);
  return Array.from(randomArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Crea un token de recuperación para un usuario (por userId interno de created_users)
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = generateResetToken();
  const now = Date.now();
  const expiresAt = now + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;
  const createdAt = new Date().toISOString();

  await database.insert(passwordResetTokens).values({
    id: `reset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    token,
    expiresAt,
    used: false,
    createdAt,
  });

  return token;
}

/**
 * Verifica un token de recuperación (no lo consume). Devuelve userId y tokenId si es válido.
 * El token solo debe marcarse como usado tras restablecer la contraseña con éxito (un solo uso).
 */
export async function verifyPasswordResetToken(
  token: string
): Promise<{ valid: boolean; userId?: string; tokenId?: string; error?: string }> {
  try {
    const now = Date.now();

    const result = await database
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return { valid: false, error: 'Token no encontrado o ya usado' };
    }

    const tokenRecord = result[0];

    if (tokenRecord.expiresAt < now) {
      return { valid: false, error: 'Token expirado' };
    }

    return { valid: true, userId: tokenRecord.userId, tokenId: tokenRecord.id };
  } catch (error) {
    console.error('Error verificando token de recuperación:', error);
    return { valid: false, error: 'Error al verificar token' };
  }
}

/**
 * Marca un token de recuperación como usado. Llamar solo tras restablecer la contraseña con éxito (un solo uso).
 */
export async function markPasswordResetTokenUsed(tokenId: string): Promise<void> {
  await database
    .update(passwordResetTokens)
    .set({ used: true })
    .where(eq(passwordResetTokens.id, tokenId));
}

/**
 * Limpia tokens de recuperación expirados o usados
 */
export async function cleanupExpiredPasswordResetTokens(): Promise<number> {
  const now = Date.now();
  try {
    const allTokens = await database.select().from(passwordResetTokens);
    const expiredOrUsed = allTokens.filter(
      (t) => t.expiresAt < now || t.used
    );
    let deleted = 0;
    for (const token of expiredOrUsed) {
      await database
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.id, token.id));
      deleted++;
    }
    return deleted;
  } catch (error) {
    console.error('Error limpiando tokens de recuperación:', error);
    return 0;
  }
}
