import { useLocation, Link } from "wouter";
import { useAuth } from "../../contexts/auth-context";
import { useLanguage } from "../../contexts/language-context";
import { usePermissions } from "../../hooks/use-permissions";
import { LanguageSwitcher } from "../language-switcher";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { hasPermission, isSuperAdmin, isClinicAdmin, isAdmin, isPodiatrist } = usePermissions();

  const getRoleLabel = () => {
    if (isSuperAdmin) return t.roles.superAdmin;
    if (isClinicAdmin) return t.roles.clinicAdmin;
    if (isAdmin) return t.roles.admin;
    return t.roles.podiatrist;
  };

  const navItems = [
    {
      path: "/",
      label: t.nav.dashboard,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      permission: "view_dashboard" as const,
      roles: ["super_admin", "clinic_admin", "admin", "podiatrist"] as const,
    },
    {
      path: "/users",
      label: t.nav.users,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      permission: "view_users" as const,
      roles: ["super_admin", "admin"] as const,
    },
    {
      path: "/messages",
      label: t.messaging.title,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      permission: "view_users" as const,
      roles: ["super_admin"] as const,
    },
    {
      path: "/clinic",
      label: t.nav.clinicManagement,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      permission: "view_clinic_stats" as const,
      roles: ["clinic_admin"] as const,
    },
    {
      path: "/patients",
      label: t.nav.patients,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      permission: "view_patients" as const,
      roles: ["podiatrist"] as const,
    },
    {
      path: "/sessions",
      label: t.nav.clinicalSessions,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      permission: "view_sessions" as const,
      roles: ["podiatrist"] as const,
    },
    {
      path: "/calendar",
      label: "Calendario",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      permission: "view_sessions" as const,
      roles: ["clinic_admin", "podiatrist"] as const,
    },
    {
      path: "/credits",
      label: t.nav.credits,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      permission: "view_credits" as const,
      roles: ["super_admin", "clinic_admin", "admin", "podiatrist"] as const,
    },
    {
      path: "/distribute-credits",
      label: "Distribuir Créditos",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      permission: "view_clinic_stats" as const,
      roles: ["clinic_admin"] as const,
    },
    {
      path: "/audit-log",
      label: t.nav.auditLog,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      permission: "view_audit_log" as const,
      roles: ["super_admin"] as const,
    },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (!user) return false;
    // Check if user role is in the allowed roles
    return item.roles.includes(user.role as typeof item.roles[number]) && hasPermission(item.permission);
  });

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <>
      {/* Overlay for mobile - full screen with animation */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar - full height overlay on mobile, fixed on desktop */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[85%] max-w-[300px] md:w-72 bg-[#1a1a1a] transform transition-transform duration-300 ease-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full safe-area-inset">
          {/* Header with close button for mobile */}
          <div className="p-4 md:p-6 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-white text-xl md:text-2xl font-light tracking-tight">
                Podo<span className="font-bold">Admin</span>
              </h1>
              {/* Close button - only visible on mobile */}
              <button
                onClick={onClose}
                className="md:hidden p-2 -mr-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Cerrar menú"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* User info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-medium">
                  {user?.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{user?.name}</p>
                <p className="text-gray-400 text-xs truncate">
                  {getRoleLabel()}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation - scrollable */}
          <nav className="flex-1 overflow-y-auto py-3 md:py-4 px-2 md:px-3 overscroll-contain">
            <ul className="space-y-1">
              {filteredNavItems.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 md:px-4 py-3 md:py-3 rounded-lg transition-all min-h-[48px] active:scale-[0.98] ${
                      isActive(item.path)
                        ? "bg-white text-[#1a1a1a]"
                        : "text-gray-300 hover:bg-white/10 hover:text-white active:bg-white/20"
                    }`}
                  >
                    {item.icon}
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer with safe area padding */}
          <div className="p-3 md:p-4 border-t border-white/10 space-y-2 md:space-y-3 pb-safe">
            <LanguageSwitcher variant="inline" className="justify-center" />
            
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-gray-300 hover:bg-white/10 hover:text-white active:bg-white/20 rounded-lg transition-all min-h-[48px] active:scale-[0.98]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium text-sm">{t.auth.logout}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
