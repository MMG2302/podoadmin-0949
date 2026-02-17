import { useEffect, useState } from "react";
import { Route, Switch, Link } from "wouter";
import { Users, Stethoscope, Building2, UserCircle, CalendarCheck, Settings, UserPlus, Building, Calendar, FileText } from "lucide-react";
import { MainLayout } from "../components/layout/main-layout";
import { RoleDashboardBento } from "../components/ui/bento-grid";
import { useLanguage } from "../contexts/language-context";
import { useAuth } from "../contexts/auth-context";
import { usePermissions } from "../hooks/use-permissions";
import { api } from "../lib/api-client";
import PatientsPage from "./patients-page";
import SessionsPage from "./sessions-page";
import SettingsPage from "./settings-page";
import AuditLogPage from "./audit-log-page";
import UsersManagementPage from "./users-page";
import ClinicManagementPage from "./clinic-page";
import NotificationsPage from "./notifications-page";
import CalendarPage from "./calendar-page";
import MessagesPage from "./messages-page";
import SupportPage from "./support-page";

// Super Admin Dashboard - focused on Users, Settings
const SuperAdminDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState<{ id: string; name: string; email: string; role: string }[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    api.get<{ success?: boolean; users?: { id: string; name: string; email: string; role: string }[] }>("/users").then((r) => {
      if (r.success && Array.isArray(r.data?.users)) setAllUsers(r.data.users);
    });
  }, [user?.id]);

  const podiatrists = allUsers.filter(u => u.role === "podiatrist");
  const clinicAdmins = allUsers.filter(u => u.role === "clinic_admin");

  return (
    <MainLayout title={t.dashboard.title}>
      <RoleDashboardBento
        welcomeTitle={<>{t.auth.welcomeBack}, <span className="font-semibold">{user?.name}</span></>}
        welcomeDescription={t.roles.superAdminDesc}
        statItems={[
          { Icon: Users, label: t.nav.users, value: allUsers.length.toString(), path: "/users" },
          { Icon: Stethoscope, label: "Podólogos", value: podiatrists.length.toString(), path: "/users" },
          { Icon: Building2, label: "Administradores de clínica", value: clinicAdmins.length.toString(), path: "/users" },
        ]}
        actionItems={[
          { Icon: Users, name: t.nav.users, description: "Gestionar usuarios y clínicas", href: "/users" },
          { Icon: Settings, name: t.settings.title, description: "Configuración del sistema", href: "/settings" },
        ]}
      >
        {/* Users Overview - full width */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-[#1a1a1a] dark:text-white">Usuarios del Sistema</h3>
            <Link href="/users" className="text-sm text-gray-500 dark:text-gray-400 hover:text-[#1a1a1a] dark:hover:text-white transition-colors">
              Ver todos →
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
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <span className="font-medium text-[#1a1a1a] dark:text-white">
                      {u.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#1a1a1a] dark:text-white">{u.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    u.role === "super_admin" ? "bg-[#1a1a1a] text-white" :
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

// Tipos mínimos para pacientes/sesiones desde API
type PatientRow = { id: string; firstName: string; lastName: string; createdBy: string };
type SessionRow = { id: string; patientId: string; sessionDate: string; status: string; createdAt: string; createdBy: string };

// Podiatrist Dashboard - Patient and session focused (datos desde API)
const PodiatristDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);

  useEffect(() => {
    if (!user?.id) return;
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
    <MainLayout title={t.dashboard.title}>
      <RoleDashboardBento
        welcomeTitle={<>{t.auth.welcomeBack}, <span className="font-semibold">{user?.name}</span></>}
        welcomeDescription={t.roles.podiatristDesc}
        statItems={[
          { Icon: UserCircle, label: t.dashboard.totalPatients, value: patients.length.toString(), path: "/patients" },
          { Icon: CalendarCheck, label: t.dashboard.sessionsThisMonth, value: sessionsThisMonth.length.toString(), path: "/sessions" },
        ]}
        actionItems={[
          { Icon: UserPlus, name: t.patients.addPatient, description: "Registrar nuevo paciente", href: "/patients" },
          { Icon: FileText, name: t.sessions.newSession, description: "Iniciar consulta clínica", href: "/sessions" },
          { Icon: Settings, name: t.settings.title, description: "Personalizar sistema", href: "/settings" },
        ]}
        gridClassName="md:grid-cols-2 lg:grid-cols-3"
      >
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
      </RoleDashboardBento>
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
          { Icon: Users, name: t.nav.users, description: "Ver usuarios del sistema", href: "/users" },
          { Icon: Settings, name: t.settings.title, description: "Configuración de cuenta", href: "/settings" },
        ]}
      />
    </MainLayout>
  );
};

// Clinic Admin Dashboard
const ClinicAdminDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <MainLayout title={t.dashboard.title}>
      <RoleDashboardBento
        welcomeTitle={<>{t.auth.welcomeBack}, <span className="font-semibold">{user?.name}</span></>}
        welcomeDescription={t.roles.clinicAdminDesc}
        actionItems={[
          { Icon: Building, name: t.nav.clinicManagement, description: "Gestión de la clínica", href: "/clinic" },
          { Icon: UserCircle, name: t.nav.patients, description: "Ver todos los pacientes", href: "/patients" },
          { Icon: FileText, name: t.nav.clinicalSessions, description: "Ver todas las sesiones", href: "/sessions" },
          { Icon: Settings, name: t.settings.title, description: "Configuración", href: "/settings" },
        ]}
        gridClassName="md:grid-cols-2 lg:grid-cols-3"
      />
    </MainLayout>
  );
};

// Receptionist Dashboard - datos desde API (pacientes, clínica, podólogos asignados)
const ReceptionistDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [allPatients, setAllPatients] = useState<{ createdBy: string }[]>([]);
  const [clinic, setClinic] = useState<{ clinicName: string } | null>(null);
  const [assignedPodiatrists, setAssignedPodiatrists] = useState<{ id: string; name: string }[]>([]);

  const assignedIds = user?.assignedPodiatristIds ?? [];
  const patientCount = allPatients.filter((p) => assignedIds.includes(p.createdBy)).length;

  useEffect(() => {
    if (!user?.id) return;
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

  const welcomeDescription = (
    <>
      <span className="text-gray-400">{t.roles.receptionistDesc}</span>
      {clinic && (
        <p className="text-gray-300 text-sm mt-1">
          Clínica asignada: <span className="font-semibold">{clinic.clinicName}</span>
        </p>
      )}
      {assignedPodiatrists.length > 0 && (
        <p className="text-gray-300 text-sm mt-1">
          Podólogos asignados:{" "}
          <span className="font-semibold">{assignedPodiatrists.map((p) => p.name).join(", ")}</span>
        </p>
      )}
    </>
  );

  return (
    <MainLayout title={t.dashboard.title}>
      <RoleDashboardBento
        welcomeTitle={<>{t.auth.welcomeBack}, <span className="font-semibold">{user?.name}</span></>}
        welcomeDescription={welcomeDescription}
        statItems={[
          { Icon: UserCircle, label: "Pacientes de podólogos asignados", value: patientCount.toString(), path: "/patients" },
        ]}
        actionItems={[
          { Icon: UserPlus, name: t.patients.addPatient, description: "Crear y gestionar pacientes", href: "/patients" },
          { Icon: Calendar, name: "Calendario", description: "Crear y editar citas", href: "/calendar" },
          { Icon: Settings, name: t.settings.title, description: "Podólogos asignados y preferencias", href: "/settings" },
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
  const { isSuperAdmin, isClinicAdmin, isAdmin, isPodiatrist, isReceptionist } = usePermissions();

  return (
    <Switch>
      <Route path="/" component={DashboardHome} />
      
      {/* Super Admin routes */}
      {isSuperAdmin && <Route path="/users" component={UsersManagementPage} />}
      {isSuperAdmin && <Route path="/messages" component={MessagesPage} />}
      {isSuperAdmin && <Route path="/support" component={SupportPage} />}
      {isSuperAdmin && <Route path="/audit-log" component={AuditLogPage} />}
      
      {/* Admin routes */}
      {isAdmin && <Route path="/users" component={UsersManagementPage} />}
      {isAdmin && <Route path="/support" component={SupportPage} />}
      {/* Clinic Admin routes */}
      {isClinicAdmin && <Route path="/clinic" component={ClinicManagementPage} />}
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
      <Route path="/settings" component={SettingsPage} />
      <Route path="/notifications" component={NotificationsPage} />
      
      <Route component={DashboardHome} />
    </Switch>
  );
};

export default Dashboard;
