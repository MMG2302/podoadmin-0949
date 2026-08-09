import { TOTP } from 'otpauth';
import { database } from '../database';
import { twoFactorAuth } from '../database/schema';
import { eq } from 'drizzle-orm';
import base32Encode from 'base32-encode';

/**
 * Utilidades para autenticación de dos factores (2FA) con TOTP
 * Usa el estándar RFC 6238 (TOTP - Time-based One-Time Password)
 */

const ISSUER_NAME = 'Podoraa';

/**
 * Genera un secreto TOTP para un usuario
 */
export function generateTOTPSecret(userId: string, userEmail: string): {
  secret: string;
  qrCodeUrl: string;
} {
  // Generar bytes aleatorios usando Web Crypto API (compatible con Cloudflare Workers)
  const randomArray = new Uint8Array(20);
  crypto.getRandomValues(randomArray);
  
  // Convertir a base32 (formato estándar para TOTP)
  const secret = base32Encode(randomArray, 'RFC3548').replace(/=/g, '');
  
  const totp = new TOTP({
    issuer: ISSUER_NAME,
    label: userEmail,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: secret,
  });

  const qrCodeUrl = totp.toString();

  return {
    secret,
    qrCodeUrl,
  };
}

/**
 * Verifica un código TOTP
 */
export function verifyTOTPCode(secret: string, code: string): boolean {
  try {
    const totp = new TOTP({
      secret: secret,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });

    // Verificar código con ventana de ±1 período (30 segundos)
    return totp.validate({ token: code, window: 1 }) !== null;
  } catch (error) {
    console.error('Error verificando código TOTP:', error);
    return false;
  }
}

/**
 * Alfabeto Crockford base32: 32 símbolos, sin I, L, O ni U, para que un código
 * transcrito a mano no se confunda. 32 divide a 256, así que `byte % 32` es uniforme
 * y no hace falta rechazo de muestras.
 */
const BACKUP_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const BACKUP_SYMBOLS = 12; // 12 × 5 bits = 60 bits de entropía por código

/**
 * Normaliza un código tal como lo teclea el usuario: mayúsculas, sin guiones ni
 * espacios, y con las confusiones habituales de Crockford resueltas (O→0, I/L→1).
 */
function normalizeBackupCode(code: string): string {
  return code
    .trim()
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
}

/** SHA-256 en hexadecimal del código normalizado. */
async function hashBackupCode(code: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(normalizeBackupCode(code))
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Comparación en tiempo constante: no revela en qué carácter difieren. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Genera códigos de respaldo en claro, para mostrarlos una única vez al usuario.
 *
 * Con `crypto.getRandomValues`, no `Math.random()`: los diez códigos salían antes de
 * tiradas consecutivas del mismo PRNG, así que conocer uno permitía derivar el resto.
 *
 * Se devuelven agrupados (XXXX-XXXX-XXXX) solo para que sean legibles; la verificación
 * normaliza la entrada, de modo que el usuario puede teclearlos con o sin guiones.
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = crypto.getRandomValues(new Uint8Array(BACKUP_SYMBOLS));
    const symbols = Array.from(bytes, (b) => BACKUP_ALPHABET[b % BACKUP_ALPHABET.length]).join('');
    codes.push(symbols.replace(/(.{4})(.{4})(.{4})/, '$1-$2-$3'));
  }
  return codes;
}

/** Hashea los códigos para guardarlos. Nunca se almacena el código en claro. */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map(hashBackupCode));
}

const SHA256_HEX = /^[0-9a-f]{64}$/;

/**
 * Busca un código entre los almacenados y devuelve su índice, o -1.
 *
 * Acepta también entradas heredadas en claro (los códigos de 8 dígitos que se guardaban
 * sin hashear antes de este cambio) para no dejar fuera a una cuenta que hubiera activado
 * 2FA por API. Esa rama puede eliminarse cuando no queden códigos con ese formato.
 */
export async function findBackupCodeIndex(stored: string[], input: string): Promise<number> {
  const hashed = await hashBackupCode(input);
  const normalized = normalizeBackupCode(input);

  for (let i = 0; i < stored.length; i++) {
    const entry = stored[i];
    const match = SHA256_HEX.test(entry)
      ? timingSafeEqual(entry, hashed)
      : timingSafeEqual(normalizeBackupCode(entry), normalized);
    if (match) return i;
  }
  return -1;
}

/**
 * Habilita 2FA para un usuario.
 *
 * `backupCodes` son los códigos en claro que se muestran una vez al usuario; aquí se
 * guardan hasheados. Son credenciales equivalentes a una contraseña: si la tabla se
 * leyera indebidamente, en claro serían utilizables tal cual.
 */
export async function enable2FA(
  userId: string,
  secret: string,
  backupCodes: string[]
): Promise<void> {
  const now = new Date().toISOString();
  const hashed = JSON.stringify(await hashBackupCodes(backupCodes));

  try {
    await database.insert(twoFactorAuth).values({
      userId,
      secret,
      enabled: true,
      backupCodes: hashed,
      createdAt: now,
      updatedAt: now,
    });
  } catch {
    // Si ya existe, actualizar
    await database
      .update(twoFactorAuth)
      .set({
        secret,
        enabled: true,
        backupCodes: hashed,
        updatedAt: now,
      })
      .where(eq(twoFactorAuth.userId, userId));
  }
}

/**
 * Deshabilita 2FA para un usuario
 */
export async function disable2FA(userId: string): Promise<void> {
  const now = new Date().toISOString();

  try {
    await database
      .update(twoFactorAuth)
      .set({
        enabled: false,
        updatedAt: now,
      })
      .where(eq(twoFactorAuth.userId, userId));
  } catch (error) {
    console.error('Error deshabilitando 2FA:', error);
  }
}

/**
 * Borra por completo la configuración de 2FA de un usuario: secreto y códigos de respaldo.
 *
 * Es lo que ejecuta el reseteo administrativo. Se elimina la fila entera en vez de poner
 * `enabled = false` por dos razones: `secret` es NOT NULL y no se puede vaciar, y dejar
 * guardado el secreto viejo significaría que el reseteo no invalida de verdad al
 * autenticador que el usuario ya no controla (si volviera a activarse la fila, el teléfono
 * perdido seguiría generando códigos válidos). Sin fila, `get2FAConfig` responde
 * `{ enabled: false }` y `/2fa/setup` vuelve a estar disponible para dar de alta un
 * secreto nuevo.
 *
 * Devuelve si había 2FA activo, para distinguir un reseteo real de un no-op.
 */
export async function resetTwoFactorForUser(userId: string): Promise<{ wasEnabled: boolean }> {
  const config = await get2FAConfig(userId);
  const wasEnabled = config?.enabled === true;

  await database.delete(twoFactorAuth).where(eq(twoFactorAuth.userId, userId));

  return { wasEnabled };
}

/**
 * Obtiene la configuración de 2FA de un usuario
 */
export async function get2FAConfig(userId: string): Promise<{
  enabled: boolean;
  secret?: string;
  backupCodes?: string[];
} | null> {
  try {
    const result = await database
      .select()
      .from(twoFactorAuth)
      .where(eq(twoFactorAuth.userId, userId))
      .limit(1);

    if (result.length === 0) {
      return { enabled: false };
    }

    const config = result[0];
    return {
      enabled: config.enabled,
      secret: config.secret || undefined,
      backupCodes: config.backupCodes
        ? JSON.parse(config.backupCodes)
        : undefined,
    };
  } catch (error) {
    console.error('Error obteniendo configuración 2FA:', error);
    return { enabled: false };
  }
}

/**
 * Verifica si un usuario tiene 2FA habilitado
 */
export async function is2FAEnabled(userId: string): Promise<boolean> {
  const config = await get2FAConfig(userId);
  return config?.enabled === true;
}

/**
 * Verifica un código 2FA (TOTP o backup code)
 */
export async function verify2FACode(
  userId: string,
  code: string
): Promise<{ valid: boolean; usedBackupCode?: boolean }> {
  const config = await get2FAConfig(userId);

  if (!config?.enabled || !config.secret) {
    return { valid: false };
  }

  // Intentar verificar como código TOTP
  if (verifyTOTPCode(config.secret, code)) {
    return { valid: true };
  }

  // Si no es TOTP, verificar como código de respaldo
  if (config.backupCodes?.length) {
    const index = await findBackupCodeIndex(config.backupCodes, code);
    if (index >= 0) {
      // Un código de respaldo es de un solo uso: se consume por índice, no por valor,
      // para que dos entradas con el mismo hash no se borren juntas.
      const remaining = config.backupCodes.filter((_, i) => i !== index);

      await database
        .update(twoFactorAuth)
        .set({
          backupCodes: JSON.stringify(remaining),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(twoFactorAuth.userId, userId));

      return { valid: true, usedBackupCode: true };
    }
  }

  return { valid: false };
}
