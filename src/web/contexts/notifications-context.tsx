import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "./auth-context";
import { api } from "../lib/api-client";
import { fetchShared, invalidateShared, invalidateSharedPrefix } from "../lib/shared-query";
import type { Notification } from "../types/notification";

const POLL_MS = 25_000;
const CACHE_KEY = "notifications:list";

type NotificationsContextValue = {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  refresh: (options?: { force?: boolean; limit?: number }) => Promise<void>;
  setNotificationsLocal: (updater: (prev: Notification[]) => Notification[]) => void;
};

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

async function fetchNotificationsFromApi(limit = 100): Promise<{
  notifications: Notification[];
  unreadCount: number;
}> {
  const params = new URLSearchParams({ limit: String(limit), includeUnreadCount: "1" });
  const res = await api.get<{
    success?: boolean;
    notifications?: Notification[];
    unreadCount?: number;
  }>(`/notifications?${params}`);
  if (res.success && Array.isArray(res.data?.notifications)) {
    return {
      notifications: res.data.notifications,
      unreadCount: typeof res.data.unreadCount === "number" ? res.data.unreadCount : 0,
    };
  }
  return { notifications: [], unreadCount: 0 };
}

/** Consulta ligera: solo el contador de no leídas (1 fila), para el poll de fondo. */
async function fetchUnreadCountFromApi(): Promise<number> {
  const res = await api.get<{ success?: boolean; unreadCount?: number }>("/notifications/unread-count");
  return res.success && typeof res.data?.unreadCount === "number" ? res.data.unreadCount : 0;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const limitRef = useRef(100);
  const onNotificationsPage = location === "/notifications";

  const refresh = useCallback(
    async (options?: { force?: boolean; limit?: number }) => {
      if (!user?.id) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      if (options?.limit) limitRef.current = options.limit;
      setIsLoading(true);
      try {
        const key = `${CACHE_KEY}:${limitRef.current}`;
        const data = await fetchShared(
          key,
          () => fetchNotificationsFromApi(limitRef.current),
          { staleTime: 4_000, force: options?.force }
        );
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      } catch {
        setNotifications([]);
        setUnreadCount(0);
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id]
  );

  // Poll de fondo: solo actualiza el contador (1 fila leída) sin traer la lista completa.
  // La lista se pide con refresh() al montar, al abrir la campanita o al volver a la pestaña.
  const refreshCount = useCallback(async () => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }
    try {
      setUnreadCount(await fetchUnreadCountFromApi());
    } catch {
      /* transitorio: mantener el último valor */
    }
  }, [user?.id]);

  const setNotificationsLocal = useCallback((updater: (prev: Notification[]) => Notification[]) => {
    setNotifications((prev) => {
      const next = updater(prev);
      setUnreadCount(next.filter((n) => !n.read).length);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    limitRef.current = onNotificationsPage ? 500 : 100;
    void refresh({ force: true });

    if (onNotificationsPage) return;

    const tick = () => {
      if (document.hidden) return;
      void refreshCount();
    };

    const interval = setInterval(tick, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh({ force: true });
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user?.id, onNotificationsPage, refresh, refreshCount]);

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, isLoading, refresh, setNotificationsLocal }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}

export function invalidateNotificationsCache() {
  invalidateSharedPrefix("notifications:list");
}
