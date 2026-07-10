import { eq } from 'drizzle-orm';

import { database } from '../database';
import { createdUsers } from '../database/schema';

import { getSubscriptionForUser, getSubscriptionsBatch, lookupSubscriptionFromBatch, type SubscriptionPublic } from './subscription-service';
import { canUserAccess } from './user-retention';

export type AccessGrantReason = 'platform_admin' | 'admin_enabled' | 'stripe_paid' | 'ip_trial' | 'dev_trial' | null;

export interface SystemAccessResult {
  granted: boolean;
  reason: AccessGrantReason;
  message?: string;
}

/** Roles que no pagan: super_admin, admin (grant super_admin), receptionist (grant clínica/podólogo). */
export function isNonPayingRole(role: string): boolean {
  return role === 'super_admin' || role === 'admin' || role === 'receptionist';
}

/** Roles que deben tener suscripción Stripe activa (salvo excepción manual de super_admin). */
export function roleRequiresStripe(role: string): boolean {
  return role === 'clinic_admin' || role === 'podiatrist';
}

/** Trial solo con ACCESS_ALLOW_TRIAL=1 (no concede acceso en dev por defecto). */
export function allowDevTrialAccess(): boolean {
  return process.env.ACCESS_ALLOW_TRIAL === '1';
}

export function isStripeSubscriptionGranted(sub: SubscriptionPublic | null): boolean {
  if (!sub?.stripeSubscriptionId) return false;
  return sub.isActive;
}

export function isDevTrialGranted(sub: SubscriptionPublic | null): boolean {
  return allowDevTrialAccess() && sub?.status === 'trial' && sub.isActive;
}

async function isIpTrialGranted(
  sub: SubscriptionPublic | null,
  subjectType: 'clinic' | 'user',
  subjectId: string
): Promise<boolean> {
  if (!sub || sub.status !== 'trial' || !sub.isActive) return false;
  const { isIpTrialSubscriptionActive } = await import('./ip-trial-service');
  return isIpTrialSubscriptionActive(sub, subjectType, subjectId);
}

async function isTrialAccessGranted(
  sub: SubscriptionPublic | null,
  subjectType: 'clinic' | 'user',
  subjectId: string
): Promise<boolean> {
  if (isDevTrialGranted(sub)) return true;
  return isIpTrialGranted(sub, subjectType, subjectId);
}

async function getReceptionistPayerSubscription(
  userRow: typeof createdUsers.$inferSelect
): Promise<SubscriptionPublic | null> {
  if (userRow.clinicId) {
    return getSubscriptionForUser(userRow.userId, userRow.clinicId);
  }

  if (!userRow.createdBy) return null;

  const creator = await database
    .select()
    .from(createdUsers)
    .where(eq(createdUsers.userId, userRow.createdBy))
    .limit(1)
    .then((r) => r[0]);

  if (!creator) return null;
  if (creator.role === 'podiatrist' || creator.role === 'clinic_admin') {
    return getSubscriptionForUser(creator.userId, creator.clinicId);
  }

  return null;
}

/**
 * Acceso al sistema por rol:
 * - super_admin: plataforma, sin pago
 * - admin: solo si super_admin habilitó (isEnabled)
 * - receptionist: habilitación de clinic_admin/podólogo o suscripción activa del pagador
 * - clinic_admin / podiatrist: Stripe activo o habilitación excepcional de super_admin
 */
export async function resolveSystemAccess(
  userId: string,
  role: string,
  userRow?: typeof createdUsers.$inferSelect,
  prefetchedSub?: SubscriptionPublic | null
): Promise<SystemAccessResult> {
  if (role === 'super_admin') {
    return { granted: true, reason: 'platform_admin' };
  }

  const userRowResolved =
    userRow ??
    (await database
      .select()
      .from(createdUsers)
      .where(eq(createdUsers.userId, userId))
      .limit(1)
      .then((r) => r[0]));

  if (!userRowResolved) {
    return {
      granted: false,
      reason: null,
      message: 'Usuario no encontrado',
    };
  }

  if (role === 'admin') {
    if (userRowResolved.isEnabled === true) {
      return { granted: true, reason: 'admin_enabled' };
    }
    return {
      granted: false,
      reason: null,
      message: 'Tu cuenta de administrador debe ser habilitada por un super administrador.',
    };
  }

  if (role === 'receptionist') {
    if (userRowResolved.isEnabled === true) {
      return { granted: true, reason: 'admin_enabled' };
    }
    const payerSub = prefetchedSub ?? (await getReceptionistPayerSubscription(userRowResolved));
    if (isStripeSubscriptionGranted(payerSub)) {
      return { granted: true, reason: 'stripe_paid' };
    }
    if (
      payerSub &&
      (await isTrialAccessGranted(payerSub, payerSub.subjectType, payerSub.subjectId))
    ) {
      const reason = isDevTrialGranted(payerSub) ? 'dev_trial' : 'ip_trial';
      return { granted: true, reason };
    }
    return {
      granted: false,
      reason: null,
      message:
        'Tu acceso debe ser concedido por el administrador de clínica o el podólogo que te creó la cuenta, o la clínica debe tener el pago activo.',
    };
  }

  if (role === 'clinic_admin' || role === 'podiatrist') {
    const sub =
      prefetchedSub !== undefined
        ? prefetchedSub
        : await getSubscriptionForUser(userId, userRowResolved.clinicId);
    const subjectType = userRowResolved.clinicId ? ('clinic' as const) : ('user' as const);
    const subjectId = userRowResolved.clinicId ?? userId;
    if (isStripeSubscriptionGranted(sub)) {
      return { granted: true, reason: 'stripe_paid' };
    }
    if (sub && (await isTrialAccessGranted(sub, subjectType, subjectId))) {
      const reason = isDevTrialGranted(sub) ? 'dev_trial' : 'ip_trial';
      return { granted: true, reason };
    }
    if (userRowResolved.isEnabled === true) {
      return { granted: true, reason: 'admin_enabled' };
    }
    return {
      granted: false,
      reason: null,
      message: 'Tu acceso no está activo. Completa el pago en Facturación para usar el servicio.',
    };
  }

  return {
    granted: false,
    reason: null,
    message: 'Rol no reconocido o sin acceso configurado.',
  };
}

export async function hasSystemAccess(userId: string, role: string): Promise<boolean> {
  return (await resolveSystemAccess(userId, role)).granted;
}

/** Cuenta deshabilitada por admin (con período de gracia/baja). No aplica a cuentas pendientes de pago. */
export function isAdministrativelyBlocked(
  isEnabled: boolean | null | undefined,
  disabledAt: number | null | undefined
): boolean {
  if (isEnabled !== false) return false;
  if (disabledAt == null) return false;
  return !canUserAccess(disabledAt);
}

/** isEnabled inicial al crear usuario según quién crea y qué rol. */
export function resolveInitialIsEnabled(
  role: string,
  requesterRole: string
): boolean {
  if (role === 'receptionist' && (requesterRole === 'clinic_admin' || requesterRole === 'podiatrist')) {
    return true;
  }
  if (requesterRole === 'super_admin' && role === 'admin') {
    return true;
  }
  return false;
}

/** isEnabled al aprobar una lista de registro (super_admin). */
export function resolveRegistrationListIsEnabled(role: string): boolean {
  return role === 'admin' || role === 'receptionist';
}
