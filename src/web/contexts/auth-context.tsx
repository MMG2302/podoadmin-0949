import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { api } from "../lib/api-client";
import { fetchShared, invalidateSharedPrefix } from "../lib/shared-query";

export type UserRole = "super_admin" | "clinic_admin" | "admin" | "podiatrist" | "receptionist";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  clinicId?: string; // For clinic_admin, podiatrists and receptionists (clinic context)
  assignedPodiatristIds?: string[]; // Solo para receptionist: podólogos a los que da servicio
  isBlocked?: boolean; // Cuenta bloqueada temporalmente
  isEnabled?: boolean; // Cuenta habilitada (por defecto true)
  isBanned?: boolean; // Cuenta baneada permanentemente
  disabledAt?: number; // Timestamp cuando se deshabilitó (ciclo: 1 mes grace → bloqueo → 7 meses borrado)
  mustChangePassword?: boolean; // Contraseña temporal: obligar cambio en primer login
  systemAccess?: boolean; // Acceso al sistema (super_admin habilitó o Stripe activo)
  accessReason?: 'platform_admin' | 'admin_enabled' | 'stripe_paid' | 'ip_trial' | 'dev_trial' | null;
  planTier?: 'base' | 'premium'; // Plan contratado (capa ortogonal al rol)
  entitlements?: Record<string, boolean>; // Features incluidas en el plan (calculadas en servidor)
  accessBadge?: {
    label: string;
    tone: 'green' | 'amber' | 'red' | 'orange' | 'blue' | 'gray' | 'yellow';
  };
  /** URL o data URI de la foto de perfil */
  avatarUrl?: string | null;
}

import {
  getPostLoginPath,
  hasActiveSystemAccess,
  isAllowedWithoutSystemAccess,
  isClinicalAppPath,
  normalizeUserSystemAccess,
} from "../lib/system-access";
import { refreshReceptionistAssignmentsInBackground } from "../lib/receptionist-assignments";

export {
  getPostLoginPath,
  hasActiveSystemAccess,
  isAllowedWithoutSystemAccess,
  isClinicalAppPath,
  normalizeUserSystemAccess,
} from "../lib/system-access";

interface AuthContextType {
  user: User | null;
  users: User[];
  usersLoading: boolean;
  isLoading: boolean;
  login: (email: string, password: string, captchaToken?: string | null) => Promise<{ 
    success: boolean; 
    error?: string;
    redirectPath?: string;
    retryAfter?: number;
    blockedUntil?: number;
    attemptCount?: number;
    isBlocked?: boolean;
    blockDurationMinutes?: number;
    requiresCaptcha?: boolean;
  }>;
  logout: () => void;
  /** Lista de usuarios (desde API). Solo disponible para super_admin, admin, clinic_admin. */
  getAllUsers: () => User[];
  /** Recarga la lista de usuarios desde la API. */
  fetchUsers: () => Promise<User[]>;
  /** Carga usuarios visibles bajo demanda (con caché compartida). */
  ensureVisibleUsers: () => Promise<User[]>;
  /** Comprueba si un email está en uso (según la lista cargada desde API). */
  isEmailTaken: (email: string) => boolean;
  /** Actualiza datos del usuario en el contexto (p. ej. tras cambiar contraseña). */
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readCachedUser(): User | null {
  try {
    const raw = localStorage.getItem("podoadmin_user");
    if (!raw) return null;
    return normalizeUserSystemAccess(JSON.parse(raw) as User);
  } catch {
    localStorage.removeItem("podoadmin_user");
    return null;
  }
}

const AUTH_VERIFY_TIMEOUT_MS = 12_000;
const VISIBLE_USERS_CACHE_PREFIX = "users:visible";

function visibleUsersCacheKey(userId: string) {
  return `${VISIBLE_USERS_CACHE_PREFIX}:${userId}`;
}

export function invalidateVisibleUsersCache() {
  invalidateSharedPrefix(VISIBLE_USERS_CACHE_PREFIX);
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("auth_verify_timeout")), ms);
    }),
  ]);
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => readCachedUser());
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const usersRef = useRef<User[]>([]);
  usersRef.current = users;
  /** Solo bloquea rutas si aún no hay sesión en caché (primera visita). */
  const [isLoading, setIsLoading] = useState(() => readCachedUser() === null);

  const loadVisibleUsers = useCallback(
    async (force?: boolean): Promise<User[]> => {
      if (!user) return [];
      setUsersLoading(true);
      try {
        const list = await fetchShared(
          visibleUsersCacheKey(user.id),
          async () => {
            const r = await api.get<{ success?: boolean; users?: User[] }>("/users/visible");
            if (r.success && Array.isArray(r.data?.users)) return r.data.users;
            return [];
          },
          { staleTime: 30_000, force }
        );
        setUsers(list);
        return list;
      } catch {
        setUsers([]);
        return [];
      } finally {
        setUsersLoading(false);
      }
    },
    [user]
  );

  const fetchUsers = useCallback(() => loadVisibleUsers(true), [loadVisibleUsers]);

  const ensureVisibleUsers = useCallback(async (): Promise<User[]> => {
    if (!user) return [];
    if (usersRef.current.length > 0) return usersRef.current;
    return loadVisibleUsers();
  }, [user, loadVisibleUsers]);

  useEffect(() => {
    const applyUserSession = (raw: User | null) => {
      if (!raw) {
        setUser(null);
        localStorage.removeItem("podoadmin_user");
        return;
      }
      const userData = normalizeUserSystemAccess(raw);
      setUser(userData);
      localStorage.setItem("podoadmin_user", JSON.stringify(userData));
      refreshReceptionistAssignmentsInBackground(userData, (hydrated) => {
        setUser(hydrated);
        localStorage.setItem("podoadmin_user", JSON.stringify(hydrated));
      });
    };

    const verifyAuth = async () => {
      try {
        await withTimeout(api.get("/csrf/token"), AUTH_VERIFY_TIMEOUT_MS);
      } catch {
        /* servidor caído o lento */
      }

      try {
        const response = await withTimeout(
          api.get<{ user: User }>("/auth/verify"),
          AUTH_VERIFY_TIMEOUT_MS
        );

        if (response.success && response.data?.user) {
          applyUserSession(response.data.user);
        } else {
          applyUserSession(null);
        }
      } catch (error) {
        const cached = readCachedUser();
        const isTimeout = error instanceof Error && error.message === "auth_verify_timeout";
        if (isTimeout && cached) {
          applyUserSession(cached);
        } else if (!isTimeout) {
          applyUserSession(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    void verifyAuth();

    const loadingSafety = setTimeout(() => {
      setIsLoading(false);
    }, AUTH_VERIFY_TIMEOUT_MS + 3_000);

    const handleLogout = () => {
      setUser(null);
      localStorage.removeItem("podoadmin_token");
      localStorage.removeItem("podoadmin_user");
    };

    window.addEventListener("auth:logout", handleLogout);
    return () => {
      clearTimeout(loadingSafety);
      window.removeEventListener("auth:logout", handleLogout);
    };
  }, []);

  const login = async (email: string, password: string, captchaToken?: string | null) => {
    try {
      try {
        await api.get("/csrf/token");
      } catch {
        /* */
      }

      const body: { email: string; password: string; captchaToken?: string } = { email, password };
      if (captchaToken) body.captchaToken = captchaToken;

      const response = await api.post<{ user: User }>("/auth/login", body);

      if (response.success && response.data) {
        const userData = normalizeUserSystemAccess({
          ...response.data.user,
          mustChangePassword: response.data.user?.mustChangePassword ?? false,
          accessReason: response.data.user?.accessReason ?? null,
        } as User);
        setUser(userData);
        localStorage.setItem("podoadmin_user", JSON.stringify(userData));
        setIsLoading(false);
        refreshReceptionistAssignmentsInBackground(userData, (hydrated) => {
          setUser(hydrated);
          localStorage.setItem("podoadmin_user", JSON.stringify(hydrated));
        });
        try {
          await api.get("/csrf/token");
        } catch {
          /* */
        }
        return { success: true, redirectPath: getPostLoginPath(userData) };
      }

      const retryAfter = response.retryAfter;
      const blockedUntil = response.blockedUntil;
      const attemptCount = response.attemptCount;
      const isBlocked = response.isBlocked;
      const blockDurationMinutes = response.blockDurationMinutes;
      const requiresCaptcha = response.requiresCaptcha;
      return {
        success: false,
        error: response.error || response.message || "Credenciales incorrectas",
        retryAfter,
        blockedUntil,
        attemptCount,
        isBlocked,
        blockDurationMinutes,
        requiresCaptcha,
      };
    } catch (error) {
      console.error("Error en login:", error);
      return { success: false, error: "Credenciales incorrectas" };
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Error en logout:", error);
    } finally {
      setUser(null);
      setUsers([]);
      invalidateVisibleUsersCache();
      localStorage.removeItem("podoadmin_user");
    }
  };

  const getAllUsers = () => users;
  const isEmailTaken = (email: string) =>
    users.some((u) => u.email.toLowerCase().trim() === email.toLowerCase().trim());

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = normalizeUserSystemAccess({ ...prev, ...updates });
      localStorage.setItem("podoadmin_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        usersLoading,
        isLoading,
        login,
        logout,
        getAllUsers,
        fetchUsers,
        ensureVisibleUsers,
        isEmailTaken,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
