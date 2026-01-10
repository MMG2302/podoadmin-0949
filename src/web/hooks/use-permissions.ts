import { useAuth, UserRole } from "../contexts/auth-context";

type Permission =
  | "view_dashboard"
  | "view_patients"
  | "manage_patients"
  | "view_sessions"
  | "manage_sessions"
  | "view_credits"
  | "manage_credits"
  | "purchase_credits"
  | "view_users"
  | "manage_users"
  | "view_audit_log"
  | "export_data"
  | "print_documents"
  | "view_settings"
  | "manage_settings"
  | "view_clinic_stats"
  | "reassign_patients"
  | "adjust_credits";

const rolePermissions: Record<UserRole, Permission[]> = {
  // Super Admin: Users Management, Credits Management (Whop.io), Settings, Audit Log
  // NO access to Patients or Clinical Sessions
  super_admin: [
    "view_dashboard",
    "view_credits",
    "manage_credits",
    "view_users",
    "manage_users",
    "view_audit_log",
    "export_data",
    "view_settings",
    "manage_settings",
  ],
  
  // Clinic Administrator: manages podiatrists, views all patients/sessions, can reassign patients
  // Cannot create/edit clinical sessions
  clinic_admin: [
    "view_dashboard",
    "view_patients",
    "view_sessions",
    "view_credits",
    "view_clinic_stats",
    "reassign_patients",
    "print_documents",
    "view_settings",
  ],
  
  // Admin (Support): limited credit adjustment capabilities
  admin: [
    "view_dashboard",
    "view_users",
    "view_credits",
    "adjust_credits",
    "view_settings",
  ],
  
  // Podiatrist: patient management, clinical sessions, PDF printing
  podiatrist: [
    "view_dashboard",
    "view_patients",
    "manage_patients",
    "view_sessions",
    "manage_sessions",
    "view_credits",
    "print_documents",
    "view_settings",
  ],
};

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return rolePermissions[user.role].includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(hasPermission);
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(hasPermission);
  };

  const isSuperAdmin = user?.role === "super_admin";
  const isClinicAdmin = user?.role === "clinic_admin";
  const isAdmin = user?.role === "admin";
  const isPodiatrist = user?.role === "podiatrist";

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
    isClinicAdmin,
    isAdmin,
    isPodiatrist,
    permissions: user ? rolePermissions[user.role] : [],
  };
};
