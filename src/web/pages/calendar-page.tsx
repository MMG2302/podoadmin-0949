import { useState, useMemo } from "react";
import { Link } from "wouter";
import { MainLayout } from "../components/layout/main-layout";
import { useLanguage } from "../contexts/language-context";
import { useAuth, getAllUsers } from "../contexts/auth-context";
import { usePermissions } from "../hooks/use-permissions";
import { getUserCredits, getSessions, getPatients, ClinicalSession, Patient } from "../lib/storage";

type ViewMode = "month" | "week" | "day";

interface SessionWithPatient extends ClinicalSession {
  patient: Patient | undefined;
}

const CalendarPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isClinicAdmin, isPodiatrist } = usePermissions();
  const credits = getUserCredits(user?.id || "");
  
  const allUsers = getAllUsers();
  const clinicPodiatrists = allUsers.filter(
    u => u.role === "podiatrist" && u.clinicId === user?.clinicId
  );
  
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [podiatristFilter, setPodiatristFilter] = useState<string>("all");

  // Get all sessions and patients
  const allSessions = getSessions();
  const allPatients = getPatients();

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
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  // Selected date sessions
  const selectedDateSessions = selectedDate ? getSessionsForDate(selectedDate) : [];

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

  const getPodiatristName = (podiatristId: string) => {
    const pod = clinicPodiatrists.find(p => p.id === podiatristId);
    return pod?.name || "Desconocido";
  };

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
              <div className="flex items-center gap-3">
                {/* Podiatrist filter for clinic admin */}
                {isClinicAdmin && (
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
                    const hasCompleted = sessions.some(s => s.status === "completed");
                    const hasDraft = sessions.some(s => s.status === "draft");
                    
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
                          {sessions.length > 0 && (
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              {sessions.length}
                            </span>
                          )}
                        </div>
                        
                        {/* Session indicators */}
                        <div className="space-y-1">
                          {sessions.slice(0, 3).map((session) => (
                            <div
                              key={session.id}
                              className={`text-xs px-1.5 py-0.5 rounded truncate ${getStatusBg(session.status)}`}
                            >
                              {session.patient?.firstName} {session.patient?.lastName?.charAt(0)}.
                            </div>
                          ))}
                          {sessions.length > 3 && (
                            <div className="text-xs text-gray-500 px-1.5">
                              +{sessions.length - 3} más
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

                {/* Sessions grid */}
                <div className="grid grid-cols-7 min-h-[400px]">
                  {getWeekGrid().map((date, index) => {
                    const sessions = getSessionsForDate(date);
                    return (
                      <div
                        key={index}
                        className={`border-r border-gray-50 p-2 ${
                          isSelected(date) ? "bg-blue-50/50" : ""
                        }`}
                      >
                        <div className="space-y-2">
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
                      {getSessionsForDate(currentDate).length} sesiones
                    </h3>
                    <p className="text-sm text-gray-500">
                      {currentDate.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {getSessionsForDate(currentDate).length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p>No hay sesiones programadas para este día</p>
                    </div>
                  ) : (
                    getSessionsForDate(currentDate).map((session) => (
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
                    ))
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

              {selectedDateSessions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay sesiones para este día
                </p>
              ) : (
                <div className="space-y-3">
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
                        {isClinicAdmin && (
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
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="font-semibold text-[#1a1a1a] mb-4">
              Próximas citas (7 días)
            </h3>
            
            {upcomingSessions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No hay citas próximas
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
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-gray-600">Completada</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm text-gray-600">Borrador</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400" />
                <span className="text-sm text-gray-600">Cancelada</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CalendarPage;
