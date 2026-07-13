import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api-client";
import type { CheckoutAnalytics, CheckoutAnalyticsPeriod, CheckoutAnalyticsPrefs } from "../types/checkout-analytics";

function analyticsQuery(period: CheckoutAnalyticsPeriod, podiatristId?: string): string {
  const params = new URLSearchParams({ period });
  if (podiatristId) params.set("podiatristId", podiatristId);
  return `/checkout-handoffs/analytics?${params.toString()}`;
}

function prefsQuery(podiatristId?: string): string {
  const params = new URLSearchParams();
  if (podiatristId) params.set("podiatristId", podiatristId);
  const qs = params.toString();
  return qs ? `/checkout-handoffs/analytics-preferences?${qs}` : "/checkout-handoffs/analytics-preferences";
}

export function useCheckoutAnalytics(
  period: CheckoutAnalyticsPeriod,
  enabled: boolean,
  podiatristId?: string
) {
  const [analytics, setAnalytics] = useState<CheckoutAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    const res = await api.get<{ success: boolean; analytics?: CheckoutAnalytics; error?: string }>(
      analyticsQuery(period, podiatristId)
    );
    setLoading(false);
    if (res.success && res.data?.analytics) {
      setAnalytics(res.data.analytics);
    } else {
      setError(res.message || res.error || "No se pudieron cargar las analíticas");
    }
  }, [enabled, period, podiatristId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { analytics, loading, error, reload: load };
}

export function useCheckoutAnalyticsPrefs(enabled: boolean, podiatristId?: string) {
  const [preferences, setPreferences] = useState<CheckoutAnalyticsPrefs | null>(null);
  const [editable, setEditable] = useState(true);
  const [scopeLabel, setScopeLabel] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!enabled) return;
    const res = await api.get<{
      success: boolean;
      preferences?: CheckoutAnalyticsPrefs;
      editable?: boolean;
      scopeLabel?: string;
    }>(prefsQuery(podiatristId));
    if (res.success && res.data?.preferences) {
      setPreferences(res.data.preferences);
      setEditable(res.data.editable !== false);
      setScopeLabel(res.data.scopeLabel ?? null);
    }
  }, [enabled, podiatristId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(
    async (next: Partial<CheckoutAnalyticsPrefs>) => {
      setSaving(true);
      const res = await api.put<{ success: boolean; preferences?: CheckoutAnalyticsPrefs }>(
        "/checkout-handoffs/analytics-preferences",
        podiatristId ? { ...next, podiatristId } : next
      );
      setSaving(false);
      if (res.success && res.data?.preferences) {
        setPreferences(res.data.preferences);
        return true;
      }
      return false;
    },
    [podiatristId]
  );

  return { preferences, editable, scopeLabel, saving, save, reload: load };
}
