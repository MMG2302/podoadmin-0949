import { useLocation, Link } from "wouter";
import { useAuth } from "../../contexts/auth-context";
import { useLanguage } from "../../contexts/language-context";
import { usePermissions } from "../../hooks/use-permissions";
import { useSidebarNavItems } from "../../hooks/use-sidebar-nav-items";
import { LanguageSwitcher } from "../language-switcher";
import { UserAvatar } from "../ui/user-avatar";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  visibleOnDesktop?: boolean;
  onToggleDesktop?: () => void;
  locked?: "visible" | "hidden" | null;
}

export const Sidebar = ({
  isOpen,
  onClose,
  visibleOnDesktop = true,
  onToggleDesktop,
  locked = null,
}: SidebarProps) => {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const {
    isSuperAdmin,
    isClinicAdmin,
    isAdmin,
    isPodiatrist,
    isReceptionist,
  } = usePermissions();
  const { visibleItems: itemsToShow } = useSidebarNavItems();

  const getRoleLabel = () => {
    if (isSuperAdmin) return t.roles.superAdmin;
    if (isClinicAdmin) return t.roles.clinicAdmin;
    if (isAdmin) return t.roles.admin;
    if (isReceptionist) return t.roles.receptionist;
    if (isPodiatrist) return t.roles.podiatrist;
    return user?.role ? String(user.role) : t.roles.podiatrist;
  };

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[85%] max-w-[300px] md:w-72 bg-brand-sidebar text-brand-sidebar-fg transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${visibleOnDesktop ? "md:translate-x-0" : "md:-translate-x-full"}`}
      >
        <div className="flex flex-col h-full min-h-0 safe-area-inset">
          <div className="flex-shrink-0 p-4 md:p-6 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-white text-xl md:text-2xl font-light tracking-tight">
                Podo<span className="font-bold">Admin</span>
              </h1>
              <div className="flex items-center gap-1">
                {onToggleDesktop && !locked && (
                  <button
                    onClick={onToggleDesktop}
                    className="hidden md:flex p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors min-w-[40px] min-h-[40px] items-center justify-center"
                    title="Ocultar menú"
                    aria-label="Ocultar menú"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </button>
                )}
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
            </div>

            <div className="flex items-center gap-3">
              <UserAvatar
                name={user?.name}
                avatarUrl={user?.avatarUrl}
                size="sm"
                variant="sidebar"
              />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{user?.name}</p>
                <p className="text-gray-400 text-xs truncate">{getRoleLabel()}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 min-h-0 overflow-y-auto py-3 md:py-4 px-2 md:px-3 overscroll-contain">
            <ul className="space-y-1">
              {itemsToShow.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-2.5 rounded-lg transition-all min-h-[44px] active:scale-[0.98] ${
                      isActive(item.path)
                        ? "bg-brand-sidebar-active-bg text-brand-sidebar-active-fg"
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

          <div className="flex-shrink-0 p-3 md:p-4 border-t border-white/10 space-y-2 md:space-y-3 pb-safe">
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
