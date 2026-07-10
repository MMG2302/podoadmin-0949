const invalidateListeners = new Set<() => void>();

export function invalidateClinicalListCache() {
  for (const fn of invalidateListeners) fn();
}

/** Registro interno para hooks paginados (use-clinical-list-page). */
export function registerClinicalListInvalidator(fn: () => void): () => void {
  invalidateListeners.add(fn);
  return () => invalidateListeners.delete(fn);
}
