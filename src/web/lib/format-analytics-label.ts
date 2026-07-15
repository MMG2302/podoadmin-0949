import type { CheckoutAnalyticsPeriod } from "../types/checkout-analytics";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const YEAR_MONTH_RE = /^\d{4}-\d{2}$/;
const WEEK_BUCKET_RE = /^[WS](\d+)$/i;

/** Formatea claves estables del API (ISO / YYYY-MM / Wn) al locale del usuario. */
export function formatAnalyticsSeriesLabel(
  label: string,
  period: CheckoutAnalyticsPeriod,
  locale: string,
  weekBucketTemplate: string
): string {
  if (ISO_DATE_RE.test(label)) {
    return new Date(`${label}T12:00:00`).toLocaleDateString(locale, {
      weekday: "short",
    });
  }
  if (YEAR_MONTH_RE.test(label)) {
    const [y, m] = label.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(locale, {
      month: "short",
      ...(period === "year" ? {} : { year: "2-digit" as const }),
    });
  }
  const weekMatch = label.match(WEEK_BUCKET_RE);
  if (weekMatch) {
    return weekBucketTemplate.replace("{n}", weekMatch[1]);
  }
  return label;
}
