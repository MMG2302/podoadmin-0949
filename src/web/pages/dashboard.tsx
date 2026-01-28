import { useEffect, useState } from "react";
import { Route, Switch, Link } from "wouter";
import { MainLayout } from "../components/layout/main-layout";
import { useLanguage } from "../contexts/language-context";
import { useAuth } from "../contexts/auth-context";
import { usePermissions } from "../hooks/use-permissions";
import { api } from "../lib/api-client";
import PatientsPage from "./patients-page";
import SessionsPage from "./sessions-page";
import CreditsPage from "./credits-page";
import SettingsPage from "./settings-page";
import AuditLogPage from "./audit-log-page";
import UsersManagementPage from "./users-page";
import ClinicManagementPage from "./clinic-page";
import AdminCreditsPage from "./admin-credits-page";
import NotificationsPage from "./notifications-page";
import CalendarPage from "./calendar-page";
import MessagesPage from "./messages-page";
import DistributeCreditsPage from "./distribute-credits-page";

// Créditos por defecto para MainLayout hasta que cargue la API
const defaultCredits = { userId: "", monthlyCredits: 0, extraCredits: 0, reservedCredits: 0, lastMonthlyReset: "", monthlyRenewalAmount: 0 };

// Super Admin Dashboard - focused on Users, Credits, Settings
const SuperAdminDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [credits, setCredits] = useState(defaultCredits);
  const [allUsers, setAllUsers] = useState<{ id: string; name: string; email: string; role: string }[]>([]);
  const [totalCreditsInSystem, setTotalCreditsInSystem] = useState(0);
  const [creditsByUser, setCreditsByUser] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user?.id) return;
    api.get<{ success?: boolean; credits?: typeof defaultCredits }>("/credits/me").then((r) => {
      if (r.success && r.data?.credits) setCredits(r.data.credits as typeof defaultCredits);
    });
    api.get<{ success?: boolean; users?: { id: string; name: string; email: string; role: string }[] }>("/users").then((r) => {
      if (r.success && Array.isArray(r.data?.users)) setAllUsers(r.data.users);
    });
    api.get<{ success?: boolean; totalCreditsInSystem?: number; byUser?: Record<string, number> }>("/credits/summary").then((r) => {
      if (r.success) {
        if (typeof r.data?.totalCreditsInSystem === "number") setTotalCreditsInSystem(r.data.totalCreditsInSystem);
        if (r.data?.byUser && typeof r.data.byUser === "object") setCreditsByUser(r.data.byUser);
      }
    });
  }, [user?.id]);

  const podiatrists = allUsers.filter(u => u.role === "podiatrist");
  const clinicAdmins = allUsers.filter(u => u.role === "clinic_admin");

  const stats = [
    { label: t.nav.users, value: allUsers.length.toString(), path: "/users" },
    { label: "Podólogos", value: podiatrists.length.toString(), path: "/users" },
    { label: "Créditos en Sistema", value: totalCreditsInSystem.toString(), path: "/credits" },
  ];

  return (
    <MainLayout title={t.dashboard.title} credits={credits}>
      <div className="space-y-8">
        {/* Welcome */}
        <div className="bg-[#1a1a1a] rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="welcome-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#welcome-grid)" />
            </svg>
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-light mb-2">
              {t.auth.welcomeBack}, <span className="font-semibold">{user?.name}</span>
            </h2>
            <p className="text-gray-400">
              {t.roles.superAdminDesc}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div>
          <h3 className="text-lg font-semibold text-[#1a1a1a] mb-4">{t.dashboard.quickStats}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <Link key={index} href={stat.path}>
                <div className="bg-white rounded-xl p-6 border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer group">
                  <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                  <span className="text-3xl font-semibold text-[#1a1a1a] group-hover:text-[#1a1a1a]/80 transition-colors">
                    {stat.value}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions for Super Admin */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/users">
            <div className="bg-white rounded-xl p-5 border border-gray-100 hover:border-[#1a1a1a] transition-colors cursor-pointer group">
              <div className="w-10 h-10 bg-gray-100 group-hover:bg-[#1a1a1a] rounded-lg flex items-center justify-center mb-3 transition-colors">
                <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="font-medium text-[#1a1a1a]">{t.nav.users}</p>
              <p className="text-sm text-gray-500 mt-1">Gestionar usuarios y clínicas</p>
            </div>
          </Link>
          
          <Link href="/credits">
            <div className="bg-white rounded-xl p-5 border border-gray-100 hover:border-[#1a1a1a] transition-colors cursor-pointer group">
              <div className="w-10 h-10 bg-gray-100 group-hover:bg-[#1a1a1a] rounded-lg flex items-center justify-center mb-3 transition-colors">
                <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-medium text-[#1a1a1a]">{t.credits.title}</p>
              <p className="text-sm text-gray-500 mt-1">Gestión de créditos y Whop.io</p>
            </div>
          </Link>
          
          <Link href="/settings">
            <div className="bg-white rounded-xl p-5 border border-gray-100 hover:border-[#1a1a1a] transition-colors cursor-pointer group">
              <div className="w-10 h-10 bg-gray-100 group-hover:bg-[#1a1a1a] rounded-lg flex items-center justify-center mb-3 transition-colors">
                <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="font-medium text-[#1a1a1a]">{t.settings.title}</p>
              <p className="text-sm text-gray-500 mt-1">Configuración del sistema</p>
            </div>
          </Link>
        </div>

        {/* Users Overview */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#1a1a1a]">Usuarios del Sistema</h3>
            <Link href="/users" className="text-sm text-gray-500 hover:text-[#1a1a1a] transition-colors">
              Ver todos →
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
            {allUsers.slice(0, 5).map((u) => {
              const userCreditsDisplay = creditsByUser[u.id] ?? 0;
              const roleLabel = {
                super_admin: t.roles.superAdmin,
                clinic_admin: t.roles.clinicAdmin,
                admin: t.roles.admin,
                podiatrist: t.roles.podiatrist,
              }[u.role];
              
              return (
                <div key={u.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="font-medium text-[#1a1a1a]">
                      {u.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#1a1a1a]">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    u.role === "super_admin" ? "bg-[#1a1a1a] text-white" :
                    u.role === "clinic_admin" ? "bg-blue-100 text-blue-700" :
                    u.role === "admin" ? "bg-orange-100 text-orange-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {roleLabel}
                  </span>
                  {u.role === "podiatrist" && (
                    <span className="text-sm text-gray-500">
                      {userCreditsDisplay} créditos
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

// Tipos mínimos para pacientes/sesiones desde API
type PatientRow = { id: string; firstName: string; lastName: string; createdBy: string };
type SessionRow = { id: string; patientId: string; sessionDate: string; status: string; createdAt: string; createdBy: string };

// Podiatrist Dashboard - Patient and session focused (datos desde API)
const PodiatristDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [credits, setCredits] = useState(defaultCredits);
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    api.get<{ success?: boolean; credits?: typeof defaultCredits }>("/credits/me").then((r) => {
      if (r.success && r.data?.credits) setCredits(r.data.credits as typeof defaultCredits);
    });
    api.get<{ success?: boolean; patients?: PatientRow[] }>("/patients").then((r) => {
      if (r.success && Array.isArray(r.data?.patients)) setPatients(r.data.patients.filter((p: PatientRow) => p.createdBy === user?.id));
    });
    api.get<{ success?: boolean; sessions?: SessionRow[] }>("/sessions").then((r) => {
      if (r.success && Array.isArray(r.data?.sessions)) setSessions(r.data.sessions.filter((s: SessionRow) => s.createdBy === user?.id));
    });
  }, [user?.id]);

  const sessionsThisMonth = sessions.filter((s) => {
    const sessionDate = new Date(s.sessionDate);
    const now = new Date();
    return sessionDate.getMonth() === now.getMonth() && sessionDate.getFullYear() === now.getFullYear();
  });

  const creditsRemaining = credits.monthlyCredits + credits.extraCredits - credits.reservedCredits;
  const stats = [
    { label: t.dashboard.totalPatients, value: patients.length.toString(), path: "/patients" },
    { label: t.dashboard.sessionsThisMonth, value: sessionsThisMonth.length.toString(), path: "/sessions" },
    { label: t.dashboard.creditsRemaining, value: `${creditsRemaining}`, path: "/credits" },
  ];

  const recentSessions = sessions
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return "Hace unos minutos";
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    if (diffDays === 1) return "Ayer";
    return `Hace ${diffDays} días`;
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : "Paciente";
  };

  return (
    <MainLayout title={t.dashboard.title} credits={credits}>
      <div className="space-y-8">
        {/* Welcome */}
        <div className="bg-[#1a1a1a] rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="welcome-grid-pod" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#welcome-grid-pod)" />
            </svg>
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-light mb-2">
              {t.auth.welcomeBack}, <span className="font-semibold">{user?.name}</span>
            </h2>
            <p className="text-gray-400">
              {t.roles.podiatristDesc}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div>
          <h3 className="text-lg font-semibold text-[#1a1a1a] mb-4">{t.dashboard.quickStats}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <Link key={index} href={stat.path}>
                <div className="bg-white rounded-xl p-6 border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer group">
                  <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                  <span className="text-3xl font-semibold text-[#1a1a1a] group-hover:text-[#1a1a1a]/80 transition-colors">
                    {stat.value}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#1a1a1a]">{t.dashboard.recentActivity}</h3>
            <Link href="/sessions" className="text-sm text-gray-500 hover:text-[#1a1a1a] transition-colors">
              Ver todo →
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
            {recentSessions.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">{t.dashboard.noRecentActivity}</p>
              </div>
            ) : (
              recentSessions.map((session) => (
                <Link key={session.id} href={`/sessions?patient=${session.patientId}`}>
                  <div className="p-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      session.status === "completed" ? "bg-green-100" : "bg-yellow-100"
                    }`}>
                      <svg className={`w-5 h-5 ${session.status === "completed" ? "text-green-600" : "text-yellow-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {session.status === "completed" ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        )}
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#1a1a1a]">
                        {getPatientName(session.patientId)} - {session.status === "completed" ? "Sesión completada" : "Borrador"}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(session.createdAt)}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      session.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {session.status === "completed" ? t.sessions.completed : t.sessions.draft}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/patients">
            <div className="bg-white rounded-xl p-5 border border-gray-100 hover:border-[#1a1a1a] transition-colors cursor-pointer group">
              <div className="w-10 h-10 bg-gray-100 group-hover:bg-[#1a1a1a] rounded-lg flex items-center justify-center mb-3 transition-colors">
                <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <p className="font-medium text-[#1a1a1a]">{t.patients.addPatient}</p>
              <p className="text-sm text-gray-500 mt-1">Registrar nuevo paciente</p>
            </div>
          </Link>
          
          <Link href="/sessions">
            <div className="bg-white rounded-xl p-5 border border-gray-100 hover:border-[#1a1a1a] transition-colors cursor-pointer group">
              <div className="w-10 h-10 bg-gray-100 group-hover:bg-[#1a1a1a] rounded-lg flex items-center justify-center mb-3 transition-colors">
                <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-medium text-[#1a1a1a]">{t.sessions.newSession}</p>
              <p className="text-sm text-gray-500 mt-1">Iniciar consulta clínica</p>
            </div>
          </Link>
          
          <Link href="/credits">
            <div className="bg-white rounded-xl p-5 border border-gray-100 hover:border-[#1a1a1a] transition-colors cursor-pointer group">
              <div className="w-10 h-10 bg-gray-100 group-hover:bg-[#1a1a1a] rounded-lg flex items-center justify-center mb-3 transition-colors">
                <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-medium text-[#1a1a1a]">{t.credits.title}</p>
              <p className="text-sm text-gray-500 mt-1">Ver saldo y comprar</p>
            </div>
          </Link>
          
          <Link href="/settings">
            <div className="bg-white rounded-xl p-5 border border-gray-100 hover:border-[#1a1a1a] transition-colors cursor-pointer group">
              <div className="w-10 h-10 bg-gray-100 group-hover:bg-[#1a1a1a] rounded-lg flex items-center justify-center mb-3 transition-colors">
                <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="font-medium text-[#1a1a1a]">{t.settings.title}</p>
              <p className="text-sm text-gray-500 mt-1">Personalizar sistema</p>
            </div>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

// Admin (Support) Dashboard - créditos desde API
const AdminDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [credits, setCredits] = useState(defaultCredits);

  useEffect(() => {
    if (!user?.id) return;
    api.get<{ success?: boolean; credits?: typeof defaultCredits }>("/credits/me").then((r) => {
      if (r.success && r.data?.credits) setCredits(r.data.credits as typeof defaultCredits);
    });
  }, [user?.id]);

  return (
    <MainLayout title={t.dashboard.title} credits={credits}>
      <div className="space-y-8">
        {/* Welcome */}
        <div className="bg-[#1a1a1a] rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="welcome-grid-admin" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#welcome-grid-admin)" />
            </svg>
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-light mb-2">
              {t.auth.welcomeBack}, <span className="font-semibold">{user?.name}</span>
            </h2>
            <p className="text-gray-400">
              {t.roles.adminDesc}
            </p>
          </div>
        </div>

        {/* Quick Actions for Admin */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/users">
            <div className="bg-white rounded-xl p-5 border border-gray-100 hover:border-[#1a1a1a] transition-colors cursor-pointer group">
              <div className="w-10 h-10 bg-gray-100 group-hover:bg-[#1a1a1a] rounded-lg flex items-center justify-center mb-3 transition-colors">
                <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="font-medium text-[#1a1a1a]">{t.nav.users}</p>
              <p className="text-sm text-gray-500 mt-1">Ver usuarios del sistema</p>
            </div>
          </Link>
          
          <Link href="/credits">
            <div className="bg-white rounded-xl p-5 border border-gray-100 hover:border-[#1a1a1a] transition-colors cursor-pointer group">
              <div className="w-10 h-10 bg-gray-100 group-hover:bg-[#1a1a1a] rounded-lg flex items-center justify-center mb-3 transition-colors">
                <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-medium text-[#1a1a1a]">Ajustar Créditos</p>
              <p className="text-sm text-gray-500 mt-1">Compensar errores del sistema</p>
            </div>
          </Link>
          
          <Link href="/settings">
            <div className="bg-white rounded-xl p-5 border border-gray-100 hover:border-[#1a1a1a] transition-colors cursor-pointer group">
              <div className="w-10 h-10 bg-gray-100 group-hover:bg-[#1a1a1a] rounded-lg flex items-center justify-center mb-3 transition-colors">
                <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="font-medium text-[#1a1a1a]">{t.settings.title}</p>
              <p className="text-sm text-gray-500 mt-1">Configuración de cuenta</p>
            </div>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

// Clinic Admin Dashboard - créditos desde API
const ClinicAdminDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [credits, setCredits] = useState(defaultCredits);

  useEffect(() => {
    if (!user?.id) return;
    api.get<{ success?: boolean; credits?: typeof defaultCredits }>("/credits/me").then((r) => {
      if (r.success && r.data?.credits) setCredits(r.data.credits as typeof defaultCredits);
    });
  }, [user?.id]);

  return (
    <MainLayout title={t.dashboard.title} credits={credits}>
      <div className="space-y-8">
        {/* Welcome */}
        <div className="bg-[#1a1a1a] rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="welcome-grid-clinic" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#welcome-grid-clinic)" />
            </svg>
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-light mb-2">
              {t.auth.welcomeBack}, <span className="font-semibold">{user?.name}</span>
            </h2>
            <p className="text-gray-400">
              {t.roles.clinicAdminDesc}
            </p>
          </div>
        </div>

        {/* Quick Actions for Clinic Admin */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/clinic">
            <div className="bg-white rounded-xl p-5 border border-gray-100 hover:border-[#1a1a1a] transition-colors cursor-pointer group">
              <div className="w-10 h-10 bg-gray-100 group-hover:bg-[#1a1a1a] rounded-lg flex items-center justify-center mb-3 transition-colors">
                <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="font-medium text-[#1a1a1a]">{t.nav.clinicManagement}</p>
              <p className="text-sm text-gray-500 mt-1">Gestión de la clínica</p>
            </div>
          </Link>
          
          <Link href="/patients">
            <div className="bg-white rounded-xl p-5 border border-gray-100 hover:border-[#1a1a1a] transition-colors cursor-pointer group">
              <div className="w-10 h-10 bg-gray-100 group-hover:bg-[#1a1a1a] rounded-lg flex items-center justify-center mb-3 transition-colors">
                <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="font-medium text-[#1a1a1a]">{t.nav.patients}</p>
              <p className="text-sm text-gray-500 mt-1">Ver todos los pacientes</p>
            </div>
          </Link>
          
          <Link href="/sessions">
            <div className="bg-white rounded-xl p-5 border border-gray-100 hover:border-[#1a1a1a] transition-colors cursor-pointer group">
              <div className="w-10 h-10 bg-gray-100 group-hover:bg-[#1a1a1a] rounded-lg flex items-center justify-center mb-3 transition-colors">
                <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="font-medium text-[#1a1a1a]">{t.nav.clinicalSessions}</p>
              <p className="text-sm text-gray-500 mt-1">Ver todas las sesiones</p>
            </div>
          </Link>
          
          <Link href="/settings">
            <div className="bg-white rounded-xl p-5 border border-gray-100 hover:border-[#1a1a1a] transition-colors cursor-pointer group">
              <div className="w-10 h-10 bg-gray-100 group-hover:bg-[#1a1a1a] rounded-lg flex items-center justify-center mb-3 transition-colors">
                <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="font-medium text-[#1a1a1a]">{t.settings.title}</p>
              <p className="text-sm text-gray-500 mt-1">Configuración</p>
            </div>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

// Receptionist Dashboard - datos desde API (pacientes, clínica, podólogos asignados)
const ReceptionistDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [credits, setCredits] = useState(defaultCredits);
  const [allPatients, setAllPatients] = useState<{ createdBy: string }[]>([]);
  const [clinic, setClinic] = useState<{ clinicName: string } | null>(null);
  const [assignedPodiatrists, setAssignedPodiatrists] = useState<{ id: string; name: string }[]>([]);

  const assignedIds = user?.assignedPodiatristIds ?? [];
  const patientCount = allPatients.filter((p) => assignedIds.includes(p.createdBy)).length;

  useEffect(() => {
    if (!user?.id) return;
    api.get<{ success?: boolean; credits?: typeof defaultCredits }>("/credits/me").then((r) => {
      if (r.success && r.data?.credits) setCredits(r.data.credits as typeof defaultCredits);
    });
    api.get<{ success?: boolean; patients?: { createdBy: string }[] }>("/patients").then((r) => {
      if (r.success && Array.isArray(r.data?.patients)) setAllPatients(r.data.patients);
    });
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

  const stats = [
    { label: "Pacientes de podólogos asignados", value: patientCount.toString(), path: "/patients" },
  ];

  return (
    <MainLayout title={t.dashboard.title} credits={credits} showCredits={false}>
      <div className="space-y-8">
        <div className="bg-[#1a1a1a] rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-light mb-2">
              {t.auth.welcomeBack}, <span className="font-semibold">{user?.name}</span>
            </h2>
            <p className="text-gray-400">{t.roles.receptionistDesc}</p>
            {/* Información de asignación específica */}
            {clinic && (
              <p className="text-gray-300 text-sm mt-1">
                Clínica asignada: <span className="font-semibold">{clinic.clinicName}</span>
              </p>
            )}
            {assignedPodiatrists.length > 0 && (
              <p className="text-gray-300 text-sm mt-1">
                Podólogos asignados:{" "}
                <span className="font-semibold">
                  {assignedPodiatrists.map((p) => p.name).join(", ")}
                </span>
              </p>
            )}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#1a1a1a] mb-4">{t.dashboard.quickStats}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.map((stat, i) => (
              <Link key={i} href={stat.path}>
                <div className="bg-white rounded-xl p-6 border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer group">
                  <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                  <span className="text-3xl font-semibold text-[#1a1a1a] group-hover:text-[#1a1a1a]/80">{stat.value}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/patients">
            <div className="bg-white rounded-xl p-5 border border-gray-100 hover:border-[#1a1a1a] transition-colors cursor-pointer group">
              <div className="w-10 h-10 bg-gray-100 group-hover:bg-[#1a1a1a] rounded-lg flex items-center justify-center mb-3 transition-colors">
                <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <p className="font-medium text-[#1a1a1a]">{t.patients.addPatient}</p>
              <p className="text-sm text-gray-500 mt-1">Crear y gestionar pacientes</p>
            </div>
          </Link>
          <Link href="/calendar">
            <div className="bg-white rounded-xl p-5 border border-gray-100 hover:border-[#1a1a1a] transition-colors cursor-pointer group">
              <div className="w-10 h-10 bg-gray-100 group-hover:bg-[#1a1a1a] rounded-lg flex items-center justify-center mb-3 transition-colors">
                <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="font-medium text-[#1a1a1a]">Calendario</p>
              <p className="text-sm text-gray-500 mt-1">Crear y editar citas</p>
            </div>
          </Link>
          <Link href="/settings" className="sm:col-span-2">
            <div className="bg-white rounded-xl p-5 border border-gray-100 hover:border-[#1a1a1a] transition-colors cursor-pointer group">
              <div className="w-10 h-10 bg-gray-100 group-hover:bg-[#1a1a1a] rounded-lg flex items-center justify-center mb-3 transition-colors">
                <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="font-medium text-[#1a1a1a]">{t.settings.title}</p>
              <p className="text-sm text-gray-500 mt-1">Podólogos asignados y preferencias</p>
            </div>
          </Link>
        </div>
      </div>
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
  const { isSuperAdmin, isClinicAdmin, isAdmin, isPodiatrist, isReceptionist } = usePermissions();

  return (
    <Switch>
      <Route path="/" component={DashboardHome} />
      
      {/* Super Admin routes */}
      {isSuperAdmin && <Route path="/users" component={UsersManagementPage} />}
      {isSuperAdmin && <Route path="/messages" component={MessagesPage} />}
      {isSuperAdmin && <Route path="/audit-log" component={AuditLogPage} />}
      
      {/* Admin routes */}
      {isAdmin && <Route path="/users" component={UsersManagementPage} />}
      {isAdmin && <Route path="/credits" component={AdminCreditsPage} />}
      
      {/* Clinic Admin routes */}
      {isClinicAdmin && <Route path="/clinic" component={ClinicManagementPage} />}
      {isClinicAdmin && <Route path="/distribute-credits" component={DistributeCreditsPage} />}
      {isClinicAdmin && <Route path="/patients" component={PatientsPage} />}
      {isClinicAdmin && <Route path="/patients/:id" component={PatientsPage} />}
      {isClinicAdmin && <Route path="/sessions" component={SessionsPage} />}
      {isClinicAdmin && <Route path="/sessions/:id" component={SessionsPage} />}
      {isClinicAdmin && <Route path="/calendar" component={CalendarPage} />}
      
      {/* Receptionist routes - pacientes y calendario, sin sesiones */}
      {isReceptionist && <Route path="/patients" component={PatientsPage} />}
      {isReceptionist && <Route path="/patients/:id" component={PatientsPage} />}
      {isReceptionist && <Route path="/calendar" component={CalendarPage} />}
      
      {/* Podiatrist routes */}
      {isPodiatrist && <Route path="/patients" component={PatientsPage} />}
      {isPodiatrist && <Route path="/patients/:id" component={PatientsPage} />}
      {isPodiatrist && <Route path="/sessions" component={SessionsPage} />}
      {isPodiatrist && <Route path="/sessions/:id" component={SessionsPage} />}
      {isPodiatrist && <Route path="/calendar" component={CalendarPage} />}
      
      {/* Common routes */}
      <Route path="/credits" component={CreditsPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/notifications" component={NotificationsPage} />
      
      <Route component={DashboardHome} />
    </Switch>
  );
};

export default Dashboard;
