export type AgendaSettings = {
  workdayStartHour: number;
  workdayEndHour: number;
  allowOvertime: boolean;
  overtimeStartHour: number;
  overtimeEndHour: number;
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
