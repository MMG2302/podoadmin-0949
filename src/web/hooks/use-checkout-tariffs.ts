import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/auth-context";
import { api } from "../lib/api-client";
import {
  DEFAULT_CHECKOUT_TARIFFS,
  normalizeCheckoutTariffs,
  type CheckoutQuickTariff,
} from "../types/checkout-tariff";

export function useCheckoutTariffs(podiatristId?: string) {
  const { user } = useAuth();
  const targetId = podiatristId || (user?.role === "podiatrist" ? user.id : undefined);
  const [tariffs, setTariffs] = useState<CheckoutQuickTariff[]>(DEFAULT_CHECKOUT_TARIFFS);
  const [loading, setLoading] = useState(Boolean(targetId));

  const load = useCallback(async () => {
    if (!targetId) {
      setTariffs(DEFAULT_CHECKOUT_TARIFFS);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await api.get<{ success: boolean; tariffs?: CheckoutQuickTariff[] }>(
      `/checkout-handoffs/tariffs?podiatristId=${encodeURIComponent(targetId)}`
    );
    if (res.success && res.data?.tariffs) {
      setTariffs(res.data.tariffs);
    }
    setLoading(false);
  }, [targetId]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveTariffs = useCallback(
    async (next: CheckoutQuickTariff[]) => {
      const normalized = normalizeCheckoutTariffs(next);
      const res = await api.put<{ success: boolean; tariffs?: CheckoutQuickTariff[]; error?: string }>(
        "/checkout-handoffs/tariffs",
        { podiatristId: targetId, tariffs: normalized }
      );
      if (res.success && res.data?.success && res.data.tariffs) {
        setTariffs(res.data.tariffs);
        return true;
      }
      return false;
    },
    [targetId]
  );

  return { tariffs, loading, reload: load, saveTariffs, podiatristId: targetId };
}
