export type CheckoutAnalyticsPeriod = "day" | "week" | "month" | "year";
export type CheckoutPaymentMethod = "cash" | "card" | "transfer" | "other" | "unknown";

export interface CheckoutAnalyticsSeriesPoint {
  label: string;
  paidCents: number;
  count: number;
}

export interface CheckoutAnalyticsComparisonPoint {
  label: string;
  /** Etiqueta del periodo anterior emparejado (p. ej. mes previo). */
  previousLabel: string;
  currentCents: number;
  previousCents: number;
}

export interface CheckoutAnalytics {
  period: CheckoutAnalyticsPeriod;
  currency: string;
  scope?: {
    kind: "podiatrist" | "clinic";
    label: string;
    clinicId: string | null;
    podiatristId: string | null;
  };
  sales: {
    currentTotalCents: number;
    previousTotalCents: number;
    changePercent: number | null;
    count: number;
    previousCount: number;
    uniquePatientsCount: number;
    previousUniquePatientsCount: number;
    averageSalePerPatientCents: number;
    previousAverageSalePerPatientCents: number;
    averageSalePerPatientChangePercent: number | null;
    salesByPatient: {
      patientId: string;
      patientName: string;
      chartLabel: string;
      totalCents: number;
      visitCount: number;
      averageCents: number;
    }[];
    /** Ingresos/conteos por tipo de servicio (periodo seleccionado). */
    salesByService: {
      label: string;
      totalCents: number;
      count: number;
      sharePercent: number;
    }[];
    salesByPodiatrist: {
      podiatristId: string;
      podiatristName: string;
      totalCents: number;
      count: number;
      averageCents: number;
    }[];
    series: CheckoutAnalyticsSeriesPoint[];
    comparisonSeries: CheckoutAnalyticsComparisonPoint[];
  };
  collections: {
    paidTotalCents: number;
    pendingTotalCents: number;
    paidCount: number;
    pendingCount: number;
    byPaymentMethod: { method: string; totalCents: number; count: number }[];
    receivablesByPatient: {
      patientId: string;
      patientName: string;
      totalCents: number;
      count: number;
    }[];
    monthlyCashFlow: { month: string; label: string; paidCents: number }[];
    accountsReceivableCents: number;
    paidAllTimeCents: number;
    collectionsByPodiatrist: {
      podiatristId: string;
      podiatristName: string;
      paidCents: number;
      paidCount: number;
      pendingCents: number;
      pendingCount: number;
    }[];
  };
  profitability: {
    monthlyGoalCents: number;
    monthlyExpensesCents: number;
    defaultMarginPercent: number;
    actualSalesCents: number;
    estimatedProfitCents: number;
    goalProgressPercent: number | null;
    monthEndProjectionCents: number;
    marginByService: {
      label: string;
      totalCents: number;
      count: number;
      marginPercent: number;
      estimatedProfitCents: number;
    }[];
    growthTrend12Months: {
      month: string;
      label: string;
      paidCents: number;
      changePercent: number | null;
    }[];
    weeklyChangePercent: number | null;
    annualChangePercent: number | null;
  };
}

export interface CheckoutAnalyticsPrefs {
  monthlyGoalCents: number;
  monthlyExpensesCents: number;
  defaultMarginPercent: number;
}

export type CheckoutViewMode = "operations" | "sales" | "collections" | "profit" | "agenda";

/** @deprecated Prefer t.checkout.analytics.cash/card/… in UI; kept as Spanish fallback for legacy callers. */
export const PAYMENT_METHOD_LABELS: Record<CheckoutPaymentMethod, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  other: "Otro",
  unknown: "Sin registrar",
};

export function formatChangePercent(value: number | null): string {
  if (value == null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}%`;
}

export function changeTone(value: number | null): "up" | "down" | "neutral" {
  if (value == null || value === 0) return "neutral";
  return value > 0 ? "up" : "down";
}
