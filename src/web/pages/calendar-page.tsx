import { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { MainLayout } from "../components/layout/main-layout";
import { AppModal, AppModalBody, AppModalFooter, AppModalHeader } from "../components/ui/app-modal";
import { formFieldClassSm, formFieldDisabledClassSm, formHintClass, formLabelClass, formLabelClassXs, formPanelMutedClass, whatsappButtonSmClass } from "../lib/form-field-classes";
import { PatientSearchSelect } from "../components/patients/patient-search-select";
import { useLanguage } from "../contexts/language-context";
import { useAuth } from "../contexts/auth-context";
import { usePermissions } from "../hooks/use-permissions";
import { useEntitlements } from "../hooks/use-entitlements";
import { PremiumLockIcon } from "../components/premium/premium-upsell";
import { useRefreshOnFocus } from "../hooks/use-refresh-on-focus";
import {
  fetchPatientPickerSample,
} from "../hooks/use-patient-picker";

/** Por encima de este número se usa búsqueda indexada en lugar del &lt;select&gt;. */
const APPOINTMENT_PATIENT_SELECT_THRESHOLD = 10;
import { api } from "../lib/api-client";
import {
  buildAgendaWhatsAppMessage,
  downloadAgendaIcs,
  fetchAgendaExportPreview,
  formatLocalDateString,
  openAgendaWhatsAppWeb,
  resolveAgendaWhatsAppCountry,
  resolveAgendaWhatsAppPhone,
} from "../lib/agenda-export";
import { useTenantCountry } from "../hooks/use-tenant-country";
import { hydrateReceptionistUser } from "../lib/receptionist-assignments";
import type { ClinicalSession, Patient, Appointment } from "../types/clinical";
import type { AgendaSettings } from "../types/agenda";
import { isAppointmentOutsideAgendaHours } from "../lib/agenda-hours";
import {
  CalendarDayResourceGrid,
  CalendarDayTimeGrid,
  CalendarWeekTimeGrid,
  PodiatristColorLegend,
  type CalendarTimedBlock,
  type CalendarUntimedBlock,
} from "../components/calendar/calendar-time-grid";
import {
  clampEventToGrid,
  getPodiatristColorCollisions,
  getPodiatristStyle,
  parseIsoToMinutes,
  parseTimeToMinutes,
  podiatristInitials,
  sortPodiatristsByName,
  DEFAULT_APPOINTMENT_STYLE,
} from "../lib/calendar-time-grid";

type ViewMode = "month" | "week" | "day";

interface SessionWithPatient extends ClinicalSession {
  patient: Patient | undefined;
}

interface AppointmentWithDetails extends Appointment {
  patient: Patient | undefined;
  podiatristName: string;
  pendingPatientName?: string;
  pendingPatientPhone?: string;
}

interface AppointmentFormData {
  patientId: string | null; // null for "pending patient"
  podiatristId: string;
  date: string;
  time: string;
  duration: number;
  notes: string;
  pendingPatientName: string;
  pendingPatientPhone: string;
}

const emptyAppointmentForm: AppointmentFormData = {
  patientId: "",
  podiatristId: "",
  date: "",
  time: "09:00",
  duration: 30,
  notes: "",
  pendingPatientName: "",
  pendingPatientPhone: "",
};

const CALENDAR_LOCALE: Record<string, string> = { es: "es-ES", en: "en-US", pt: "pt-BR", fr: "fr-FR" };

const CalendarPage = () => {
  const { t, language } = useLanguage();
  const locale = CALENDAR_LOCALE[language] ?? "es-ES";
  const { user, getAllUsers, updateUser, ensureVisibleUsers } = useAuth();
  const { isClinicAdmin, isPodiatrist, isReceptionist } = usePermissions();
  const { has: hasFeature } = useEntitlements();
  const hasAgendaAnalytics = hasFeature("agenda_analytics");
  const tenantCountry = useTenantCountry(user);
  
  useEffect(() => {
    void ensureVisibleUsers();
  }, [ensureVisibleUsers]);

  const allUsers = getAllUsers();
  const clinicPodiatrists = isReceptionist && user?.assignedPodiatristIds?.length
    ? allUsers.filter((u) => user.assignedPodiatristIds!.includes(u.id))
    : allUsers.filter(
        (u) => u.role === "podiatrist" && u.clinicId === user?.clinicId
      );
  
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [podiatristFilter, setPodiatristFilter] = useState<string>("all");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const [allSessions, setAllSessions] = useState<ClinicalSession[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);

  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [appointmentPatientMode, setAppointmentPatientMode] = useState<"registered" | "pending">("registered");
  const [appointmentPatientPickerMode, setAppointmentPatientPickerMode] = useState<
    "loading" | "select" | "search"
  >("loading");
  const [appointmentCompactPatients, setAppointmentCompactPatients] = useState<Patient[]>([]);
  const [appointmentForm, setAppointmentForm] = useState<AppointmentFormData>(emptyAppointmentForm);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isSubmittingAppointment, setIsSubmittingAppointment] = useState(false);
  const [appointmentSubmitError, setAppointmentSubmitError] = useState("");
  const [appointmentAgendaSettings, setAppointmentAgendaSettings] = useState<AgendaSettings | null>(null);
  const [appointmentAgendaWarning, setAppointmentAgendaWarning] = useState<string | null>(null);
  const [agendaExportBusy, setAgendaExportBusy] = useState(false);
  const [agendaMetrics, setAgendaMetrics] = useState<{
    scheduled: number;
    noShow: number;
    completed: number;
    noShowRate: number;
    completionRate: number;
    demandByWeekday?: Array<{ label: string; count: number }>;
    totals?: { demand?: number };
  } | null>(null);
  const [waitlist, setWaitlist] = useState<
    Array<{
      id: string;
      pendingPatientName?: string | null;
      pendingPatientPhone?: string | null;
      podiatristId: string;
      preferredDate?: string | null;
      reason?: string | null;
    }>
  >([]);

  const loadCalendarData = useCallback(async () => {
    if (!user?.id) return;

    const rangeStart = new Date(currentDate);
    const rangeEnd = new Date(currentDate);
    if (viewMode === "day") {
      // same day
    } else if (viewMode === "week") {
      rangeStart.setDate(currentDate.getDate() - currentDate.getDay());
      rangeEnd.setDate(rangeStart.getDate() + 6);
    } else {
      rangeStart.setDate(1);
      rangeEnd.setMonth(currentDate.getMonth() + 1, 0);
    }
    const from = formatLocalDateString(rangeStart);
    const to = formatLocalDateString(rangeEnd);

    const [sessRes, aptRes, metricsRes, waitRes, demandRes] = await Promise.all([
      api.get<{ success?: boolean; sessions?: ClinicalSession[] }>(
        `/sessions?from=${from}&to=${to}&limit=500`
      ),
      api.get<{ success?: boolean; appointments?: Appointment[] }>(
        `/appointments?from=${from}&to=${to}&includeCancelled=1&limit=500`
      ),
      api.get<{ success?: boolean; metrics?: typeof agendaMetrics }>("/clinical/appointments/metrics"),
      api.get<{ success?: boolean; waitlist?: typeof waitlist }>("/clinical/waitlist"),
      // Analítica de demanda: solo con plan Premium (evita un 402 innecesario).
      hasAgendaAnalytics
        ? api.get<{
            success?: boolean;
            metrics?: {
              demandByWeekday?: Array<{ label: string; count: number }>;
              totals?: { demand?: number };
            };
          }>("/clinical-dashboard/appointment-metrics?days=30")
        : Promise.resolve({ success: false as const, data: undefined }),
    ]);

    const sess = sessRes.success && Array.isArray(sessRes.data?.sessions) ? sessRes.data.sessions : [];
    const apt = aptRes.success && Array.isArray(aptRes.data?.appointments) ? aptRes.data.appointments : [];
    setAllSessions(sess);
    setAllAppointments(apt);

    const patientIds = [
      ...new Set([
        ...sess.map((s) => s.patientId),
        ...apt.filter((a) => a.patientId).map((a) => a.patientId as string),
      ]),
    ];
    if (patientIds.length > 0) {
      const patRes = await api.get<{ success?: boolean; patients?: Patient[] }>(
        `/patients?ids=${patientIds.slice(0, 100).join(",")}&limit=100`
      );
      if (patRes.success && Array.isArray(patRes.data?.patients)) {
        setAllPatients(patRes.data.patients);
      } else {
        setAllPatients([]);
      }
    } else {
      setAllPatients([]);
    }

    if (metricsRes.success && metricsRes.data?.metrics) {
      const base = metricsRes.data.metrics;
      const demand = demandRes.success ? demandRes.data?.metrics : undefined;
      setAgendaMetrics({
        ...base,
        demandByWeekday: demand?.demandByWeekday,
        totals: demand?.totals,
      });
    }
    if (waitRes.success && waitRes.data?.waitlist) setWaitlist(waitRes.data.waitlist);
  }, [user?.id, currentDate, viewMode, hasAgendaAnalytics]);

  const updateCheckIn = async (
    apptId: string,
    checkInStatus: "none" | "waiting" | "in_room" | "seen",
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();
    const res = await api.patch<{ success?: boolean }>(`/clinical/appointments/${apptId}/check-in`, {
      checkInStatus,
    });
    if (res.success) {
      setAllAppointments((prev) =>
        prev.map((a) => (a.id === apptId ? { ...a, checkInStatus } : a))
      );
    }
  };

  const checkInLabel = (s?: string) => {
    if (s === "waiting") return t.calendar.checkInWaiting;
    if (s === "in_room") return t.calendar.checkInInConsult;
    if (s === "seen") return t.calendar.checkInDone;
    return t.calendar.checkInNone;
  };

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData, refreshTrigger]);

  // Refresco periódico: refleja sin recargar manualmente cambios externos
  // (p. ej. confirmación/cancelación de citas por el paciente vía enlace de WhatsApp).
  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(() => {
      if (!document.hidden) void loadCalendarData();
    }, 5_000);
    return () => clearInterval(interval);
  }, [loadCalendarData, user?.id]);

  useEffect(() => {
    if (!isReceptionist || !user?.id || user.assignedPodiatristIds?.length) return;
    void hydrateReceptionistUser(user).then((hydrated) => {
      if (hydrated.assignedPodiatristIds?.length) {
        updateUser({ assignedPodiatristIds: hydrated.assignedPodiatristIds });
      }
    });
  }, [isReceptionist, user, updateUser]);

  useRefreshOnFocus(loadCalendarData);

  // Filter sessions based on role and podiatrist filter
  const filteredSessions: SessionWithPatient[] = useMemo(() => {
    let sessions = allSessions;
    
    if (isPodiatrist) {
      sessions = sessions.filter(s => s.createdBy === user?.id);
    } else if (isClinicAdmin) {
      const clinicPodiatristIds = clinicPodiatrists.map(p => p.id);
      sessions = sessions.filter(s => clinicPodiatristIds.includes(s.createdBy));
      
      if (podiatristFilter !== "all") {
        sessions = sessions.filter(s => s.createdBy === podiatristFilter);
      }
    }
    
    return sessions.map(s => ({
      ...s,
      patient: allPatients.find(p => p.id === s.patientId),
    }));
  }, [allSessions, allPatients, isPodiatrist, isClinicAdmin, user, clinicPodiatrists, podiatristFilter]);

  // Filter appointments
  const filteredAppointments: AppointmentWithDetails[] = useMemo(() => {
    let appointments = allAppointments;
    
    if ((isClinicAdmin || isReceptionist) && podiatristFilter !== "all") {
      appointments = appointments.filter(a => a.podiatristId === podiatristFilter);
    }
    
    return appointments.map(a => ({
      ...a,
      patient: a.patientId ? allPatients.find(p => p.id === a.patientId) : undefined,
      podiatristName: clinicPodiatrists.find(p => p.id === a.podiatristId)?.name || t.calendar.unknown,
      pendingPatientName: a.pendingPatientName,
      pendingPatientPhone: a.pendingPatientPhone,
    }));
  }, [allAppointments, allPatients, isClinicAdmin, isReceptionist, podiatristFilter, clinicPodiatrists]);

  // Calendar navigation
  const navigatePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Índices por fecha: una sola pasada por los datos en lugar de filtrar todo el
  // arreglo por cada celda del mes (42×). formatLocalDateString evita además el
  // desfase de día de toISOString() en husos horarios negativos por la noche.
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, SessionWithPatient[]>();
    for (const s of filteredSessions) {
      const key = s.sessionDate.split("T")[0];
      const list = map.get(key);
      if (list) list.push(s);
      else map.set(key, [s]);
    }
    return map;
  }, [filteredSessions]);

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, AppointmentWithDetails[]>();
    for (const a of filteredAppointments) {
      const list = map.get(a.date);
      if (list) list.push(a);
      else map.set(a.date, [a]);
    }
    return map;
  }, [filteredAppointments]);

  const getSessionsForDate = (date: Date): SessionWithPatient[] =>
    sessionsByDate.get(formatLocalDateString(date)) ?? [];

  const getAppointmentsForDate = (date: Date): AppointmentWithDetails[] =>
    (appointmentsByDate.get(formatLocalDateString(date)) ?? []).filter((a) => a.status !== "cancelled");

  // Canceladas del día: se muestran en gris (el horario queda libre para reagendar).
  const getCancelledAppointmentsForDate = (date: Date): AppointmentWithDetails[] =>
    (appointmentsByDate.get(formatLocalDateString(date)) ?? []).filter((a) => a.status === "cancelled");

  // Get month grid data
  const getMonthGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from Monday (adjust if first day is Sunday)
    let startDate = new Date(firstDay);
    const dayOfWeek = startDate.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(startDate.getDate() - diff);
    
    const days: Date[] = [];
    const current = new Date(startDate);
    
    // Generate 6 weeks (42 days) to ensure full grid
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  // Get week grid data
  const getWeekGrid = () => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(startOfWeek.getDate() - diff);
    
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

const isToday = (date: Date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const isCurrentMonth = (date: Date) => {
  return date.getMonth() === currentDate.getMonth();
};

const isPastDay = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d < today;
};

const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

const isSelected = (date: Date) => {
  return selectedDate && date.toDateString() === selectedDate.toDateString();
};

  const formatMonthYear = () => {
    return currentDate.toLocaleDateString(locale, { month: "long", year: "numeric" });
  };

  const formatWeekRange = () => {
    const weekDays = getWeekGrid();
    const start = weekDays[0];
    const end = weekDays[6];
    return `${start.getDate()} - ${end.getDate()} ${end.toLocaleDateString(locale, { month: "long", year: "numeric" })}`;
  };

  const formatDayDate = () => {
    return currentDate.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };

  const dayNames = [t.calendar.dayMon, t.calendar.dayTue, t.calendar.dayWed, t.calendar.dayThu, t.calendar.dayFri, t.calendar.daySat, t.calendar.daySun];

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "draft":
        return "bg-yellow-500";
      case "scheduled":
        return "bg-blue-500";
      case "confirmed":
        return "bg-indigo-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 border-green-200 text-green-700";
      case "draft":
        return "bg-yellow-50 border-yellow-200 text-yellow-700";
      case "scheduled":
        return "bg-blue-50 border-blue-200 text-blue-700";
      case "confirmed":
        return "bg-indigo-50 border-indigo-200 text-indigo-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  const getSessionStatusLabel = (status: string) =>
    status === "completed" ? t.calendar.completed : t.calendar.draft;

  // Selected date sessions and appointments
  const selectedDateSessions = selectedDate ? getSessionsForDate(selectedDate) : [];
  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];
  const selectedDateCancelled = selectedDate ? getCancelledAppointmentsForDate(selectedDate) : [];

  // Aviso informativo en el formulario: el horario elegido corresponde a una cita
  // cancelada. No bloquea; solo avisa que se agendará encima de una cancelación.
  const cancelledSlotOverlap = useMemo(() => {
    if (!showAppointmentForm || !appointmentForm.date || !appointmentForm.time) return false;
    const start = parseTimeToMinutes(appointmentForm.time);
    if (start == null) return false;
    const end = start + (appointmentForm.duration || 30);
    const podiatristId = appointmentForm.podiatristId || (isPodiatrist ? user?.id ?? "" : "");
    return allAppointments.some((a) => {
      if (a.status !== "cancelled" || a.date !== appointmentForm.date) return false;
      if (podiatristId && a.podiatristId !== podiatristId) return false;
      if (editingAppointment && a.id === editingAppointment.id) return false;
      const aStart = parseTimeToMinutes(a.time);
      if (aStart == null) return false;
      const aEnd = aStart + (a.duration || 30);
      return start < aEnd && end > aStart;
    });
  }, [showAppointmentForm, appointmentForm, allAppointments, editingAppointment, isPodiatrist, user?.id]);

  // Upcoming sessions (next 7 days)
  const upcomingSessions = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return filteredSessions
      .filter(s => {
        const sessionDate = new Date(s.sessionDate);
        return sessionDate >= today && sessionDate <= nextWeek;
      })
      .sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime());
  }, [filteredSessions]);

  // Upcoming appointments (next 7 days)
  const upcomingAppointments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return filteredAppointments
      .filter(a => {
        const appointmentDate = new Date(a.date);
        return appointmentDate >= today && appointmentDate <= nextWeek && a.status !== "cancelled";
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredAppointments]);

  const getPodiatristName = (podiatristId: string) => {
    const pod = clinicPodiatrists.find(p => p.id === podiatristId);
    return pod?.name || t.calendar.unknown;
  };

  const getPatientDisplayName = (appointment: AppointmentWithDetails) => {
    if (!appointment.patientId || !appointment.patient) {
      return appointment.pendingPatientName || t.calendar.pendingPatient;
    }
    return `${appointment.patient.firstName} ${appointment.patient.lastName}`;
  };

  const getPatientDisplayNameShort = (appointment: AppointmentWithDetails) => {
    if (!appointment.patientId || !appointment.patient) {
      return appointment.pendingPatientName || t.calendar.pendingShort;
    }
    return `${appointment.patient.firstName} ${appointment.patient.lastName?.charAt(0)}.`;
  };

  const sortedClinicPodiatrists = useMemo(
    () => sortPodiatristsByName(clinicPodiatrists),
    [clinicPodiatrists]
  );

  const orderedPodiatristIds = useMemo(
    () => sortedClinicPodiatrists.map((p) => p.id),
    [sortedClinicPodiatrists]
  );

  const podiatristColorCollisions = useMemo(
    () => getPodiatristColorCollisions(orderedPodiatristIds),
    [orderedPodiatristIds]
  );

  const colorByPodiatrist = useMemo(
    () =>
      (isClinicAdmin || isReceptionist) &&
      podiatristFilter === "all" &&
      clinicPodiatrists.length > 1,
    [isClinicAdmin, isReceptionist, podiatristFilter, clinicPodiatrists.length]
  );

  const podiatristBadge = (podiatristId: string, name: string): string | undefined => {
    if (!colorByPodiatrist || !podiatristColorCollisions.has(podiatristId)) return undefined;
    return podiatristInitials(name);
  };

  const canEditAppointment = (appt: AppointmentWithDetails) =>
    isClinicAdmin ||
    (isPodiatrist && appt.podiatristId === user?.id) ||
    (isReceptionist && user?.assignedPodiatristIds?.includes(appt.podiatristId));

  const podiatristLegend = colorByPodiatrist ? (
    <PodiatristColorLegend
      podiatrists={sortedClinicPodiatrists}
      orderedPodiatristIds={orderedPodiatristIds}
      colorCollisionIds={podiatristColorCollisions}
    />
  ) : null;

  const buildTimedBlocksForDate = (date: Date): CalendarTimedBlock[] => {
    const blocks: CalendarTimedBlock[] = [];

    for (const appt of getAppointmentsForDate(date)) {
      const minutes = parseTimeToMinutes(appt.time);
      if (minutes == null) continue;
      const clamped = clampEventToGrid(minutes, appt.duration || 30);
      if (!clamped) continue;
      const editable = canEditAppointment(appt);
      blocks.push({
        id: appt.id,
        kind: "appointment",
        startMinutes: clamped.startMinutes,
        durationMinutes: clamped.durationMinutes,
        podiatristId: appt.podiatristId,
        title: getPatientDisplayName(appt),
        subtitle: colorByPodiatrist ? appt.podiatristName : undefined,
        meta: appt.time,
        badge: podiatristBadge(appt.podiatristId, appt.podiatristName),
        canEdit: editable,
        onClick: editable ? () => openEditAppointmentForm(appt) : undefined,
      });
    }

    for (const session of getSessionsForDate(date)) {
      const minutes = parseIsoToMinutes(session.sessionDate);
      if (minutes == null) continue;
      const clamped = clampEventToGrid(minutes, 30);
      if (!clamped) continue;
      const podName = getPodiatristName(session.createdBy);
      blocks.push({
        id: session.id,
        kind: "session",
        startMinutes: clamped.startMinutes,
        durationMinutes: clamped.durationMinutes,
        podiatristId: session.createdBy,
        title: `${session.patient?.firstName ?? ""} ${session.patient?.lastName ?? ""}`.trim(),
        subtitle: colorByPodiatrist ? podName : getSessionStatusLabel(session.status),
        meta: t.calendar.session,
        badge: podiatristBadge(session.createdBy, podName),
        href: `/sessions?id=${session.id}`,
      });
    }

    // Canceladas: en gris, no editables; recuerdan que el horario quedó libre.
    for (const appt of getCancelledAppointmentsForDate(date)) {
      const minutes = parseTimeToMinutes(appt.time);
      if (minutes == null) continue;
      const clamped = clampEventToGrid(minutes, appt.duration || 30);
      if (!clamped) continue;
      blocks.push({
        id: appt.id,
        kind: "appointment",
        startMinutes: clamped.startMinutes,
        durationMinutes: clamped.durationMinutes,
        podiatristId: appt.podiatristId,
        title: getPatientDisplayName(appt),
        subtitle: t.calendar.legendCancelled,
        meta: appt.time,
        muted: true,
      });
    }

    return blocks;
  };

  const buildUntimedBlocksForDate = (date: Date): CalendarUntimedBlock[] => {
    const blocks: CalendarUntimedBlock[] = [];
    for (const session of getSessionsForDate(date)) {
      if (parseIsoToMinutes(session.sessionDate) != null) continue;
      const podName = getPodiatristName(session.createdBy);
      blocks.push({
        id: session.id,
        kind: "session",
        podiatristId: session.createdBy,
        title: `${session.patient?.firstName ?? ""} ${session.patient?.lastName ?? ""}`.trim(),
        subtitle: colorByPodiatrist ? podName : t.calendar.session,
        badge: podiatristBadge(session.createdBy, podName),
        href: `/sessions?id=${session.id}`,
      });
    }
    return blocks;
  };

  const appointmentChipStyle = (podiatristId: string) => {
    if (!colorByPodiatrist) return DEFAULT_APPOINTMENT_STYLE;
    return getPodiatristStyle(podiatristId, orderedPodiatristIds);
  };

  // Appointment form handlers
  const openNewAppointmentForm = (date?: Date) => {
    setEditingAppointment(null);
    let defaultPodiatristId = "";
    if (isPodiatrist && !isClinicAdmin) defaultPodiatristId = user?.id || "";
    else if (isReceptionist && user?.assignedPodiatristIds?.length === 1) defaultPodiatristId = user.assignedPodiatristIds[0];
    setAppointmentForm({
      ...emptyAppointmentForm,
      date: date ? formatLocalDateString(date) : formatLocalDateString(new Date()),
      podiatristId: defaultPodiatristId,
      patientId: "",
    });
    setAppointmentPatientMode("registered");
    setShowAppointmentForm(true);
  };

  const openEditAppointmentForm = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setAppointmentPatientMode(appointment.patientId ? "registered" : "pending");
    setAppointmentForm({
      patientId: appointment.patientId || "",
      podiatristId: appointment.podiatristId,
      date: appointment.date,
      time: appointment.time,
      duration: appointment.duration,
      notes: appointment.notes,
      pendingPatientName: appointment.pendingPatientName || "",
      pendingPatientPhone: appointment.pendingPatientPhone || "",
    });
    setShowAppointmentForm(true);
  };

  const closeAppointmentForm = () => {
    setShowAppointmentForm(false);
    setEditingAppointment(null);
    setAppointmentForm(emptyAppointmentForm);
    setAppointmentSubmitError("");
    setAppointmentAgendaSettings(null);
    setAppointmentAgendaWarning(null);
    setAppointmentPatientMode("registered");
  };

  /** Carga horario laboral del podólogo seleccionado en el formulario. */
  useEffect(() => {
    if (!showAppointmentForm) return;
    const podId =
      appointmentForm.podiatristId ||
      (isPodiatrist && !isClinicAdmin ? user?.id : undefined);
    if (!podId) {
      setAppointmentAgendaSettings(null);
      return;
    }
    let cancelled = false;
    void api
      .get<{ success?: boolean; settings?: AgendaSettings }>(
        `/clinical-dashboard/agenda-settings?podiatristId=${encodeURIComponent(podId)}`
      )
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data?.settings) {
          setAppointmentAgendaSettings(res.data.settings);
        } else {
          setAppointmentAgendaSettings(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [
    showAppointmentForm,
    appointmentForm.podiatristId,
    isPodiatrist,
    isClinicAdmin,
    user?.id,
  ]);

  useEffect(() => {
    if (!appointmentAgendaSettings || !appointmentForm.time) {
      setAppointmentAgendaWarning(null);
      return;
    }
    const hit = isAppointmentOutsideAgendaHours(
      appointmentAgendaSettings,
      appointmentForm.time,
      appointmentForm.duration || 30
    );
    setAppointmentAgendaWarning(hit?.message ?? null);
  }, [
    appointmentAgendaSettings,
    appointmentForm.time,
    appointmentForm.duration,
  ]);

  const isPendingPatientMode = appointmentPatientMode === "pending";

  const getPatientById = (id: string) => allPatients.find((p) => p.id === id) ?? null;

  /** Detecta si el error de la API es por solapamiento de horarios (por código o por texto del mensaje). */
  const isOverlapError = (res: { data?: { code?: string; message?: string }; message?: string }) => {
    if ((res.data as { code?: string })?.code === "APPOINTMENT_OVERLAP") return true;
    const msg = (res.data as { message?: string })?.message || res.message || "";
    return /solapa|overlap|horario no disponible|chevauche|sobrepõe/i.test(msg);
  };

  const isAgendaHoursError = (res: { data?: { code?: string; message?: string }; message?: string }) => {
    const code = (res.data as { code?: string })?.code;
    return code === "AGENDA_OUTSIDE_HOURS" || code === "AGENDA_OVERTIME_LIMIT";
  };

  const handleAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppointmentSubmitError("");

    if (!appointmentForm.podiatristId || !appointmentForm.date) {
      if (isReceptionist && !appointmentForm.podiatristId) {
        setAppointmentSubmitError(t.calendar.selectPodiatrist);
      }
      return;
    }

    const patientId = isPendingPatientMode ? null : appointmentForm.patientId || null;

    if (patientId === null) {
      if (!appointmentForm.pendingPatientName || !appointmentForm.pendingPatientPhone) {
        setAppointmentSubmitError(t.calendar.errorPendingPatientRequired);
        return;
      }
    }

    if (appointmentAgendaWarning && (isPodiatrist || isClinicAdmin) && !isReceptionist) {
      const proceed = window.confirm(
        `${appointmentAgendaWarning}\n\n${t.calendar.confirmSaveAnyway}`
      );
      if (!proceed) return;
    }

    const selectedPodiatrist = clinicPodiatrists.find((p) => p.id === appointmentForm.podiatristId);
    const clinicIdForAppointment = user?.clinicId || selectedPodiatrist?.clinicId || undefined;

    const body = {
      ...(patientId != null ? { patientId } : {}),
      podiatristId: appointmentForm.podiatristId,
      date: appointmentForm.date,
      time: appointmentForm.time,
      duration: appointmentForm.duration,
      notes: appointmentForm.notes,
      ...(clinicIdForAppointment ? { clinicId: clinicIdForAppointment } : {}),
      ...(patientId === null
        ? {
            pendingPatientName: appointmentForm.pendingPatientName,
            pendingPatientPhone: appointmentForm.pendingPatientPhone,
          }
        : {}),
    };

    setIsSubmittingAppointment(true);
    try {
      if (editingAppointment) {
        const res = await api.put<{
          success?: boolean;
          appointment?: Appointment;
          message?: string;
          code?: string;
          agendaWarning?: { message: string };
        }>(`/appointments/${editingAppointment.id}`, body);
        if (!res.success) {
          const errMsg = isOverlapError(res)
            ? t.calendar.errorOverlap
            : isAgendaHoursError(res)
              ? (res.data as { message?: string })?.message ||
                res.message ||
                t.calendar.outsideHoursBlocked
              : (res.message || res.error || (res.data as { message?: string })?.message || t.calendar.errorUpdateFailed);
          setAppointmentSubmitError(errMsg);
          return;
        }
        const updatedAppointment = res.data?.appointment;
        if (updatedAppointment) {
          setAllAppointments((prev) => prev.map((a) => (a.id === updatedAppointment.id ? updatedAppointment : a)));
        }
        setShowAppointmentForm(false);
        setAppointmentForm(emptyAppointmentForm);
        setEditingAppointment(null);
        setAppointmentAgendaSettings(null);
        setAppointmentAgendaWarning(null);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        const res = await api.post<{
          success?: boolean;
          appointment?: Appointment;
          message?: string;
          code?: string;
          agendaWarning?: { message: string };
        }>("/appointments", body);
        if (!res.success) {
          const errMsg = isOverlapError(res)
            ? t.calendar.errorOverlap
            : isAgendaHoursError(res)
              ? (res.data as { message?: string })?.message ||
                res.message ||
                t.calendar.outsideHoursBlocked
              : (res.message || res.error || (res.data as { message?: string })?.message || t.calendar.errorCreateFailed);
          setAppointmentSubmitError(errMsg);
          return;
        }
        const newAppointment = res.data?.appointment;
        if (newAppointment) {
          setAllAppointments((prev) => [newAppointment, ...prev]);
        }
        setShowAppointmentForm(false);
        setAppointmentForm(emptyAppointmentForm);
        setEditingAppointment(null);
        setAppointmentAgendaSettings(null);
        setAppointmentAgendaWarning(null);
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.calendar.errorSaveFailed;
      setAppointmentSubmitError(msg);
    } finally {
      setIsSubmittingAppointment(false);
    }
  };

  const handleCancelAppointment = async (appointment: Appointment) => {
    if (!confirm(t.calendar.confirmCancelAppointment)) return;
    const res = await api.put<{ success?: boolean; appointment?: Appointment; message?: string }>(
      `/appointments/${appointment.id}`,
      { status: 'cancelled' }
    );
    if (!res.success) {
      alert(res.data?.message || res.error || t.calendar.errorDeleteFailed);
      return;
    }
    const updated = res.data?.appointment;
    if (updated) {
      setAllAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    }
    setEditingAppointment(null);
    setShowAppointmentForm(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleMarkNoShow = async (appointment: Appointment) => {
    if (!confirm(t.calendar.confirmMarkNoShow)) return;
    const res = await api.put<{ success?: boolean; appointment?: Appointment; message?: string }>(
      `/appointments/${appointment.id}`,
      { status: 'no_show' }
    );
    if (!res.success) {
      alert(res.data?.message || res.error || t.calendar.errorDeleteFailed);
      return;
    }
    const updated = res.data?.appointment;
    if (updated) {
      setAllAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    }
    setEditingAppointment(null);
    setShowAppointmentForm(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  // Pacientes del formulario de cita
  const filterPatientsForClinic = useCallback(
    (patients: Patient[]) => {
      if (isClinicAdmin || isReceptionist) {
        const podiatristIds = clinicPodiatrists.map((p) => p.id);
        return patients.filter((p) => podiatristIds.includes(p.createdBy));
      }
      return patients.filter((p) => p.createdBy === user?.id);
    },
    [isClinicAdmin, isReceptionist, clinicPodiatrists, user?.id]
  );

  const clinicPatients = useMemo(
    () => filterPatientsForClinic(appointmentCompactPatients),
    [filterPatientsForClinic, appointmentCompactPatients]
  );

  const isAppointmentPatientInClinic = useCallback(
    (patient: Patient) => filterPatientsForClinic([patient]).length > 0,
    [filterPatientsForClinic]
  );

  useEffect(() => {
    if (!showAppointmentForm) {
      setAppointmentPatientPickerMode("loading");
      setAppointmentCompactPatients([]);
      return;
    }
    if (isPendingPatientMode) return;

    let cancelled = false;
    void fetchPatientPickerSample().then(({ patients, hasMore }) => {
      if (cancelled) return;
      const filtered = filterPatientsForClinic(patients);
      const useSearch =
        hasMore || patients.length > APPOINTMENT_PATIENT_SELECT_THRESHOLD;
      setAppointmentCompactPatients(filtered);
      setAppointmentPatientPickerMode(useSearch ? "search" : "select");
    });

    return () => {
      cancelled = true;
    };
  }, [showAppointmentForm, isPendingPatientMode, filterPatientsForClinic]);

  useEffect(() => {
    if (!showAppointmentForm || editingAppointment || isPendingPatientMode) return;
    if (appointmentPatientPickerMode !== "select") return;
    if (!clinicPatients.length) return;
    if (appointmentForm.patientId && clinicPatients.some((p) => p.id === appointmentForm.patientId)) return;
    setAppointmentForm((prev) => ({ ...prev, patientId: clinicPatients[0].id }));
  }, [
    showAppointmentForm,
    editingAppointment,
    isPendingPatientMode,
    appointmentPatientPickerMode,
    clinicPatients,
    appointmentForm.patientId,
  ]);

  const getAgendaExportDate = () => formatLocalDateString(selectedDate ?? currentDate);

  const resolveAgendaExportPodiatristId = (): string | undefined => {
    if (isPodiatrist) return undefined;
    if (podiatristFilter !== "all") return podiatristFilter;
    return undefined;
  };

  const handleDownloadAgendaIcs = async () => {
    if (isReceptionist && podiatristFilter === "all") {
      alert(t.calendar.exportSelectPodiatrist);
      return;
    }
    setAgendaExportBusy(true);
    try {
      const result = await downloadAgendaIcs(getAgendaExportDate(), resolveAgendaExportPodiatristId());
      if (!result.ok) alert(result.message);
    } finally {
      setAgendaExportBusy(false);
    }
  };

  const handleShareAgendaWhatsApp = async () => {
    if (isReceptionist && podiatristFilter === "all") {
      alert(t.calendar.exportSelectPodiatrist);
      return;
    }
    setAgendaExportBusy(true);
    try {
      const date = getAgendaExportDate();
      const podiatristId = resolveAgendaExportPodiatristId();
      const previewRes = await fetchAgendaExportPreview(date, podiatristId);
      if (!previewRes.ok) {
        alert(previewRes.message);
        return;
      }
      const preview = previewRes.data;
      const message = buildAgendaWhatsAppMessage(
        preview,
        {
          header: t.calendar.exportWaHeader,
          line: t.calendar.exportWaLine,
          emptyDay: t.calendar.exportNoAppointments,
          attachHint: t.calendar.exportWaAttachHint,
        },
        locale
      );
      const icsRes = await downloadAgendaIcs(date, podiatristId);
      if (!icsRes.ok) {
        alert(icsRes.message);
        return;
      }
      const directToPodiatrist = isReceptionist || isClinicAdmin;
      const waPhone = resolveAgendaWhatsAppPhone(preview, { directToPodiatrist });
      const waCountry = resolveAgendaWhatsAppCountry(preview, tenantCountry);
      const waRes = openAgendaWhatsAppWeb(message, waPhone, waCountry);
      if (!waRes.ok) {
        openAgendaWhatsAppWeb(message, null, waCountry);
      }
    } finally {
      setAgendaExportBusy(false);
    }
  };

  return (
    <MainLayout title={t.calendar.title} >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Calendar Area */}
        <div className="flex-1">
          {/* Calendar Header */}
          <div className="bg-brand-surface rounded-xl border border-brand-border p-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Navigation */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <button
                    onClick={navigatePrev}
                    className="p-2 hover:bg-brand-canvas rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-brand-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={navigateNext}
                    className="p-2 hover:bg-brand-canvas rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-brand-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                
                <h2 className="text-lg font-semibold text-brand-ink capitalize">
                  {viewMode === "month" && formatMonthYear()}
                  {viewMode === "week" && formatWeekRange()}
                  {viewMode === "day" && formatDayDate()}
                </h2>

                <button
                  onClick={goToToday}
                  className="px-3 py-1.5 text-sm font-medium text-brand-ink bg-brand-canvas rounded-lg hover:bg-brand-border/40 transition-colors"
                >
                  {t.calendar.today}
                </button>
              </div>

              {/* View Mode & Filters */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* New Appointment Button for Clinic Admin and Podiatrists */}
                {(isClinicAdmin || isPodiatrist || isReceptionist) && (
                  <button
                    onClick={() => openNewAppointmentForm(selectedDate || undefined)}
                    className="px-4 py-2 bg-brand-ink text-brand-ink-fg rounded-lg hover:bg-brand-ink-hover transition-colors font-medium flex items-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {t.calendar.newAppointment}
                  </button>
                )}

                {(isClinicAdmin || isPodiatrist || isReceptionist) && (
                  <>
                    <button
                      type="button"
                      onClick={handleDownloadAgendaIcs}
                      disabled={agendaExportBusy}
                      title={t.calendar.exportIcsHint}
                      className="px-3 py-2 text-sm font-medium border border-brand-border rounded-lg bg-brand-surface text-brand-ink hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {agendaExportBusy ? t.calendar.exportBusy : t.calendar.downloadIcs}
                    </button>
                    <button
                      type="button"
                      onClick={handleShareAgendaWhatsApp}
                      disabled={agendaExportBusy}
                      title={t.calendar.exportWaHint}
                      className={`${whatsappButtonSmClass} flex items-center gap-1.5`}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      {t.calendar.sendWhatsApp}
                    </button>
                  </>
                )}

                {/* Podiatrist filter for clinic admin */}
                {(isClinicAdmin || isReceptionist) && (
                  <select
                    value={podiatristFilter}
                    onChange={(e) => setPodiatristFilter(e.target.value)}
                    className="px-3 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface text-brand-ink focus:border-brand-ink focus:ring-1 focus:ring-brand-ink outline-none"
                  >
                    <option value="all">{t.calendar.allPodiatrists}</option>
                    {sortedClinicPodiatrists.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}

                {/* View Mode Toggle */}
                <div className="flex gap-1 bg-brand-canvas p-1 rounded-lg">
                  {(["month", "week", "day"] as ViewMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        viewMode === mode
                          ? "bg-brand-surface text-brand-ink shadow-sm"
                          : "text-brand-muted hover:text-brand-ink dark:hover:text-white"
                      }`}
                    >
                      {mode === "month" ? t.calendar.month : mode === "week" ? t.calendar.week : t.calendar.day}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {agendaMetrics && (
            <div className="space-y-4 mb-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-brand-surface rounded-xl border border-brand-border p-3">
                <p className="text-xs text-brand-muted">{t.calendar.scheduledMetric}</p>
                <p className="text-xl font-semibold text-brand-ink">{agendaMetrics.scheduled}</p>
              </div>
              <div className="bg-brand-surface rounded-xl border border-brand-border p-3">
                <p className="text-xs text-brand-muted">{t.calendar.completedMetric}</p>
                <p className="text-xl font-semibold text-brand-ink">{agendaMetrics.completed}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{agendaMetrics.completionRate}%</p>
              </div>
              <div className="bg-brand-surface rounded-xl border border-brand-border p-3">
                <p className="text-xs text-brand-muted">{t.calendar.noShow}</p>
                <p className="text-xl font-semibold text-brand-ink">{agendaMetrics.noShow}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{agendaMetrics.noShowRate}%</p>
              </div>
              <div className="bg-brand-surface rounded-xl border border-brand-border p-3">
                <p className="text-xs text-brand-muted">{t.calendar.waitlist}</p>
                <p className="text-xl font-semibold text-brand-ink">{waitlist.length}</p>
              </div>
            </div>
            {agendaMetrics && hasAgendaAnalytics && (
              <div className="bg-brand-surface rounded-xl border border-brand-border p-4">
                <p className="text-sm font-semibold text-brand-ink mb-1">{t.calendar.agendaDemandTitle}</p>
                <p className="text-xs text-brand-muted mb-2">
                  {t.calendar.agendaDemandDemandTotal.replace(
                    "{n}",
                    String(agendaMetrics.totals?.demand ?? 0)
                  )}
                </p>
                <Link
                  href="/checkout"
                  className="text-sm font-medium text-brand-ink underline-offset-2 hover:underline"
                >
                  {t.calendar.goToCheckoutAgendaLong}
                </Link>
              </div>
            )}
            {agendaMetrics && !hasAgendaAnalytics && (
              <div className="bg-brand-surface rounded-xl border border-brand-border p-4">
                <p className="text-sm font-semibold text-brand-ink mb-1 flex items-center gap-1.5">
                  <PremiumLockIcon />
                  {t.calendar.agendaDemandTitle}
                </p>
                <p className="text-xs text-brand-muted mb-2">{t.premium.agendaAnalyticsLockedBody}</p>
                <Link
                  href="/settings?tab=billing"
                  className="text-sm font-medium text-brand-ink underline-offset-2 hover:underline"
                >
                  {t.premium.upsellCta}
                </Link>
              </div>
            )}
            </div>
          )}

          {waitlist.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-4">
              <h3 className="text-sm font-semibold text-amber-900 mb-2">{t.calendar.waitlist}</h3>
              <ul className="space-y-1 text-sm text-amber-900">
                {waitlist.slice(0, 5).map((w) => (
                  <li key={w.id}>
                    {w.pendingPatientName || t.calendar.patientLabel} · {w.pendingPatientPhone || t.calendar.noPhoneShort}
                    {w.preferredDate
                      ? ` · ${t.calendar.preferredDateShort.replace("{date}", w.preferredDate)}`
                      : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Calendar Grid - overflow-x-auto en móvil para grid de 7 columnas */}
          <div className="bg-brand-surface rounded-xl border border-brand-border overflow-x-auto overscroll-contain">
            {/* Month View */}
            {viewMode === "month" && (
              <>
                {/* Day headers - min-w para scroll horizontal en móvil */}
                <div className="grid grid-cols-7 min-w-[400px] border-b border-brand-border">
                  {dayNames.map((day) => (
                    <div key={day} className="py-3 text-center text-sm font-medium text-brand-muted">
                      {day}
                    </div>
                  ))}
                </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 min-w-[400px]">
                {getMonthGrid().map((date, index) => {
                  const sessions = getSessionsForDate(date);
                  const appointments = getAppointmentsForDate(date);
                  const allItems = [
                    ...sessions.map((s) => ({ type: "session" as const, ...s })),
                    ...appointments.map((a) => ({ type: "appointment" as const, ...a })),
                  ];

                  const inCurrentMonth = isCurrentMonth(date);
                  const pastDay = isPastDay(date);
                  const weekend = isWeekend(date);
                  const selected = isSelected(date);

                  const baseCellClasses =
                    "min-h-[100px] p-2 border-b border-r border-gray-50 dark:border-gray-800 cursor-pointer transition-colors";
                  const backgroundClasses = !inCurrentMonth
                    ? "bg-gray-50/50 dark:bg-gray-900/50"
                    : selected
                      ? "bg-blue-50 ring-1 ring-blue-200 dark:bg-blue-950/40 dark:ring-blue-800"
                      : pastDay && !isToday(date)
                        ? "bg-brand-canvas/50"
                        : weekend
                          ? "bg-slate-50 dark:bg-gray-800/30"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800";

                  return (
                    <div
                      key={index}
                      onClick={() => setSelectedDate(date)}
                      className={`${baseCellClasses} ${backgroundClasses}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 text-sm rounded-full ${
                            isToday(date)
                              ? "bg-brand-ink text-brand-ink-fg font-semibold ring-2 ring-blue-300"
                              : !inCurrentMonth
                                ? "text-gray-400 dark:text-gray-600"
                                : pastDay
                                  ? "text-gray-400 dark:text-gray-500"
                                  : weekend
                                    ? "text-emerald-700 dark:text-emerald-400"
                                    : "text-brand-ink"
                          }`}
                        >
                          {date.getDate()}
                        </span>
                          {allItems.length > 0 && (
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              {allItems.length}
                            </span>
                          )}
                        </div>
                        
                        {/* Session/Appointment indicators */}
                        <div className="space-y-1">
                          {appointments.slice(0, 2).map((appt) => {
                            const chipStyle = appointmentChipStyle(appt.podiatristId);
                            const badge = podiatristBadge(appt.podiatristId, appt.podiatristName);
                            return (
                            <div
                              key={appt.id}
                              className={`text-xs px-1.5 py-0.5 rounded truncate border flex items-center gap-1 ${chipStyle.bg} ${chipStyle.border} ${chipStyle.text}`}
                              title={`${t.calendar.appointment} · ${appt.time}${colorByPodiatrist ? ` · ${appt.podiatristName}` : ""}`}
                            >
                              {badge && (
                                <span className="inline-flex items-center justify-center min-w-[1rem] h-4 px-0.5 rounded text-[8px] font-bold bg-brand-ink/10 border border-current/20 shrink-0">
                                  {badge}
                                </span>
                              )}
                              <span className="truncate min-w-0">
                                <span className="font-semibold uppercase tracking-wide text-[10px] opacity-80">
                                  {t.calendar.appointment}
                                </span>{" "}
                                <span className="font-medium">{appt.time}</span>{" "}
                                {colorByPodiatrist && !badge && (
                                  <span className="opacity-75">{appt.podiatristName.split(" ")[0]} · </span>
                                )}
                                {getPatientDisplayNameShort(appt)}
                              </span>
                            </div>
                            );
                          })}
                          {sessions.slice(0, Math.max(0, 3 - appointments.length)).map((session) => (
                            <div
                              key={session.id}
                              className={`text-xs px-1.5 py-0.5 rounded truncate border ${getStatusBg(session.status)}`}
                              title={`${t.calendar.session} · ${getSessionStatusLabel(session.status)}`}
                            >
                              <span className="font-semibold uppercase tracking-wide text-[10px] opacity-80">
                                {t.calendar.session}
                              </span>{" "}
                              {session.patient?.firstName} {session.patient?.lastName?.charAt(0)}.
                            </div>
                          ))}
                          {allItems.length > 3 && (
                            <div className="text-xs text-gray-500 px-1.5">
                              +{allItems.length - 3} {t.calendar.more}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Week View — rejilla horaria */}
            {viewMode === "week" && (
              <CalendarWeekTimeGrid
                days={getWeekGrid().map((date, index) => ({
                  date,
                  dayLabel: dayNames[index],
                  isToday: isToday(date),
                  isSelected: isSelected(date),
                  onSelect: () => setSelectedDate(date),
                }))}
                getTimedBlocks={buildTimedBlocksForDate}
                getUntimedBlocks={buildUntimedBlocksForDate}
                colorByPodiatrist={colorByPodiatrist}
                orderedPodiatristIds={orderedPodiatristIds}
                legend={podiatristLegend}
              />
            )}

            {/* Day View — rejilla horaria */}
            {viewMode === "day" && (
              <div className="p-4 sm:p-6">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div
                    className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                      isToday(currentDate) ? "bg-brand-ink text-brand-ink-fg" : "bg-brand-canvas text-brand-ink"
                    }`}
                  >
                    <span className="text-2xl font-semibold">{currentDate.getDate()}</span>
                    <span className="text-xs uppercase">
                      {currentDate.toLocaleDateString(locale, { weekday: "short" })}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-xl font-semibold text-brand-ink">
                      {getSessionsForDate(currentDate).length + getAppointmentsForDate(currentDate).length}{" "}
                      {t.calendar.events}
                    </h3>
                    <p className="text-sm text-brand-muted">
                      {currentDate.toLocaleDateString(locale, {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>
                  {(isClinicAdmin || isPodiatrist || isReceptionist) && (
                    <button
                      onClick={() => openNewAppointmentForm(currentDate)}
                      className="px-4 py-2 bg-brand-ink text-brand-ink-fg rounded-lg hover:bg-brand-ink-hover transition-colors font-medium flex items-center gap-2 text-sm min-h-[44px]"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      {t.calendar.addAppointment}
                    </button>
                  )}
                </div>

                {getAppointmentsForDate(currentDate).length === 0 &&
                getSessionsForDate(currentDate).length === 0 &&
                getCancelledAppointmentsForDate(currentDate).length === 0 ? (
                  <div className="text-center py-12 text-brand-muted">
                    <svg className="w-12 h-12 mx-auto text-brand-border mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>{t.calendar.noEventsForDay}</p>
                  </div>
                ) : colorByPodiatrist ? (
                  // Vista por columnas: un doctor por columna con su color (admin/recepción)
                  <CalendarDayResourceGrid
                    podiatrists={sortedClinicPodiatrists}
                    orderedPodiatristIds={orderedPodiatristIds}
                    getTimedBlocksForPodiatrist={(podiatristId) =>
                      buildTimedBlocksForDate(currentDate).filter((b) => b.podiatristId === podiatristId)
                    }
                    getUntimedBlocksForPodiatrist={(podiatristId) =>
                      buildUntimedBlocksForDate(currentDate).filter((b) => b.podiatristId === podiatristId)
                    }
                  />
                ) : (
                  <CalendarDayTimeGrid
                    date={currentDate}
                    timedBlocks={buildTimedBlocksForDate(currentDate)}
                    untimedBlocks={buildUntimedBlocksForDate(currentDate)}
                    colorByPodiatrist={colorByPodiatrist}
                    orderedPodiatristIds={orderedPodiatristIds}
                    legend={podiatristLegend}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Selected Date Details */}
        <div className="w-full lg:w-80 space-y-4">
          {/* Selected Date Panel */}
          {selectedDate && (
            <div className="bg-brand-surface rounded-xl border border-brand-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-brand-ink">
                  {selectedDate.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
                </h3>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {(isClinicAdmin || isPodiatrist) && (
                <button
                  onClick={() => openNewAppointmentForm(selectedDate)}
                  className="w-full mb-4 px-3 py-2 bg-brand-canvas text-brand-ink rounded-lg hover:bg-brand-border/40 transition-colors font-medium flex items-center justify-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {t.calendar.addAppointment}
                </button>
              )}

              {selectedDateAppointments.length === 0 &&
              selectedDateSessions.length === 0 &&
              selectedDateCancelled.length === 0 ? (
                <p className="text-sm text-brand-muted text-center py-4">
                  {t.calendar.noEventsForDay}
                </p>
              ) : (
                <div className="space-y-3">
                  {/* Appointments */}
                  {selectedDateAppointments.map((appt) => {
                    // Los podólogos solo pueden editar sus propias citas, los clinic admins pueden editar todas
                    const canEdit = isClinicAdmin || (isPodiatrist && appt.podiatristId === user?.id) || (isReceptionist && user?.assignedPodiatristIds?.includes(appt.podiatristId));
                    return (
                    <div
                      key={appt.id}
                      onClick={() => canEdit && openEditAppointmentForm(appt)}
                      className={`p-3 bg-blue-50 rounded-lg transition-colors ${canEdit ? "hover:bg-blue-100 cursor-pointer" : "cursor-default"}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-xs font-medium text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                          {t.calendar.appointment}
                        </span>
                        <span className="text-sm font-medium text-brand-ink">
                          {appt.time} - {getPatientDisplayName(appt)}
                        </span>
                        {!appt.patientId && (
                          <span className="text-[10px] text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">
                            {t.calendar.pendingBadge}
                          </span>
                        )}
                      </div>
                      {!appt.patientId && appt.pendingPatientPhone && (
                        <p className="text-xs text-gray-500">
                          {t.calendar.tel} {appt.pendingPatientPhone}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        {t.calendar.podiatristLabel} {appt.podiatristName}
                      </p>
                      {(isClinicAdmin || isReceptionist || isPodiatrist) && (
                        <select
                          className="mt-2 w-full text-xs border rounded px-2 py-1"
                          value={appt.checkInStatus || "none"}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            updateCheckIn(
                              appt.id,
                              e.target.value as "none" | "waiting" | "in_room" | "seen"
                            )
                          }
                        >
                          <option value="none">{checkInLabel("none")}</option>
                          <option value="waiting">{checkInLabel("waiting")}</option>
                          <option value="in_room">{checkInLabel("in_room")}</option>
                          <option value="seen">{checkInLabel("seen")}</option>
                        </select>
                      )}
                      {appt.notes && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{appt.notes}</p>
                      )}
                    </div>
                    );
                  })}
                  {/* Canceladas: en gris, solo informativas (el horario quedó libre) */}
                  {selectedDateCancelled.map((appt) => (
                    <div key={appt.id} className="p-3 bg-gray-100 rounded-lg opacity-75">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                        <span className="text-xs font-medium text-gray-600 bg-gray-200 px-1.5 py-0.5 rounded">
                          {t.calendar.legendCancelled}
                        </span>
                        <span className="text-sm font-medium text-gray-500 line-through">
                          {appt.time} - {getPatientDisplayName(appt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {t.calendar.podiatristLabel} {appt.podiatristName}
                      </p>
                    </div>
                  ))}
                  {/* Sessions */}
                  {selectedDateSessions.map((session) => (
                    <Link key={session.id} href={`/sessions?id=${session.id}`}>
                      <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(session.status)}`} />
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">
                            {t.calendar.session}
                          </span>
                          <span className="text-sm font-medium text-brand-ink">
                            {session.patient?.firstName} {session.patient?.lastName}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {session.clinicalNotes || session.diagnosis || t.calendar.noNotes}
                        </p>
                        {(isClinicAdmin || isReceptionist) && (
                          <p className="text-[10px] text-gray-400 mt-1">
                            {getPodiatristName(session.createdBy)}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upcoming Appointments */}
          {(isClinicAdmin || isPodiatrist) && upcomingAppointments.length > 0 && (
            <div className="bg-brand-surface rounded-xl border border-brand-border p-4">
              <h3 className="font-semibold text-brand-ink mb-4">
                {t.calendar.upcomingAppointments}
              </h3>
              
              <div className="space-y-3">
                {upcomingAppointments.slice(0, 5).map((appt) => {
                  // Los podólogos solo pueden editar sus propias citas, los clinic admins pueden editar todas
                  const canEdit = isClinicAdmin || (isPodiatrist && appt.podiatristId === user?.id) || (isReceptionist && user?.assignedPodiatristIds?.includes(appt.podiatristId));
                  return (
                  <div
                    key={appt.id}
                    onClick={() => canEdit && openEditAppointmentForm(appt)}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${canEdit ? "hover:bg-gray-50 cursor-pointer" : "cursor-default"}`}
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex flex-col items-center justify-center">
                      <span className="text-xs font-semibold text-blue-700">
                        {new Date(appt.date).getDate()}
                      </span>
                      <span className="text-[8px] text-blue-500 uppercase">
                        {new Date(appt.date).toLocaleDateString(locale, { month: "short" })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-brand-ink truncate">
                          {getPatientDisplayName(appt)}
                        </p>
                        {!appt.patientId && (
                          <span className="text-[10px] text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">{t.calendar.pendingShort}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {appt.time} • {appt.podiatristName}
                      </p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upcoming Sessions */}
          <div className="bg-brand-surface rounded-xl border border-brand-border p-4">
            <h3 className="font-semibold text-brand-ink mb-4">
              {t.calendar.upcomingSessions}
            </h3>
            
            {upcomingSessions.length === 0 ? (
              <p className="text-sm text-brand-muted text-center py-4">
                {t.calendar.noUpcomingSessions}
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.slice(0, 5).map((session) => {
                  // Para recepcionistas, llevar a la ficha del paciente; para el resto, a la sesión clínica
                  const href =
                    isReceptionist && session.patientId
                      ? `/patients?id=${session.patientId}`
                      : `/sessions?id=${session.id}`;

                  return (
                    <Link key={session.id} href={href}>
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                        <div className="flex-shrink-0 w-10 h-10 bg-brand-canvas rounded-lg flex flex-col items-center justify-center">
                          <span className="text-xs font-semibold text-brand-ink">
                            {new Date(session.sessionDate).getDate()}
                          </span>
                          <span className="text-[8px] text-gray-500 uppercase">
                            {new Date(session.sessionDate).toLocaleDateString(locale, { month: "short" })}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-brand-ink truncate">
                            {session.patient?.firstName} {session.patient?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {session.status === "completed" ? t.calendar.completed : t.calendar.draft}
                          </p>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(session.status)}`} />
                      </div>
                    </Link>
                  );
                })}
                {upcomingSessions.length > 5 && (
                  <p className="text-xs text-center text-gray-500">
                    +{upcomingSessions.length - 5} {t.calendar.more}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="bg-brand-surface rounded-xl border border-brand-border p-4">
            <h3 className="font-semibold text-brand-ink mb-3">{t.calendar.legend}</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-brand-muted">{t.calendar.legendAppointment}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-brand-muted">{t.calendar.legendSessionCompleted}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm text-brand-muted">{t.calendar.legendSessionDraft}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400" />
                <span className="text-sm text-brand-muted">{t.calendar.legendCancelled}</span>
              </div>
              <p className="text-xs text-brand-muted pt-2 border-t border-brand-border mt-2">
                {t.calendar.exportIcsHint}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Form Modal — portal flotante (evita fixed dentro de main) */}
      <AppModal open={showAppointmentForm} onClose={closeAppointmentForm} maxWidth="xl" panelId="appointment-form-panel">
        <form onSubmit={handleAppointmentSubmit} className="flex min-h-0 flex-1 flex-col">
          <AppModalHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-brand-ink">
                  {editingAppointment ? t.calendar.formTitleEdit : t.calendar.formTitleNew}
                </h3>
                {appointmentForm.date && (
                  <p className="text-sm text-brand-muted mt-1 truncate">
                    {new Date(`${appointmentForm.date}T12:00:00`).toLocaleDateString(locale, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                    {appointmentForm.time ? ` · ${appointmentForm.time}` : ""}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={closeAppointmentForm}
                className="p-2 hover:bg-brand-canvas rounded-lg transition-colors flex-shrink-0"
                aria-label={t.calendar.close}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </AppModalHeader>

          <AppModalBody className="space-y-5">
            {/* Patient Selection */}
            <section className="space-y-3">
              <label className={formLabelClass}>{t.calendar.patientLabel}</label>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-brand-canvas border border-brand-border">
                <button
                  type="button"
                  onClick={() => {
                    setAppointmentPatientMode("registered");
                    setAppointmentForm((prev) => ({
                      ...prev,
                      patientId: clinicPatients[0]?.id ?? "",
                      pendingPatientName: "",
                      pendingPatientPhone: "",
                    }));
                  }}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    !isPendingPatientMode
                      ? "bg-brand-surface text-brand-ink shadow-sm border border-brand-border"
                      : "text-brand-muted hover:text-brand-ink"
                  }`}
                >
                  {t.calendar.patientLabel}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAppointmentPatientMode("pending");
                    setAppointmentForm((prev) => ({
                      ...prev,
                      patientId: "",
                      pendingPatientName: "",
                      pendingPatientPhone: "",
                    }));
                  }}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isPendingPatientMode
                      ? "bg-brand-surface text-brand-ink shadow-sm border border-brand-border"
                      : "text-brand-muted hover:text-brand-ink"
                  }`}
                >
                  {t.calendar.patientPendingOption}
                </button>
              </div>

              {isPendingPatientMode ? (
                <div className={`${formPanelMutedClass} space-y-3`}>
                  <p className={formLabelClassXs}>{t.calendar.pendingPatientInfo}</p>
                  <div>
                    <label className={formLabelClassXs}>{t.calendar.nameRequired}</label>
                    <input
                      type="text"
                      value={appointmentForm.pendingPatientName}
                      onChange={(e) =>
                        setAppointmentForm((prev) => ({ ...prev, pendingPatientName: e.target.value }))
                      }
                      placeholder={t.calendar.namePlaceholder}
                      className={`${formFieldClassSm} mt-1`}
                      required
                    />
                  </div>
                  <div>
                    <label className={formLabelClassXs}>{t.calendar.phoneRequired}</label>
                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={appointmentForm.pendingPatientPhone}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^\d+\s\-()]/g, "");
                        setAppointmentForm((prev) => ({ ...prev, pendingPatientPhone: v }));
                      }}
                      placeholder={t.calendar.phonePlaceholder}
                      className={`${formFieldClassSm} mt-1`}
                      required
                      maxLength={20}
                      pattern="[\d+\s\-()]*"
                      title={t.calendar.phonePlaceholder}
                    />
                  </div>
                </div>
              ) : appointmentPatientPickerMode === "loading" ? (
                <p className={`text-sm ${formHintClass} py-2`}>{t.common.loading}</p>
              ) : appointmentPatientPickerMode === "search" ? (
                <PatientSearchSelect
                  value={appointmentForm.patientId || ""}
                  onChange={(patientId) =>
                    setAppointmentForm((prev) => ({
                      ...prev,
                      patientId,
                      pendingPatientName: "",
                      pendingPatientPhone: "",
                    }))
                  }
                  required
                  placeholder={t.patients.searchPatients}
                  isPatientEligible={isAppointmentPatientInClinic}
                />
              ) : (
                <select
                  value={appointmentForm.patientId || ""}
                  onChange={(e) =>
                    setAppointmentForm((prev) => ({
                      ...prev,
                      patientId: e.target.value,
                      pendingPatientName: "",
                      pendingPatientPhone: "",
                    }))
                  }
                  className={formFieldClassSm}
                  required
                >
                  <option value="" disabled>
                    {t.patients.selectPatient}
                  </option>
                  {clinicPatients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName}
                      {patient.email ? ` · ${patient.email}` : ""}
                    </option>
                  ))}
                </select>
              )}
            </section>

            {/* Podiatrist Selection */}
            <section>
              <label className={`${formLabelClass} mb-1`}>{t.calendar.podiatristRequired}</label>
              {isPodiatrist && !isClinicAdmin ? (
                <input
                  type="text"
                  value={user?.name || ""}
                  disabled
                  className={formFieldDisabledClassSm}
                />
              ) : (
                <select
                  value={appointmentForm.podiatristId}
                  onChange={(e) => setAppointmentForm((prev) => ({ ...prev, podiatristId: e.target.value }))}
                  className={formFieldClassSm}
                  required
                >
                  <option value="">{t.calendar.selectPodiatrist}</option>
                  {clinicPodiatrists.map((pod) => (
                    <option key={pod.id} value={pod.id}>
                      {pod.name}
                    </option>
                  ))}
                </select>
              )}
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <section>
                <label className={`${formLabelClass} mb-1`}>{t.calendar.dateRequired}</label>
                <input
                  type="date"
                  value={appointmentForm.date}
                  onChange={(e) => setAppointmentForm((prev) => ({ ...prev, date: e.target.value }))}
                  className={formFieldClassSm}
                  required
                />
              </section>
              <section>
                <label className={`${formLabelClass} mb-1`}>{t.calendar.timeRequired}</label>
                <input
                  type="time"
                  step={1800}
                  value={appointmentForm.time}
                  onChange={(e) => setAppointmentForm((prev) => ({ ...prev, time: e.target.value }))}
                  className={formFieldClassSm}
                  required
                />
              </section>
            </div>

            <section>
              <label className={`${formLabelClass} mb-1`}>{t.calendar.durationMinutes}</label>
              <select
                value={appointmentForm.duration}
                onChange={(e) =>
                  setAppointmentForm((prev) => ({ ...prev, duration: parseInt(e.target.value, 10) }))
                }
                className={formFieldClassSm}
              >
                <option value={15}>{t.calendar.duration15}</option>
                <option value={30}>{t.calendar.duration30}</option>
                <option value={45}>{t.calendar.duration45}</option>
                <option value={60}>{t.calendar.duration60}</option>
                <option value={90}>{t.calendar.duration90}</option>
              </select>
            </section>

            <section>
              <label className={`${formLabelClass} mb-1`}>{t.common.notes}</label>
              <textarea
                value={appointmentForm.notes}
                onChange={(e) => setAppointmentForm((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className={`${formFieldClassSm} resize-none`}
                placeholder={t.calendar.notesPlaceholder}
              />
            </section>

            {appointmentAgendaWarning && (
              <div
                className={`rounded-lg border px-3 py-2 text-sm ${
                  isReceptionist
                    ? "border-semantic-error/40 bg-semantic-error-bg/40 text-semantic-error"
                    : "border-amber-200 bg-amber-50 text-amber-900"
                }`}
              >
                {isReceptionist
                  ? `${appointmentAgendaWarning} ${t.calendar.outsideHoursReceptionistNote}`
                  : `${appointmentAgendaWarning} ${t.calendar.outsideHoursContinueNote}`}
              </div>
            )}

            {cancelledSlotOverlap && (
              <div className="rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-600">
                {t.calendar.cancelledSlotHint}
              </div>
            )}

            {appointmentSubmitError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm dark:bg-red-950/40 dark:border-red-900 dark:text-red-200">
                {appointmentSubmitError}
              </div>
            )}
          </AppModalBody>

          <AppModalFooter>
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              {editingAppointment && editingAppointment.status !== "cancelled" && editingAppointment.status !== "no_show" && (
                <>
                  <button
                    type="button"
                    onClick={() => void handleMarkNoShow(editingAppointment)}
                    className="px-4 py-2.5 border border-amber-200 text-amber-800 rounded-lg hover:bg-amber-50 transition-colors font-medium dark:border-amber-900 dark:text-amber-300 dark:hover:bg-amber-950/40"
                  >
                    {t.calendar.markNoShow}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCancelAppointment(editingAppointment)}
                    className="px-4 py-2.5 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
                  >
                    {t.calendar.cancelAppointmentButton}
                  </button>
                </>
              )}
              <div className="flex flex-1 gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={closeAppointmentForm}
                  disabled={isSubmittingAppointment}
                  className="flex-1 sm:flex-none px-4 py-2.5 border border-brand-border text-brand-ink rounded-lg hover:bg-brand-canvas transition-colors font-medium disabled:opacity-50"
                >
                  {editingAppointment ? t.calendar.close : t.common.cancel}
                </button>
                {(!editingAppointment || editingAppointment.status !== "cancelled") && (
                  <button
                    type="submit"
                    disabled={isSubmittingAppointment}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg hover:bg-brand-ink-hover transition-colors font-medium disabled:opacity-50"
                  >
                    {isSubmittingAppointment
                      ? editingAppointment
                        ? t.calendar.saving
                        : t.calendar.creating
                      : editingAppointment
                        ? t.calendar.saveChanges
                        : t.calendar.createAppointment}
                  </button>
                )}
              </div>
            </div>
          </AppModalFooter>
        </form>
      </AppModal>
    </MainLayout>
  );
};

export default CalendarPage;
