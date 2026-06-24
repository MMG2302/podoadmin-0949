import { cleanupExpiredPasswordResetTokens } from './password-reset';
import { cleanupExpiredTokens as cleanupExpiredEmailVerificationTokens } from './email-verification';

/** Purga tokens operativos de corta vida (email verify, reset password). */
export async function runOperationalCleanup(): Promise<{
  emailVerificationTokensRemoved: number;
  passwordResetTokensRemoved: number;
}> {
  const emailVerificationTokensRemoved = await cleanupExpiredEmailVerificationTokens();
  const passwordResetTokensRemoved = await cleanupExpiredPasswordResetTokens();
  return { emailVerificationTokensRemoved, passwordResetTokensRemoved };
}
