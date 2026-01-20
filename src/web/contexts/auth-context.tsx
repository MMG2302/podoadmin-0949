import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getCreatedUsers, CreatedUser } from "@/lib/storage";

export type UserRole = "super_admin" | "clinic_admin" | "admin" | "podiatrist";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  clinicId?: string; // For clinic_admin and podiatrists
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
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
    } as User,
  }));
  return [...MOCK_USERS, ...createdUsersFormatted];
};

export const getAllUsers = () => {
  const allUsers = getAllUsersWithCredentials();
  return allUsers.map(u => u.user);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("podoadmin_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("podoadmin_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Get fresh list of users (including newly created ones)
    const allUsers = getAllUsersWithCredentials();
    const matchedUser = allUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (matchedUser) {
      setUser(matchedUser.user);
      localStorage.setItem("podoadmin_user", JSON.stringify(matchedUser.user));
      return { success: true };
    }

    return { success: false, error: "Credenciales inválidas" };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("podoadmin_user");
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
