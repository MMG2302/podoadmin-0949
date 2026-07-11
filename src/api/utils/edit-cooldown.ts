/** Cooldown de 15 días entre cambios sensibles (datos de clínica, logos). super_admin omite. */
export const EDIT_COOLDOWN_DAYS = 15;
export const EDIT_COOLDOWN_MS = EDIT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export function canBypassEditCooldown(user: { role: string }): boolean {
  return user.role === 'super_admin';
}

export function isWithinEditCooldown(lastUpdatedAt: string | null | undefined): boolean {
  if (!lastUpdatedAt) return false;
  const last = new Date(lastUpdatedAt).getTime();
  return Date.now() - last < EDIT_COOLDOWN_MS;
}

export function getNextEditAllowedAt(lastUpdatedAt: string | null | undefined): string | null {
  if (!lastUpdatedAt) return null;
  const last = new Date(lastUpdatedAt).getTime();
  return new Date(last + EDIT_COOLDOWN_MS).toISOString();
}

export function getEditCooldownBlockedUntil(lastUpdatedAt: string | null | undefined): string | null {
  return isWithinEditCooldown(lastUpdatedAt) ? getNextEditAllowedAt(lastUpdatedAt) : null;
}

export function getEditCooldownRetryAfterSeconds(nextAllowedAt: string): number {
  return Math.ceil((new Date(nextAllowedAt).getTime() - Date.now()) / 1000);
}

export function editCooldownErrorMessage(nextAllowedAt: string): string {
  return `El logo solo puede modificarse cada ${EDIT_COOLDOWN_DAYS} días. Próximo cambio permitido: ${nextAllowedAt}`;
}

export function editCooldownInfoErrorMessage(nextAllowedAt: string): string {
  return `Los datos solo pueden modificarse cada ${EDIT_COOLDOWN_DAYS} días. Próximo cambio permitido: ${nextAllowedAt}`;
}

export type EditCooldownScope = 'info' | 'logo';

/** Normaliza scopes del body: default info+logo; acepta "all" o array. */
export function parseEditCooldownScopes(raw: unknown): EditCooldownScope[] {
  if (raw === 'all') return ['info', 'logo'];
  const arr = Array.isArray(raw) ? raw : typeof raw === 'string' ? [raw] : [];
  if (arr.includes('all')) return ['info', 'logo'];
  const scopes: EditCooldownScope[] = [];
  for (const item of arr) {
    if (item === 'info' || item === 'logo') scopes.push(item);
  }
  return scopes.length > 0 ? scopes : ['info', 'logo'];
}
