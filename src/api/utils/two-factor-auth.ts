import { TOTP } from 'otpauth';
import { database } from '../database';
import { twoFactorAuth } from '../database/schema';
import { eq } from 'drizzle-orm';
import base32Encode from 'base32-encode';

/**
 * Utilidades para autenticación de dos factores (2FA) con TOTP
 * Usa el estándar RFC 6238 (TOTP - Time-based One-Time Password)
 */

const ISSUER_NAME = 'PodoAdmin';

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
 * Genera códigos de respaldo (backup codes)
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generar código de 8 dígitos
    const code = Math.floor(10000000 + Math.random() * 90000000).toString();
    codes.push(code);
  }
  return codes;
}

/**
 * Habilita 2FA para un usuario
 */
export async function enable2FA(
  userId: string,
  secret: string,
  backupCodes: string[]
): Promise<void> {
  const now = new Date().toISOString();

  try {
    await database.insert(twoFactorAuth).values({
      userId,
      secret,
      enabled: true,
      backupCodes: JSON.stringify(backupCodes),
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    // Si ya existe, actualizar
    await database
      .update(twoFactorAuth)
      .set({
        secret,
        enabled: true,
        backupCodes: JSON.stringify(backupCodes),
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

  // Si no es TOTP, verificar como backup code
  if (config.backupCodes && config.backupCodes.includes(code)) {
    // Remover el backup code usado
    const updatedBackupCodes = config.backupCodes.filter((c) => c !== code);
    const now = new Date().toISOString();

    await database
      .update(twoFactorAuth)
      .set({
        backupCodes: JSON.stringify(updatedBackupCodes),
        updatedAt: now,
      })
      .where(eq(twoFactorAuth.userId, userId));

    return { valid: true, usedBackupCode: true };
  }

  return { valid: false };
}
