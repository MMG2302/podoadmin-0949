import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api-client";
import { useEntitlements } from "./use-entitlements";
import type { AppointmentAgendaMetrics } from "../types/agenda";
import type { CheckoutAnalytics } from "../types/checkout-analytics";
import type { DemographicsSummary } from "../lib/patient-engagement";

export type ClinicalDashboardOverview = {
  patientCount: number;
  sessionsThisMonth: number;
  recentSessions: {
    id: string;
    patientId: string;
    patientName: string;
    sessionDate: string;
    status: string;
    createdAt: string;
  }[];
};

export type ClinicTotals = {
  patients: number;
  sessionsThisMonth: number;
  podiatrists: number;
};

type Snapshot = {
  overview: ClinicalDashboardOverview | null;
  metrics: AppointmentAgendaMetrics | null;
  demographics: DemographicsSummary | null;
  analytics: CheckoutAnalytics | null;
  clinicTotals: ClinicTotals | null;
};

const EMPTY: Snapshot = {
  overview: null,
  metrics: null,
  demographics: null,
  analytics: null,
  clinicTotals: null,
};

/** Resumen ligero para el panel principal (métricas clínicas + cobros). */
export function useClinicalDashboardSnapshot(opts: {
  enabled: boolean;
  includeCheckout?: boolean;
  includeClinicStats?: boolean;
}) {
  const { enabled, includeCheckout = false, includeClinicStats = false } = opts;
  const { has: hasFeature } = useEntitlements();
  // Métricas/analíticas del plan Premium: no se piden en Base (evita 402).
  const canAgendaMetrics = hasFeature("agenda_analytics");
  const canCheckoutAnalytics = hasFeature("checkout_analytics");
  const [data, setData] = useState<Snapshot>(EMPTY);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!enabled) {
      setData(EMPTY);
      return;
    }
    setLoading(true);
    try {
      const [overviewRes, metricsRes, demoRes, analyticsRes, clinicRes] = await Promise.all([
        api.get<{ success?: boolean } & ClinicalDashboardOverview>("/clinical-dashboard/overview"),
        canAgendaMetrics
          ? api.get<{ success?: boolean; metrics?: AppointmentAgendaMetrics }>(
              "/clinical-dashboard/appointment-metrics?days=30"
            )
          : Promise.resolve({ success: false as const, data: undefined }),
        api.get<{ success?: boolean; demographics?: DemographicsSummary }>(
          "/patients/demographics-summary"
        ),
        includeCheckout && canCheckoutAnalytics
          ? api.get<{ success?: boolean; analytics?: CheckoutAnalytics }>(
              "/checkout-handoffs/analytics?period=month"
            )
          : Promise.resolve(null),
        includeClinicStats
          ? api.get<{ success?: boolean; totals?: ClinicTotals }>("/clinical-dashboard/clinic-stats")
          : Promise.resolve(null),
      ]);

      setData({
        overview:
          overviewRes.success && overviewRes.data
            ? {
                patientCount: overviewRes.data.patientCount ?? 0,
                sessionsThisMonth: overviewRes.data.sessionsThisMonth ?? 0,
                recentSessions: overviewRes.data.recentSessions ?? [],
              }
            : null,
        metrics: metricsRes.success ? metricsRes.data?.metrics ?? null : null,
        demographics: demoRes.success ? demoRes.data?.demographics ?? null : null,
        analytics:
          includeCheckout && analyticsRes && analyticsRes.success
            ? analyticsRes.data?.analytics ?? null
            : null,
        clinicTotals:
          includeClinicStats && clinicRes && clinicRes.success
            ? clinicRes.data?.totals ?? null
            : null,
      });
    } finally {
      setLoading(false);
    }
  }, [enabled, includeCheckout, includeClinicStats, canAgendaMetrics, canCheckoutAnalytics]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...data, loading, reload: load };
}
