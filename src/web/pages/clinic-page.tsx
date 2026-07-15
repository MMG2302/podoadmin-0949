import { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { MainLayout } from "../components/layout/main-layout";
import { useLanguage } from "../contexts/language-context";
import { useAuth, User } from "../contexts/auth-context";
import { useRefreshOnFocus } from "../hooks/use-refresh-on-focus";
import { useClinicalListPage } from "../hooks/use-clinical-list-page";
import { invalidateClinicalListCache } from "../lib/clinical-list-cache";
import { api } from "../lib/api-client";
import {
  semanticAlertErrorClass,
  semanticAlertInfoClass,
} from "../lib/form-field-classes";
import type { Patient } from "../types/clinical";
import { SimpleBarChart } from "../components/checkout/simple-bar-chart";
import {
  AGE_RANGE_OPTIONS,
  LTV_PERIOD_STORAGE_KEY,
  ageRangeLabel,
  buildPatientListFilters,
  formatInactivityHint,
  formatLtvPaidCount,
  formatVisitCount,
  inactiveLabel,
  ltvPeriodLabel,
  parseStoredLtvPeriod,
  segmentLabel,
  type AgeRangeId,
  type DemographicsSummary,
  type PatientInactiveFilter,
  type PatientLtvPeriod,
  type PatientSegmentFilter,
} from "../lib/patient-engagement";
import { formatCheckoutAmount } from "../types/checkout-handoff";

type AppointmentMetrics = {
  periodDays: number;
  fromDate: string;
  toDate: string;
  attendedPerDay: Array<{ date: string; count: number }>;
  demandPerDay?: Array<{ date: string; count: number }>;
  demandByWeekday?: Array<{ weekday: number; label: string; count: number }>;
  topDemandDays?: Array<{ date: string; label: string; count: number }>;
  totals: {
    attended: number;
    noShow: number;
    cancelled: number;
    scheduled: number;
    demand?: number;
    cancellationRate: number;
    noShowRate: number;
  };
};

interface PodiatristStats {
  user: User;
  patientCount: number;
  sessionCount: number;
  sessionsThisMonth: number;
  license: string | null;
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
  const { t, language } = useLanguage();
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
          <h3 className="text-lg font-semibold text-brand-ink">{t.clinic.reassignTitle}</h3>
          <p className="text-sm text-gray-500 mt-1">{patient.firstName} {patient.lastName}</p>
        </div>
        <div className="p-6 space-y-4">
          <div className={semanticAlertInfoClass}>
            <p className="text-sm">
              {t.clinic.reassignUseCase}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-ink mb-2">
              {t.clinic.currentPodiatrist}
            </label>
            <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-600 text-sm">
              {patient.podiatristName}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-ink mb-2">
              {t.clinic.newPodiatrist}
            </label>
            <select
              value={selectedPodiatrist}
              onChange={(e) => setSelectedPodiatrist(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-ink focus:ring-1 focus:ring-brand-ink outline-none transition-colors"
            >
              <option value="">{t.clinic.selectPodiatrist}</option>
              {availablePodiatrists.map(pod => (
                <option key={pod.id} value={pod.id}>{pod.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-brand-border rounded-lg text-brand-ink font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleReassign}
              disabled={!selectedPodiatrist}
              className="flex-1 px-4 py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg font-medium hover:bg-brand-ink-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.clinic.reassign}
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
  trend,
  trendSuffix,
}: { 
  label: string; 
  value: string | number; 
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  trendSuffix?: string;
}) => (
  <div className="bg-white rounded-xl border border-gray-100 p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="text-3xl font-semibold text-brand-ink">{value}</p>
        {trend && (
          <p className={`text-xs mt-2 ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}{trendSuffix ?? "% vs. previous month"}
          </p>
        )}
      </div>
      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600">
        {icon}
      </div>
    </div>
  </div>
);

// Main Clinic Page
const ClinicPage = () => {
  const { t, language } = useLanguage();
  const eng = t.patients.engagement;
  const { user: currentUser, getAllUsers, fetchUsers, ensureVisibleUsers, isEmailTaken } = useAuth();
  const allUsers = getAllUsers();

  useEffect(() => {
    void ensureVisibleUsers();
  }, [ensureVisibleUsers]);

  const [clinicStatsData, setClinicStatsData] = useState<{
    totals: { patients: number; sessionsThisMonth: number; podiatrists: number };
    podiatristStats: Array<{
      userId: string;
      patientCount: number;
      sessionCount: number;
      sessionsThisMonth: number;
      license: string | null;
    }>;
    licenses: Record<string, string | null>;
  } | null>(null);
  const [debouncedPatientSearch, setDebouncedPatientSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<"all" | PatientSegmentFilter>("all");
  const [ageRangeFilter, setAgeRangeFilter] = useState<AgeRangeId>("all");
  const [inactiveFilter, setInactiveFilter] = useState<"all" | PatientInactiveFilter>("all");
  const [minVisitsFilter, setMinVisitsFilter] = useState("");
  const [maxVisitsFilter, setMaxVisitsFilter] = useState("");
  const [ltvPeriod, setLtvPeriod] = useState<PatientLtvPeriod>(() => {
    try {
      return parseStoredLtvPeriod(localStorage.getItem(LTV_PERIOD_STORAGE_KEY));
    } catch {
      return "lifetime";
    }
  });
  const [demographicsSummary, setDemographicsSummary] = useState<DemographicsSummary | null>(null);
  const [appointmentMetrics, setAppointmentMetrics] = useState<AppointmentMetrics | null>(null);
  const [metricsPodiatristFilter, setMetricsPodiatristFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"overview" | "podiatrists" | "patients" | "receptionists">("overview");
  const [podiatristFilter, setPodiatristFilter] = useState<string>("all");
  const [patientSearch, setPatientSearch] = useState("");
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientWithPodiatrist | null>(null);
  const [showCreateReceptionistModal, setShowCreateReceptionistModal] = useState(false);
  const [receptionistForm, setReceptionistForm] = useState({ name: "", email: "", password: "" });
  const [receptionistError, setReceptionistError] = useState<string | null>(null);
  const [receptionistActionLoadingId, setReceptionistActionLoadingId] = useState<string | null>(null);
  const [editingReceptionist, setEditingReceptionist] = useState<User | null>(null);
  const [editAssignedPodiatristIds, setEditAssignedPodiatristIds] = useState<string[]>([]);
  const [editAssignmentsError, setEditAssignmentsError] = useState<string | null>(null);
  const [showCreatePodiatristModal, setShowCreatePodiatristModal] = useState(false);
  const [podiatristForm, setPodiatristForm] = useState({ name: "", email: "", password: "" });
  const [podiatristError, setPodiatristError] = useState<string | null>(null);
  const [clinicPodiatristLimit, setClinicPodiatristLimit] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPatientSearch(patientSearch), 350);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  useEffect(() => {
    try {
      localStorage.setItem(LTV_PERIOD_STORAGE_KEY, ltvPeriod);
    } catch {
      /* ignore */
    }
  }, [ltvPeriod]);

  const patientListFilters = useMemo(
    () =>
      buildPatientListFilters({
        q: debouncedPatientSearch || undefined,
        createdBy: podiatristFilter,
        segment: segmentFilter,
        ageRangeId: ageRangeFilter,
        inactive: inactiveFilter,
        minVisits: minVisitsFilter,
        maxVisits: maxVisitsFilter,
        ltvPeriod,
      }),
    [
      debouncedPatientSearch,
      podiatristFilter,
      segmentFilter,
      ageRangeFilter,
      inactiveFilter,
      minVisitsFilter,
      maxVisitsFilter,
      ltvPeriod,
    ]
  );

  const {
    items: clinicPatientsList,
    isLoading: patientsLoading,
    reload: reloadPatients,
  } = useClinicalListPage<Patient>({
    path: "/patients",
    listKey: "patients",
    filters: patientListFilters,
  });

  // Get podiatrists in this clinic
  const clinicPodiatrists = allUsers.filter(
    u => u.role === "podiatrist" && u.clinicId === currentUser?.clinicId
  );
  const clinicPodiatristIds = useMemo(() => new Set(clinicPodiatrists.map(p => p.id)), [clinicPodiatrists]);

  const loadClinicStats = useCallback(async () => {
    const r = await api.get<{
      success?: boolean;
      totals?: { patients: number; sessionsThisMonth: number; podiatrists: number };
      podiatristStats?: Array<{
        userId: string;
        patientCount: number;
        sessionCount: number;
        sessionsThisMonth: number;
        license: string | null;
      }>;
      licenses?: Record<string, string | null>;
    }>("/clinical-dashboard/clinic-stats");
    if (r.success && r.data?.totals && r.data.podiatristStats) {
      setClinicStatsData({
        totals: r.data.totals,
        podiatristStats: r.data.podiatristStats,
        licenses: r.data.licenses ?? {},
      });
    }
  }, []);

  useEffect(() => {
    void loadClinicStats();
  }, [loadClinicStats]);

  const loadDemographicsSummary = useCallback(async () => {
    const params = new URLSearchParams();
    if (podiatristFilter !== "all") params.set("createdBy", podiatristFilter);
    const query = params.toString();
    const r = await api.get<{ success?: boolean; demographics?: DemographicsSummary }>(
      `/patients/demographics-summary${query ? `?${query}` : ""}`
    );
    if (r.success && r.data?.demographics) {
      setDemographicsSummary(r.data.demographics);
    }
  }, [podiatristFilter]);

  const loadAppointmentMetrics = useCallback(async () => {
    const params = new URLSearchParams({ days: "30" });
    if (metricsPodiatristFilter !== "all") params.set("podiatristId", metricsPodiatristFilter);
    const r = await api.get<{ success?: boolean; metrics?: AppointmentMetrics }>(
      `/clinical-dashboard/appointment-metrics?${params.toString()}`
    );
    if (r.success && r.data?.metrics) {
      setAppointmentMetrics(r.data.metrics);
    }
  }, [metricsPodiatristFilter]);

  useEffect(() => {
    void loadDemographicsSummary();
  }, [loadDemographicsSummary]);

  useEffect(() => {
    if (activeTab === "overview") {
      void loadAppointmentMetrics();
    }
  }, [activeTab, loadAppointmentMetrics]);

  useRefreshOnFocus(() => {
    void loadClinicStats();
    void reloadPatients();
    void loadDemographicsSummary();
    if (activeTab === "overview") void loadAppointmentMetrics();
  });

  // Cargar límite de podólogos de la clínica
  useEffect(() => {
    if (!currentUser?.clinicId) return;
    api.get<{ success?: boolean; clinic?: { podiatristLimit?: number | null } }>(`/clinics/${currentUser.clinicId}`).then((r) => {
      if (r.success && r.data?.clinic) setClinicPodiatristLimit(r.data.clinic.podiatristLimit ?? null);
    });
  }, [currentUser?.clinicId]);

  const podiatristStats: PodiatristStats[] = useMemo(() => {
    return clinicPodiatrists.map((pod) => {
      const stat = clinicStatsData?.podiatristStats.find((s) => s.userId === pod.id);
      return {
        user: pod,
        patientCount: stat?.patientCount ?? 0,
        sessionCount: stat?.sessionCount ?? 0,
        sessionsThisMonth: stat?.sessionsThisMonth ?? 0,
        license: stat?.license ?? clinicStatsData?.licenses?.[pod.id] ?? null,
      };
    });
  }, [clinicPodiatrists, clinicStatsData]);

  const patientsWithPodiatrist: PatientWithPodiatrist[] = useMemo(() => {
    const podiatristMap = new Map(clinicPodiatrists.map((p) => [p.id, p.name]));
    return clinicPatientsList
      .filter((p) => clinicPodiatristIds.has(p.createdBy))
      .map((p) => ({
        ...p,
        podiatristName: podiatristMap.get(p.createdBy) || t.clinic.unknownPodiatrist,
        lastSessionDate: p.lastSessionDate ?? null,
      }));
  }, [clinicPatientsList, clinicPodiatrists, clinicPodiatristIds]);

  const filteredPatients = patientsWithPodiatrist;

  const segmentBadgeClass = (segment?: PatientSegmentFilter) => {
    if (segment === "new") return "bg-blue-50 text-blue-700";
    if (segment === "recovered") return "bg-violet-50 text-violet-700";
    if (segment === "recurrent") return "bg-emerald-50 text-emerald-700";
    return "bg-gray-100 text-gray-600";
  };

  const totals = useMemo(
    () =>
      clinicStatsData?.totals ?? {
        patients: patientsWithPodiatrist.length,
        sessionsThisMonth: 0,
        podiatrists: clinicPodiatrists.length,
      },
    [clinicStatsData, patientsWithPodiatrist.length, clinicPodiatrists.length]
  );

  // Handle patient reassignment (persiste en DB vía API)
  const handleReassign = async (patientId: string, newPodiatristId: string) => {
    // Persistir reasignación en backend/DB (auditoría y notificaciones en el servidor)
    const reassignRes = await api.post<{ success?: boolean; patient?: PatientApi | null; error?: string; message?: string }>(
      `/patients/${patientId}/reassign`,
      { newPodiatristId }
    );

    if (!reassignRes.success || !reassignRes.data?.success) {
      console.error("Error reasignando paciente:", reassignRes.error || reassignRes.data?.error || reassignRes.data?.message);
      return;
    }

    invalidateClinicalListCache();
    await Promise.all([reloadPatients(), loadClinicStats()]);
  };

  // Recepcionistas de la clínica (desde API / users)
  const clinicReceptionists = allUsers.filter(
    (u) => u.role === "receptionist" && u.clinicId === currentUser?.clinicId
  );

  const isReceptionistActive = (rec: User) =>
    !rec.isBlocked && !rec.isBanned && rec.isEnabled !== false;

  const activeReceptionistCount = clinicReceptionists.filter(isReceptionistActive).length;
  const MAX_ACTIVE_RECEPTIONISTS = 10;
  const canCreateReceptionist = activeReceptionistCount < MAX_ACTIVE_RECEPTIONISTS;

  const handleToggleReceptionistBlock = async (rec: User) => {
    try {
      setReceptionistActionLoadingId(rec.id);
      const endpoint = rec.isBlocked ? `/users/${rec.id}/unblock` : `/users/${rec.id}/block`;
      await api.post(endpoint);
      await fetchUsers();
    } catch (err) {
      console.error("Error cambiando bloqueo de recepcionista:", err);
    } finally {
      setReceptionistActionLoadingId(null);
    }
  };

  const handleToggleReceptionistEnabled = async (rec: User) => {
    try {
      setReceptionistActionLoadingId(rec.id);
      const isCurrentlyDisabled = rec.isEnabled === false;
      const endpoint = isCurrentlyDisabled ? `/users/${rec.id}/enable` : `/users/${rec.id}/disable`;
      await api.post(endpoint);
      await fetchUsers();
    } catch (err) {
      console.error("Error cambiando estado de recepcionista:", err);
    } finally {
      setReceptionistActionLoadingId(null);
    }
  };

  const handleDeleteReceptionist = async (rec: User) => {
    const confirmed = window.confirm(
      t.clinic.confirmDeleteReceptionist.replace("{name}", rec.name).replace("{email}", rec.email)
    );
    if (!confirmed) return;
    try {
      setReceptionistActionLoadingId(rec.id);
      await api.delete(`/users/${rec.id}`);
      await fetchUsers();
    } catch (err) {
      console.error("Error eliminando recepcionista:", err);
    } finally {
      setReceptionistActionLoadingId(null);
    }
  };

  const handleCreateReceptionist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.clinicId || !currentUser?.id) return;
    if (!canCreateReceptionist) {
      setReceptionistError(t.clinic.maxActiveReceptionists.replace("{max}", String(MAX_ACTIVE_RECEPTIONISTS)));
      return;
    }
    setReceptionistError(null);
    if (isEmailTaken(receptionistForm.email.trim())) {
      setReceptionistError(t.clinic.emailTaken);
      return;
    }
    try {
      const res = await api.post<{ success?: boolean; user?: { id: string }; error?: string; message?: string }>("/receptionists", {
        name: receptionistForm.name.trim(),
        email: receptionistForm.email.trim(),
        password: receptionistForm.password,
      });
      if (!res.success || !res.data?.user?.id) {
        setReceptionistError(res.data?.message ?? res.error ?? t.clinic.createReceptionistError);
        return;
      }
      await fetchUsers();
      setReceptionistForm({ name: "", email: "", password: "" });
      setShowCreateReceptionistModal(false);
    } catch (err) {
      setReceptionistError(err instanceof Error ? err.message : t.clinic.createReceptionistError);
    }
  };

  const openEditReceptionistAssignments = (rec: User) => {
    setEditingReceptionist(rec);
    setEditAssignedPodiatristIds(rec.assignedPodiatristIds ?? []);
    setEditAssignmentsError(null);
  };

  const handleSaveReceptionistAssignments = async () => {
    if (!editingReceptionist) return;
    setEditAssignmentsError(null);
    try {
      setReceptionistActionLoadingId(editingReceptionist.id);
      const res = await api.patch<{ success?: boolean; message?: string }>(
        `/receptionists/${editingReceptionist.id}/assigned-podiatrists`,
        { assignedPodiatristIds: editAssignedPodiatristIds }
      );
      if (!res.success) {
        setEditAssignmentsError(res.error ?? res.data?.message ?? t.clinic.saveAssignmentError);
        return;
      }
      await fetchUsers();
      setEditingReceptionist(null);
    } catch (err) {
      setEditAssignmentsError(err instanceof Error ? err.message : t.clinic.saveAssignmentError);
    } finally {
      setReceptionistActionLoadingId(null);
    }
  };

  const handleCreatePodiatrist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.clinicId) return;
    setPodiatristError(null);
    if (isEmailTaken(podiatristForm.email.trim())) {
      setPodiatristError(t.clinic.emailTaken);
      return;
    }
    if (podiatristForm.password.length < 8) {
      setPodiatristError(t.clinic.passwordMin8);
      return;
    }
    try {
      const res = await api.post<{ success?: boolean; user?: { id: string }; error?: string; message?: string }>("/users", {
        name: podiatristForm.name.trim(),
        email: podiatristForm.email.trim(),
        password: podiatristForm.password,
        role: "podiatrist",
        clinicId: currentUser.clinicId,
      });
      if (!res.success || !res.data?.user?.id) {
        setPodiatristError(res.data?.message ?? res.error ?? t.clinic.createPodiatristError);
        return;
      }
      await fetchUsers();
      setPodiatristForm({ name: "", email: "", password: "" });
      setShowCreatePodiatristModal(false);
    } catch (err) {
      setPodiatristError(err instanceof Error ? err.message : t.clinic.createPodiatristError);
    }
  };

  const canCreatePodiatrist = clinicPodiatristLimit === null || clinicPodiatrists.length < clinicPodiatristLimit;

  return (
    <MainLayout title={t.nav.clinicManagement} >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "overview" 
                ? "bg-brand-surface text-brand-ink shadow-sm" 
                : "text-gray-600 hover:text-brand-ink dark:hover:text-white"
            }`}
          >
            {t.clinic.tabOverview}
          </button>
          <button
            onClick={() => setActiveTab("podiatrists")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "podiatrists" 
                ? "bg-brand-surface text-brand-ink shadow-sm" 
                : "text-gray-600 hover:text-brand-ink dark:hover:text-white"
            }`}
          >
            {t.clinic.tabPodiatrists}
          </button>
          <button
            onClick={() => setActiveTab("patients")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "patients" 
                ? "bg-brand-surface text-brand-ink shadow-sm" 
                : "text-gray-600 hover:text-brand-ink dark:hover:text-white"
            }`}
          >
            {t.clinic.tabPatients}
          </button>
          <button
            onClick={() => setActiveTab("receptionists")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "receptionists" 
                ? "bg-brand-surface text-brand-ink shadow-sm" 
                : "text-gray-600 hover:text-brand-ink dark:hover:text-white"
            }`}
          >
            {t.clinic.tabReceptionists}
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label={t.clinic.statPodiatrists}
                value={totals.podiatrists}
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
              />
              <StatCard
                label={t.clinic.statTotalPatients}
                value={totals.patients}
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                }
              />
              <StatCard
                label={t.clinic.statSessionsThisMonth}
                value={totals.sessionsThisMonth}
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                trend={{ value: 12, isPositive: true }}
                trendSuffix={t.clinic.vsPreviousMonth}
              />
            </div>

            {/* Agenda metrics */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-brand-ink">{t.clinic.agendaTitle}</h3>
                  <p className="text-sm text-gray-500">{t.clinic.agendaSubtitle}</p>
                </div>
                <select
                  value={metricsPodiatristFilter}
                  onChange={(e) => setMetricsPodiatristFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                >
                  <option value="all">{t.clinic.allPodiatrists}</option>
                  {clinicPodiatrists.map((pod) => (
                    <option key={pod.id} value={pod.id}>{pod.name}</option>
                  ))}
                </select>
              </div>

              {appointmentMetrics ? (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="rounded-lg border border-gray-100 p-4">
                      <p className="text-xs text-gray-500">{t.clinic.attended}</p>
                      <p className="text-2xl font-semibold text-brand-ink">{appointmentMetrics.totals.attended}</p>
                    </div>
                    <div className="rounded-lg border border-gray-100 p-4">
                      <p className="text-xs text-gray-500">{t.clinic.noShow}</p>
                      <p className="text-2xl font-semibold text-brand-ink">{appointmentMetrics.totals.noShow}</p>
                      <p className="text-xs text-gray-400">{t.clinic.noShowRateOfResolved.replace("{n}", String(appointmentMetrics.totals.noShowRate))}</p>
                    </div>
                    <div className="rounded-lg border border-gray-100 p-4">
                      <p className="text-xs text-gray-500">{t.clinic.cancelled}</p>
                      <p className="text-2xl font-semibold text-brand-ink">{appointmentMetrics.totals.cancelled}</p>
                      <p className="text-xs text-gray-400">{t.clinic.cancellationRate.replace("{n}", String(appointmentMetrics.totals.cancellationRate))}</p>
                    </div>
                    <div className="rounded-lg border border-gray-100 p-4">
                      <p className="text-xs text-gray-500">{t.clinic.pending}</p>
                      <p className="text-2xl font-semibold text-brand-ink">{appointmentMetrics.totals.scheduled}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-brand-ink mb-2">{t.clinic.demandTitle}</p>
                    <p className="text-xs text-gray-500 mb-2">
                      {t.clinic.demandHint.replace("{n}", String(appointmentMetrics.totals.demand ?? 0))}
                    </p>
                    <Link
                      href="/checkout"
                      className="text-sm font-medium text-brand-ink underline-offset-2 hover:underline"
                    >
                      {t.clinic.openCheckoutAgenda}
                    </Link>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-brand-ink mb-2">{t.clinic.attendedPerDay}</p>
                    <SimpleBarChart
                      data={appointmentMetrics.attendedPerDay.map((d) => ({
                        label: new Date(`${d.date}T12:00:00`).toLocaleDateString(language === "en" ? "en-US" : language === "pt" ? "pt-BR" : language === "fr" ? "fr-FR" : "es-ES", { day: "numeric", month: "short" }),
                        value: d.count,
                      }))}
                      height={140}
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">{t.clinic.loadingAgendaMetrics}</p>
              )}
            </div>

            {/* Podiatrist Activity */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-brand-ink mb-4">{t.clinic.activityByPodiatrist}</h3>
              <div className="space-y-4">
                {podiatristStats.map((stat) => {
                  const activityPercentage = Math.min(
                    (stat.sessionsThisMonth / (totals.sessionsThisMonth || 1)) * 100,
                    100
                  );
                  
                  return (
                    <div key={stat.user.id} className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="font-medium text-brand-ink">{stat.user.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-brand-ink truncate">{stat.user.name}</p>
                          <span className="text-sm text-gray-500">{t.clinic.sessionsCount.replace("{n}", String(stat.sessionsThisMonth))}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand-ink rounded-full transition-all"
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

        {/* Podiatrists Tab - clinic_admin puede crear podólogos dentro del límite */}
        {activeTab === "podiatrists" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {clinicPodiatristLimit !== null
                  ? t.clinic.podiatristsLimit.replace("{current}", String(clinicPodiatrists.length)).replace("{limit}", String(clinicPodiatristLimit))
                  : t.clinic.podiatristsNoLimit}
              </p>
              <button
                onClick={() => {
                  setPodiatristError(null);
                  setPodiatristForm({ name: "", email: "", password: "" });
                  setShowCreatePodiatristModal(true);
                }}
                disabled={!canCreatePodiatrist}
                className="px-4 py-2 bg-brand-ink text-brand-ink-fg rounded-lg text-sm font-medium hover:bg-brand-ink-hover transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t.clinic.createPodiatrist}
              </button>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.clinic.colPodiatrist}</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.clinic.colEmail}</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.clinic.colLicense}</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.clinic.colPatients}</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.clinic.colSessionsMonth}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {podiatristStats.map((stat) => (
                  <tr key={stat.user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="font-medium text-brand-ink">{stat.user.name.charAt(0)}</span>
                        </div>
                        <span className="font-medium text-brand-ink">{stat.user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{stat.user.email}</td>
                    <td className="px-6 py-4 text-sm">
                      {stat.license ? (
                        <span className="font-mono text-brand-ink">{stat.license}</span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">{t.clinic.licenseNotRegistered}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-brand-ink font-medium">{stat.patientCount}</td>
                    <td className="px-6 py-4 text-sm text-brand-ink font-medium">{stat.sessionsThisMonth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {podiatristStats.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-gray-500">{t.clinic.noPodiatrists}</p>
              </div>
            )}
            </div>
          </div>
        )}

        {/* Patients Tab */}
        {activeTab === "patients" && (
          <div className="space-y-4">
            {/* Demographics index */}
            {demographicsSummary && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {(["new", "recurrent", "recovered"] as PatientSegmentFilter[]).map((segment) => (
                    <button
                      key={segment}
                      type="button"
                      onClick={() => setSegmentFilter(segmentFilter === segment ? "all" : segment)}
                      className={`rounded-xl border p-4 text-left transition-colors ${
                        segmentFilter === segment
                          ? "border-brand-ink bg-brand-canvas"
                          : "border-gray-100 bg-white hover:border-gray-200"
                      }`}
                    >
                      <p className="text-xs text-gray-500">{segmentLabel(eng, segment)}</p>
                      <p className="text-2xl font-semibold text-brand-ink">{demographicsSummary[segment]}</p>
                    </button>
                  ))}
                  <div className="rounded-xl border border-gray-100 bg-white p-4">
                    <p className="text-xs text-gray-500">{t.clinic.totalIndexed}</p>
                    <p className="text-2xl font-semibold text-brand-ink">{demographicsSummary.total}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(["3m", "6m"] as PatientInactiveFilter[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setInactiveFilter(inactiveFilter === key ? "all" : key)}
                      className={`rounded-xl border p-4 text-left transition-colors ${
                        inactiveFilter === key
                          ? "border-brand-ink bg-brand-canvas"
                          : "border-gray-100 bg-white hover:border-gray-200"
                      }`}
                    >
                      <p className="text-xs text-gray-500">{inactiveLabel(eng, key)}</p>
                      <p className="text-2xl font-semibold text-brand-ink">
                        {key === "3m"
                          ? demographicsSummary.inactive3m ?? 0
                          : demographicsSummary.inactive6m ?? 0}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              <input
                type="text"
                placeholder={t.clinic.searchPatientPlaceholder}
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="flex-1 min-w-[180px] px-4 py-2 rounded-lg border border-gray-200 focus:border-brand-ink focus:ring-1 focus:ring-brand-ink outline-none transition-colors text-sm"
              />
              <select
                value={podiatristFilter}
                onChange={(e) => setPodiatristFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-200 focus:border-brand-ink focus:ring-1 focus:ring-brand-ink outline-none transition-colors text-sm"
              >
                <option value="all">{t.clinic.allPodiatrists}</option>
                {clinicPodiatrists.map(pod => (
                  <option key={pod.id} value={pod.id}>{pod.name}</option>
                ))}
              </select>
              <select
                value={ageRangeFilter}
                onChange={(e) => setAgeRangeFilter(e.target.value as AgeRangeId)}
                className="px-4 py-2 rounded-lg border border-gray-200 focus:border-brand-ink focus:ring-1 focus:ring-brand-ink outline-none transition-colors text-sm"
              >
                {AGE_RANGE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>{ageRangeLabel(eng, opt.id)}</option>
                ))}
              </select>
              <select
                value={inactiveFilter}
                onChange={(e) => setInactiveFilter(e.target.value as "all" | PatientInactiveFilter)}
                className="px-4 py-2 rounded-lg border border-gray-200 focus:border-brand-ink focus:ring-1 focus:ring-brand-ink outline-none transition-colors text-sm"
              >
                <option value="all">{t.clinic.activityAll}</option>
                <option value="3m">{inactiveLabel(eng, "3m")}</option>
                <option value="6m">{inactiveLabel(eng, "6m")}</option>
              </select>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder={eng.minVisits}
                value={minVisitsFilter}
                onChange={(e) => setMinVisitsFilter(e.target.value)}
                className="w-28 px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
              <input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder={eng.maxVisits}
                value={maxVisitsFilter}
                onChange={(e) => setMaxVisitsFilter(e.target.value)}
                className="w-28 px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
              <label className="flex items-center gap-2 text-sm text-gray-500">
                <span className="shrink-0">{eng.ltvLabel}</span>
                <select
                  value={ltvPeriod}
                  onChange={(e) => setLtvPeriod(e.target.value as PatientLtvPeriod)}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-brand-ink"
                  aria-label={eng.ltvPeriodAria}
                >
                  {(["day", "week", "month", "year", "lifetime"] as PatientLtvPeriod[]).map((key) => (
                    <option key={key} value={key}>
                      {ltvPeriodLabel(eng, key)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {(segmentFilter !== "all" ||
              ageRangeFilter !== "all" ||
              inactiveFilter !== "all" ||
              minVisitsFilter ||
              maxVisitsFilter) && (
              <div className="flex flex-wrap items-center gap-2">
                {segmentFilter !== "all" && (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${segmentBadgeClass(segmentFilter)}`}>
                    {segmentLabel(eng, segmentFilter)}
                    <button type="button" className="ml-1" onClick={() => setSegmentFilter("all")}>×</button>
                  </span>
                )}
                {ageRangeFilter !== "all" && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {ageRangeLabel(eng, ageRangeFilter)}
                    <button type="button" className="ml-1" onClick={() => setAgeRangeFilter("all")}>×</button>
                  </span>
                )}
                {inactiveFilter !== "all" && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800">
                    {inactiveLabel(eng, inactiveFilter)}
                    <button type="button" className="ml-1" onClick={() => setInactiveFilter("all")}>×</button>
                  </span>
                )}
                {(minVisitsFilter || maxVisitsFilter) && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {t.clinic.visitsRangeChip.replace("{min}", minVisitsFilter || "0").replace("{max}", maxVisitsFilter || "∞")}
                    <button
                      type="button"
                      className="ml-1"
                      onClick={() => {
                        setMinVisitsFilter("");
                        setMaxVisitsFilter("");
                      }}
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            )}

            {patientsLoading && (
              <p className="text-sm text-gray-500">{t.clinic.loadingPatients}</p>
            )}

            {/* Patients Table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{eng.tablePatient}</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.clinic.colEmail}</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.clinic.colPhone}</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{eng.tableAge}</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{eng.tableSegment}</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.clinic.colVisits}</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {eng.ltvLabel} ({ltvPeriodLabel(eng, ltvPeriod)})
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.clinic.colAssignedPodiatrist}</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.clinic.colLastSession}</th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.clinic.colActions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredPatients.map((patient) => (
                      <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-medium text-brand-ink">
                            {patient.firstName} {patient.lastName}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{patient.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{patient.phone}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {patient.ageYears != null ? `${patient.ageYears} ${eng.yearsSuffix}` : "—"}
                        </td>
                        <td className="px-6 py-4">
                          {patient.patientSegment ? (
                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${segmentBadgeClass(patient.patientSegment)}`}>
                              {segmentLabel(eng, patient.patientSegment)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <p className="font-medium text-brand-ink">{formatVisitCount(patient.sessionCount, eng)}</p>
                          <p className="text-xs text-gray-400">
                            {formatInactivityHint(patient.daysSinceLastSession, patient.sessionCount, eng)}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <p className="font-medium text-brand-ink">
                            {formatCheckoutAmount(patient.ltvCents ?? 0)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatLtvPaidCount(patient.ltvPaidCount, eng)}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                            {patient.podiatristName}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {patient.lastSessionDate 
                            ? new Date(patient.lastSessionDate).toLocaleDateString(language === "en" ? "en-US" : language === "pt" ? "pt-BR" : language === "fr" ? "fr-FR" : "es-ES")
                            : "-"
                          }
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedPatient(patient);
                              setShowReassignModal(true);
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-brand-ink border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            {t.clinic.reassign}
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
                  <p className="text-gray-500">{t.clinic.noPatientsFound}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recepcionistas Tab - clinic_admin crea recepcionistas y les asigna podólogos de la clínica */}
        {activeTab === "receptionists" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500">
                  {t.clinic.receptionistsHint}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {t.clinic.receptionistsActive.replace("{active}", String(activeReceptionistCount)).replace("{max}", String(MAX_ACTIVE_RECEPTIONISTS))}
                </p>
              </div>
              <button
                onClick={() => {
                  if (!canCreateReceptionist) return;
                  setReceptionistError(null);
                  setReceptionistForm({ name: "", email: "", password: "" });
                  setShowCreateReceptionistModal(true);
                }}
                disabled={!canCreateReceptionist}
                className="px-4 py-2 bg-brand-ink text-brand-ink-fg rounded-lg text-sm font-medium hover:bg-brand-ink-hover transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t.clinic.createReceptionist}
              </button>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.clinic.colName}</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.clinic.colEmail}</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.clinic.colAssignedPodiatrists}</th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.clinic.colActions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {clinicReceptionists.map((rec) => {
                      const ids = rec.assignedPodiatristIds ?? [];
                      const names = ids.map((id) => clinicPodiatrists.find((p) => p.id === id)?.name ?? id).filter(Boolean);
                      return (
                        <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-brand-ink">{rec.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{rec.email}</td>
                          <td className="px-6 py-4">
                            <span className="text-xs text-gray-600">
                              {names.length > 0 ? names.join(", ") : t.clinic.unassigned}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => openEditReceptionistAssignments(rec)}
                                disabled={receptionistActionLoadingId === rec.id}
                                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                              >
                                {t.clinic.podiatristsAction}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleReceptionistBlock(rec)}
                                disabled={receptionistActionLoadingId === rec.id}
                                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                              >
                                {rec.isBlocked ? t.clinic.unblock : t.clinic.block}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleReceptionistEnabled(rec)}
                                disabled={receptionistActionLoadingId === rec.id}
                                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                              >
                                {rec.isEnabled === false ? t.clinic.enable : t.clinic.disable}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteReceptionist(rec)}
                                disabled={receptionistActionLoadingId === rec.id}
                                className="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                                {t.common.delete}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {clinicReceptionists.length === 0 && (
                <div className="p-12 text-center">
                  <p className="text-gray-500">{t.clinic.noReceptionists}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Podiatrist Modal */}
      {showCreatePodiatristModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-brand-ink">{t.clinic.createPodiatrist}</h3>
              <p className="text-sm text-gray-500 mt-1">{t.clinic.createPodiatristSubtitle}</p>
            </div>
            <form onSubmit={handleCreatePodiatrist} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1">{t.common.name}</label>
                <input
                  type="text"
                  value={podiatristForm.name}
                  onChange={(e) => setPodiatristForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-ink focus:ring-1 focus:ring-brand-ink outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1">{t.common.email}</label>
                <input
                  type="email"
                  value={podiatristForm.email}
                  onChange={(e) => setPodiatristForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-ink focus:ring-1 focus:ring-brand-ink outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1">{t.clinic.initialPasswordMin8}</label>
                <input
                  type="password"
                  value={podiatristForm.password}
                  onChange={(e) => setPodiatristForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-ink focus:ring-1 focus:ring-brand-ink outline-none transition-colors"
                  required
                  minLength={8}
                />
              </div>
              {podiatristError && (
                <div className={semanticAlertErrorClass}>{podiatristError}</div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreatePodiatristModal(false)}
                  className="flex-1 px-4 py-2.5 border border-brand-border rounded-lg text-brand-ink font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg font-medium hover:bg-brand-ink-hover transition-colors"
                >
                  {t.clinic.createPodiatrist}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Receptionist Modal */}
      {showCreateReceptionistModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-brand-ink">{t.clinic.createReceptionist}</h3>
              <p className="text-sm text-gray-500 mt-1">{t.clinic.createReceptionistSubtitle}</p>
            </div>
            <form onSubmit={handleCreateReceptionist} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1">{t.common.name}</label>
                <input
                  type="text"
                  value={receptionistForm.name}
                  onChange={(e) => setReceptionistForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-ink focus:ring-1 focus:ring-brand-ink outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1">{t.common.email}</label>
                <input
                  type="email"
                  value={receptionistForm.email}
                  onChange={(e) => setReceptionistForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-ink focus:ring-1 focus:ring-brand-ink outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1">{t.clinic.initialPassword}</label>
                <input
                  type="password"
                  value={receptionistForm.password}
                  onChange={(e) => setReceptionistForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-brand-ink focus:ring-1 focus:ring-brand-ink outline-none transition-colors"
                  required
                  minLength={6}
                />
              </div>
              {receptionistError && (
                <div className={semanticAlertErrorClass}>{receptionistError}</div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateReceptionistModal(false)}
                  className="flex-1 px-4 py-2.5 border border-brand-border rounded-lg text-brand-ink font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg font-medium hover:bg-brand-ink-hover transition-colors"
                >
                  {t.clinic.createReceptionist}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Editar podólogos asignados a recepcionista */}
      {editingReceptionist && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-brand-ink">{t.clinic.assignedPodiatristsTitle}</h3>
              <p className="text-sm text-gray-500 mt-1">{editingReceptionist.name} ({editingReceptionist.email})</p>
            </div>
            <div className="p-6 space-y-3">
              {clinicPodiatrists.length === 0 ? (
                <p className="text-sm text-gray-500">{t.clinic.noPodiatristsInClinic}</p>
              ) : (
                clinicPodiatrists.map((pod) => {
                  const checked = editAssignedPodiatristIds.includes(pod.id);
                  return (
                    <label
                      key={pod.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setEditAssignedPodiatristIds((prev) =>
                            prev.includes(pod.id) ? prev.filter((id) => id !== pod.id) : [...prev, pod.id]
                          );
                        }}
                        className="rounded border-gray-300 text-brand-ink focus:ring-brand-ink"
                      />
                      <span className="font-medium text-brand-ink">{pod.name}</span>
                      <span className="text-sm text-gray-500">{pod.email}</span>
                    </label>
                  );
                })
              )}
              {editAssignmentsError && (
                <div className={semanticAlertErrorClass}>{editAssignmentsError}</div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingReceptionist(null)}
                  className="flex-1 px-4 py-2.5 border border-brand-border rounded-lg text-brand-ink font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleSaveReceptionistAssignments}
                  disabled={receptionistActionLoadingId === editingReceptionist.id}
                  className="flex-1 px-4 py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg font-medium hover:bg-brand-ink-hover transition-colors disabled:opacity-50"
                >
                  {t.common.save}
                </button>
              </div>
            </div>
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
