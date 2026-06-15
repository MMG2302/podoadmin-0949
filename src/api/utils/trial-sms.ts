import { createHash, randomInt } from 'crypto';
import { and, eq, gt } from 'drizzle-orm';

import { database } from '../database';
import { trialSmsOtp, trialUserVerifications } from '../database/schema';

import { isSmsConfigured, sendSms } from './sms-service';

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

export function isTrialSmsRequired(): boolean {
  return process.env.TRIAL_REQUIRE_SMS === '1' || process.env.NODE_ENV === 'production';
}

export function normalizePhoneE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 15) return null;
  if (raw.trim().startsWith('+')) return `+${digits}`;
  if (digits.length === 9 && (digits.startsWith('6') || digits.startsWith('7'))) {
    return `+34${digits}`;
  }
  return `+${digits}`;
}

export function hashPhoneE164(e164: string): string {
  return createHash('sha256').update(e164).digest('hex');
}

function hashOtp(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

export async function isPhoneUsedForTrial(phoneHash: string): Promise<boolean> {
  const row = await database
    .select({ userId: trialUserVerifications.userId })
    .from(trialUserVerifications)
    .where(eq(trialUserVerifications.phoneE164Hash, phoneHash))
    .limit(1)
    .then((r) => r[0]);
  return Boolean(row);
}

export async function sendTrialSmsOtp(userId: string, phoneRaw: string): Promise<{ ok: boolean; message?: string }> {
  if (!isSmsConfigured()) {
    return { ok: false, message: 'SMS no configurado en el servidor.' };
  }

  const e164 = normalizePhoneE164(phoneRaw);
  if (!e164) {
    return { ok: false, message: 'Número de teléfono inválido. Usa formato internacional (+34...).' };
  }

  const phoneHash = hashPhoneE164(e164);
  if (await isPhoneUsedForTrial(phoneHash)) {
    return {
      ok: false,
      message: 'Este número ya se usó para activar un periodo de prueba en otra cuenta.',
    };
  }

  const code =
    process.env.NODE_ENV !== 'production' && process.env.SMS_MOCK_CODE?.trim()
      ? process.env.SMS_MOCK_CODE.trim()
      : String(randomInt(100000, 999999));

  const now = Date.now();
  const iso = new Date().toISOString();
  const id = crypto.randomUUID();

  await database.insert(trialSmsOtp).values({
    id,
    userId,
    phoneE164Hash: phoneHash,
    codeHash: hashOtp(code),
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
    createdAt: iso,
  });

  const sent = await sendSms(
    e164,
    `PodoAdmin: tu código de verificación es ${code}. Válido 10 minutos.`
  );
  if (!sent) {
    return { ok: false, message: 'No se pudo enviar el SMS. Intenta más tarde.' };
  }

  return { ok: true };
}

export async function verifyTrialSmsOtp(
  userId: string,
  phoneRaw: string,
  code: string
): Promise<{ ok: boolean; message?: string }> {
  const e164 = normalizePhoneE164(phoneRaw);
  if (!e164) return { ok: false, message: 'Número inválido.' };

  const phoneHash = hashPhoneE164(e164);
  const now = Date.now();
  const iso = new Date().toISOString();

  const otp = await database
    .select()
    .from(trialSmsOtp)
    .where(and(eq(trialSmsOtp.userId, userId), gt(trialSmsOtp.expiresAt, now)))
    .limit(1)
    .then((r) => r[0]);

  if (!otp || otp.phoneE164Hash !== phoneHash) {
    return { ok: false, message: 'Código expirado o teléfono no coincide. Solicita uno nuevo.' };
  }

  if (otp.attempts >= MAX_OTP_ATTEMPTS) {
    return { ok: false, message: 'Demasiados intentos. Solicita un código nuevo.' };
  }

  if (otp.codeHash !== hashOtp(code.trim())) {
    await database
      .update(trialSmsOtp)
      .set({ attempts: otp.attempts + 1 })
      .where(eq(trialSmsOtp.id, otp.id));
    return { ok: false, message: 'Código incorrecto.' };
  }

  if (await isPhoneUsedForTrial(phoneHash)) {
    return { ok: false, message: 'Este número ya está vinculado a otra prueba gratuita.' };
  }

  const existing = await database
    .select()
    .from(trialUserVerifications)
    .where(eq(trialUserVerifications.userId, userId))
    .limit(1)
    .then((r) => r[0]);

  if (existing) {
    await database
      .update(trialUserVerifications)
      .set({
        phoneE164Hash: phoneHash,
        phoneVerifiedAt: now,
        updatedAt: iso,
      })
      .where(eq(trialUserVerifications.userId, userId));
  } else {
    await database.insert(trialUserVerifications).values({
      userId,
      phoneE164Hash: phoneHash,
      phoneVerifiedAt: now,
      createdAt: iso,
      updatedAt: iso,
    });
  }

  await database.delete(trialSmsOtp).where(eq(trialSmsOtp.userId, userId));
  return { ok: true };
}

export async function isUserSmsVerified(userId: string): Promise<boolean> {
  if (!isTrialSmsRequired()) return true;
  const row = await database
    .select({ at: trialUserVerifications.phoneVerifiedAt })
    .from(trialUserVerifications)
    .where(eq(trialUserVerifications.userId, userId))
    .limit(1)
    .then((r) => r[0]);
  return Boolean(row?.at);
}
