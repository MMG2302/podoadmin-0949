export type AgendaSettings = {
  workdayStartHour: number;
  workdayEndHour: number;
  allowOvertime: boolean;
  overtimeStartHour: number;
  overtimeEndHour: number;
  rescheduleAlertIntervalMinutes: number;
  timezone: string;
};

export type AgendaBlockCategory = "lunch" | "personal" | "admin" | "vacation" | "other";
export type AgendaBlockRecurrence = "once" | "weekly";

/**
 * Tramo bloqueado de la agenda (comida, salida personal, vacaciones, festivo).
 * podiatristId null = bloqueo de toda la clínica. La ventana es [startTime, endTime)
 * y "24:00" significa fin del día, así que 00:00–24:00 es un bloqueo de día completo.
 */
export type AgendaBlock = {
  id: string;
  podiatristId: string | null;
  clinicId: string | null;
  title: string;
  category: AgendaBlockCategory;
  recurrence: AgendaBlockRecurrence;
  /** Días de la semana (0=domingo) en los que aplica, solo si recurrence="weekly". */
  weekdays: number[];
  startDate: string | null;
  endDate: string | null;
  startTime: string;
  endTime: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type SatisfactionSummary = {
  periodDays: number;
  fromDate: string;
  toDate: string;
  totals: { good: number; regular: number; bad: number; total: number; satisfactionRate: number };
  comments: Array<{
    appointmentId: string;
    rating: "good" | "regular" | "bad";
    comment: string;
    patientName: string | null;
    date: string;
    createdAt: string | null;
  }>;
};

export type AppointmentAgendaMetrics = {
  periodDays: number;
  fromDate: string;
  toDate: string;
  demandByWeekday: Array<{ weekday: number; label: string; count: number }>;
  topDemandDays: Array<{ date: string; label: string; count: number }>;
  busyHours: Array<{ hour: number; label: string; count: number }>;
  topBusyHours: Array<{ hour: number; label: string; count: number }>;
  occupancy: {
    occupiedMinutes: number;
    availableMinutes: number;
    percent: number;
    workdayStartHour: number;
    workdayEndHour: number;
  };
  avgDurationByReason: Array<{ reason: string; count: number; avgMinutes: number }>;
  totals: {
    attended: number;
    noShow: number;
    cancelled: number;
    scheduled: number;
    demand: number;
    cancellationRate: number;
    noShowRate: number;
  };
};

export type DailyCloseSnapshot = {
  id: string;
  closeDate: string;
  podiatristId: string;
  clinicId: string | null;
  paidCents: number;
  paidCount: number;
  pendingCents: number;
  pendingCount: number;
  byMethod: Record<string, { totalCents: number; count: number }>;
  notes: string | null;
  closedBy: string;
  closedAt: string;
};

export type DailyCloseTodayStatus = {
  closeDate: string;
  closed: boolean;
  close: DailyCloseSnapshot | null;
  live: {
    closeDate: string;
    paidCents: number;
    paidCount: number;
    pendingCents: number;
    pendingCount: number;
    byMethod: Record<string, { totalCents: number; count: number }>;
    paidAfterCloseCents: number;
  };
};
