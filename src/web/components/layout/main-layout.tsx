import { useState, useEffect, ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { NotificationsBell } from "../notifications-bell";
import { SettingsButton } from "../settings-button";
import { AnimatedThemeToggler } from "../ui/animated-theme-toggler";
import { Dock, DockIcon } from "../ui/dock";
import { getSidebarSettings, saveSidebarSettings } from "../../lib/storage";

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
}

export const MainLayout = ({ children, title }: MainLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarLocked, setSidebarLocked] = useState<"visible" | "hidden" | null>(null);

  // Cargar preferencias de sidebar al iniciar
  useEffect(() => {
    const s = getSidebarSettings();
    setSidebarCollapsed(s.collapsed);
    setSidebarLocked(s.locked);
  }, []);

  // En móvil: asegurar que header/layout estén visibles tras login (evita pantalla en blanco hasta refresh)
  useEffect(() => {
    window.scrollTo(0, 0);
    // Forzar reflow para que el navegador recalcule el layout (arregla header/sidebar que no aparecen hasta refresh)
    requestAnimationFrame(() => {
      document.body.offsetHeight;
    });
  }, []);

  // Sidebar visible en desktop: no colapsado (salvo si está bloqueado oculto)
  const sidebarVisibleOnDesktop =
    sidebarLocked === "visible" ? true : sidebarLocked === "hidden" ? false : !sidebarCollapsed;

  const handleToggleDesktop = () => {
    if (sidebarLocked !== null) return;
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    saveSidebarSettings({
      collapsed: next,
      locked: sidebarLocked,
    });
  };

  const handleLockCycle = () => {
    const next: "visible" | "hidden" | null =
      sidebarLocked === null ? "visible" : sidebarLocked === "visible" ? "hidden" : null;
    setSidebarLocked(next);
    saveSidebarSettings({
      collapsed: next === "visible" ? false : next === "hidden" ? true : sidebarCollapsed,
      locked: next,
    });
    if (next === "visible") setSidebarCollapsed(false);
    if (next === "hidden") setSidebarCollapsed(true);
  };

  return (
    <div className="h-dvh h-screen min-h-0 flex overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        visibleOnDesktop={sidebarVisibleOnDesktop}
        onToggleDesktop={handleToggleDesktop}
        locked={sidebarLocked}
      />
      
      {/* Main content area - flex para adaptarse al viewport, margen dinámico según sidebar */}
      <div
        className={`flex-1 flex flex-col min-w-0 min-h-0 md:pl-0 ml-0 w-full overflow-hidden transition-[margin] duration-300 ${
          sidebarVisibleOnDesktop ? "md:ml-72" : "md:ml-0"
        }`}
      >
        {/* Top header - responsive */}
        <header className="flex-shrink-0 sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 safe-area-top">
          <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8 h-14 sm:h-16">
            {/* Left side - menu button and title */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {/* Bloquear sidebar - solo en desktop, siempre visible */}
              <button
                onClick={handleLockCycle}
                className={`hidden md:flex p-2 rounded-lg transition-colors min-w-[40px] min-h-[40px] items-center justify-center flex-shrink-0 ${
                  sidebarLocked ? "bg-gray-200 dark:bg-gray-700 text-[#1a1a1a] dark:text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
                }`}
                title={
                  sidebarLocked === "visible"
                    ? "Desbloquear (bloqueado visible)"
                    : sidebarLocked === "hidden"
                      ? "Desbloquear (bloqueado oculto)"
                      : "Bloquear sidebar visible"
                }
                aria-label="Alternar bloqueo de sidebar"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </button>
              {/* Menú: en móvil abre overlay, en desktop alterna visible/oculto */}
              <button
                onClick={() => {
                  if (window.matchMedia("(min-width: 768px)").matches) {
                    handleToggleDesktop();
                  } else {
                    setSidebarOpen(true);
                  }
                }}
                className="p-2 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
                aria-label={sidebarVisibleOnDesktop ? "Ocultar menú" : "Mostrar menú"}
              >
                <svg className="w-6 h-6 text-[#1a1a1a] dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Page title - truncate on small screens */}
              <h1 className="text-base sm:text-lg md:text-xl font-semibold text-[#1a1a1a] dark:text-white truncate">
                {title || "PodoAdmin"}
              </h1>
            </div>

            {/* Right side actions - Dock con efecto de magnificación */}
            <Dock
              iconMagnification={55}
              iconDistance={90}
              className="h-12 bg-white/80 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 shadow-sm"
            >
              <DockIcon className="!bg-transparent hover:!bg-gray-100 dark:hover:!bg-gray-700">
                <AnimatedThemeToggler className="!h-9 !w-9 !min-w-0 !min-h-0 !p-0 !bg-transparent !hover:bg-transparent" />
              </DockIcon>
              <DockIcon className="!bg-transparent hover:!bg-gray-100 dark:hover:!bg-gray-700">
                <NotificationsBell />
              </DockIcon>
              <DockIcon className="!bg-transparent hover:!bg-gray-100 dark:hover:!bg-gray-700">
                <SettingsButton />
              </DockIcon>
            </Dock>
          </div>
        </header>

        {/* Page content - scroll interno, fondo gris oscuro en dark mode */}
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8 pb-safe bg-gray-50 dark:bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  );
};
