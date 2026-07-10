export type CheckoutHandoffStatus =
  | "awaiting_amount"
  | "ready_for_payment"
  | "paid"
  | "cancelled";

export interface CheckoutHandoff {
  id: string;
  clinicId: string | null;
  podiatristId: string;
  patientId: string;
  sessionId: string | null;
  appointmentId: string | null;
  amountCents: number | null;
  currency: string;
  notes: string;
  status: CheckoutHandoffStatus;
  createdBy: string;
  paidAt: string | null;
  paidBy: string | null;
  createdAt: string;
  updatedAt: string;
  patientName?: string;
  podiatristName?: string;
}

export function formatCheckoutAmount(amountCents: number | null | undefined, currency: string): string {
  if (amountCents == null) return "—";
  const amount = amountCents / 100;
  try {
    return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function parseAmountToCents(value: string): number | null {
  const normalized = value.replace(/[^\d.,]/g, "").replace(",", ".");
  if (!normalized) return null;
  const num = Number.parseFloat(normalized);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100);
}
