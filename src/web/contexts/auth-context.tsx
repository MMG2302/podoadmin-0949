import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

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
}

interface AuthContextType {
  user: User | null;
  users: User[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ 
    success: boolean; 
    error?: string;
    retryAfter?: number;
    blockedUntil?: number;
    attemptCount?: number;
    isBlocked?: boolean;
    blockDurationMinutes?: number;
  }>;
  logout: () => void;
  /** Lista de usuarios (desde API). Solo disponible para super_admin, admin, clinic_admin. */
  getAllUsers: () => User[];
  /** Recarga la lista de usuarios desde la API. */
  fetchUsers: () => Promise<void>;
  /** Comprueba si un email está en uso (según la lista cargada desde API). */
  isEmailTaken: (email: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    if (!user) return;
    try {
      const { api } = await import("../lib/api-client");
      // /users/visible devuelve la lista según rol: admins/clinic todos o clínica; receptionist solo asignados; podiatrist su clínica
      const r = await api.get<{ success?: boolean; users?: User[] }>("/users/visible");
      if (r.success && Array.isArray(r.data?.users)) setUsers(r.data.users);
      else setUsers([]);
    } catch {
      setUsers([]);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUsers([]);
      return;
    }
    fetchUsers();
  }, [user, fetchUsers]);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const { api } = await import("../lib/api-client");
        await api.get("/csrf/token");
      } catch (error) {
        console.warn("No se pudo obtener token CSRF inicial:", error);
      }

      try {
        const { api } = await import("../lib/api-client");
        const response = await api.get<{ user: User }>("/auth/verify");

        if (response.success && response.data?.user) {
          setUser(response.data.user);
          localStorage.setItem("podoadmin_user", JSON.stringify(response.data.user));
        } else {
          setUser(null);
          localStorage.removeItem("podoadmin_user");
        }
      } catch (error) {
        console.error("Error verificando autenticación:", error);
        setUser(null);
        localStorage.removeItem("podoadmin_user");
      }
      setIsLoading(false);
    };

    verifyAuth();

    const handleLogout = () => {
      setUser(null);
      localStorage.removeItem("podoadmin_token");
      localStorage.removeItem("podoadmin_user");
    };

    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { api } = await import("../lib/api-client");

      try {
        await api.get("/csrf/token");
      } catch (error) {
        console.warn("No se pudo obtener token CSRF antes de login:", error);
      }

      const response = await api.post<{ user: User }>("/auth/login", {
        email,
        password,
      });

      if (response.success && response.data) {
        setUser(response.data.user);
        localStorage.setItem("podoadmin_user", JSON.stringify(response.data.user));
        try {
          await api.get("/csrf/token");
        } catch (error) {
          console.warn("No se pudo obtener token CSRF después de login:", error);
        }
        return { success: true };
      }

      const retryAfter = response.retryAfter;
      const blockedUntil = response.blockedUntil;
      const attemptCount = response.attemptCount;
      const isBlocked = response.isBlocked;
      const blockDurationMinutes = response.blockDurationMinutes;
      return {
        success: false,
        error: response.error || response.message || "Credenciales incorrectas",
        retryAfter,
        blockedUntil,
        attemptCount,
        isBlocked,
        blockDurationMinutes,
      };
    } catch (error) {
      console.error("Error en login:", error);
      return { success: false, error: "Credenciales incorrectas" };
    }
  };

  const logout = async () => {
    try {
      const { api } = await import("../lib/api-client");
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Error en logout:", error);
    } finally {
      setUser(null);
      setUsers([]);
      localStorage.removeItem("podoadmin_user");
    }
  };

  const getAllUsers = () => users;
  const isEmailTaken = (email: string) =>
    users.some((u) => u.email.toLowerCase().trim() === email.toLowerCase().trim());

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        isLoading,
        login,
        logout,
        getAllUsers,
        fetchUsers,
        isEmailTaken,
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
