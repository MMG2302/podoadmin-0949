import { and, eq, gte, inArray, lte } from 'drizzle-orm';
import { database } from '../database';
import { appointments as appointmentsTable } from '../database/schema';
import type { ClinicalListScope } from './clinical-list-scope';
import {
  DEFAULT_AGENDA_SETTINGS,
  type AgendaSettings,
  resolveAgendaSettingsForPodiatrist,
} from './agenda-settings';

export type AppointmentMetricsResult = {
  periodDays: number;
  fromDate: string;
  toDate: string;
  /** Citas completadas por día (calendario). */
  attendedPerDay: Array<{ date: string; count: number }>;
  /** Demanda = citas programadas/confirmadas/completadas/no_show (sin canceladas). */
  demandPerDay: Array<{ date: string; count: number }>;
  /** Agregado por día de la semana (0=domingo … 6=sábado), etiquetas en es. */
  demandByWeekday: Array<{ weekday: number; label: string; count: number }>;
  /** Top días con más demanda en el periodo. */
  topDemandDays: Array<{ date: string; label: string; count: number }>;
  /** Demanda por hora de inicio (0–23). */
  busyHours: Array<{ hour: number; label: string; count: number }>;
  /** Top horas pico. */
  topBusyHours: Array<{ hour: number; label: string; count: number }>;
  occupancy: {
    occupiedMinutes: number;
    availableMinutes: number;
    percent: number;
    workdayStartHour: number;
    workdayEndHour: number;
  };
  avgDurationByReason: Array<{
    reason: string;
    count: number;
    avgMinutes: number;
  }>;
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

const WEEKDAY_LABELS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function isDemandStatus(status: string): boolean {
  return status === 'scheduled' || status === 'confirmed' || status === 'completed' || status === 'no_show';
}

function parseDuration(notes: string | null): number {
  if (!notes) return 30;
  try {
    const p = JSON.parse(notes);
    if (typeof p === 'object' && p && typeof p.duration === 'number') {
      return Math.min(480, Math.max(5, p.duration));
    }
  } catch {
    /* plain text notes */
  }
  return 30;
}

function parseHour(sessionTime: string): number {
  const h = Number.parseInt(String(sessionTime).slice(0, 2), 10);
  return Number.isFinite(h) ? Math.min(23, Math.max(0, h)) : 0;
}

function emptyMetrics(periodDays: number): AppointmentMetricsResult {
  return {
    periodDays,
    fromDate: '',
    toDate: '',
    attendedPerDay: [],
    demandPerDay: [],
    demandByWeekday: [],
    topDemandDays: [],
    busyHours: [],
    topBusyHours: [],
    occupancy: {
      occupiedMinutes: 0,
      availableMinutes: 0,
      percent: 0,
      workdayStartHour: DEFAULT_AGENDA_SETTINGS.workdayStartHour,
      workdayEndHour: DEFAULT_AGENDA_SETTINGS.workdayEndHour,
    },
    avgDurationByReason: [],
    totals: {
      attended: 0,
      noShow: 0,
      cancelled: 0,
      scheduled: 0,
      demand: 0,
      cancellationRate: 0,
      noShowRate: 0,
    },
  };
}

export async function fetchAppointmentMetrics(options: {
  scope: ClinicalListScope;
  clinicId?: string | null;
  podiatristUserId?: string;
  days?: number;
  agendaSettings?: AgendaSettings;
}): Promise<AppointmentMetricsResult> {
  const periodDays = Math.min(Math.max(options.days ?? 30, 7), 90);
  if (options.scope.mode === 'none') return emptyMetrics(periodDays);

  const today = new Date();
  const toDate = formatDate(today);
  const fromDate = formatDate(addDays(today, -(periodDays - 1)));

  const conditions = [
    gte(appointmentsTable.sessionDate, fromDate),
    lte(appointmentsTable.sessionDate, toDate),
  ];

  if (options.podiatristUserId) {
    conditions.push(eq(appointmentsTable.createdBy, options.podiatristUserId));
  } else if (options.scope.mode === 'clinic') {
    conditions.push(eq(appointmentsTable.clinicId, options.scope.clinicId));
  } else if (options.scope.mode === 'podiatrist') {
    conditions.push(eq(appointmentsTable.createdBy, options.scope.createdBy));
  } else if (options.scope.mode === 'receptionist') {
    conditions.push(inArray(appointmentsTable.createdBy, options.scope.createdByIn));
  }

  const where = conditions.length === 1 ? conditions[0] : and(...conditions);

  const rows = await database
    .select({
      sessionDate: appointmentsTable.sessionDate,
      sessionTime: appointmentsTable.sessionTime,
      status: appointmentsTable.status,
      notes: appointmentsTable.notes,
      reason: appointmentsTable.reason,
      serviceLabel: appointmentsTable.serviceLabel,
      createdBy: appointmentsTable.createdBy,
    })
    .from(appointmentsTable)
    .where(where);

  let settings = options.agendaSettings ?? { ...DEFAULT_AGENDA_SETTINGS };
  if (!options.agendaSettings) {
    const targetPodiatristId =
      options.podiatristUserId ??
      (options.scope.mode === 'podiatrist' ? options.scope.createdBy : null);
    if (targetPodiatristId) {
      const resolved = await resolveAgendaSettingsForPodiatrist(targetPodiatristId);
      settings = resolved.settings;
    }
  }

  const workMinutesPerDay = Math.max(
    0,
    (settings.workdayEndHour - settings.workdayStartHour) * 60
  );

  const attendedByDay = new Map<string, number>();
  const demandByDay = new Map<string, number>();
  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
  const hourCounts = Array.from({ length: 24 }, () => 0);
  const reasonAgg = new Map<string, { totalMinutes: number; count: number }>();
  let attended = 0;
  let noShow = 0;
  let cancelled = 0;
  let scheduled = 0;
  let demand = 0;
  let occupiedMinutes = 0;

  for (const row of rows) {
    const duration = parseDuration(row.notes);

    if (row.status === 'completed') {
      attended += 1;
      attendedByDay.set(row.sessionDate, (attendedByDay.get(row.sessionDate) ?? 0) + 1);
    } else if (row.status === 'no_show') {
      noShow += 1;
    } else if (row.status === 'cancelled') {
      cancelled += 1;
    } else if (row.status === 'scheduled' || row.status === 'confirmed') {
      scheduled += 1;
    }

    if (isDemandStatus(row.status)) {
      demand += 1;
      demandByDay.set(row.sessionDate, (demandByDay.get(row.sessionDate) ?? 0) + 1);
      occupiedMinutes += duration;
      const hour = parseHour(row.sessionTime);
      hourCounts[hour] += 1;

      const d = new Date(`${row.sessionDate}T12:00:00`);
      if (!Number.isNaN(d.getTime())) {
        weekdayCounts[d.getDay()] += 1;
      }

      // Agrupamos por el servicio/tarifa elegido (para cruzar con la pauta de duración).
      // Fallback al motivo libre por compatibilidad con citas antiguas sin servicio.
      const reasonKey = (row.serviceLabel || row.reason || 'Sin motivo').trim() || 'Sin motivo';
      const prev = reasonAgg.get(reasonKey) ?? { totalMinutes: 0, count: 0 };
      reasonAgg.set(reasonKey, {
        totalMinutes: prev.totalMinutes + duration,
        count: prev.count + 1,
      });
    }
  }

  const resolvedTotal = attended + noShow + cancelled;
  const cancellationRate = resolvedTotal > 0 ? Math.round((cancelled / resolvedTotal) * 100) : 0;
  const noShowRate = resolvedTotal > 0 ? Math.round((noShow / resolvedTotal) * 100) : 0;

  const attendedPerDay: Array<{ date: string; count: number }> = [];
  const demandPerDay: Array<{ date: string; count: number }> = [];
  let daysWithDemand = 0;
  for (let i = 0; i < periodDays; i++) {
    const date = formatDate(addDays(new Date(`${fromDate}T12:00:00`), i));
    const demandCount = demandByDay.get(date) ?? 0;
    if (demandCount > 0) daysWithDemand += 1;
    attendedPerDay.push({ date, count: attendedByDay.get(date) ?? 0 });
    demandPerDay.push({ date, count: demandCount });
  }

  // Disponibles = días con demanda × ventana laboral (evita inflar con días vacíos).
  // Si no hay demanda, usar todos los días del periodo.
  const capacityDays = daysWithDemand > 0 ? daysWithDemand : periodDays;
  const availableMinutes = capacityDays * workMinutesPerDay;
  const occupancyPercent =
    availableMinutes > 0
      ? Math.min(100, Math.round((occupiedMinutes / availableMinutes) * 1000) / 10)
      : 0;

  const weekdayOrder = [1, 2, 3, 4, 5, 6, 0];
  const demandByWeekday = weekdayOrder.map((weekday) => ({
    weekday,
    label: WEEKDAY_LABELS_ES[weekday],
    count: weekdayCounts[weekday] ?? 0,
  }));

  const topDemandDays = [...demandPerDay]
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count || b.date.localeCompare(a.date))
    .slice(0, 7)
    .map((d) => ({
      date: d.date,
      label: new Date(`${d.date}T12:00:00`).toLocaleDateString('es-MX', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }),
      count: d.count,
    }));

  const busyHours = hourCounts
    .map((count, hour) => ({
      hour,
      label: `${String(hour).padStart(2, '0')}:00`,
      count,
    }))
    .filter(
      (h) =>
        h.count > 0 ||
        (h.hour >= settings.workdayStartHour && h.hour < settings.workdayEndHour)
    );

  const topBusyHours = [...busyHours]
    .filter((h) => h.count > 0)
    .sort((a, b) => b.count - a.count || a.hour - b.hour)
    .slice(0, 5);

  const avgDurationByReason = [...reasonAgg.entries()]
    .map(([reason, agg]) => ({
      reason,
      count: agg.count,
      avgMinutes: Math.round(agg.totalMinutes / agg.count),
    }))
    .sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason))
    .slice(0, 12);

  return {
    periodDays,
    fromDate,
    toDate,
    attendedPerDay,
    demandPerDay,
    demandByWeekday,
    topDemandDays,
    busyHours,
    topBusyHours,
    occupancy: {
      occupiedMinutes,
      availableMinutes,
      percent: occupancyPercent,
      workdayStartHour: settings.workdayStartHour,
      workdayEndHour: settings.workdayEndHour,
    },
    avgDurationByReason,
    totals: {
      attended,
      noShow,
      cancelled,
      scheduled,
      demand,
      cancellationRate,
      noShowRate,
    },
  };
}
