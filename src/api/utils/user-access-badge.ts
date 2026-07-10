import type { createdUsers } from '../database/schema';
import { resolveSystemAccess } from './access-control';
import { getSubscriptionForUser, getSubscriptionsBatch, lookupSubscriptionFromBatch } from './subscription-service';
import { RETENTION } from './user-retention';

export type UserAccessBadgeTone =
  | 'green'
  | 'amber'
  | 'red'
  | 'orange'
  | 'blue'
  | 'gray'
  | 'yellow';

export interface UserAccessBadge {
  label: string;
  tone: UserAccessBadgeTone;
}

function isAdministrativelyDisabled(row: typeof createdUsers.$inferSelect): boolean {
  return row.isEnabled === false && row.disabledAt != null && row.disabledAt > 0;
}

function adminGraceBadge(row: typeof createdUsers.$inferSelect): UserAccessBadge {
  const daysSince = (Date.now() - row.disabledAt!) / (24 * 60 * 60 * 1000);
  if (daysSince < RETENTION.GRACE_PERIOD_DAYS) {
    const d = Math.max(0, Math.floor(daysSince));
    return {
      label: `Período de gracia (${d} día${d === 1 ? '' : 's'})`,
      tone: 'amber',
    };
  }
  return { label: 'Deshabilitado', tone: 'yellow' };
}

function trialBadge(days: number): UserAccessBadge {
  return {
    label: `Prueba (${days} día${days === 1 ? '' : 's'})`,
    tone: 'blue',
  };
}

function badgeFromAccessAndSubscription(
  access: Awaited<ReturnType<typeof resolveSystemAccess>>,
  sub: Awaited<ReturnType<typeof getSubscriptionForUser>>
): UserAccessBadge | null {
  if (access.granted) {
    switch (access.reason) {
      case 'stripe_paid':
        return { label: 'Suscripción activa', tone: 'green' };
      case 'ip_trial':
      case 'dev_trial':
        return trialBadge(sub?.daysRemaining ?? 0);
      case 'admin_enabled':
        return { label: 'Habilitado (admin)', tone: 'green' };
      default:
        return { label: 'Activo', tone: 'green' };
    }
  }

  if (sub?.status === 'trial' && sub.isActive) {
    return trialBadge(sub.daysRemaining ?? 0);
  }

  if (sub?.status === 'trial' && !sub.isActive) {
    return { label: 'Prueba vencida', tone: 'amber' };
  }

  if (sub?.status === 'past_due') {
    return { label: 'Pago pendiente', tone: 'amber' };
  }

  return null;
}

/**
 * Etiqueta de estado para listados de admin.
 * Trial/suscripción activa tiene prioridad sobre isEnabled=false (billing) o disabledAt mal interpretado.
 */
export async function buildUserAccessBadge(
  row: typeof createdUsers.$inferSelect,
  prefetchedSub?: Awaited<ReturnType<typeof getSubscriptionForUser>>
): Promise<UserAccessBadge> {
  if (row.isBanned) {
    return { label: 'Baneado', tone: 'red' };
  }
  if (row.isBlocked) {
    return { label: 'Bloqueado', tone: 'orange' };
  }

  if (row.role === 'super_admin') {
    return { label: 'Plataforma', tone: 'green' };
  }

  if (row.role === 'admin') {
    return row.isEnabled === true
      ? { label: 'Activo', tone: 'green' }
      : { label: 'Pendiente habilitación', tone: 'gray' };
  }

  const isBillingRole =
    row.role === 'clinic_admin' || row.role === 'podiatrist' || row.role === 'receptionist';

  if (isBillingRole) {
    const sub =
      prefetchedSub !== undefined
        ? prefetchedSub
        : await getSubscriptionForUser(row.userId, row.clinicId);
    const access = await resolveSystemAccess(row.userId, row.role, row, sub);
    const billingBadge = badgeFromAccessAndSubscription(access, sub);
    if (billingBadge) {
      return billingBadge;
    }

    if (isAdministrativelyDisabled(row)) {
      return adminGraceBadge(row);
    }

    if (row.role === 'receptionist' && row.isEnabled === true) {
      return { label: 'Activo', tone: 'green' };
    }

    return { label: 'Pendiente pago', tone: 'amber' };
  }

  if (isAdministrativelyDisabled(row)) {
    return adminGraceBadge(row);
  }

  return { label: 'Activo', tone: 'green' };
}

export async function mapUsersWithAccessBadge<T extends { id: string }>(
  users: T[],
  rows: typeof createdUsers.$inferSelect[]
): Promise<Array<T & { accessBadge: UserAccessBadge }>> {
  const rowByUserId = new Map(rows.map((r) => [r.userId, r]));
  const clinicIds = rows.map((r) => r.clinicId).filter((id): id is string => Boolean(id));
  const independentPodiatristIds = rows
    .filter((r) => r.role === 'podiatrist' && !r.clinicId)
    .map((r) => r.userId);
  const subBatch = await getSubscriptionsBatch(clinicIds, independentPodiatristIds);

  return Promise.all(
    users.map(async (u) => {
      const row = rowByUserId.get(u.id);
      const prefetchedSub = row ? lookupSubscriptionFromBatch(subBatch, row.userId, row.clinicId) : null;
      const accessBadge = row
        ? await buildUserAccessBadge(row, prefetchedSub)
        : { label: '—', tone: 'gray' as const };
      return { ...u, accessBadge };
    })
  );
}
