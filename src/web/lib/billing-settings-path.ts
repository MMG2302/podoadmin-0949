export const BILLING_SETTINGS_TAB = "billing";

export const BILLING_SETTINGS_PATH = `/settings?tab=${BILLING_SETTINGS_TAB}`;

export function buildBillingSettingsPath(extraParams?: Record<string, string>): string {
  const params = new URLSearchParams({ tab: BILLING_SETTINGS_TAB });
  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      params.set(key, value);
    }
  }
  return `/settings?${params.toString()}`;
}

export function isBillingSettingsView(path: string): boolean {
  if (path.startsWith("/billing")) return true;
  if (!path.startsWith("/settings")) return false;
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("tab") === BILLING_SETTINGS_TAB;
}
