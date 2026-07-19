import { cleanupExpiredPasswordResetTokens } from './password-reset';
import { cleanupExpiredTokens as cleanupExpiredEmailVerificationTokens } from './email-verification';
import { database } from '../database';
import { securityMetrics } from '../database/schema';
import { and, lt, eq } from 'drizzle-orm';

/** Retención de métricas de seguridad: 12 meses (salvo legal hold). */
const SECURITY_METRICS_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Poda métricas de seguridad antiguas para acotar el crecimiento de la tabla
 * (es de las de mayor volumen: un registro por login fallido, captcha, 2FA, etc.).
 * `created_at` es texto ISO → la comparación lexicográfica con un cutoff ISO es válida.
 */
async function purgeOldSecurityMetrics(): Promise<number> {
  const cutoffIso = new Date(Date.now() - SECURITY_METRICS_RETENTION_MS).toISOString();
  try {
    const result = await database
      .delete(securityMetrics)
      .where(and(lt(securityMetrics.createdAt, cutoffIso), eq(securityMetrics.legalHold, false)));
    return (result as { meta?: { changes?: number } })?.meta?.changes ?? 0;
  } catch (err) {
    console.error('Error podando security_metrics:', err);
    return 0;
  }
}

/** Purga tokens operativos de corta vida (email verify, reset password) y métricas antiguas. */
export async function runOperationalCleanup(): Promise<{
  emailVerificationTokensRemoved: number;
  passwordResetTokensRemoved: number;
  securityMetricsRemoved: number;
}> {
  const emailVerificationTokensRemoved = await cleanupExpiredEmailVerificationTokens();
  const passwordResetTokensRemoved = await cleanupExpiredPasswordResetTokens();
  const securityMetricsRemoved = await purgeOldSecurityMetrics();
  return { emailVerificationTokensRemoved, passwordResetTokensRemoved, securityMetricsRemoved };
}
