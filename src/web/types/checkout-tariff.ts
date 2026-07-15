/** Tarifas rápidas para handoff de cobro. */

export interface CheckoutQuickTariff {
  id: string;
  label: string;
  amountCents: number;
  /** Pauta de duración en minutos (opcional). */
  durationMinutes?: number;
}

export const DEFAULT_CHECKOUT_TARIFFS: CheckoutQuickTariff[] = [
  { id: "consulta", label: "Consulta", amountCents: 60000, durationMinutes: 30 },
  { id: "revision", label: "Revisión", amountCents: 40000, durationMinutes: 20 },
  { id: "procedimiento", label: "Procedimiento", amountCents: 80000, durationMinutes: 45 },
];

export function normalizeCheckoutTariffs(raw: unknown): CheckoutQuickTariff[] {
  if (!Array.isArray(raw)) return [...DEFAULT_CHECKOUT_TARIFFS];
  const out: CheckoutQuickTariff[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const label = String(o.label ?? "").trim();
    const amountCents = Number(o.amountCents);
    if (!label || !Number.isFinite(amountCents) || amountCents < 0) continue;
    const id = String(o.id ?? label.toLowerCase().replace(/\s+/g, "_")).slice(0, 40);
    const durationRaw = Number(o.durationMinutes);
    const durationMinutes =
      Number.isFinite(durationRaw) && durationRaw > 0
        ? Math.min(480, Math.max(5, Math.round(durationRaw)))
        : undefined;
    out.push({
      id,
      label,
      amountCents: Math.round(amountCents),
      ...(durationMinutes != null ? { durationMinutes } : {}),
    });
  }
  return out.length > 0 ? out.slice(0, 12) : [...DEFAULT_CHECKOUT_TARIFFS];
}

export function parseCheckoutTariffsJson(raw: string | null | undefined): CheckoutQuickTariff[] {
  if (!raw) return [...DEFAULT_CHECKOUT_TARIFFS];
  try {
    return normalizeCheckoutTariffs(JSON.parse(raw));
  } catch {
    return [...DEFAULT_CHECKOUT_TARIFFS];
  }
}

export function formatTariffAmount(amountCents: number, currency = "MXN"): string {
  const amount = amountCents / 100;
  try {
    return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}
