import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api-client";

export function useRescheduleMessage(enabled: boolean, podiatristId?: string) {
  const [message, setMessage] = useState<string | null>(null);
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
        message?: string | null;
        editable?: boolean;
        scopeLabel?: string;
      }>(qs ? `/clinical-dashboard/reschedule-message?${qs}` : "/clinical-dashboard/reschedule-message");
      if (res.success) {
        setMessage(res.data?.message ?? null);
        setEditable(Boolean(res.data?.editable));
        setScopeLabel(res.data?.scopeLabel ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, podiatristId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(async (next: string | null) => {
    setSaving(true);
    try {
      const res = await api.put<{ success: boolean; message?: string | null }>(
        "/clinical-dashboard/reschedule-message",
        { message: next }
      );
      if (res.success) {
        setMessage(res.data?.message ?? null);
        return true;
      }
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return { message, editable, scopeLabel, loading, saving, save, reload: load };
}
