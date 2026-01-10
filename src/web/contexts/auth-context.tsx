import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
  // Clinic Administrator - manages a clinic with multiple podiatrists
  {
    email: "manager@clinic.com",
    password: "manager123",
    user: {
      id: "user_clinic_admin_001",
      email: "manager@clinic.com",
      name: "Carlos Mendoza",
      role: "clinic_admin",
      clinicId: "clinic_001",
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
  // Podiatrists
  {
    email: "doctor1@clinic.com",
    password: "doctor123",
    user: {
      id: "user_podiatrist_001",
      email: "doctor1@clinic.com",
      name: "Dra. María García",
      role: "podiatrist",
      clinicId: "clinic_001",
    },
  },
  {
    email: "doctor2@clinic.com",
    password: "doctor123",
    user: {
      id: "user_podiatrist_002",
      email: "doctor2@clinic.com",
      name: "Dr. Antonio López",
      role: "podiatrist",
      clinicId: "clinic_001",
    },
  },
  {
    email: "doctor3@clinic.com",
    password: "doctor123",
    user: {
      id: "user_podiatrist_003",
      email: "doctor3@clinic.com",
      name: "Dra. Elena Martínez",
      role: "podiatrist",
      clinicId: "clinic_001",
    },
  },
  {
    email: "doctor4@clinic.com",
    password: "doctor123",
    user: {
      id: "user_podiatrist_004",
      email: "doctor4@clinic.com",
      name: "Dr. Pedro Sánchez",
      role: "podiatrist",
      clinicId: "clinic_002",
    },
  },
];

export const getAllUsers = () => MOCK_USERS.map(u => u.user);

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

    const matchedUser = MOCK_USERS.find(
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
