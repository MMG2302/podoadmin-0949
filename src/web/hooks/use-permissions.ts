import { useAuth } from "../contexts/auth-context";

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
  | "manage_settings";

const rolePermissions: Record<"super_admin" | "podiatrist", Permission[]> = {
  super_admin: [
    "view_dashboard",
    "view_patients",
    "manage_patients",
    "view_sessions",
    "manage_sessions",
    "view_credits",
    "manage_credits",
    "purchase_credits",
    "view_users",
    "manage_users",
    "view_audit_log",
    "export_data",
    "print_documents",
    "view_settings",
    "manage_settings",
  ],
  podiatrist: [
    "view_dashboard",
    "view_patients",
    "manage_patients",
    "view_sessions",
    "manage_sessions",
    "view_credits",
    "export_data",
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
  const isPodiatrist = user?.role === "podiatrist";

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
    isPodiatrist,
    permissions: user ? rolePermissions[user.role] : [],
  };
};
