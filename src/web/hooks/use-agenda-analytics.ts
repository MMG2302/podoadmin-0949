import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api-client";
import { useLanguage } from "../contexts/language-context";
import type { AgendaBlock, AgendaBlockCategory, AgendaBlockRecurrence, AgendaSettings } from "../types/agenda";
import type { AppointmentAgendaMetrics, SatisfactionSummary } from "../types/agenda";
import type { DailyCloseSnapshot, DailyCloseTodayStatus } from "../types/agenda";

export function useAppointmentAgendaMetrics(enabled: boolean, podiatristId?: string) {
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState<AppointmentAgendaMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadFailed = t.checkout.agendaAnalytics.loadMetricsFailed;
  const networkError = t.checkout.agendaAnalytics.loadMetricsNetworkError;

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ days: "30" });
      if (podiatristId) params.set("podiatristId", podiatristId);
      const res = await api.get<{ success: boolean; metrics?: AppointmentAgendaMetrics; error?: string }>(
        `/clinical-dashboard/appointment-metrics?${params.toString()}`
      );
      if (res.success && res.data?.metrics) {
        setMetrics(res.data.metrics);
      } else {
        setMetrics(null);
        setError(res.data?.error || res.error || loadFailed);
      }
    } catch {
      setError(networkError);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, podiatristId, loadFailed, networkError]);

  useEffect(() => {
    void load();
  }, [load]);

  return { metrics, loading, error, reload: load };
}

export function useSatisfaction(enabled: boolean, podiatristId?: string) {
  const [data, setData] = useState<SatisfactionSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ days: "30" });
      if (podiatristId) params.set("podiatristId", podiatristId);
      const res = await api.get<{ success: boolean; satisfaction?: SatisfactionSummary }>(
        `/clinical-dashboard/satisfaction?${params.toString()}`
      );
      setData(res.success ? res.data?.satisfaction ?? null : null);
    } finally {
      setLoading(false);
    }
  }, [enabled, podiatristId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { satisfaction: data, loading, reload: load };
}

export function useAgendaSettings(enabled: boolean, podiatristId?: string) {
  const [settings, setSettings] = useState<AgendaSettings | null>(null);
  const [editable, setEditable] = useState(false);
  const [scopeLabel, setScopeLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (podiatristId) params.set("podiatristId", podiatristId);
      const qs = params.toString();
      const res = await api.get<{
        success: boolean;
        settings?: AgendaSettings;
        editable?: boolean;
        scopeLabel?: string;
      }>(qs ? `/clinical-dashboard/agenda-settings?${qs}` : "/clinical-dashboard/agenda-settings");
      if (res.success && res.data?.settings) {
        setSettings(res.data.settings);
        setEditable(Boolean(res.data.editable));
        setScopeLabel(res.data.scopeLabel ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, podiatristId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(
    async (patch: Partial<AgendaSettings>) => {
      setSaving(true);
      try {
        const res = await api.put<{ success: boolean; settings?: AgendaSettings }>(
          "/clinical-dashboard/agenda-settings",
          patch
        );
        if (res.success && res.data?.settings) {
          setSettings(res.data.settings);
          return true;
        }
        return false;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  return { settings, editable, scopeLabel, loading, saving, save, reload: load };
}

export function useDailySalesClose(enabled: boolean, podiatristId?: string) {
  const { t } = useLanguage();
  const [today, setToday] = useState<DailyCloseTodayStatus | null>(null);
  const [history, setHistory] = useState<DailyCloseSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadCloseFailed = t.checkout.agendaAnalytics.loadDailyCloseFailed;
  const closeDayFailed = t.checkout.agendaAnalytics.closeDayFailed;

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (podiatristId) params.set("podiatristId", podiatristId);
      const qs = params.toString();
      const [todayRes, listRes] = await Promise.all([
        api.get<{ success: boolean; closed?: boolean; closeDate?: string; close?: DailyCloseSnapshot | null; live?: DailyCloseTodayStatus["live"]; error?: string }>(
          qs ? `/checkout-handoffs/daily-closes/today?${qs}` : "/checkout-handoffs/daily-closes/today"
        ),
        api.get<{ success: boolean; closes?: DailyCloseSnapshot[] }>(
          qs ? `/checkout-handoffs/daily-closes?${qs}&limit=14` : "/checkout-handoffs/daily-closes?limit=14"
        ),
      ]);

      if (todayRes.success && todayRes.data?.live && todayRes.data.closeDate) {
        setToday({
          closeDate: todayRes.data.closeDate,
          closed: Boolean(todayRes.data.closed),
          close: todayRes.data.close ?? null,
          live: todayRes.data.live,
        });
      } else {
        setToday(null);
        setError(todayRes.data?.error || todayRes.error || null);
      }
      setHistory(listRes.data?.closes ?? []);
    } catch {
      setError(loadCloseFailed);
    } finally {
      setLoading(false);
    }
  }, [enabled, podiatristId, loadCloseFailed]);

  useEffect(() => {
    void load();
  }, [load]);

  const closeDay = useCallback(
    async (notes?: string) => {
      setClosing(true);
      try {
        const res = await api.post<{ success: boolean; close?: DailyCloseSnapshot; error?: string }>(
          "/checkout-handoffs/daily-closes",
          {
            ...(podiatristId ? { podiatristId } : {}),
            ...(notes ? { notes } : {}),
          }
        );
        if (res.success) {
          await load();
          return true;
        }
        setError(res.data?.error || res.error || closeDayFailed);
        return false;
      } finally {
        setClosing(false);
      }
    },
    [load, podiatristId, closeDayFailed]
  );

  return { today, history, loading, closing, error, reload: load, closeDay };
}

export type AgendaBlockDraft = {
  scope?: "podiatrist" | "clinic";
  podiatristId?: string;
  title: string;
  category: AgendaBlockCategory;
  recurrence: AgendaBlockRecurrence;
  weekdays?: number[];
  startDate?: string | null;
  endDate?: string | null;
  startTime: string;
  endTime: string;
};

/** Bloqueos de agenda (comida, salidas, vacaciones, festivos) del podólogo o de la clínica. */
export function useAgendaBlocks(enabled: boolean, podiatristId?: string) {
  const [blocks, setBlocks] = useState<AgendaBlock[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [canManageClinicWide, setCanManageClinicWide] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (podiatristId) params.set("podiatristId", podiatristId);
      const qs = params.toString();
      const res = await api.get<{
        success: boolean;
        blocks?: AgendaBlock[];
        canManage?: boolean;
        canManageClinicWide?: boolean;
        error?: string;
      }>(qs ? `/clinical-dashboard/agenda-blocks?${qs}` : "/clinical-dashboard/agenda-blocks");
      if (res.success && res.data?.success) {
        setBlocks(res.data.blocks ?? []);
        setCanManage(Boolean(res.data.canManage));
        setCanManageClinicWide(Boolean(res.data.canManageClinicWide));
      } else {
        setBlocks([]);
        setCanManage(false);
        setError(res.data?.error || res.error || null);
      }
    } catch {
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, podiatristId]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = useCallback(
    async (draft: AgendaBlockDraft): Promise<{ ok: boolean; error?: string }> => {
      setSaving(true);
      setError(null);
      try {
        const res = await api.post<{ success: boolean; block?: AgendaBlock; error?: string }>(
          "/clinical-dashboard/agenda-blocks",
          draft
        );
        if (res.success && res.data?.success) {
          await load();
          return { ok: true };
        }
        const message = res.data?.error || res.error || null;
        setError(message);
        return { ok: false, error: message ?? undefined };
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const res = await api.delete<{ success: boolean; error?: string }>(
          `/clinical-dashboard/agenda-blocks/${encodeURIComponent(id)}`
        );
        if (res.success && res.data?.success) {
          await load();
          return true;
        }
        setError(res.data?.error || res.error || null);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  return { blocks, canManage, canManageClinicWide, loading, saving, error, create, remove, reload: load };
}
