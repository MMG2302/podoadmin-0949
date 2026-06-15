/**
 * Sync automático de tramos Stripe desactivado: clínicas > límite se gestionan con super_admin.
 */

export interface ClinicTierSyncResult {
  synced: boolean;
  upgraded: boolean;
  downgraded: boolean;
  reason?: string;
}

export async function syncClinicStripeTierIfNeeded(_clinicId: string): Promise<ClinicTierSyncResult> {
  return {
    synced: false,
    upgraded: false,
    downgraded: false,
    reason: 'tier_sync_disabled',
  };
}

export async function syncClinicBillingAfterPodiatristChange(
  _clinicId: string | null | undefined,
  _role: string
): Promise<void> {
  // Sin cambio de precio en Stripe al variar podólogos.
}
