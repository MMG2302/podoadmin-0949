import { and, eq } from 'drizzle-orm';

import { database } from '../database';
import { ipTrialGrants, subscriptions, trialUserVerifications } from '../database/schema';

import { evaluateIpTrialRisk, queryIpWithIpQuery } from './ipquery-client';
import { getTrialVerificationStatus } from './trial-card';
import {
  getSubscriptionForUser,
  type SubscriptionPublic,
  TRIAL_PERIOD_MS,
} from './subscription-service';

export type IpTrialEligibilityReason =
  | 'eligible'
  | 'ip_already_used'
  | 'ip_unknown'
  | 'ip_risky'
  | 'ipquery_unavailable'
  | 'role_not_eligible'
  | 'already_active_trial'
  | 'already_paid'
  | 'verification_incomplete'
  | 'ip_repeat_revoked';

export interface IpTrialEligibility {
  eligible: boolean;
  reason: IpTrialEligibilityReason;
  message?: string;
  ip?: string;
  expiresAt?: number;
}

export interface IpTrialGrantResult {
  granted: boolean;
  subscription?: SubscriptionPublic;
  eligibility: IpTrialEligibility;
}

function normalizeClientIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const trimmed = ip.trim();
  if (!trimmed || trimmed === 'unknown') return null;
  return trimmed;
}

function allowUnknownIpInDev(): boolean {
  return (
    process.env.IPQUERY_ALLOW_UNKNOWN_IP === '1' ||
    (process.env.NODE_ENV !== 'production' && process.env.IPQUERY_ALLOW_UNKNOWN_IP !== '0')
  );
}

function enforceIpTrialInDev(): boolean {
  return process.env.IP_TRIAL_ENFORCE_IN_DEV === '1' || process.env.NODE_ENV === 'production';
}

/** Resuelve IP del cliente para políticas de trial (prod exige IP real salvo dev-local explícito). */
export function resolveClientIpForTrial(clientIp: string | null | undefined): string | null {
  let ip = normalizeClientIp(clientIp);
  if (!ip && allowUnknownIpInDev()) {
    ip = 'dev-local';
  }
  return ip;
}

/**
 * Bloquea registro público si esta IP ya consumió el mes de prueba gratuito.
 * Una IP = un trial de por vida (tabla ip_trial_grants, índice único en ip_address).
 */
export async function checkPublicRegistrationIpTrialPolicy(params: {
  clientIp: string | null | undefined;
  role?: string;
  /** Si se une a clínica existente, no aplica bloqueo (no abre trial independiente). */
  joiningExistingClinic?: boolean;
}): Promise<{ allowed: boolean; reason?: IpTrialEligibilityReason; message?: string }> {
  const role = params.role ?? 'podiatrist';
  if (role !== 'clinic_admin' && role !== 'podiatrist') {
    return { allowed: true };
  }
  if (params.joiningExistingClinic) {
    return { allowed: true };
  }

  const ip = resolveClientIpForTrial(params.clientIp);
  if (!ip) {
    if (process.env.NODE_ENV === 'production') {
      return {
        allowed: false,
        reason: 'ip_unknown',
        message:
          'No pudimos verificar tu conexión. Desactiva VPN/proxy o contacta con soporte para registrarte.',
      };
    }
    return { allowed: true };
  }

  if (!enforceIpTrialInDev() && ip === 'dev-local') {
    return { allowed: true };
  }

  if (ip !== 'dev-local' && (await hasIpUsedTrial(ip))) {
    return {
      allowed: false,
      reason: 'ip_already_used',
      message:
        'Esta conexión ya utilizó el periodo de prueba gratuito de 1 mes. ' +
        'Inicia sesión en tu cuenta existente o activa el pago en Facturación.',
    };
  }

  return { allowed: true };
}

export async function hasIpUsedTrial(ip: string): Promise<boolean> {
  const row = await database
    .select({ id: ipTrialGrants.id })
    .from(ipTrialGrants)
    .where(eq(ipTrialGrants.ipAddress, ip))
    .limit(1)
    .then((r) => r[0]);
  return Boolean(row);
}

/** Revoca trials activos vinculados a una IP (p. ej. segunda cuenta desde la misma conexión). */
export async function revokeActiveTrialsForIp(
  ip: string,
  reason: string,
  exceptUserId?: string
): Promise<string[]> {
  const now = Date.now();
  const iso = new Date().toISOString();
  const grants = await database.select().from(ipTrialGrants).where(eq(ipTrialGrants.ipAddress, ip));

  const revokedUserIds: string[] = [];
  for (const grant of grants) {
    if (grant.status === 'revoked') continue;
    if (grant.expiresAt <= now) continue;
    if (exceptUserId && grant.userId === exceptUserId) continue;

    await database
      .update(ipTrialGrants)
      .set({
        status: 'revoked',
        revokedAt: now,
        revokeReason: reason,
      })
      .where(eq(ipTrialGrants.id, grant.id));

    if (grant.subscriptionId) {
      await database
        .update(subscriptions)
        .set({
          status: 'cancelled',
          currentPeriodEnd: now,
          updatedAt: iso,
        })
        .where(eq(subscriptions.id, grant.subscriptionId));
    }
    revokedUserIds.push(grant.userId);
  }
  return revokedUserIds;
}

async function handleIpRepeatBeforeGrant(
  ip: string,
  userId: string
): Promise<{ allowed: boolean; message?: string; reason?: IpTrialEligibilityReason }> {
  if (process.env.TRIAL_REVOKE_ON_IP_REPEAT === '0') {
    return { allowed: true };
  }

  const grants = await database
    .select()
    .from(ipTrialGrants)
    .where(eq(ipTrialGrants.ipAddress, ip));

  const now = Date.now();
  const activeOther = grants.filter(
    (g) => g.userId !== userId && g.status !== 'revoked' && g.expiresAt > now
  );

  if (activeOther.length === 0) {
    return { allowed: true };
  }

  await revokeActiveTrialsForIp(ip, 'ip_repeat', userId);

  return {
    allowed: false,
    reason: 'ip_repeat_revoked',
    message:
      'Se detectó otra cuenta de prueba desde esta misma conexión. ' +
      'Se cancelaron los accesos de prueba vinculados a esta IP. Activa el pago para continuar.',
  };
}

export async function getIpTrialGrantForSubject(
  subjectType: 'clinic' | 'user',
  subjectId: string
): Promise<typeof ipTrialGrants.$inferSelect | null> {
  const row = await database
    .select()
    .from(ipTrialGrants)
    .where(and(eq(ipTrialGrants.subjectType, subjectType), eq(ipTrialGrants.subjectId, subjectId)))
    .limit(1)
    .then((r) => r[0]);
  return row ?? null;
}

export async function isIpTrialSubscriptionActive(
  sub: SubscriptionPublic | null,
  subjectType: 'clinic' | 'user',
  subjectId: string
): Promise<boolean> {
  if (!sub || sub.status !== 'trial' || !sub.isActive) return false;
  const grant = await getIpTrialGrantForSubject(subjectType, subjectId);
  if (!grant || grant.status === 'revoked') return false;
  return grant.expiresAt > Date.now();
}

export async function checkIpTrialEligibility(
  clientIp: string | null | undefined,
  role: string
): Promise<IpTrialEligibility> {
  if (role !== 'clinic_admin' && role !== 'podiatrist') {
    return {
      eligible: false,
      reason: 'role_not_eligible',
      message: 'Tu rol no incluye periodo de prueba automático.',
    };
  }

  let ip = resolveClientIpForTrial(clientIp);
  if (!ip) {
    return {
      eligible: false,
      reason: 'ip_unknown',
      message: 'No pudimos identificar tu IP. Conéctate sin VPN/proxy o activa el pago en Facturación.',
    };
  }

  if (ip !== 'dev-local' && (await hasIpUsedTrial(ip))) {
    return {
      eligible: false,
      reason: 'ip_already_used',
      ip,
      message: 'Esta dirección IP ya utilizó el periodo de prueba de 1 mes. Activa el pago para continuar.',
    };
  }

  if (ip === 'dev-local') {
    return { eligible: true, reason: 'eligible', ip };
  }

  const ipInfo = await queryIpWithIpQuery(ip);
  if (!ipInfo) {
    return {
      eligible: false,
      reason: 'ipquery_unavailable',
      ip,
      message: 'No pudimos verificar tu IP en este momento. Intenta más tarde o activa el pago.',
    };
  }

  const risk = evaluateIpTrialRisk(ipInfo);
  if (!risk.allowed) {
    return {
      eligible: false,
      reason: 'ip_risky',
      ip,
      message:
        'No se puede activar el periodo de prueba desde esta conexión (VPN, proxy o riesgo elevado). Usa una conexión normal o activa el pago.',
    };
  }

  return { eligible: true, reason: 'eligible', ip };
}

export async function grantIpTrialIfEligible(params: {
  userId: string;
  role: string;
  clinicId?: string | null;
  clientIp: string | null | undefined;
}): Promise<IpTrialGrantResult> {
  const { userId, role, clinicId, clientIp } = params;
  const subjectType: 'clinic' | 'user' = clinicId ? 'clinic' : 'user';
  const subjectId = clinicId ?? userId;

  const existingSub = await getSubscriptionForUser(userId, clinicId);
  if (existingSub?.hasStripeBilling && existingSub.isActive) {
    return {
      granted: false,
      subscription: existingSub,
      eligibility: {
        eligible: false,
        reason: 'already_paid',
        message: 'Ya tienes suscripción de pago activa.',
      },
    };
  }

  if (existingSub?.status === 'trial' && existingSub.isActive) {
    const active = await isIpTrialSubscriptionActive(existingSub, subjectType, subjectId);
    if (active) {
      return {
        granted: false,
        subscription: existingSub,
        eligibility: {
          eligible: false,
          reason: 'already_active_trial',
          message: 'Tu periodo de prueba ya está activo.',
          expiresAt: existingSub.currentPeriodEnd,
        },
      };
    }
  }

  const eligibility = await checkIpTrialEligibility(clientIp, role);
  if (!eligibility.eligible || !eligibility.ip) {
    return { granted: false, subscription: existingSub ?? undefined, eligibility };
  }

  const ip = eligibility.ip;

  const repeatCheck = await handleIpRepeatBeforeGrant(ip, userId);
  if (!repeatCheck.allowed) {
    return {
      granted: false,
      subscription: (await getSubscriptionForUser(userId, clinicId)) ?? undefined,
      eligibility: {
        eligible: false,
        reason: repeatCheck.reason ?? 'ip_repeat_revoked',
        ip,
        message: repeatCheck.message,
      },
    };
  }

  const verification = await getTrialVerificationStatus(userId);
  if (!verification.ready) {
    return {
      granted: false,
      subscription: existingSub ?? undefined,
      eligibility: {
        eligible: false,
        reason: 'verification_incomplete',
        ip,
        message:
          'Verifica tu correo y tarjeta en Facturación antes de activar la prueba gratuita.',
      },
    };
  }

  if (ip !== 'dev-local' && (await hasIpUsedTrial(ip))) {
    return {
      granted: false,
      subscription: existingSub ?? undefined,
      eligibility: {
        eligible: false,
        reason: 'ip_already_used',
        ip,
        message: 'Esta dirección IP ya utilizó el periodo de prueba de 1 mes.',
      },
    };
  }

  const ipInfo = ip === 'dev-local' ? null : await queryIpWithIpQuery(ip);
  const now = Date.now();
  const expiresAt = now + TRIAL_PERIOD_MS;
  const iso = new Date().toISOString();
  const grantId = crypto.randomUUID();

  let subscriptionId = existingSub?.id;

  if (existingSub) {
    await database
      .update(subscriptions)
      .set({
        status: 'trial',
        currentPeriodStart: now,
        currentPeriodEnd: expiresAt,
        updatedAt: iso,
      })
      .where(eq(subscriptions.id, existingSub.id));
  } else {
    subscriptionId = crypto.randomUUID();
    await database.insert(subscriptions).values({
      id: subscriptionId,
      subjectType,
      subjectId,
      status: 'trial',
      planId: 'monthly_standard',
      currentPeriodStart: now,
      currentPeriodEnd: expiresAt,
      createdAt: iso,
      updatedAt: iso,
    });
  }

  try {
    await database.insert(ipTrialGrants).values({
      id: grantId,
      ipAddress: ip,
      userId,
      subjectType,
      subjectId,
      subscriptionId: subscriptionId ?? null,
      countryCode: ipInfo?.location?.country_code ?? null,
      riskScore: ipInfo?.risk?.risk_score ?? null,
      ipqueryJson: ipInfo ? JSON.stringify(ipInfo) : null,
      grantedAt: now,
      expiresAt,
      createdAt: iso,
      status: 'active',
      phoneHash: null,
      cardFingerprint: verification.cardFingerprint,
    });

    await database
      .update(trialUserVerifications)
      .set({ activationIp: ip, updatedAt: iso })
      .where(eq(trialUserVerifications.userId, userId));
  } catch (err) {
    console.warn('[ip-trial] Conflicto al registrar IP (posible carrera):', ip, err);
    return {
      granted: false,
      subscription: (await getSubscriptionForUser(userId, clinicId)) ?? undefined,
      eligibility: {
        eligible: false,
        reason: 'ip_already_used',
        ip,
        message: 'Esta dirección IP ya utilizó el periodo de prueba.',
      },
    };
  }

  const subscription = (await getSubscriptionForUser(userId, clinicId))!;
  return {
    granted: true,
    subscription,
    eligibility: {
      eligible: true,
      reason: 'eligible',
      ip,
      expiresAt,
      message: 'Periodo de prueba de 1 mes activado.',
    },
  };
}

/** Solo concede trial si correo + tarjeta ya están verificados (no auto-activa en login). */
export async function tryGrantIpTrialForUser(
  userId: string,
  role: string,
  clinicId: string | null | undefined,
  clientIp: string | null | undefined
): Promise<void> {
  if (role !== 'clinic_admin' && role !== 'podiatrist') return;
  const verification = await getTrialVerificationStatus(userId);
  if (!verification.ready) return;
  await grantIpTrialIfEligible({ userId, role, clinicId, clientIp });
}

/** Activa trial tras verificaciones (llamar desde Facturación). */
export async function activateTrialForUser(params: {
  userId: string;
  role: string;
  clinicId?: string | null;
  clientIp: string | null | undefined;
}): Promise<IpTrialGrantResult> {
  return grantIpTrialIfEligible(params);
}
