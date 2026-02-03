import { useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "./sidebar";
import { useLanguage } from "../../contexts/language-context";
import { useAuth } from "../../contexts/auth-context";
import { usePermissions } from "../../hooks/use-permissions";
import { NotificationsBell } from "../notifications-bell";
import { SettingsButton } from "../settings-button";
import { 
  initializeUserCredits, 
  getUserCredits,
  getClinicAvailableCredits,
  getClinicCredits,
  initializeClinicCredits,
} from "../../lib/storage";

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  showCredits?: boolean;
  credits?: { monthly?: number; extra?: number; monthlyCredits?: number; extraCredits?: number };
}

const getCreditsColorClasses = (percentage: number, total: number, isClinicAdmin: boolean = false) => {
  if (total === 0) {
    return {
      bg: "bg-red-100",
      text: "text-red-700",
      icon: "text-red-600"
    };
  }
  
  // Same logic for both: yellow if percentage <= 10%, green if > 10%, red if 0
  // For clinic_admin, percentage is based on pool available/total pool
  // For others, percentage is based on monthly credits remaining/initial monthly
  if (percentage <= 10) {
    return {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      icon: "text-yellow-600"
    };
  }
  return {
    bg: "bg-green-100",
    text: "text-green-700",
    icon: "text-green-600"
  };
};

export const MainLayout = ({ children, title, showCredits = true, credits: propCredits }: MainLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isClinicAdmin, isReceptionist } = usePermissions();
  const [, setLocation] = useLocation();
  
  // Real-time credits state - fetched from localStorage
  const [liveCredits, setLiveCredits] = useState<{ monthlyCredits: number; extraCredits: number }>({ monthlyCredits: 0, extraCredits: 0 });
  const [clinicAvailableCredits, setClinicAvailableCredits] = useState(0);
  const [clinicTotalCredits, setClinicTotalCredits] = useState(0);

  // Function to fetch current credits from storage
  const refreshCredits = useCallback(() => {
    if (user?.id) {
      if (isClinicAdmin && user.clinicId) {
        // For clinic_admin, get clinic pool credits
        const clinicId = user.clinicId;
        let clinicCredits = getClinicCredits(clinicId);
        if (!clinicCredits) {
          clinicCredits = initializeClinicCredits(clinicId, 500);
        }
        const available = getClinicAvailableCredits(clinicId);
        setClinicAvailableCredits(available);
        setClinicTotalCredits(clinicCredits.totalCredits);
      } else {
        // For other users, get personal credits
        const currentCredits = getUserCredits(user.id);
        setLiveCredits(currentCredits);
      }
    }
  }, [user?.id, user?.clinicId, isClinicAdmin]);

  // Safety check: ensure credits are initialized when component mounts or user changes
  useEffect(() => {
    if (user && user.id) {
      initializeUserCredits(user.id, user.role);
      refreshCredits();
    }
  }, [user, refreshCredits]);

  // Listen for localStorage changes to update credits in real-time
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes("credits")) {
        refreshCredits();
      }
    };

    // Listen for custom credit update events (for same-tab updates)
    const handleCreditUpdate = () => {
      refreshCredits();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("creditsUpdated", handleCreditUpdate);
    
    // Also set up an interval to check for updates (fallback for same-tab changes)
    const intervalId = setInterval(refreshCredits, 2000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("creditsUpdated", handleCreditUpdate);
      clearInterval(intervalId);
    };
  }, [refreshCredits]);

  // Default initial monthly credits based on role
  const getInitialMonthlyCredits = () => {
    if (!user) return 250;
    switch (user.role) {
      case "super_admin": return 1000;
      case "clinic_admin": return 500;
      case "admin": return 300;
      case "podiatrist": return 250;
      case "receptionist": return 0;
      default: return 250;
    }
  };

  const initialMonthlyCredits = getInitialMonthlyCredits();
  
  // For clinic_admin, use clinic pool credits; for others, use personal credits
  const monthlyCredits = isClinicAdmin 
    ? 0 
    : (liveCredits.monthlyCredits || (propCredits?.monthly ?? propCredits?.monthlyCredits ?? 0));
  const extraCredits = isClinicAdmin 
    ? 0 
    : (liveCredits.extraCredits || (propCredits?.extra ?? propCredits?.extraCredits ?? 0));
  
  // Total credits: clinic pool for clinic_admin, personal for others
  const totalCredits = isClinicAdmin 
    ? clinicAvailableCredits 
    : (monthlyCredits + extraCredits);
  
  // Calculate percentage: for clinic_admin use pool percentage, for others use monthly percentage
  const monthlyPercentage = isClinicAdmin 
    ? (clinicTotalCredits > 0 ? (clinicAvailableCredits / clinicTotalCredits) * 100 : 0)
    : (initialMonthlyCredits > 0 ? (monthlyCredits / initialMonthlyCredits) * 100 : 0);
  const colorClasses = getCreditsColorClasses(monthlyPercentage, totalCredits, isClinicAdmin);

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
              {/* Notifications Bell */}
              <NotificationsBell />

              {/* Settings Button */}
              <SettingsButton />

              {/* Credits indicator - simplified on mobile (no créditos para recepcionistas) */}
              {showCredits && !isReceptionist && (
                <button
                  onClick={() => setLocation(user?.role === "super_admin" ? "/credits" : "/dashboard")}
                  className={`group relative flex items-center justify-center w-10 h-10 sm:w-10 sm:h-10 rounded-full transition-all hover:scale-105 active:scale-95 cursor-pointer min-w-[44px] min-h-[44px] ${colorClasses.bg}`}
                  title={isClinicAdmin 
                    ? `Créditos disponibles en pool: ${totalCredits}` 
                    : `${t.credits.monthly}: ${monthlyCredits} / ${t.credits.extra}: ${extraCredits} / Total: ${totalCredits}`}
                  aria-label={`Créditos: ${totalCredits}`}
                >
                  <svg className={`w-5 h-5 ${colorClasses.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {/* Credit count badge on mobile */}
                  <span className={`absolute -bottom-1 -right-1 text-[10px] font-bold ${colorClasses.text} bg-white rounded-full px-1 min-w-[18px] text-center shadow-sm md:hidden`}>
                    {totalCredits}
                  </span>
                  {/* Tooltip on hover - desktop only */}
                  <div className="hidden md:block absolute top-full mt-2 right-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="bg-[#1a1a1a] text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {isClinicAdmin ? (
                          <span className="font-semibold">Créditos disponibles en pool: {totalCredits}</span>
                        ) : (
                          <>
                            <span>{t.credits.monthly}: {monthlyCredits}</span>
                            <span>{t.credits.extra}: {extraCredits}</span>
                            <span className="font-semibold border-t border-gray-600 pt-1 mt-1">Total: {totalCredits}</span>
                          </>
                        )}
                      </div>
                      <div className="absolute -top-1 right-4 w-2 h-2 bg-[#1a1a1a] rotate-45"></div>
                    </div>
                  </div>
                </button>
              )}
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
