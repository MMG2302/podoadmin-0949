import { useAuth, UserRole } from "../contexts/auth-context";

type Permission =
  | "view_dashboard"
  | "view_patients"
  | "manage_patients"
  | "view_sessions"
  | "manage_sessions"
  | "view_users"
  | "manage_users"
  | "view_audit_log"
  | "export_data"
  | "print_documents"
  | "view_settings"
  | "manage_settings"
  | "view_clinic_stats"
  | "reassign_patients"
  | "view_calendar"
  | "view_whatsapp_messages";

const rolePermissions: Record<UserRole, Permission[]> = {
  super_admin: [
    "view_dashboard",
    "view_users",
    "manage_users",
    "view_audit_log",
    "export_data",
    "view_settings",
    "manage_settings",
  ],
  clinic_admin: [
    "view_dashboard",
    "view_patients",
    "view_sessions",
    "view_calendar",
    "view_clinic_stats",
    "reassign_patients",
    "print_documents",
    "view_settings",
    "view_whatsapp_messages",
  ],
  admin: [
    "view_dashboard",
    "view_users",
    "view_settings",
  ],
  podiatrist: [
    "view_dashboard",
    "view_patients",
    "manage_patients",
    "view_sessions",
    "manage_sessions",
    "view_calendar",
    "print_documents",
    "view_settings",
    "view_whatsapp_messages",
  ],
  receptionist: [
    "view_dashboard",
    "view_patients",
    "manage_patients",
    "view_calendar",
    "view_settings",
  ],
};

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    const perms = rolePermissions[user.role as UserRole];
    return perms ? perms.includes(permission) : false;
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
  const isReceptionist = user?.role === "receptionist";
  const canViewWhatsAppMessages = isPodiatrist || isClinicAdmin;

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
    isClinicAdmin,
    isAdmin,
    isPodiatrist,
    isReceptionist,
    canViewWhatsAppMessages,
    permissions: user ? (rolePermissions[user.role as UserRole] ?? []) : [],
  };
};
