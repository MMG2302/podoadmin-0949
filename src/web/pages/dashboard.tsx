import { useEffect, useMemo, useState } from "react";
import { Route, Switch, Link, Redirect, useLocation } from "wouter";
import {
  Users,
  Stethoscope,
  Building2,
  UserCircle,
  CalendarCheck,
  Settings,
  UserPlus,
  Building,
  Calendar,
  FileText,
  Shield,
  MapPin,
  CalendarClock,
  Percent,
  Wallet,
  Banknote,
  UserRoundPlus,
  UserX,
} from "lucide-react";
import { MainLayout } from "../components/layout/main-layout";
import { ClinicalRoleDashboardBento, RoleDashboardBento, type StatItem } from "../components/ui/bento-grid";
import { useLanguage } from "../contexts/language-context";
import { useAuth, getPostLoginPath, hasActiveSystemAccess, isClinicalAppPath } from "../contexts/auth-context";
import { usePermissions } from "../hooks/use-permissions";
import { useEntitlements } from "../hooks/use-entitlements";
import { useClinicalDashboardSnapshot } from "../hooks/use-clinical-dashboard-snapshot";
import { api } from "../lib/api-client";
import { semanticChipSuccessClass, semanticChipWarningClass } from "../lib/form-field-classes";
import { formatCheckoutAmount } from "../types/checkout-handoff";
import PatientsPage from "./patients-page";
import SessionsPage from "./sessions-page";
import SettingsPage from "./settings-page";
import AuditLogPage from "./audit-log-page";
import SecurityMetricsPage from "./security-metrics-page";
import SponsoredAnnouncementsPage from "./sponsored-announcements-page";
import UsersManagementPage from "./users-page";
import ClinicManagementPage from "./clinic-page";
import NotificationsPage from "./notifications-page";
import CalendarPage from "./calendar-page";
import MessagesPage from "./messages-page";
import SupportPage from "./support-page";
import WhatsAppMessagesPage from "./whatsapp-messages-page";
import ClinicalToolsPage from "./clinical-tools-page";
import WhatsAppCampaignsPage from "./whatsapp-campaigns-page";
import BillingPage from "./billing-page";
import CheckoutPage from "./checkout-page";

// Super Admin Dashboard - focused on Users, Settings
const SuperAdminDashboard = () => {
  const { t } = useLanguage();
  const { user, users, ensureVisibleUsers } = useAuth();

  useEffect(() => {
    void ensureVisibleUsers();
  }, [ensureVisibleUsers]);

  const allUsers = users;

  const podiatrists = allUsers.filter(u => u.role === "podiatrist");
  const clinicAdmins = allUsers.filter(u => u.role === "clinic_admin");

  return (
    <MainLayout title={t.dashboard.title}>
      <RoleDashboardBento
        welcomeTitle={<>{t.auth.welcomeBack}, <span className="font-semibold">{user?.name}</span></>}
        welcomeDescription={t.roles.superAdminDesc}
        statItems={[
          { Icon: Users, label: t.nav.users, value: allUsers.length.toString(), path: "/users" },
          { Icon: Stethoscope, label: t.dashboard.podiatrists, value: podiatrists.length.toString(), path: "/users" },
          { Icon: Building2, label: t.dashboard.clinicAdmins, value: clinicAdmins.length.toString(), path: "/users" },
        ]}
        actionItems={[
          { Icon: Users, name: t.nav.users, description: t.dashboard.actions.usersDesc, href: "/users" },
          { Icon: Settings, name: t.settings.title, description: t.dashboard.actions.settingsDesc, href: "/settings" },
          { Icon: Shield, name: t.nav.securityMetrics, description: t.dashboard.actions.securityDesc, href: "/security-metrics" },
          { Icon: MapPin, name: t.dashboard.sponsoredAnnouncements, description: t.dashboard.actions.sponsoredDesc, href: "/sponsored-announcements" },
        ]}
      >
        {/* Users Overview - full width */}
        <div className="bg-brand-surface rounded-xl border border-brand-border overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-brand-ink">{t.dashboard.systemUsers}</h3>
            <Link href="/users" className="text-sm text-brand-muted hover:text-brand-ink dark:hover:text-white transition-colors">
              {t.common.seeAll}
            </Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {allUsers.slice(0, 5).map((u) => {
              const roleLabel = {
                super_admin: t.roles.superAdmin,
                clinic_admin: t.roles.clinicAdmin,
                admin: t.roles.admin,
                podiatrist: t.roles.podiatrist,
              }[u.role];
              
              return (
                <div key={u.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="w-10 h-10 bg-brand-canvas rounded-full flex items-center justify-center">
                    <span className="font-medium text-brand-ink">
                      {u.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-brand-ink">{u.name}</p>
                    <p className="text-xs text-brand-muted">{u.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    u.role === "super_admin" ? "bg-brand-ink text-brand-ink-fg" :
                    u.role === "clinic_admin" ? "bg-blue-100 text-blue-700" :
                    u.role === "admin" ? "bg-orange-100 text-orange-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {roleLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </RoleDashboardBento>
    </MainLayout>
  );
};

function formatRelativeActivity(
  dateStr: string,
  labels: {
    relativeMinutesAgo: string;
    relativeHoursAgo: string;
    relativeYesterday: string;
    relativeDaysAgo: string;
  }
) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return labels.relativeMinutesAgo;
  if (diffHours < 24) return labels.relativeHoursAgo.replace("{n}", String(diffHours));
  if (diffDays === 1) return labels.relativeYesterday;
  return labels.relativeDaysAgo.replace("{n}", String(diffDays));
}

// Podiatrist Dashboard - métricas de agenda, cobros y demografía
const PodiatristDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { has: hasFeature } = useEntitlements();
  const hasAgendaAnalytics = hasFeature("agenda_analytics");
  const hasCheckoutAnalytics = hasFeature("checkout_analytics");
  const canCheckout = hasPermission("view_checkout_handoffs");
  const { overview, metrics, demographics, analytics } = useClinicalDashboardSnapshot({
    enabled: Boolean(user?.id),
    includeCheckout: canCheckout,
  });

  const recentSessions = overview?.recentSessions ?? [];
  const currency = analytics?.currency ?? "MXN";

  const statItems = useMemo((): StatItem[] => {
    const items: StatItem[] = [
      {
        Icon: UserCircle,
        label: t.dashboard.totalPatients,
        value: String(overview?.patientCount ?? 0),
        path: "/patients",
      },
      {
        Icon: CalendarCheck,
        label: t.dashboard.sessionsThisMonth,
        value: String(overview?.sessionsThisMonth ?? 0),
        path: "/sessions",
      },
      {
        Icon: CalendarClock,
        label: t.dashboard.attendedAppointments,
        value: String(metrics?.totals.attended ?? 0),
        path: "/calendar",
        hint: t.dashboard.last30Days,
        locked: !hasAgendaAnalytics,
      },
      {
        Icon: Percent,
        label: t.dashboard.agendaOccupancy,
        value: `${Math.round(metrics?.occupancy.percent ?? 0)}%`,
        path: "/calendar",
        hint: t.dashboard.last30Days,
        locked: !hasAgendaAnalytics,
      },
    ];

    if (canCheckout) {
      items.push(
        {
          Icon: Wallet,
          label: t.dashboard.salesThisMonth,
          value: formatCheckoutAmount(analytics?.sales.currentTotalCents ?? 0, currency),
          path: "/checkout",
          locked: !hasCheckoutAnalytics,
        },
        {
          Icon: Banknote,
          label: t.dashboard.pendingCollections,
          value: formatCheckoutAmount(analytics?.collections.pendingTotalCents ?? 0, currency),
          path: "/checkout",
          hint:
            analytics?.collections.pendingCount != null
              ? String(analytics.collections.pendingCount)
              : undefined,
          locked: !hasCheckoutAnalytics,
        }
      );
    } else {
      items.push(
        {
          Icon: UserRoundPlus,
          label: t.dashboard.newPatients,
          value: String(demographics?.new ?? 0),
          path: "/patients",
        },
        {
          Icon: UserX,
          label: t.dashboard.inactivePatients,
          value: String(demographics?.inactive3m ?? 0),
          path: "/patients",
        }
      );
    }

    return items;
  }, [analytics, canCheckout, currency, demographics, metrics, overview, t, hasAgendaAnalytics, hasCheckoutAnalytics]);

  return (
    <MainLayout title={t.dashboard.title}>
      <ClinicalRoleDashboardBento
        welcomeTitle={<>{t.auth.welcomeBack}, <span className="font-semibold">{user?.name}</span></>}
        welcomeDescription={t.roles.podiatristDesc}
        statItems={statItems}
        actionItems={[
          { Icon: UserPlus, name: t.patients.addPatient, description: t.dashboard.actions.addPatientDesc, href: "/patients" },
          { Icon: FileText, name: t.sessions.newSession, description: t.dashboard.actions.newSessionDesc, href: "/sessions" },
          { Icon: Calendar, name: t.calendar.title, description: t.dashboard.actions.calendarDesc, href: "/calendar" },
        ]}
        gridClassName="md:grid-cols-2 lg:grid-cols-3"
      >
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-brand-ink">{t.dashboard.recentActivity}</h3>
            <Link href="/sessions" className="text-sm text-brand-muted hover:text-brand-ink dark:hover:text-white transition-colors">
              {t.common.seeAllShort}
            </Link>
          </div>
          <div className="bg-brand-surface rounded-xl border border-brand-border divide-y divide-gray-50 dark:divide-gray-800">
            {recentSessions.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-brand-muted">{t.dashboard.noRecentActivity}</p>
              </div>
            ) : (
              recentSessions.map((session) => (
                <Link key={session.id} href={`/sessions?patient=${session.patientId}`}>
                  <div className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      session.status === "completed"
                        ? "bg-green-100 dark:bg-green-900/30"
                        : "bg-yellow-100 dark:bg-yellow-900/30"
                    }`}>
                      <svg className={`w-5 h-5 ${
                        session.status === "completed"
                          ? "text-semantic-success"
                          : "text-yellow-600 dark:text-yellow-400"
                      }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {session.status === "completed" ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        )}
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-brand-ink">
                        {session.patientName ?? t.dashboard.patientFallback} -{" "}
                        {session.status === "completed"
                          ? t.dashboard.sessionCompletedActivity
                          : t.dashboard.draftActivity}
                      </p>
                      <p className="text-xs text-brand-muted">{formatRelativeActivity(session.createdAt, t.dashboard)}</p>
                    </div>
                    <span className={
                      session.status === "completed"
                        ? semanticChipSuccessClass
                        : semanticChipWarningClass
                    }>
                      {session.status === "completed" ? t.sessions.completed : t.sessions.draft}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </ClinicalRoleDashboardBento>
    </MainLayout>
  );
};

// Admin (Support) Dashboard
const AdminDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <MainLayout title={t.dashboard.title}>
      <RoleDashboardBento
        welcomeTitle={<>{t.auth.welcomeBack}, <span className="font-semibold">{user?.name}</span></>}
        welcomeDescription={t.roles.adminDesc}
        actionItems={[
          { Icon: Users, name: t.nav.users, description: t.dashboard.actions.usersDesc, href: "/users" },
          { Icon: Settings, name: t.settings.title, description: t.dashboard.actions.settingsDesc, href: "/settings" },
        ]}
      />
    </MainLayout>
  );
};

// Clinic Admin Dashboard
const ClinicAdminDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { has: hasFeature } = useEntitlements();
  const hasAgendaAnalytics = hasFeature("agenda_analytics");
  const hasCheckoutAnalytics = hasFeature("checkout_analytics");
  const canCheckout = hasPermission("view_checkout_handoffs");
  const { overview, metrics, demographics, analytics, clinicTotals } = useClinicalDashboardSnapshot({
    enabled: Boolean(user?.id),
    includeCheckout: canCheckout,
    includeClinicStats: true,
  });

  const currency = analytics?.currency ?? "MXN";
  const patientCount = clinicTotals?.patients ?? overview?.patientCount ?? 0;
  const sessionsThisMonth = clinicTotals?.sessionsThisMonth ?? overview?.sessionsThisMonth ?? 0;

  const statItems = useMemo((): StatItem[] => {
    const items: StatItem[] = [
      {
        Icon: UserCircle,
        label: t.dashboard.totalPatients,
        value: String(patientCount),
        path: "/patients",
      },
      {
        Icon: CalendarCheck,
        label: t.dashboard.sessionsThisMonth,
        value: String(sessionsThisMonth),
        path: "/sessions",
      },
      {
        Icon: Stethoscope,
        label: t.dashboard.podiatristsCount,
        value: String(clinicTotals?.podiatrists ?? 0),
        path: "/clinic",
      },
      {
        Icon: CalendarClock,
        label: t.dashboard.attendedAppointments,
        value: String(metrics?.totals.attended ?? 0),
        path: "/calendar",
        hint: t.dashboard.last30Days,
        locked: !hasAgendaAnalytics,
      },
      {
        Icon: Percent,
        label: t.dashboard.agendaOccupancy,
        value: `${Math.round(metrics?.occupancy.percent ?? 0)}%`,
        path: "/calendar",
        hint: t.dashboard.last30Days,
        locked: !hasAgendaAnalytics,
      },
    ];

    if (canCheckout) {
      items.push({
        Icon: Wallet,
        label: t.dashboard.salesThisMonth,
        value: formatCheckoutAmount(analytics?.sales.currentTotalCents ?? 0, currency),
        path: "/checkout",
        locked: !hasCheckoutAnalytics,
      });
    } else {
      items.push({
        Icon: UserRoundPlus,
        label: t.dashboard.newPatients,
        value: String(demographics?.new ?? 0),
        path: "/patients",
      });
    }

    return items;
  }, [
    analytics,
    canCheckout,
    clinicTotals,
    currency,
    demographics,
    metrics,
    patientCount,
    sessionsThisMonth,
    t,
    hasAgendaAnalytics,
    hasCheckoutAnalytics,
  ]);

  return (
    <MainLayout title={t.dashboard.title}>
      <ClinicalRoleDashboardBento
        welcomeTitle={<>{t.auth.welcomeBack}, <span className="font-semibold">{user?.name}</span></>}
        welcomeDescription={t.roles.clinicAdminDesc}
        statItems={statItems}
        actionItems={[
          { Icon: Building, name: t.nav.clinicManagement, description: t.dashboard.actions.clinicDesc, href: "/clinic" },
          { Icon: UserCircle, name: t.nav.patients, description: t.dashboard.actions.patientsDesc, href: "/patients" },
          { Icon: Calendar, name: t.calendar.title, description: t.dashboard.actions.calendarDesc, href: "/calendar" },
        ]}
        gridClassName="md:grid-cols-2 lg:grid-cols-3"
      />
    </MainLayout>
  );
};

// Receptionist Dashboard - pacientes, agenda y cobros pendientes
const ReceptionistDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { has: hasFeature } = useEntitlements();
  const hasAgendaAnalytics = hasFeature("agenda_analytics");
  const hasCheckoutAnalytics = hasFeature("checkout_analytics");
  const canCheckout = hasPermission("view_checkout_handoffs");
  const [clinic, setClinic] = useState<{ clinicName: string } | null>(null);
  const [assignedPodiatrists, setAssignedPodiatrists] = useState<{ id: string; name: string }[]>([]);
  const { overview, metrics, demographics, analytics } = useClinicalDashboardSnapshot({
    enabled: Boolean(user?.id),
    includeCheckout: canCheckout,
  });

  useEffect(() => {
    if (!user?.id) return;
    api
      .get<{ success?: boolean; assignedPodiatristIds?: string[]; podiatrists?: { id: string; name: string }[] }>(
        `/receptionists/assigned-podiatrists/${user.id}`
      )
      .then((r) => {
        if (r.success && Array.isArray(r.data?.podiatrists)) {
          setAssignedPodiatrists(r.data.podiatrists);
        }
      });
    if (user?.clinicId) {
      api.get<{ success?: boolean; clinic?: { clinicName: string } }>(`/clinics/${user.clinicId}`).then((r) => {
        if (r.success && r.data?.clinic) setClinic(r.data.clinic);
      });
    }
  }, [user?.id, user?.clinicId]);

  const currency = analytics?.currency ?? "MXN";

  const welcomeDescription = (
    <>
      <span className="text-gray-400">{t.roles.receptionistDesc}</span>
      {clinic && (
        <p className="text-gray-300 text-sm mt-1">
          {t.dashboard.assignedClinic}: <span className="font-semibold">{clinic.clinicName}</span>
        </p>
      )}
      {assignedPodiatrists.length > 0 && (
        <p className="text-gray-300 text-sm mt-1">
          {t.dashboard.assignedPodiatrists}:{" "}
          <span className="font-semibold">{assignedPodiatrists.map((p) => p.name).join(", ")}</span>
        </p>
      )}
    </>
  );

  const statItems = useMemo((): StatItem[] => {
    const items: StatItem[] = [
      {
        Icon: UserCircle,
        label: t.dashboard.totalPatients,
        value: String(overview?.patientCount ?? 0),
        path: "/patients",
      },
      {
        Icon: CalendarClock,
        label: t.dashboard.attendedAppointments,
        value: String(metrics?.totals.attended ?? 0),
        path: "/calendar",
        hint: t.dashboard.last30Days,
        locked: !hasAgendaAnalytics,
      },
      {
        Icon: Percent,
        label: t.dashboard.agendaOccupancy,
        value: `${Math.round(metrics?.occupancy.percent ?? 0)}%`,
        path: "/calendar",
        hint: t.dashboard.last30Days,
        locked: !hasAgendaAnalytics,
      },
    ];

    if (canCheckout) {
      items.push(
        {
          Icon: Banknote,
          label: t.dashboard.pendingCollections,
          value: formatCheckoutAmount(analytics?.collections.pendingTotalCents ?? 0, currency),
          path: "/checkout",
          hint:
            analytics?.collections.pendingCount != null
              ? String(analytics.collections.pendingCount)
              : undefined,
          locked: !hasCheckoutAnalytics,
        },
        {
          Icon: Wallet,
          label: t.dashboard.salesThisMonth,
          value: formatCheckoutAmount(analytics?.sales.currentTotalCents ?? 0, currency),
          path: "/checkout",
          locked: !hasCheckoutAnalytics,
        },
        {
          Icon: UserRoundPlus,
          label: t.dashboard.newPatients,
          value: String(demographics?.new ?? 0),
          path: "/patients",
        }
      );
    } else {
      items.push(
        {
          Icon: UserRoundPlus,
          label: t.dashboard.newPatients,
          value: String(demographics?.new ?? 0),
          path: "/patients",
        },
        {
          Icon: UserX,
          label: t.dashboard.inactivePatients,
          value: String(demographics?.inactive3m ?? 0),
          path: "/patients",
        },
        {
          Icon: Stethoscope,
          label: t.dashboard.podiatristsCount,
          value: String(assignedPodiatrists.length),
          path: "/settings",
        }
      );
    }

    return items;
  }, [analytics, assignedPodiatrists.length, canCheckout, currency, demographics, metrics, overview, t, hasAgendaAnalytics, hasCheckoutAnalytics]);

  return (
    <MainLayout title={t.dashboard.title}>
      <ClinicalRoleDashboardBento
        welcomeTitle={<>{t.auth.welcomeBack}, <span className="font-semibold">{user?.name}</span></>}
        welcomeDescription={welcomeDescription}
        statItems={statItems}
        actionItems={[
          { Icon: UserPlus, name: t.patients.addPatient, description: t.dashboard.actions.patientsDesc, href: "/patients" },
          { Icon: Calendar, name: t.calendar.title, description: t.dashboard.actions.calendarDesc, href: "/calendar" },
          ...(canCheckout
            ? [{ Icon: Wallet, name: t.nav.checkout, description: t.dashboard.actions.checkoutDesc, href: "/checkout" }]
            : [{ Icon: Settings, name: t.settings.title, description: t.dashboard.actions.settingsDesc, href: "/settings" }]),
        ]}
        gridClassName="md:grid-cols-2 lg:grid-cols-3"
      />
    </MainLayout>
  );
};

// Dashboard Home - routes to appropriate dashboard based on role
const DashboardHome = () => {
  const { isSuperAdmin, isClinicAdmin, isAdmin, isPodiatrist, isReceptionist } = usePermissions();

  if (isSuperAdmin) return <SuperAdminDashboard />;
  if (isClinicAdmin) return <ClinicAdminDashboard />;
  if (isAdmin) return <AdminDashboard />;
  if (isReceptionist) return <ReceptionistDashboard />;
  return <PodiatristDashboard />;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [location] = useLocation();
  const { isSuperAdmin, isClinicAdmin, isAdmin, isPodiatrist, isReceptionist, hasPermission } = usePermissions();

  if (user && !hasActiveSystemAccess(user) && isClinicalAppPath(location)) {
    return <Redirect to={getPostLoginPath(user)} />;
  }

  return (
    <Switch>
      <Route path="/" component={DashboardHome} />
      
      {/* Super Admin routes */}
      {isSuperAdmin && <Route path="/users" component={UsersManagementPage} />}
      {isSuperAdmin && <Route path="/messages" component={MessagesPage} />}
      {isSuperAdmin && <Route path="/support" component={SupportPage} />}
      {isSuperAdmin && <Route path="/audit-log" component={AuditLogPage} />}
      {isSuperAdmin && <Route path="/security-metrics" component={SecurityMetricsPage} />}
      {isSuperAdmin && <Route path="/sponsored-announcements" component={SponsoredAnnouncementsPage} />}
      
      {/* Admin routes */}
      {isAdmin && <Route path="/users" component={UsersManagementPage} />}
      {isAdmin && <Route path="/support" component={SupportPage} />}
      {/* Rutas clínicas compartidas (evita que /patients caiga en DashboardHome) */}
      {user && <Route path="/patients" component={PatientsPage} />}
      {user && <Route path="/patients/:id" component={PatientsPage} />}
      {user && <Route path="/sessions" component={SessionsPage} />}
      {user && <Route path="/sessions/:id" component={SessionsPage} />}
      {user && <Route path="/calendar" component={CalendarPage} />}
      {hasPermission("view_checkout_handoffs") && (
        <Route path="/checkout" component={CheckoutPage} />
      )}

      {/* Clinic Admin routes */}
      {isClinicAdmin && <Route path="/clinic" component={ClinicManagementPage} />}
      {isClinicAdmin && <Route path="/whatsapp-messages" component={WhatsAppMessagesPage} />}
      {isClinicAdmin && <Route path="/whatsapp-campaigns" component={WhatsAppCampaignsPage} />}
      {isClinicAdmin && <Route path="/clinical-tools" component={ClinicalToolsPage} />}
      
      {/* Podiatrist routes */}
      {isPodiatrist && <Route path="/whatsapp-messages" component={WhatsAppMessagesPage} />}
      {isPodiatrist && <Route path="/whatsapp-campaigns" component={WhatsAppCampaignsPage} />}
      {isPodiatrist && <Route path="/clinical-tools" component={ClinicalToolsPage} />}

      {/* Redirección legacy /billing → Configuración → Facturación */}
      {user && <Route path="/billing" component={BillingPage} />}

      {/* Recepción: mensajes WhatsApp Web (+ API si el podólogo lo asignó) */}
      {isReceptionist && hasPermission("view_whatsapp_web") && (
        <>
          <Route path="/whatsapp-messages" component={WhatsAppMessagesPage} />
          <Route path="/whatsapp-campaigns" component={WhatsAppCampaignsPage} />
        </>
      )}
      
      {/* Common routes */}
      <Route path="/settings" component={SettingsPage} />
      <Route path="/notifications" component={NotificationsPage} />
      
      <Route component={DashboardHome} />
    </Switch>
  );
};

export default Dashboard;
