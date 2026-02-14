import { useState, ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { NotificationsBell } from "../notifications-bell";
import { SettingsButton } from "../settings-button";

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
}

export const MainLayout = ({ children, title }: MainLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-dvh min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content area */}
      <div className="md:pl-72">
        {/* Top header - responsive */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 safe-area-top">
          <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8 h-14 sm:h-16">
            {/* Left side - menu button and title */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {/* Mobile menu button - touch optimized */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 -ml-1 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
                aria-label="Abrir menú"
              >
                <svg className="w-6 h-6 text-[#1a1a1a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Page title - truncate on small screens */}
              <h1 className="text-base sm:text-lg md:text-xl font-semibold text-[#1a1a1a] truncate">
                {title || "PodoAdmin"}
              </h1>
            </div>

            {/* Right side actions - responsive layout */}
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
              <NotificationsBell />
              <SettingsButton />
            </div>
          </div>
        </header>

        {/* Page content - responsive padding */}
        <main className="p-3 sm:p-4 md:p-6 lg:p-8 pb-safe">
          {children}
        </main>
      </div>
    </div>
  );
};
