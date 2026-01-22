import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getCreatedUsers, CreatedUser, initializeUserCredits, getUserStatus } from "@/lib/storage";

export type UserRole = "super_admin" | "clinic_admin" | "admin" | "podiatrist";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  clinicId?: string; // For clinic_admin and podiatrists
  isBlocked?: boolean; // Cuenta bloqueada temporalmente
  isEnabled?: boolean; // Cuenta habilitada (por defecto true)
  isBanned?: boolean; // Cuenta baneada permanentemente
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ 
    success: boolean; 
    error?: string;
    retryAfter?: number;
    blockedUntil?: number;
    attemptCount?: number;
  }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USERS: { email: string; password: string; user: User }[] = [
  // Super Admin - full platform access
  {
    email: "admin@podoadmin.com",
    password: "admin123",
    user: {
      id: "user_super_admin_001",
      email: "admin@podoadmin.com",
      name: "Super Administrador",
      role: "super_admin",
    },
  },
  // Admin (Support) - limited credit adjustment capabilities
  {
    email: "support@podoadmin.com",
    password: "support123",
    user: {
      id: "user_admin_001",
      email: "support@podoadmin.com",
      name: "Soporte Técnico",
      role: "admin",
    },
  },
  
  // ============ CLINIC 1: Clínica Podológica Premium ============
  {
    email: "maria.fernandez@premium.com",
    password: "manager123",
    user: {
      id: "user_clinic_admin_001",
      email: "maria.fernandez@premium.com",
      name: "María Fernández",
      role: "clinic_admin",
      clinicId: "clinic_001",
    },
  },
  {
    email: "doctor1@premium.com",
    password: "doctor123",
    user: {
      id: "user_podiatrist_001",
      email: "doctor1@premium.com",
      name: "Dra. Ana Belén Ruiz",
      role: "podiatrist",
      clinicId: "clinic_001",
    },
  },
  {
    email: "doctor2@premium.com",
    password: "doctor123",
    user: {
      id: "user_podiatrist_002",
      email: "doctor2@premium.com",
      name: "Dr. Carlos Moreno",
      role: "podiatrist",
      clinicId: "clinic_001",
    },
  },
  {
    email: "doctor3@premium.com",
    password: "doctor123",
    user: {
      id: "user_podiatrist_003",
      email: "doctor3@premium.com",
      name: "Dra. Laura Vidal",
      role: "podiatrist",
      clinicId: "clinic_001",
    },
  },
  
  // ============ CLINIC 2: Centro Médico Podológico ============
  {
    email: "juan.garcia@centromedico.com",
    password: "manager123",
    user: {
      id: "user_clinic_admin_002",
      email: "juan.garcia@centromedico.com",
      name: "Juan García",
      role: "clinic_admin",
      clinicId: "clinic_002",
    },
  },
  {
    email: "doctor1@centromedico.com",
    password: "doctor123",
    user: {
      id: "user_podiatrist_004",
      email: "doctor1@centromedico.com",
      name: "Dr. Miguel Ángel Torres",
      role: "podiatrist",
      clinicId: "clinic_002",
    },
  },
  {
    email: "doctor2@centromedico.com",
    password: "doctor123",
    user: {
      id: "user_podiatrist_005",
      email: "doctor2@centromedico.com",
      name: "Dra. Patricia Navarro",
      role: "podiatrist",
      clinicId: "clinic_002",
    },
  },
  {
    email: "doctor3@centromedico.com",
    password: "doctor123",
    user: {
      id: "user_podiatrist_006",
      email: "doctor3@centromedico.com",
      name: "Dr. Fernando Ramos",
      role: "podiatrist",
      clinicId: "clinic_002",
    },
  },
  
  // ============ CLINIC 3: Podología Integral Plus ============
  {
    email: "sofia.rodriguez@integralplus.com",
    password: "manager123",
    user: {
      id: "user_clinic_admin_003",
      email: "sofia.rodriguez@integralplus.com",
      name: "Sofía Rodríguez",
      role: "clinic_admin",
      clinicId: "clinic_003",
    },
  },
  {
    email: "doctor1@integralplus.com",
    password: "doctor123",
    user: {
      id: "user_podiatrist_007",
      email: "doctor1@integralplus.com",
      name: "Dra. Carmen Delgado",
      role: "podiatrist",
      clinicId: "clinic_003",
    },
  },
  {
    email: "doctor2@integralplus.com",
    password: "doctor123",
    user: {
      id: "user_podiatrist_008",
      email: "doctor2@integralplus.com",
      name: "Dr. Alberto Serrano",
      role: "podiatrist",
      clinicId: "clinic_003",
    },
  },
  {
    email: "doctor3@integralplus.com",
    password: "doctor123",
    user: {
      id: "user_podiatrist_009",
      email: "doctor3@integralplus.com",
      name: "Dra. Isabel Castro",
      role: "podiatrist",
      clinicId: "clinic_003",
    },
  },
  
  // ============ INDEPENDENT PODIATRISTS (no clinic) ============
  {
    email: "pablo.hernandez@gmail.com",
    password: "doctor123",
    user: {
      id: "user_podiatrist_010",
      email: "pablo.hernandez@gmail.com",
      name: "Dr. Pablo Hernández",
      role: "podiatrist",
    },
  },
  {
    email: "lucia.santos@outlook.com",
    password: "doctor123",
    user: {
      id: "user_podiatrist_011",
      email: "lucia.santos@outlook.com",
      name: "Dra. Lucía Santos",
      role: "podiatrist",
    },
  },
  {
    email: "andres.molina@yahoo.es",
    password: "doctor123",
    user: {
      id: "user_podiatrist_012",
      email: "andres.molina@yahoo.es",
      name: "Dr. Andrés Molina",
      role: "podiatrist",
    },
  },
  {
    email: "beatriz.ortiz@hotmail.com",
    password: "doctor123",
    user: {
      id: "user_podiatrist_013",
      email: "beatriz.ortiz@hotmail.com",
      name: "Dra. Beatriz Ortiz",
      role: "podiatrist",
    },
  },
];

// Helper function to get all users (mock + created)
const getAllUsersWithCredentials = (): { email: string; password: string; user: User }[] => {
  const createdUsers = getCreatedUsers();
  const createdUsersFormatted = createdUsers.map((cu: CreatedUser) => ({
    email: cu.email,
    password: cu.password,
    user: {
      id: cu.id,
      email: cu.email,
      name: cu.name,
      role: cu.role,
      clinicId: cu.clinicId,
      isBlocked: cu.isBlocked,
      isEnabled: cu.isEnabled,
      isBanned: cu.isBanned,
    } as User,
  }));
  return [...MOCK_USERS, ...createdUsersFormatted];
};

export const getAllUsers = () => {
  const allUsers = getAllUsersWithCredentials();
  return allUsers.map(u => {
    // Para usuarios mock, obtener estado desde storage si existe
    const userStatus = getUserStatus(u.user.id);
    return {
      ...u.user,
      isBlocked: u.user.isBlocked ?? userStatus.isBlocked,
      isEnabled: u.user.isEnabled ?? userStatus.isEnabled,
      isBanned: u.user.isBanned ?? userStatus.isBanned,
    };
  });
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar autenticación al cargar
  useEffect(() => {
    const verifyAuth = async () => {
      // Obtener token CSRF al cargar (necesario para futuras solicitudes)
      try {
        const { api } = await import("../lib/api-client");
        // Esto obtendrá el token CSRF y lo guardará en cookie
        await api.get("/csrf/token");
      } catch (error) {
        console.warn("No se pudo obtener token CSRF inicial:", error);
      }

      // Verificar si hay cookies de sesión (tokens HTTP-only)
      // Los tokens ahora están en cookies, no en localStorage
      try {
        const { api } = await import("../lib/api-client");
        const response = await api.get<{ user: User }>("/auth/verify");

        if (response.success && response.data?.user) {
          setUser(response.data.user);
          // Solo guardar información del usuario (no tokens)
          localStorage.setItem("podoadmin_user", JSON.stringify(response.data.user));
        } else {
          // No hay sesión válida, limpiar
          localStorage.removeItem("podoadmin_user");
        }
      } catch (error) {
        console.error("Error verificando autenticación:", error);
        localStorage.removeItem("podoadmin_user");
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();

    // Escuchar eventos de logout desde otras pestañas/componentes
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
      
      // Obtener token CSRF antes de hacer login (aunque login no lo requiere, es buena práctica)
      // Esto asegura que tenemos un token CSRF para futuras solicitudes
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
        // Los tokens ahora se almacenan en cookies HTTP-only automáticamente
        // Solo guardar información del usuario (no tokens)
        setUser(response.data.user);
        localStorage.setItem("podoadmin_user", JSON.stringify(response.data.user));
        
        // Obtener nuevo token CSRF después del login exitoso
        try {
          await api.get("/csrf/token");
        } catch (error) {
          console.warn("No se pudo obtener token CSRF después de login:", error);
        }
        
        // Initialize user credits on successful login (mantener compatibilidad)
        initializeUserCredits(response.data.user.id, response.data.user.role);
        
        return { success: true };
      } else {
        // Extraer información de rate limiting si está presente
        // Estos campos vienen en el nivel superior de la respuesta ApiResponse
        const retryAfter = response.retryAfter;
        const blockedUntil = response.blockedUntil;
        const attemptCount = response.attemptCount;

        return {
          success: false,
          error: response.error || response.message || "Error al iniciar sesión",
          retryAfter,
          blockedUntil,
          attemptCount,
        };
      }
    } catch (error) {
      console.error("Error en login:", error);
      return { success: false, error: "Error de conexión con el servidor" };
    }
  };

  const logout = async () => {
    try {
      // Intentar cerrar sesión en el servidor (elimina cookies)
      const { api } = await import("../lib/api-client");
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Error en logout:", error);
      // Aún así limpiar el estado local
    } finally {
      setUser(null);
      localStorage.removeItem("podoadmin_user");
      // Las cookies se eliminan automáticamente por el servidor
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
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
