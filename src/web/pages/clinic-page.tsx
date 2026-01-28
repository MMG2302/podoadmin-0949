import { useState, useMemo, useEffect } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { useLanguage } from "../contexts/language-context";
import { useAuth, getAllUsers, isEmailTaken, User } from "../contexts/auth-context";
import { api } from "../lib/api-client";
import { 
  getUserCredits, 
  addAuditLog,
  getAllProfessionalLicenses,
  getCreatedUsers,
  saveCreatedUser,
  Patient,
  ClinicalSession,
} from "../lib/storage";

interface PodiatristStats {
  user: User;
  patientCount: number;
  sessionCount: number;
  sessionsThisMonth: number;
  license: string | null;
  credits: {
    monthly: number;
    extra: number;
    total: number;
  };
}

interface PatientWithPodiatrist extends Patient {
  podiatristName: string;
  lastSessionDate: string | null;
}

// Patient Reassignment Modal
const ReassignPatientModal = ({ 
  isOpen, 
  onClose, 
  patient,
  podiatrists,
  currentPodiatristId,
  onReassign
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  patient: PatientWithPodiatrist | null;
  podiatrists: User[];
  currentPodiatristId: string;
  onReassign: (patientId: string, newPodiatristId: string) => void;
}) => {
  const { t } = useLanguage();
  const [selectedPodiatrist, setSelectedPodiatrist] = useState("");

  if (!isOpen || !patient) return null;

  const handleReassign = () => {
    if (!selectedPodiatrist) return;
    onReassign(patient.id, selectedPodiatrist);
    setSelectedPodiatrist("");
    onClose();
  };

  const availablePodiatrists = podiatrists.filter(p => p.id !== currentPodiatristId);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-[#1a1a1a]">Reasignar paciente</h3>
          <p className="text-sm text-gray-500 mt-1">{patient.firstName} {patient.lastName}</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              <strong>Caso de uso:</strong> Cuando un podólogo no puede atender citas por ausencia o indisponibilidad, puede reasignar sus pacientes a otro profesional de la clínica.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Podólogo actual
            </label>
            <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-600 text-sm">
              {patient.podiatristName}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Nuevo podólogo asignado
            </label>
            <select
              value={selectedPodiatrist}
              onChange={(e) => setSelectedPodiatrist(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors"
            >
              <option value="">Seleccionar podólogo...</option>
              {availablePodiatrists.map(pod => (
                <option key={pod.id} value={pod.id}>{pod.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-[#1a1a1a] font-medium hover:bg-gray-50 transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleReassign}
              disabled={!selectedPodiatrist}
              className="flex-1 px-4 py-2.5 bg-[#1a1a1a] text-white rounded-lg font-medium hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reasignar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Statistics Card Component
const StatCard = ({ 
  label, 
  value, 
  icon, 
  trend 
}: { 
  label: string; 
  value: string | number; 
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
}) => (
  <div className="bg-white rounded-xl border border-gray-100 p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="text-3xl font-semibold text-[#1a1a1a]">{value}</p>
        {trend && (
          <p className={`text-xs mt-2 ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}% vs. mes anterior
          </p>
        )}
      </div>
      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600">
        {icon}
      </div>
    </div>
  </div>
);

// Tipos mínimos para respuestas API
type PatientApi = Patient & { createdBy: string };
type SessionApi = ClinicalSession & { sessionDate: string; createdBy: string };

// Main Clinic Page - pacientes y sesiones desde API
const ClinicPage = () => {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const credits = getUserCredits(currentUser?.id || "");
  const allUsers = getAllUsers();

  const [allPatients, setAllPatients] = useState<PatientApi[]>([]);
  const [allSessions, setAllSessions] = useState<SessionApi[]>([]);
  
  const [activeTab, setActiveTab] = useState<"overview" | "podiatrists" | "patients" | "receptionists">("overview");
  const [podiatristFilter, setPodiatristFilter] = useState<string>("all");
  const [patientSearch, setPatientSearch] = useState("");
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientWithPodiatrist | null>(null);
  const [showCreateReceptionistModal, setShowCreateReceptionistModal] = useState(false);
  const [receptionistForm, setReceptionistForm] = useState({ name: "", email: "", password: "" });
  const [receptionistError, setReceptionistError] = useState<string | null>(null);

  // Get podiatrists in this clinic
  const clinicPodiatrists = allUsers.filter(
    u => u.role === "podiatrist" && u.clinicId === currentUser?.clinicId
  );
  const clinicPodiatristIds = useMemo(() => new Set(clinicPodiatrists.map(p => p.id)), [clinicPodiatrists]);

  // Cargar pacientes y sesiones desde API (clinic_admin ve todos; filtramos por clínica en cliente)
  useEffect(() => {
    api.get<{ success?: boolean; patients?: PatientApi[] }>("/patients").then((r) => {
      if (r.success && Array.isArray(r.data?.patients)) setAllPatients(r.data.patients);
    });
    api.get<{ success?: boolean; sessions?: SessionApi[] }>("/sessions").then((r) => {
      if (r.success && Array.isArray(r.data?.sessions)) setAllSessions(r.data.sessions);
    });
  }, []);

  // Pacientes y sesiones de la clínica (filtrados por podólogos de la clínica)
  const clinicPatients = useMemo(
    () => allPatients.filter((p) => clinicPodiatristIds.has(p.createdBy)),
    [allPatients, clinicPodiatristIds]
  );
  const clinicSessions = useMemo(
    () => allSessions.filter((s) => clinicPodiatristIds.has(s.createdBy)),
    [allSessions, clinicPodiatristIds]
  );

  // Calculate podiatrist stats
  const podiatristStats: PodiatristStats[] = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const allLicenses = getAllProfessionalLicenses();

    return clinicPodiatrists.map(pod => {
      const podCredits = getUserCredits(pod.id);
      const patients = clinicPatients.filter(p => p.createdBy === pod.id);
      const sessions = clinicSessions.filter(s => s.createdBy === pod.id);
      const sessionsThisMonth = sessions.filter(s => {
        const date = new Date(s.sessionDate);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
      });

      return {
        user: pod,
        patientCount: patients.length,
        sessionCount: sessions.length,
        sessionsThisMonth: sessionsThisMonth.length,
        license: allLicenses[pod.id] || null,
        credits: {
          monthly: podCredits.monthlyCredits,
          extra: podCredits.extraCredits,
          total: podCredits.monthlyCredits + podCredits.extraCredits,
        },
      };
    });
  }, [clinicPodiatrists, clinicPatients, clinicSessions]);

  // Get patients with podiatrist info
  const patientsWithPodiatrist: PatientWithPodiatrist[] = useMemo(() => {
    const podiatristMap = new Map(clinicPodiatrists.map(p => [p.id, p.name]));
    
    return clinicPatients.map(p => {
      const patientSessions = clinicSessions.filter(s => s.patientId === p.id);
      const lastSession = patientSessions.sort(
        (a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
      )[0];

      return {
        ...p,
        podiatristName: podiatristMap.get(p.createdBy) || "Desconocido",
        lastSessionDate: lastSession?.sessionDate || null,
      };
    });
  }, [clinicPatients, clinicSessions, clinicPodiatrists]);

  // Filter patients
  const filteredPatients = patientsWithPodiatrist.filter(p => {
    const matchesSearch = 
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.email.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.phone.includes(patientSearch);
    const matchesPodiatrist = podiatristFilter === "all" || p.createdBy === podiatristFilter;
    return matchesSearch && matchesPodiatrist;
  });

  // Calculate totals
  const totals = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    const sessionsThisMonth = clinicSessions.filter(s => {
      const date = new Date(s.sessionDate);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });

    const totalCredits = podiatristStats.reduce((acc, p) => acc + p.credits.total, 0);

    return {
      patients: patientsWithPodiatrist.length,
      sessionsThisMonth: sessionsThisMonth.length,
      totalCredits,
      podiatrists: clinicPodiatrists.length,
    };
  }, [patientsWithPodiatrist, clinicSessions, clinicPodiatrists, podiatristStats]);

  // Handle patient reassignment (persiste en DB vía API)
  const handleReassign = async (patientId: string, newPodiatristId: string) => {
    const patient = patientsWithPodiatrist.find(p => p.id === patientId);
    const previousPodiatristId = patient?.createdBy || "";
    const previousPodiatrist = clinicPodiatrists.find(p => p.id === previousPodiatristId);
    const newPodiatrist = clinicPodiatrists.find(p => p.id === newPodiatristId);
    const patientFullName = `${patient?.firstName} ${patient?.lastName}`;

    // Persistir reasignación en backend/DB
    const reassignRes = await api.post<{ success?: boolean; patient?: PatientApi | null; error?: string; message?: string }>(
      `/patients/${patientId}/reassign`,
      { newPodiatristId }
    );

    if (!reassignRes.success || !reassignRes.data?.success) {
      console.error("Error reasignando paciente:", reassignRes.error || reassignRes.data?.error || reassignRes.data?.message);
      return;
    }

    // Refrescar datos desde API para mantener consistencia (DB es la fuente de verdad)
    const [patientsRes, sessionsRes] = await Promise.all([
      api.get<{ success?: boolean; patients?: PatientApi[] }>("/patients"),
      api.get<{ success?: boolean; sessions?: SessionApi[] }>("/sessions"),
    ]);
    if (patientsRes.success && Array.isArray(patientsRes.data?.patients)) setAllPatients(patientsRes.data.patients);
    if (sessionsRes.success && Array.isArray(sessionsRes.data?.sessions)) setAllSessions(sessionsRes.data.sessions);
    
    addAuditLog({
      userId: currentUser?.id || "",
      userName: currentUser?.name || "",
      action: "REASSIGN",
      entityType: "reassignment",
      entityId: patientId,
      details: JSON.stringify({
        action: "patient_reassignment",
        patientId: patientId,
        patientName: patientFullName,
        previousPodiatrist: previousPodiatrist?.name || "sin asignar",
        previousPodiatristId: previousPodiatristId || null,
        newPodiatrist: newPodiatrist?.name,
        newPodiatristId: newPodiatristId,
        fromPodiatrist: previousPodiatrist?.name || "sin asignar",
        toPodiatrist: newPodiatrist?.name,
      }),
    });

    const reassignmentDate = new Date().toISOString();
    const commonMetadata = {
      patientId: patientId,
      patientName: patientFullName,
      fromUserId: previousPodiatristId,
      fromUserName: previousPodiatrist?.name || "",
      toUserId: newPodiatristId,
      toUserName: newPodiatrist?.name || "",
      reassignedById: currentUser?.id,
      reassignedByName: currentUser?.name,
      clinicAdminId: currentUser?.id,
      clinicAdminName: currentUser?.name,
      reassignmentDate: reassignmentDate,
    };

    const notifications: Array<{ userId: string; type: string; title: string; message: string; metadata: typeof commonMetadata }> = [
      { userId: currentUser?.id || "", type: "reassignment", title: "Reasignación realizada", message: `Has reasignado al paciente ${patientFullName} del Dr. ${previousPodiatrist?.name || "sin asignar"} al Dr. ${newPodiatrist?.name}.`, metadata: commonMetadata },
      { userId: newPodiatristId, type: "reassignment", title: "Nuevo paciente asignado", message: `El paciente ${patientFullName} te ha sido asignado desde el Dr. ${previousPodiatrist?.name || "sin asignar"} por ${currentUser?.name}.`, metadata: commonMetadata },
    ];
    if (previousPodiatristId && previousPodiatristId !== newPodiatristId) {
      notifications.push({ userId: previousPodiatristId, type: "reassignment", title: "Paciente reasignado", message: `El paciente ${patientFullName} ha sido reasignado de ti al Dr. ${newPodiatrist?.name} por ${currentUser?.name}.`, metadata: commonMetadata });
    }
    await Promise.all(
      notifications.map((n) =>
        api.post("/notifications", n).catch(() => {
          // Silenciar error por ahora; la auditoría principal se hace en backend
        })
      )
    );
  };

  // Recepcionistas de la clínica
  const clinicReceptionists = getCreatedUsers().filter(
    (u) => u.role === "receptionist" && u.clinicId === currentUser?.clinicId
  );

  const handleCreateReceptionist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.clinicId || !currentUser?.id) return;
    setReceptionistError(null);
    if (isEmailTaken(receptionistForm.email.trim())) {
      setReceptionistError("Ya existe una cuenta con este correo electrónico");
      return;
    }
    try {
      const podiatristIds = clinicPodiatrists.map((p) => p.id);
      saveCreatedUser(
        {
          email: receptionistForm.email,
          name: receptionistForm.name,
          role: "receptionist",
          clinicId: currentUser.clinicId,
          assignedPodiatristIds: podiatristIds,
        },
        receptionistForm.password,
        currentUser.id
      );
      addAuditLog({
        userId: currentUser.id,
        userName: currentUser.name,
        action: "CREATE",
        entityType: "receptionist",
        entityId: "",
        details: JSON.stringify({
          action: "receptionist_create_by_clinic_admin",
          receptionistEmail: receptionistForm.email,
          clinicId: currentUser.clinicId,
          assignedPodiatristIds: podiatristIds,
        }),
      });
      setReceptionistForm({ name: "", email: "", password: "" });
      setShowCreateReceptionistModal(false);
    } catch (err) {
      setReceptionistError(err instanceof Error ? err.message : "Error al crear recepcionista");
    }
  };

  return (
    <MainLayout title={t.nav.clinicManagement} credits={credits}>
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "overview" 
                ? "bg-white text-[#1a1a1a] shadow-sm" 
                : "text-gray-600 hover:text-[#1a1a1a]"
            }`}
          >
            Resumen
          </button>
          <button
            onClick={() => setActiveTab("podiatrists")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "podiatrists" 
                ? "bg-white text-[#1a1a1a] shadow-sm" 
                : "text-gray-600 hover:text-[#1a1a1a]"
            }`}
          >
            Podólogos
          </button>
          <button
            onClick={() => setActiveTab("patients")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "patients" 
                ? "bg-white text-[#1a1a1a] shadow-sm" 
                : "text-gray-600 hover:text-[#1a1a1a]"
            }`}
          >
            Pacientes
          </button>
          <button
            onClick={() => setActiveTab("receptionists")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "receptionists" 
                ? "bg-white text-[#1a1a1a] shadow-sm" 
                : "text-gray-600 hover:text-[#1a1a1a]"
            }`}
          >
            Recepcionistas
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Podólogos"
                value={totals.podiatrists}
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
              />
              <StatCard
                label="Total Pacientes"
                value={totals.patients}
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                }
              />
              <StatCard
                label="Sesiones este mes"
                value={totals.sessionsThisMonth}
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                trend={{ value: 12, isPositive: true }}
              />
              <StatCard
                label="Créditos totales"
                value={totals.totalCredits}
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </div>

            {/* Podiatrist Activity */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-[#1a1a1a] mb-4">Actividad por podólogo</h3>
              <div className="space-y-4">
                {podiatristStats.map((stat) => {
                  const activityPercentage = Math.min(
                    (stat.sessionsThisMonth / (totals.sessionsThisMonth || 1)) * 100,
                    100
                  );
                  
                  return (
                    <div key={stat.user.id} className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="font-medium text-[#1a1a1a]">{stat.user.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-[#1a1a1a] truncate">{stat.user.name}</p>
                          <span className="text-sm text-gray-500">{stat.sessionsThisMonth} sesiones</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#1a1a1a] rounded-full transition-all"
                            style={{ width: `${activityPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Podiatrists Tab */}
        {activeTab === "podiatrists" && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Podólogo</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Licencia</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pacientes</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sesiones (mes)</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Créditos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {podiatristStats.map((stat) => (
                  <tr key={stat.user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="font-medium text-[#1a1a1a]">{stat.user.name.charAt(0)}</span>
                        </div>
                        <span className="font-medium text-[#1a1a1a]">{stat.user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{stat.user.email}</td>
                    <td className="px-6 py-4 text-sm">
                      {stat.license ? (
                        <span className="font-mono text-[#1a1a1a]">{stat.license}</span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">No registrada</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#1a1a1a] font-medium">{stat.patientCount}</td>
                    <td className="px-6 py-4 text-sm text-[#1a1a1a] font-medium">{stat.sessionsThisMonth}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#1a1a1a]">{stat.credits.total}</span>
                        <span className="text-xs text-gray-400">
                          ({stat.credits.monthly}m + {stat.credits.extra}e)
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {podiatristStats.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-gray-500">No hay podólogos en esta clínica</p>
              </div>
            )}
          </div>
        )}

        {/* Patients Tab */}
        {activeTab === "patients" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Buscar paciente (nombre, email, teléfono)..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors text-sm"
              />
              <select
                value={podiatristFilter}
                onChange={(e) => setPodiatristFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors text-sm"
              >
                <option value="all">Todos los podólogos</option>
                {clinicPodiatrists.map(pod => (
                  <option key={pod.id} value={pod.id}>{pod.name}</option>
                ))}
              </select>
            </div>

            {/* Patients Table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Paciente</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Teléfono</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Podólogo asignado</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Última sesión</th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredPatients.map((patient) => (
                      <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-medium text-[#1a1a1a]">
                            {patient.firstName} {patient.lastName}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{patient.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{patient.phone}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                            {patient.podiatristName}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {patient.lastSessionDate 
                            ? new Date(patient.lastSessionDate).toLocaleDateString("es-ES")
                            : "-"
                          }
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedPatient(patient);
                              setShowReassignModal(true);
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-[#1a1a1a] border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Reasignar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredPatients.length === 0 && (
                <div className="p-12 text-center">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-gray-500">No se encontraron pacientes</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recepcionistas Tab - clinic_admin crea recepcionistas y les asigna podólogos de la clínica */}
        {activeTab === "receptionists" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Las recepcionistas tienen acceso sin créditos a crear pacientes, crear y editar citas en el calendario de los podólogos que les asignes. Por defecto se asignan todos los podólogos de la clínica.
              </p>
              <button
                onClick={() => {
                  setReceptionistError(null);
                  setReceptionistForm({ name: "", email: "", password: "" });
                  setShowCreateReceptionistModal(true);
                }}
                className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg text-sm font-medium hover:bg-[#2a2a2a] transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear recepcionista
              </button>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Podólogos asignados</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {clinicReceptionists.map((rec) => {
                      const ids = rec.assignedPodiatristIds ?? [];
                      const names = ids.map((id) => clinicPodiatrists.find((p) => p.id === id)?.name ?? id).filter(Boolean);
                      return (
                        <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-[#1a1a1a]">{rec.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{rec.email}</td>
                          <td className="px-6 py-4">
                            <span className="text-xs text-gray-600">
                              {names.length > 0 ? names.join(", ") : "Sin asignar"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {clinicReceptionists.length === 0 && (
                <div className="p-12 text-center">
                  <p className="text-gray-500">No hay recepcionistas. Crear una para que gestione citas y pacientes de los podólogos de la clínica.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Receptionist Modal */}
      {showCreateReceptionistModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-[#1a1a1a]">Crear recepcionista</h3>
              <p className="text-sm text-gray-500 mt-1">Se asignarán todos los podólogos de la clínica por defecto.</p>
            </div>
            <form onSubmit={handleCreateReceptionist} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Nombre</label>
                <input
                  type="text"
                  value={receptionistForm.name}
                  onChange={(e) => setReceptionistForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Email</label>
                <input
                  type="email"
                  value={receptionistForm.email}
                  onChange={(e) => setReceptionistForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Contraseña inicial</label>
                <input
                  type="password"
                  value={receptionistForm.password}
                  onChange={(e) => setReceptionistForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none transition-colors"
                  required
                  minLength={6}
                />
              </div>
              {receptionistError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">{receptionistError}</div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateReceptionistModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-[#1a1a1a] font-medium hover:bg-gray-50 transition-colors"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-[#1a1a1a] text-white rounded-lg font-medium hover:bg-[#2a2a2a] transition-colors"
                >
                  Crear recepcionista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      <ReassignPatientModal
        isOpen={showReassignModal}
        onClose={() => setShowReassignModal(false)}
        patient={selectedPatient}
        podiatrists={clinicPodiatrists}
        currentPodiatristId={selectedPatient?.createdBy || ""}
        onReassign={handleReassign}
      />
    </MainLayout>
  );
};

export default ClinicPage;
