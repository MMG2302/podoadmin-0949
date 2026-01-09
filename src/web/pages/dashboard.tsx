import { useEffect } from "react";
import { Route, Switch, Link } from "wouter";
import { MainLayout } from "../components/layout/main-layout";
import { useLanguage } from "../contexts/language-context";
import { useAuth } from "../contexts/auth-context";
import { usePermissions } from "../hooks/use-permissions";
import { getUserCredits, getPatients, getSessions } from "../lib/storage";
import { seedDatabase } from "../lib/seed-data";
import PatientsPage from "./patients-page";
import SessionsPage from "./sessions-page";
import CreditsPage from "./credits-page";
import SettingsPage from "./settings-page";
import AuditLogPage from "./audit-log-page";

// Dashboard Home
const DashboardHome = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isSuperAdmin } = usePermissions();

  // Seed database on first load
  useEffect(() => {
    seedDatabase();
  }, []);

  const credits = getUserCredits(user?.id || "");
  const patients = getPatients();
  const sessions = getSessions();
  const sessionsThisMonth = sessions.filter((s) => {
    const sessionDate = new Date(s.sessionDate);
    const now = new Date();
    return sessionDate.getMonth() === now.getMonth() && sessionDate.getFullYear() === now.getFullYear();
  });

  const stats = [
    { label: t.dashboard.totalPatients, value: patients.length.toString(), change: "" },
    { label: t.dashboard.sessionsThisMonth, value: sessionsThisMonth.length.toString(), change: "" },
    { label: t.dashboard.creditsRemaining, value: `${credits.monthlyCredits + credits.extraCredits - credits.reservedCredits}`, change: "" },
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
              {isSuperAdmin ? t.roles.superAdminDesc : t.roles.podiatristDesc}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div>
          <h3 className="text-lg font-semibold text-[#1a1a1a] mb-4">{t.dashboard.quickStats}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <Link key={index} href={index === 0 ? "/patients" : index === 1 ? "/sessions" : "/credits"}>
                <div className="bg-white rounded-xl p-6 border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer group">
                  <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-semibold text-[#1a1a1a] group-hover:text-[#1a1a1a]/80 transition-colors">{stat.value}</span>
                    {stat.change && (
                      <span className="text-sm text-green-600 font-medium mb-1">{stat.change}</span>
                    )}
                  </div>
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

// Users Page (Super Admin only)
const UsersPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const credits = getUserCredits(user?.id || "");
  
  const users = [
    { id: "user_super_admin_001", name: "Super Administrador", email: "admin@podoadmin.com", role: "super_admin" },
    { id: "user_podiatrist_001", name: "Dr. María García", email: "doctor@podoadmin.com", role: "podiatrist" },
  ];
  
  return (
    <MainLayout title={t.nav.users} credits={credits}>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-4 text-sm font-semibold text-[#1a1a1a]">Usuario</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-[#1a1a1a]">Email</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-[#1a1a1a]">Rol</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-[#1a1a1a]">Créditos</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const userCredits = getUserCredits(u.id);
              return (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="font-medium text-[#1a1a1a]">
                          {u.name.charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium text-[#1a1a1a]">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      u.role === "super_admin" ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-gray-700"
                    }`}>
                      {u.role === "super_admin" ? t.roles.superAdmin : t.roles.podiatrist}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {userCredits.monthlyCredits + userCredits.extraCredits}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </MainLayout>
  );
};

const Dashboard = () => {
  const { isSuperAdmin } = usePermissions();

  return (
    <Switch>
      <Route path="/" component={DashboardHome} />
      <Route path="/patients" component={PatientsPage} />
      <Route path="/patients/:id" component={PatientsPage} />
      <Route path="/sessions" component={SessionsPage} />
      <Route path="/sessions/:id" component={SessionsPage} />
      <Route path="/credits" component={CreditsPage} />
      {isSuperAdmin && <Route path="/users" component={UsersPage} />}
      {isSuperAdmin && <Route path="/audit-log" component={AuditLogPage} />}
      <Route path="/settings" component={SettingsPage} />
      <Route component={DashboardHome} />
    </Switch>
  );
};

export default Dashboard;
