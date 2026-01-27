import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { MainLayout } from "../components/layout/main-layout";
import { useLanguage } from "../contexts/language-context";
import { useAuth, getAllUsers } from "../contexts/auth-context";
import { usePermissions } from "../hooks/use-permissions";
import { 
  getUserCredits, 
  getSessions, 
  getPatients, 
  getPatientById,
  ClinicalSession, 
  Patient,
  Appointment,
  getAppointments,
  getAppointmentsByClinic,
  saveAppointment,
  updateAppointment,
  deleteAppointment,
  addAuditLog,
  addNotification,
} from "../lib/storage";

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

const CalendarPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isClinicAdmin, isPodiatrist, isReceptionist } = usePermissions();
  const credits = getUserCredits(user?.id || "");
  
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
  
  // Appointment form state (for clinic admin)
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState<AppointmentFormData>(emptyAppointmentForm);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  // Get all sessions, patients, and appointments (refresh when trigger changes)
  const allSessions = getSessions();
  const allPatients = getPatients();
  const allAppointments = (isClinicAdmin && user?.clinicId
    ? getAppointmentsByClinic(user.clinicId)
    : isReceptionist && user?.assignedPodiatristIds?.length
    ? getAppointments().filter((a) => user.assignedPodiatristIds!.includes(a.podiatristId))
    : getAppointments().filter((a) => a.podiatristId === user?.id));
  
  // Force re-render when appointments change
  useEffect(() => {
    // This effect will run when refreshTrigger changes, causing a re-render
  }, [refreshTrigger]);

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
      podiatristName: clinicPodiatrists.find(p => p.id === a.podiatristId)?.name || "Desconocido",
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

  // Get sessions for a specific date
  const getSessionsForDate = (date: Date): SessionWithPatient[] => {
    const dateStr = date.toISOString().split("T")[0];
    return filteredSessions.filter(s => s.sessionDate.split("T")[0] === dateStr);
  };

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date): AppointmentWithDetails[] => {
    const dateStr = date.toISOString().split("T")[0];
    return filteredAppointments.filter(a => a.date === dateStr && a.status !== "cancelled");
  };

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

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const formatMonthYear = () => {
    return currentDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  };

  const formatWeekRange = () => {
    const weekDays = getWeekGrid();
    const start = weekDays[0];
    const end = weekDays[6];
    return `${start.getDate()} - ${end.getDate()} ${end.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}`;
  };

  const formatDayDate = () => {
    return currentDate.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };

  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

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

  // Selected date sessions and appointments
  const selectedDateSessions = selectedDate ? getSessionsForDate(selectedDate) : [];
  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];

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
    return pod?.name || "Desconocido";
  };

  const getPatientDisplayName = (appointment: AppointmentWithDetails) => {
    if (!appointment.patientId || !appointment.patient) {
      return appointment.pendingPatientName || "Paciente pendiente";
    }
    return `${appointment.patient.firstName} ${appointment.patient.lastName}`;
  };

  const getPatientDisplayNameShort = (appointment: AppointmentWithDetails) => {
    if (!appointment.patientId || !appointment.patient) {
      return appointment.pendingPatientName || "Pendiente";
    }
    return `${appointment.patient.firstName} ${appointment.patient.lastName?.charAt(0)}.`;
  };

  // Appointment form handlers
  const openNewAppointmentForm = (date?: Date) => {
    setEditingAppointment(null);
    let defaultPodiatristId = "";
    if (isPodiatrist && !isClinicAdmin) defaultPodiatristId = user?.id || "";
    else if (isReceptionist && user?.assignedPodiatristIds?.length === 1) defaultPodiatristId = user.assignedPodiatristIds[0];
    setAppointmentForm({
      ...emptyAppointmentForm,
      date: date ? date.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      podiatristId: defaultPodiatristId,
    });
    setShowAppointmentForm(true);
  };

  const openEditAppointmentForm = (appointment: Appointment) => {
    setEditingAppointment(appointment);
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

  const handleAppointmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appointmentForm.podiatristId || !appointmentForm.date) {
      return;
    }

    // Convert empty string to null for pending patient
    const patientId = appointmentForm.patientId === "" ? null : appointmentForm.patientId;
    
    // Validar que si es paciente pendiente, se proporcionen nombre y teléfono
    if (patientId === null) {
      if (!appointmentForm.pendingPatientName || !appointmentForm.pendingPatientPhone) {
        alert("Por favor, complete el nombre y teléfono del paciente pendiente.");
        return;
      }
    }

    if (editingAppointment) {
      const previousPodiatristId = editingAppointment.podiatristId;
      const newPodiatristId = appointmentForm.podiatristId;
      
      updateAppointment(editingAppointment.id, {
        patientId: patientId,
        podiatristId: appointmentForm.podiatristId,
        date: appointmentForm.date,
        time: appointmentForm.time,
        duration: appointmentForm.duration,
        notes: appointmentForm.notes,
        // Si se asigna un paciente existente, limpiar campos de paciente pendiente
        // Si es paciente pendiente, guardar nombre y teléfono
        pendingPatientName: patientId === null ? (appointmentForm.pendingPatientName || undefined) : undefined,
        pendingPatientPhone: patientId === null ? (appointmentForm.pendingPatientPhone || undefined) : undefined,
      });
      
      // Send notification if podiatrist changed
      if (previousPodiatristId !== newPodiatristId) {
        const assignedPodiatrist = allUsers.find(u => u.id === newPodiatristId);
        const patient = patientId ? getPatientById(patientId) : null;
        const appointmentDate = new Date(`${appointmentForm.date}T${appointmentForm.time}`);
        const formattedDate = appointmentDate.toLocaleDateString("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        const formattedTime = appointmentForm.time;
        
        if (assignedPodiatrist) {
          addNotification({
            userId: assignedPodiatrist.id,
            type: "appointment",
            title: "Cita reasignada",
            message: patientId && patient
              ? `Se te ha reasignado una cita con ${patient.firstName} ${patient.lastName} el ${formattedDate} a las ${formattedTime}`
              : `Se te ha reasignado una cita programada el ${formattedDate} a las ${formattedTime}${appointmentForm.notes ? ` - ${appointmentForm.notes}` : ""}`,
            metadata: {
              appointmentDate: appointmentForm.date,
              reason: appointmentForm.notes || undefined,
              fromUserId: user?.id,
              fromUserName: user?.name,
              patientId: patientId || undefined,
              patientName: patient ? `${patient.firstName} ${patient.lastName}` : undefined,
            },
          });
        }
      }
      
      addAuditLog({
        userId: user?.id || "",
        userName: user?.name || "",
        action: "UPDATE_APPOINTMENT",
        entityType: "appointment",
        entityId: editingAppointment.id,
        details: JSON.stringify({
          appointmentId: editingAppointment.id,
          patientId: patientId,
          podiatristId: appointmentForm.podiatristId,
          date: appointmentForm.date,
        }),
      });
    } else {
      const newAppointment = saveAppointment({
        patientId: patientId,
        podiatristId: appointmentForm.podiatristId,
        clinicId: user?.clinicId || "",
        date: appointmentForm.date,
        time: appointmentForm.time,
        duration: appointmentForm.duration,
        notes: appointmentForm.notes,
        status: "scheduled",
        createdBy: user?.id || "",
        pendingPatientName: patientId === null ? appointmentForm.pendingPatientName : undefined,
        pendingPatientPhone: patientId === null ? appointmentForm.pendingPatientPhone : undefined,
      });
      
      // Send notification to assigned podiatrist
      const assignedPodiatrist = allUsers.find(u => u.id === appointmentForm.podiatristId);
      const patient = patientId ? getPatientById(patientId) : null;
      const appointmentDate = new Date(`${appointmentForm.date}T${appointmentForm.time}`);
      const formattedDate = appointmentDate.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const formattedTime = appointmentForm.time;
      
      if (assignedPodiatrist) {
        addNotification({
          userId: assignedPodiatrist.id,
          type: "appointment",
          title: "Nueva cita asignada",
          message: patientId && patient
            ? `Tienes una nueva cita con ${patient.firstName} ${patient.lastName} el ${formattedDate} a las ${formattedTime}`
            : `Tienes una nueva cita programada el ${formattedDate} a las ${formattedTime}${appointmentForm.notes ? ` - ${appointmentForm.notes}` : ""}`,
          metadata: {
            appointmentDate: appointmentForm.date,
            reason: appointmentForm.notes || undefined,
            fromUserId: user?.id,
            fromUserName: user?.name,
            patientId: patientId || undefined,
            patientName: patient ? `${patient.firstName} ${patient.lastName}` : undefined,
          },
        });
      }
      
      addAuditLog({
        userId: user?.id || "",
        userName: user?.name || "",
        action: "CREATE_APPOINTMENT",
        entityType: "appointment",
        entityId: newAppointment.id,
        details: JSON.stringify({
          appointmentId: newAppointment.id,
          patientId: patientId,
          podiatristId: appointmentForm.podiatristId,
          date: appointmentForm.date,
        }),
      });
    }
    
    setShowAppointmentForm(false);
    setAppointmentForm(emptyAppointmentForm);
    setEditingAppointment(null);
  };

  const handleCancelAppointment = (appointment: Appointment) => {
    if (confirm("¿Cancelar esta cita?")) {
      updateAppointment(appointment.id, { status: "cancelled" });
      
      addAuditLog({
        userId: user?.id || "",
        userName: user?.name || "",
        action: "CANCEL_APPOINTMENT",
        entityType: "appointment",
        entityId: appointment.id,
        details: JSON.stringify({
          appointmentId: appointment.id,
          patientId: appointment.patientId,
        }),
      });
      
      // Trigger refresh to update the view
      setRefreshTrigger(prev => prev + 1);
    }
  };

  // Get clinic patients for the form (podólogos de la clínica, o del usuario, o de los asignados a la recepcionista)
  const clinicPatients = useMemo(() => {
    if (isClinicAdmin || isReceptionist) {
      const podiatristIds = clinicPodiatrists.map(p => p.id);
      return allPatients.filter(p => podiatristIds.includes(p.createdBy));
    }
    return allPatients.filter(p => p.createdBy === user?.id);
  }, [allPatients, isClinicAdmin, isReceptionist, clinicPodiatrists, user]);

  return (
    <MainLayout title="Calendario" credits={credits}>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Calendar Area */}
        <div className="flex-1">
          {/* Calendar Header */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Navigation */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <button
                    onClick={navigatePrev}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-[#1a1a1a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={navigateNext}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-[#1a1a1a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                
                <h2 className="text-lg font-semibold text-[#1a1a1a] capitalize">
                  {viewMode === "month" && formatMonthYear()}
                  {viewMode === "week" && formatWeekRange()}
                  {viewMode === "day" && formatDayDate()}
                </h2>

                <button
                  onClick={goToToday}
                  className="px-3 py-1.5 text-sm font-medium text-[#1a1a1a] bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Hoy
                </button>
              </div>

              {/* View Mode & Filters */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* New Appointment Button for Clinic Admin and Podiatrists */}
                {(isClinicAdmin || isPodiatrist || isReceptionist) && (
                  <button
                    onClick={() => openNewAppointmentForm(selectedDate || undefined)}
                    className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors font-medium flex items-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Nueva Cita
                  </button>
                )}

                {/* Podiatrist filter for clinic admin */}
                {(isClinicAdmin || isReceptionist) && (
                  <select
                    value={podiatristFilter}
                    onChange={(e) => setPodiatristFilter(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] outline-none"
                  >
                    <option value="all">Todos los podólogos</option>
                    {clinicPodiatrists.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}

                {/* View Mode Toggle */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                  {(["month", "week", "day"] as ViewMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        viewMode === mode
                          ? "bg-white text-[#1a1a1a] shadow-sm"
                          : "text-gray-600 hover:text-[#1a1a1a]"
                      }`}
                    >
                      {mode === "month" ? "Mes" : mode === "week" ? "Semana" : "Día"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Month View */}
            {viewMode === "month" && (
              <>
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-gray-100">
                  {dayNames.map((day) => (
                    <div key={day} className="py-3 text-center text-sm font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7">
                  {getMonthGrid().map((date, index) => {
                    const sessions = getSessionsForDate(date);
                    const appointments = getAppointmentsForDate(date);
                    const allItems = [...sessions.map(s => ({ type: 'session' as const, ...s })), ...appointments.map(a => ({ type: 'appointment' as const, ...a }))];
                    
                    return (
                      <div
                        key={index}
                        onClick={() => setSelectedDate(date)}
                        className={`min-h-[100px] p-2 border-b border-r border-gray-50 cursor-pointer transition-colors ${
                          !isCurrentMonth(date) ? "bg-gray-50/50" : "hover:bg-gray-50"
                        } ${isSelected(date) ? "bg-blue-50 ring-1 ring-blue-200" : ""}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`inline-flex items-center justify-center w-7 h-7 text-sm rounded-full ${
                            isToday(date) 
                              ? "bg-[#1a1a1a] text-white font-semibold" 
                              : isCurrentMonth(date) 
                                ? "text-[#1a1a1a]" 
                                : "text-gray-400"
                          }`}>
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
                          {appointments.slice(0, 2).map((appt) => (
                            <div
                              key={appt.id}
                              className="text-xs px-1.5 py-0.5 rounded truncate bg-blue-50 border border-blue-200 text-blue-700"
                            >
                              <span className="font-medium">{appt.time}</span> {getPatientDisplayNameShort(appt)}
                            </div>
                          ))}
                          {sessions.slice(0, Math.max(0, 3 - appointments.length)).map((session) => (
                            <div
                              key={session.id}
                              className={`text-xs px-1.5 py-0.5 rounded truncate ${getStatusBg(session.status)}`}
                            >
                              {session.patient?.firstName} {session.patient?.lastName?.charAt(0)}.
                            </div>
                          ))}
                          {allItems.length > 3 && (
                            <div className="text-xs text-gray-500 px-1.5">
                              +{allItems.length - 3} más
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Week View */}
            {viewMode === "week" && (
              <>
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-gray-100">
                  {getWeekGrid().map((date, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedDate(date)}
                      className={`py-3 text-center cursor-pointer hover:bg-gray-50 transition-colors ${
                        isSelected(date) ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="text-sm text-gray-500">{dayNames[index]}</div>
                      <div className={`text-lg font-semibold mt-1 ${
                        isToday(date) 
                          ? "text-white bg-[#1a1a1a] rounded-full w-8 h-8 flex items-center justify-center mx-auto" 
                          : "text-[#1a1a1a]"
                      }`}>
                        {date.getDate()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sessions/appointments grid */}
                <div className="grid grid-cols-7 min-h-[400px]">
                  {getWeekGrid().map((date, index) => {
                    const sessions = getSessionsForDate(date);
                    const appointments = getAppointmentsForDate(date);
                    return (
                      <div
                        key={index}
                        className={`border-r border-gray-50 p-2 ${
                          isSelected(date) ? "bg-blue-50/50" : ""
                        }`}
                      >
                        <div className="space-y-2">
                          {appointments.map((appt) => {
                            // Los podólogos solo pueden editar sus propias citas, los clinic admins pueden editar todas
                            const canEdit = isClinicAdmin || (isPodiatrist && appt.podiatristId === user?.id) || (isReceptionist && user?.assignedPodiatristIds?.includes(appt.podiatristId));
                            return (
                            <div
                              key={appt.id}
                              onClick={() => canEdit && openEditAppointmentForm(appt)}
                              className={`p-2 rounded-lg border transition-shadow bg-blue-50 border-blue-200 text-blue-700 ${canEdit ? "cursor-pointer hover:shadow-sm" : "cursor-default"}`}
                            >
                              <p className="text-xs font-semibold">{appt.time}</p>
                              <p className="text-xs truncate">
                                {getPatientDisplayName(appt)}
                              </p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <p className="text-[10px] opacity-70">
                                  Cita
                                </p>
                                {!appt.patientId && (
                                  <span className="text-[9px] text-orange-600 bg-orange-100 px-1 py-0.5 rounded">Pendiente</span>
                                )}
                              </div>
                            </div>
                            );
                          })}
                          {sessions.map((session) => (
                            <Link key={session.id} href={`/sessions?id=${session.id}`}>
                              <div className={`p-2 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow ${getStatusBg(session.status)}`}>
                                <p className="text-xs font-medium truncate">
                                  {session.patient?.firstName} {session.patient?.lastName}
                                </p>
                                <p className="text-[10px] mt-0.5 opacity-70">
                                  {session.status === "completed" ? "Completada" : "Borrador"}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Day View */}
            {viewMode === "day" && (
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center ${
                    isToday(currentDate) ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-[#1a1a1a]"
                  }`}>
                    <span className="text-2xl font-semibold">{currentDate.getDate()}</span>
                    <span className="text-xs uppercase">{currentDate.toLocaleDateString("es-ES", { weekday: "short" })}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#1a1a1a]">
                      {getSessionsForDate(currentDate).length + getAppointmentsForDate(currentDate).length} eventos
                    </h3>
                    <p className="text-sm text-gray-500">
                      {currentDate.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
                    </p>
                  </div>
                  {(isClinicAdmin || isPodiatrist || isReceptionist) && (
                    <button
                      onClick={() => openNewAppointmentForm(currentDate)}
                      className="ml-auto px-4 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors font-medium flex items-center gap-2 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Añadir Cita
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {getAppointmentsForDate(currentDate).length === 0 && getSessionsForDate(currentDate).length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p>No hay eventos para este día</p>
                    </div>
                  ) : (
                    <>
                      {/* Appointments first */}
                      {getAppointmentsForDate(currentDate).map((appt) => (
                        <div
                          key={appt.id}
                          className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100"
                        >
                          <div className="w-1.5 h-12 rounded-full bg-blue-500" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-blue-700">{appt.time}</span>
                              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">Cita programada</span>
                              {!appt.patientId && (
                                <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded">Paciente pendiente</span>
                              )}
                            </div>
                            <p className="font-medium text-[#1a1a1a]">
                              {getPatientDisplayName(appt)}
                            </p>
                            {!appt.patientId && appt.pendingPatientPhone && (
                              <p className="text-xs text-gray-500">
                                Tel: {appt.pendingPatientPhone}
                              </p>
                            )}
                            <p className="text-sm text-gray-500">
                              Podólogo: {appt.podiatristName} • {appt.duration} min
                            </p>
                            {appt.notes && (
                              <p className="text-sm text-gray-400 mt-1">{appt.notes}</p>
                            )}
                          </div>
                          {(isClinicAdmin || isPodiatrist || isReceptionist) && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditAppointmentForm(appt)}
                                className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleCancelAppointment(appt)}
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                title="Cancelar"
                              >
                                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      {/* Then sessions */}
                      {getSessionsForDate(currentDate).map((session) => (
                        <Link key={session.id} href={`/sessions?id=${session.id}`}>
                          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                            <div className={`w-1.5 h-12 rounded-full ${getStatusColor(session.status)}`} />
                            <div className="flex-1">
                              <p className="font-medium text-[#1a1a1a]">
                                {session.patient?.firstName} {session.patient?.lastName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {session.diagnosis || "Sin diagnóstico"}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              session.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                            }`}>
                              {session.status === "completed" ? "Completada" : "Borrador"}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Selected Date Details */}
        <div className="w-full lg:w-80 space-y-4">
          {/* Selected Date Panel */}
          {selectedDate && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#1a1a1a]">
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
                  className="w-full mb-4 px-3 py-2 bg-gray-100 text-[#1a1a1a] rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Añadir cita
                </button>
              )}

              {selectedDateAppointments.length === 0 && selectedDateSessions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay eventos para este día
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
                        <span className="text-sm font-medium text-[#1a1a1a]">
                          {appt.time} - {getPatientDisplayName(appt)}
                        </span>
                        {!appt.patientId && (
                          <span className="text-[10px] text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">Pendiente</span>
                        )}
                      </div>
                      {!appt.patientId && appt.pendingPatientPhone && (
                        <p className="text-xs text-gray-500">
                          Tel: {appt.pendingPatientPhone}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Podólogo: {appt.podiatristName}
                      </p>
                      {appt.notes && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{appt.notes}</p>
                      )}
                    </div>
                    );
                  })}
                  {/* Sessions */}
                  {selectedDateSessions.map((session) => (
                    <Link key={session.id} href={`/sessions?id=${session.id}`}>
                      <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(session.status)}`} />
                          <span className="text-sm font-medium text-[#1a1a1a]">
                            {session.patient?.firstName} {session.patient?.lastName}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {session.clinicalNotes || session.diagnosis || "Sin notas"}
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
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="font-semibold text-[#1a1a1a] mb-4">
                Próximas citas
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
                        {new Date(appt.date).toLocaleDateString("es-ES", { month: "short" })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[#1a1a1a] truncate">
                          {getPatientDisplayName(appt)}
                        </p>
                        {!appt.patientId && (
                          <span className="text-[10px] text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">Pendiente</span>
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
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="font-semibold text-[#1a1a1a] mb-4">
              Sesiones próximas (7 días)
            </h3>
            
            {upcomingSessions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No hay sesiones próximas
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.slice(0, 5).map((session) => (
                  <Link key={session.id} href={`/sessions?id=${session.id}`}>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex flex-col items-center justify-center">
                        <span className="text-xs font-semibold text-[#1a1a1a]">
                          {new Date(session.sessionDate).getDate()}
                        </span>
                        <span className="text-[8px] text-gray-500 uppercase">
                          {new Date(session.sessionDate).toLocaleDateString("es-ES", { month: "short" })}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1a1a1a] truncate">
                          {session.patient?.firstName} {session.patient?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {session.status === "completed" ? "Completada" : "Borrador"}
                        </p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(session.status)}`} />
                    </div>
                  </Link>
                ))}
                {upcomingSessions.length > 5 && (
                  <p className="text-xs text-center text-gray-500">
                    +{upcomingSessions.length - 5} más
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="font-semibold text-[#1a1a1a] mb-3">Leyenda</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-gray-600">Cita programada</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-gray-600">Sesión completada</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm text-gray-600">Sesión borrador</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400" />
                <span className="text-sm text-gray-600">Cancelada</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Form Modal */}
      {showAppointmentForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-[#1a1a1a]">
                  {editingAppointment ? "Editar Cita" : "Nueva Cita"}
                </h3>
                <button
                  onClick={() => {
                    setShowAppointmentForm(false);
                    setEditingAppointment(null);
                    setAppointmentForm(emptyAppointmentForm);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleAppointmentSubmit} className="p-6 space-y-4">
              {/* Patient Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paciente
                </label>
                <select
                  value={appointmentForm.patientId || ""}
                  onChange={(e) => setAppointmentForm(prev => ({ 
                    ...prev, 
                    patientId: e.target.value || null,
                    // Limpiar campos de paciente pendiente si se selecciona un paciente existente
                    pendingPatientName: e.target.value ? "" : prev.pendingPatientName,
                    pendingPatientPhone: e.target.value ? "" : prev.pendingPatientPhone,
                  }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                >
                  <option value="">Paciente pendiente de registrar</option>
                  {clinicPatients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName} - {patient.email}
                    </option>
                  ))}
                </select>
                {(appointmentForm.patientId === "" || appointmentForm.patientId === null) && (
                  <div className="mt-3 space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      Información del paciente pendiente:
                    </p>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={appointmentForm.pendingPatientName}
                        onChange={(e) => setAppointmentForm(prev => ({ ...prev, pendingPatientName: e.target.value }))}
                        placeholder="Nombre completo del paciente"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                        required={appointmentForm.patientId === "" || appointmentForm.patientId === null}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        value={appointmentForm.pendingPatientPhone}
                        onChange={(e) => setAppointmentForm(prev => ({ ...prev, pendingPatientPhone: e.target.value }))}
                        placeholder="Teléfono de contacto"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                        required={appointmentForm.patientId === "" || appointmentForm.patientId === null}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Podiatrist Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Podólogo *
                </label>
                {isPodiatrist && !isClinicAdmin ? (
                  <input
                    type="text"
                    value={user?.name || ""}
                    disabled
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                ) : (
                  <select
                    value={appointmentForm.podiatristId}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, podiatristId: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                    required
                  >
                    <option value="">Seleccionar podólogo</option>
                    {clinicPodiatrists.map(pod => (
                      <option key={pod.id} value={pod.id}>
                        {pod.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={appointmentForm.date}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                  required
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora *
                </label>
                <input
                  type="time"
                  value={appointmentForm.time}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                  required
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duración (minutos)
                </label>
                <select
                  value={appointmentForm.duration}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                >
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>1 hora</option>
                  <option value={90}>1 hora 30 minutos</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={appointmentForm.notes}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] resize-none"
                  placeholder="Motivo de la cita, comentarios adicionales..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                {editingAppointment && editingAppointment.status !== "cancelled" && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("¿Cancelar esta cita?")) {
                        handleCancelAppointment(editingAppointment);
                        setShowAppointmentForm(false);
                        setEditingAppointment(null);
                        setAppointmentForm(emptyAppointmentForm);
                      }
                    }}
                    className="px-4 py-2.5 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium"
                  >
                    Cancelar Cita
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowAppointmentForm(false);
                    setEditingAppointment(null);
                    setAppointmentForm(emptyAppointmentForm);
                  }}
                  className={`px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium ${editingAppointment && editingAppointment.status !== "cancelled" ? "flex-1" : ""}`}
                >
                  {editingAppointment ? "Cerrar" : "Cancelar"}
                </button>
                {(!editingAppointment || editingAppointment.status !== "cancelled") && (
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors font-medium"
                  >
                    {editingAppointment ? "Guardar Cambios" : "Crear Cita"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default CalendarPage;
