import { useMemo } from "react";
import { useAuth, getPostLoginPath } from "../contexts/auth-context";
import { hasActiveSystemAccess, isNavPathAllowedWithoutPayment } from "../lib/system-access";
import { useLanguage } from "../contexts/language-context";
import { usePermissions } from "./use-permissions";
import { useNavVisibility } from "./use-nav-visibility";
import { useEntitlements, type FeatureKey } from "./use-entitlements";

export type SidebarNavItem = {
  path: string;
  label: string;
  icon: React.ReactNode;
  permission: string;
  roles: readonly string[];
  /** Feature del plan Premium que desbloquea este ítem (si aplica). */
  premiumFeature?: FeatureKey;
  /** true cuando el plan actual no incluye la feature: se muestra con candado. */
  locked?: boolean;
};

export function useSidebarNavItems() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navVisibility = useNavVisibility();
  const {
    hasPermission,
    canViewWhatsAppMessages,
    canViewWhatsAppWeb,
    isReceptionist,
  } = usePermissions();
  const { has: hasFeature } = useEntitlements();

  const navItems = useMemo((): SidebarNavItem[] => {
    if (!user) return [];
    return [
      {
        path: "/",
        label: t.nav.dashboard,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
        permission: "view_dashboard",
        roles: ["super_admin", "clinic_admin", "admin", "podiatrist", "receptionist"],
      },
      {
        path: "/users",
        label: t.nav.users,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ),
        permission: "view_users",
        roles: ["super_admin", "admin"],
      },
      {
        path: "/messages",
        label: t.messaging.title,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        ),
        permission: "view_users",
        roles: ["super_admin"],
      },
      {
        path: "/support",
        label: t.support.contactPodoAdmin,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ),
        permission: "view_users",
        roles: ["super_admin", "admin"],
      },
      {
        path: "/clinic",
        label: t.nav.clinicManagement,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        ),
        permission: "view_clinic_stats",
        roles: ["clinic_admin"],
      },
      {
        path: "/patients",
        label: t.nav.patients,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
        permission: "view_patients",
        roles: ["podiatrist", "receptionist"],
      },
      {
        path: "/sessions",
        label: t.nav.clinicalSessions,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
        permission: "view_sessions",
        roles: ["podiatrist"],
      },
      {
        path: "/calendar",
        label: t.nav.calendar,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
        permission: "view_calendar",
        roles: ["clinic_admin", "podiatrist", "receptionist"],
      },
      {
        path: "/checkout",
        label: t.nav.checkout,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
        permission: "view_checkout_handoffs",
        roles: ["clinic_admin", "podiatrist", "receptionist"],
      },
      {
        path: "/clinical-tools",
        label: t.nav.clinicalTools,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        ),
        permission: "manage_sessions",
        roles: ["clinic_admin", "podiatrist"],
        premiumFeature: "clinical_tools",
      },
      {
        path: "/whatsapp-campaigns",
        label: t.nav.whatsappCampaigns,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417-.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        ),
        permission: "view_whatsapp_web",
        roles: ["clinic_admin", "podiatrist", "receptionist"],
        premiumFeature: "whatsapp_campaigns",
      },
      {
        path: "/whatsapp-messages",
        label: t.nav.whatsappMessages,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75h6.75m-6.75 3h4.5m-7.23 6.72A9 9 0 1119.5 6.5a9 9 0 01-12.605 12.72L3 21l1.78-3.78z" />
          </svg>
        ),
        permission: "view_whatsapp_web",
        roles: ["clinic_admin", "podiatrist", "receptionist"],
      },
      {
        path: "/audit-log",
        label: t.nav.auditLog,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        ),
        permission: "view_audit_log",
        roles: ["super_admin"],
      },
      {
        path: "/security-metrics",
        label: t.nav.securityMetrics,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        ),
        permission: "view_audit_log",
        roles: ["super_admin"],
      },
      {
        path: "/sponsored-announcements",
        label: "Anuncios patrocinados",
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
        permission: "view_audit_log",
        roles: ["super_admin"],
      },
      {
        path: "/system",
        label: t.nav.systemDiagnostics,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        ),
        permission: "view_system_diagnostics",
        roles: ["super_admin"],
      },
    ];
  }, [t, user]);

  const permittedItems = useMemo(() => {
    if (!user) return [];
    return navItems
      .filter((item) => {
        const roleAllowed = item.roles.includes(user.role);
        if (!roleAllowed) return false;
        if (!hasActiveSystemAccess(user) && !isNavPathAllowedWithoutPayment(item.path)) return false;
        if (item.path === "/whatsapp-campaigns" || item.path === "/whatsapp-messages") {
          return canViewWhatsAppWeb;
        }
        return hasPermission(item.permission as Parameters<typeof hasPermission>[0]);
      })
      // Ítems Premium siguen visibles en plan Base, pero marcados con candado (upsell).
      .map((item) =>
        item.premiumFeature && !hasFeature(item.premiumFeature)
          ? { ...item, locked: true }
          : item
      );
  }, [navItems, user, hasPermission, canViewWhatsAppMessages, canViewWhatsAppWeb, isReceptionist, hasFeature]);

  const visibleItems = useMemo(() => {
    const filtered = permittedItems.filter((item) => navVisibility[item.path] !== false);
    if (filtered.length > 0) return filtered;

    if (user && !hasActiveSystemAccess(user)) {
      const fallbackPath = getPostLoginPath(user);
      return [
        {
          path: fallbackPath,
          label:
            user.role === "clinic_admin" || user.role === "podiatrist"
              ? (t.settings?.title ?? "Configuración")
              : "Soporte",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
          permission: "view_dashboard",
          roles: ["super_admin", "clinic_admin", "admin", "podiatrist", "receptionist"],
        },
      ] satisfies SidebarNavItem[];
    }

    if (permittedItems.length > 0) return permittedItems;
    return navItems.filter((item) => item.path === "/");
  }, [permittedItems, navVisibility, user, navItems]);

  return { navItems, permittedItems, visibleItems };
}
