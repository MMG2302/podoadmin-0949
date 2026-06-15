import { database } from '../database';
import { tokenBlacklist } from '../database/schema';
import { eq, and, lt } from 'drizzle-orm';

/**
 * Utilidades para manejar blacklist de tokens
 * Permite invalidar tokens antes de su expiración (útil para logout)
 */

/**
 * Genera un ID único para un token (hash del token)
 * Usa Web Crypto API compatible con Cloudflare Workers
 */
export async function getTokenId(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Agrega un token a la blacklist
 */
export async function addTokenToBlacklist(
  token: string,
  userId: string,
  tokenType: 'access' | 'refresh',
  expiresAt: number // Timestamp en milisegundos
): Promise<void> {
  const tokenId = await getTokenId(token);
  const now = new Date().toISOString();

  try {
    await database.insert(tokenBlacklist).values({
      tokenId,
      userId,
      tokenType,
      expiresAt,
      createdAt: now,
    });
  } catch (error) {
    // Si el token ya está en la blacklist, no hacer nada
    // Esto puede pasar si se hace logout múltiples veces
    console.warn('Token ya está en blacklist o error al agregar:', error);
  }
}

/**
 * Verifica si un token está en la blacklist
 */
export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const tokenId = await getTokenId(token);

  try {
    const result = await database
      .select()
      .from(tokenBlacklist)
      .where(eq(tokenBlacklist.tokenId, tokenId))
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error('Error verificando blacklist:', error);
    // En caso de error, asumir que no está en blacklist para no bloquear usuarios legítimos
    return false;
  }
}

/**
 * Limpia tokens expirados de la blacklist
 * Debe ejecutarse periódicamente (ej: cada hora)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const now = Date.now();

  try {
    const result = await database
      .delete(tokenBlacklist)
      .where(lt(tokenBlacklist.expiresAt, now));

    return result.changes || 0;
  } catch (error) {
    console.error('Error limpiando tokens expirados:', error);
    return 0;
  }
}

/**
 * Revoca todos los tokens de un usuario (útil para logout de todos los dispositivos)
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  try {
    await database
      .delete(tokenBlacklist)
      .where(eq(tokenBlacklist.userId, userId));
  } catch (error) {
    console.error('Error revocando tokens de usuario:', error);
  }
}
