import { useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "./sidebar";
import { useLanguage } from "../../contexts/language-context";
import { useAuth } from "../../contexts/auth-context";
import { NotificationsBell } from "../notifications-bell";
import { SettingsButton } from "../settings-button";
import { initializeUserCredits } from "../../lib/storage";

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  showCredits?: boolean;
  credits?: { monthly: number; extra: number };
}

const getCreditsColorClasses = (percentage: number, total: number) => {
  if (total === 0) {
    return {
      bg: "bg-red-100",
      text: "text-red-700",
      icon: "text-red-600"
    };
  }
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

export const MainLayout = ({ children, title, showCredits = true, credits }: MainLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useLanguage();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Safety check: ensure credits are initialized when component mounts or user changes
  useEffect(() => {
    if (user && user.id) {
      initializeUserCredits(user.id, user.role);
    }
  }, [user]);

  // Default initial monthly credits based on role
  const getInitialMonthlyCredits = () => {
    if (!user) return 250;
    switch (user.role) {
      case "super_admin": return 1000;
      case "clinic_admin": return 500;
      case "admin": return 300;
      case "podiatrist": return 250;
      default: return 250;
    }
  };

  const initialMonthlyCredits = getInitialMonthlyCredits();
  const monthlyCredits = credits?.monthly ?? 0;
  const extraCredits = credits?.extra ?? 0;
  const totalCredits = monthlyCredits + extraCredits;
  const monthlyPercentage = initialMonthlyCredits > 0 ? (monthlyCredits / initialMonthlyCredits) * 100 : 0;
  const colorClasses = getCreditsColorClasses(monthlyPercentage, totalCredits);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content area */}
      <div className="lg:pl-72">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-[#1a1a1a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Page title */}
            <h1 className="text-xl font-semibold text-[#1a1a1a] hidden lg:block">
              {title}
            </h1>

            {/* Mobile title */}
            <span className="text-lg font-semibold text-[#1a1a1a] lg:hidden">
              {title || "PodoAdmin"}
            </span>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              {/* Notifications Bell */}
              <NotificationsBell />

              {/* Settings Button */}
              <SettingsButton />

              {/* Credits display */}
              {showCredits && (
                <button
                  onClick={() => setLocation(user?.role === "super_admin" ? "/credits" : "/dashboard")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:opacity-80 cursor-pointer ${colorClasses.bg}`}
                  title={`Monthly: ${monthlyCredits} / Extra: ${extraCredits}`}
                >
                  <svg className={`w-5 h-5 ${colorClasses.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm">
                    <span className={`font-semibold ${colorClasses.text}`}>{totalCredits}</span>
                    <span className={`ml-1 ${colorClasses.text} opacity-80`}>{t.credits.available}</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
