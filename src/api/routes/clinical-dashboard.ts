import { Hono } from 'hono';
import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { requireActiveSubscription } from '../middleware/subscription';
import { database } from '../database';
import { clinicalSessions, patients, createdUsers, professionalLicenses } from '../database/schema';
import { mergeScopeWhere, resolveClinicalListScope } from '../utils/clinical-list-scope';
import { fetchAppointmentMetrics } from '../utils/clinic-appointment-metrics';
import { sanitizePathParam } from '../utils/sanitization';
import {
  canAccessAgendaSettingsForPodiatrist,
  getAgendaSettingsTarget,
  resolveAgendaSettingsForPodiatrist,
  saveAgendaSettings,
} from '../utils/agenda-settings';
import {
  canAccessRescheduleMessageForPodiatrist,
  getClinicRescheduleMessage,
  resolveRescheduleMessageForPodiatrist,
  saveRescheduleMessage,
} from '../utils/reschedule-message';
import { getAssignedPodiatristUserIds } from '../utils/tenant-isolation';
import { fetchSatisfactionSummary } from '../utils/satisfaction-summary';
import { getOrCreateBookingToken } from '../utils/booking';
import { getRequestBaseUrl } from '../utils/stripe-client';
import { requireFeature } from '../middleware/entitlements';
const clinicalDashboardRoutes = new Hono();

clinicalDashboardRoutes.use('*', requireAuth, requireActiveSubscription);

// Métricas avanzadas de agenda (demanda/ocupación): plan Premium.
// agenda-settings queda libre: es configuración operativa del calendario.
clinicalDashboardRoutes.use('/appointment-metrics', requireFeature('agenda_analytics'));

clinicalDashboardRoutes.get('/overview', async (c) => {
  const user = c.get('user')!;
  const scope = await resolveClinicalListScope(user);

  if (scope.mode === 'none') {
    return c.json({
      success: true,
      patientCount: 0,
      sessionsThisMonth: 0,
      recentSessions: [],
    });
  }

  const patientWhere = mergeScopeWhere(scope, {
    createdBy: patients.createdBy,
    clinicId: patients.clinicId,
  });
  const sessionWhere = mergeScopeWhere(scope, {
    createdBy: clinicalSessions.createdBy,
    clinicId: clinicalSessions.clinicId,
  });

  const patientCountRows = patientWhere
    ? await database.select({ count: sql<number>`count(*)` }).from(patients).where(patientWhere)
    : await database.select({ count: sql<number>`count(*)` }).from(patients);
  const patientCount = Number(patientCountRows[0]?.count ?? 0);

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const sessionsThisMonthRows = sessionWhere
    ? await database
        .select({ count: sql<number>`count(*)` })
        .from(clinicalSessions)
        .where(and(sessionWhere, gte(clinicalSessions.sessionDate, monthStart)))
    : await database
        .select({ count: sql<number>`count(*)` })
        .from(clinicalSessions)
        .where(gte(clinicalSessions.sessionDate, monthStart));
  const sessionsThisMonth = Number(sessionsThisMonthRows[0]?.count ?? 0);

  const recentQuery = database
    .select({
      id: clinicalSessions.id,
      patientId: clinicalSessions.patientId,
      sessionDate: clinicalSessions.sessionDate,
      status: sql<string>`json_extract(${clinicalSessions.notes}, '$.status')`,
      createdAt: clinicalSessions.createdAt,
    })
    .from(clinicalSessions)
    .orderBy(desc(clinicalSessions.createdAt))
    .limit(5);
  const recentRows = sessionWhere
    ? await recentQuery.where(sessionWhere)
    : await recentQuery;

  const patientIds = [...new Set(recentRows.map((r) => r.patientId))];
  const patientNameById = new Map<string, string>();
  if (patientIds.length > 0) {
    const patientRows = await database
      .select({
        id: patients.id,
        firstName: patients.firstName,
        lastName: patients.lastName,
      })
      .from(patients)
      .where(inArray(patients.id, patientIds));
    for (const p of patientRows) {
      patientNameById.set(p.id, `${p.firstName} ${p.lastName}`.trim());
    }
  }

  return c.json({
    success: true,
    patientCount,
    sessionsThisMonth,
    recentSessions: recentRows.map((row) => ({
      id: row.id,
      patientId: row.patientId,
      patientName: patientNameById.get(row.patientId) ?? 'Paciente',
      sessionDate: row.sessionDate,
      status: row.status === 'completed' ? 'completed' : 'draft',
      createdAt: row.createdAt,
    })),
  });
});

clinicalDashboardRoutes.get('/clinic-stats', async (c) => {
  const user = c.get('user')!;
  if (user.role !== 'clinic_admin' || !user.clinicId) {
    return c.json({ error: 'Acceso denegado' }, 403);
  }

  const podiatristRows = await database
    .select()
    .from(createdUsers)
    .where(and(eq(createdUsers.clinicId, user.clinicId), eq(createdUsers.role, 'podiatrist')));
  const podiatristIds = podiatristRows.map((r) => r.userId);

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const licenses: Record<string, string | null> = {};
  if (podiatristIds.length > 0) {
    const licenseRows = await database
      .select()
      .from(professionalLicenses)
      .where(inArray(professionalLicenses.userId, podiatristIds));
    for (const id of podiatristIds) licenses[id] = null;
    for (const row of licenseRows) {
      licenses[row.userId] = row.license?.trim() ? row.license.trim() : null;
    }
  }

  const podiatristStats = await Promise.all(
    podiatristRows.map(async (pod) => {
      const patientCountRows = await database
        .select({ count: sql<number>`count(*)` })
        .from(patients)
        .where(eq(patients.createdBy, pod.userId));
      const sessionCountRows = await database
        .select({ count: sql<number>`count(*)` })
        .from(clinicalSessions)
        .where(eq(clinicalSessions.createdBy, pod.userId));
      const sessionsThisMonthRows = await database
        .select({ count: sql<number>`count(*)` })
        .from(clinicalSessions)
        .where(and(eq(clinicalSessions.createdBy, pod.userId), gte(clinicalSessions.sessionDate, monthStart)));

      return {
        userId: pod.userId,
        patientCount: Number(patientCountRows[0]?.count ?? 0),
        sessionCount: Number(sessionCountRows[0]?.count ?? 0),
        sessionsThisMonth: Number(sessionsThisMonthRows[0]?.count ?? 0),
        license: licenses[pod.userId] ?? null,
      };
    })
  );

  const totals = podiatristStats.reduce(
    (acc, s) => ({
      patients: acc.patients + s.patientCount,
      sessionsThisMonth: acc.sessionsThisMonth + s.sessionsThisMonth,
      podiatrists: acc.podiatrists + 1,
    }),
    { patients: 0, sessionsThisMonth: 0, podiatrists: 0 }
  );

  return c.json({ success: true, totals, podiatristStats, licenses });
});

clinicalDashboardRoutes.get('/appointment-metrics', async (c) => {
  const user = c.get('user')!;
  const scope = await resolveClinicalListScope(user);
  if (scope.mode === 'none') {
    return c.json({
      success: true,
      metrics: {
        periodDays: 30,
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
          workdayStartHour: 7,
          workdayEndHour: 21,
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
      },
    });
  }

  const daysRaw = c.req.query('days');
  const days = daysRaw ? Number.parseInt(daysRaw, 10) : 30;
  const podiatristId = sanitizePathParam(c.req.query('podiatristId') ?? '', 128) || undefined;

  const metrics = await fetchAppointmentMetrics({
    scope,
    clinicId: user.clinicId,
    podiatristUserId: podiatristId,
    days: Number.isNaN(days) ? 30 : days,
  });

  return c.json({ success: true, metrics });
});

const agendaSettingsBodySchema = z.object({
  workdayStartHour: z.number().int().min(0).max(23).optional(),
  workdayEndHour: z.number().int().min(0).max(23).optional(),
  allowOvertime: z.boolean().optional(),
  overtimeStartHour: z.number().int().min(0).max(23).optional(),
  overtimeEndHour: z.number().int().min(0).max(23).optional(),
  rescheduleAlertIntervalMinutes: z.number().int().min(5).max(1440).optional(),
  timezone: z.string().trim().min(1).max(64).optional(),
  podiatristId: z.string().trim().min(1).max(128).optional(),
});

/** GET /clinical-dashboard/agenda-settings */
clinicalDashboardRoutes.get('/agenda-settings', async (c) => {
  const user = c.get('user')!;
  const podiatristId = sanitizePathParam(c.req.query('podiatristId') ?? '', 128) || undefined;

  if (user.role === 'podiatrist') {
    const resolved = await resolveAgendaSettingsForPodiatrist(user.userId);
    return c.json({
      success: true,
      settings: resolved.settings,
      source: resolved.source,
      editable: true,
      scopeLabel: 'Mi consulta',
      podiatristId: user.userId,
    });
  }

  if (user.role === 'clinic_admin') {
    if (!user.clinicId) {
      return c.json({ success: false, error: 'Sin clínica asignada' }, 400);
    }
    if (podiatristId) {
      const ok = await canAccessAgendaSettingsForPodiatrist(user, podiatristId);
      if (!ok) return c.json({ success: false, error: 'No autorizado' }, 403);
      const resolved = await resolveAgendaSettingsForPodiatrist(podiatristId);
      return c.json({
        success: true,
        settings: resolved.settings,
        source: resolved.source,
        editable: false,
        scopeLabel: 'Podólogo',
        podiatristId,
      });
    }
    const settings = await getAgendaSettingsTarget({ kind: 'clinic', clinicId: user.clinicId });
    return c.json({
      success: true,
      settings,
      source: 'clinic' as const,
      editable: true,
      scopeLabel: 'Toda la clínica',
      podiatristId: null,
    });
  }

  if (user.role === 'receptionist') {
    const targetId =
      podiatristId ||
      (await getAssignedPodiatristUserIds(user.userId))[0] ||
      null;
    if (!targetId) {
      return c.json({ success: false, error: 'Sin podólogo asignado' }, 400);
    }
    const ok = await canAccessAgendaSettingsForPodiatrist(user, targetId);
    if (!ok) return c.json({ success: false, error: 'No autorizado' }, 403);
    const resolved = await resolveAgendaSettingsForPodiatrist(targetId);
    return c.json({
      success: true,
      settings: resolved.settings,
      source: resolved.source,
      editable: false,
      scopeLabel: 'Podólogo asignado',
      podiatristId: targetId,
    });
  }

  return c.json({ success: false, error: 'No autorizado' }, 403);
});

/** PUT /clinical-dashboard/agenda-settings */
clinicalDashboardRoutes.put('/agenda-settings', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.json().catch(() => ({}));
  const parsed = agendaSettingsBodySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: 'Datos inválidos' }, 400);
  }

  const { podiatristId: bodyPodId, rescheduleAlertIntervalMinutes, timezone, ...restPatch } = parsed.data;

  if (user.role === 'podiatrist') {
    // rescheduleAlertIntervalMinutes y timezone son clínica-wide: el podólogo no los sobreescribe.
    const settings = await saveAgendaSettings(
      { kind: 'podiatrist', podiatristId: user.userId },
      restPatch
    );
    return c.json({ success: true, settings });
  }

  if (user.role === 'clinic_admin') {
    if (!user.clinicId) {
      return c.json({ success: false, error: 'Sin clínica asignada' }, 400);
    }
    if (bodyPodId) {
      return c.json(
        { success: false, error: 'El admin de clínica solo edita el horario default de la clínica' },
        403
      );
    }
    const settings = await saveAgendaSettings(
      { kind: 'clinic', clinicId: user.clinicId },
      {
        ...restPatch,
        ...(rescheduleAlertIntervalMinutes !== undefined ? { rescheduleAlertIntervalMinutes } : {}),
        ...(timezone !== undefined ? { timezone } : {}),
      }
    );
    return c.json({ success: true, settings });
  }

  return c.json({ success: false, error: 'No autorizado' }, 403);
});

/** GET /clinical-dashboard/reschedule-message */
clinicalDashboardRoutes.get('/reschedule-message', async (c) => {
  const user = c.get('user')!;
  const podiatristId = sanitizePathParam(c.req.query('podiatristId') ?? '', 128) || undefined;

  if (user.role === 'podiatrist') {
    const resolved = await resolveRescheduleMessageForPodiatrist(user.userId);
    return c.json({
      success: true,
      message: resolved.message,
      source: resolved.source,
      editable: true,
      scopeLabel: 'Mi consulta',
      podiatristId: user.userId,
    });
  }

  if (user.role === 'clinic_admin') {
    if (!user.clinicId) {
      return c.json({ success: false, error: 'Sin clínica asignada' }, 400);
    }
    if (podiatristId) {
      const ok = await canAccessRescheduleMessageForPodiatrist(user, podiatristId);
      if (!ok) return c.json({ success: false, error: 'No autorizado' }, 403);
      const resolved = await resolveRescheduleMessageForPodiatrist(podiatristId);
      return c.json({
        success: true,
        message: resolved.message,
        source: resolved.source,
        editable: false,
        scopeLabel: 'Podólogo',
        podiatristId,
      });
    }
    const message = await getClinicRescheduleMessage(user.clinicId);
    return c.json({
      success: true,
      message,
      source: 'clinic' as const,
      editable: true,
      scopeLabel: 'Toda la clínica',
      podiatristId: null,
    });
  }

  if (user.role === 'receptionist') {
    const targetId = podiatristId || (await getAssignedPodiatristUserIds(user.userId))[0] || null;
    if (!targetId) {
      return c.json({ success: false, error: 'Sin podólogo asignado' }, 400);
    }
    const ok = await canAccessRescheduleMessageForPodiatrist(user, targetId);
    if (!ok) return c.json({ success: false, error: 'No autorizado' }, 403);
    const resolved = await resolveRescheduleMessageForPodiatrist(targetId);
    return c.json({
      success: true,
      message: resolved.message,
      source: resolved.source,
      editable: false,
      scopeLabel: 'Podólogo asignado',
      podiatristId: targetId,
    });
  }

  return c.json({ success: false, error: 'No autorizado' }, 403);
});

const rescheduleMessageBodySchema = z.object({
  message: z.string().max(500).nullable(),
});

/** PUT /clinical-dashboard/reschedule-message */
clinicalDashboardRoutes.put('/reschedule-message', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.json().catch(() => ({}));
  const parsed = rescheduleMessageBodySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: 'Datos inválidos' }, 400);
  }

  if (user.role === 'podiatrist') {
    const message = await saveRescheduleMessage({ kind: 'podiatrist', podiatristId: user.userId }, parsed.data.message);
    return c.json({ success: true, message });
  }

  if (user.role === 'clinic_admin') {
    if (!user.clinicId) {
      return c.json({ success: false, error: 'Sin clínica asignada' }, 400);
    }
    const message = await saveRescheduleMessage({ kind: 'clinic', clinicId: user.clinicId }, parsed.data.message);
    return c.json({ success: true, message });
  }

  return c.json({ success: false, error: 'No autorizado' }, 403);
});

/** GET /clinical-dashboard/satisfaction?days=30&podiatristId= */
clinicalDashboardRoutes.get('/satisfaction', async (c) => {
  const user = c.get('user')!;
  const scope = await resolveClinicalListScope(user);
  const daysRaw = c.req.query('days');
  const days = daysRaw ? Number.parseInt(daysRaw, 10) : 30;
  const podiatristId = sanitizePathParam(c.req.query('podiatristId') ?? '', 128) || undefined;

  const summary = await fetchSatisfactionSummary({
    scope,
    podiatristUserId: podiatristId,
    days: Number.isNaN(days) ? 30 : days,
  });
  return c.json({ success: true, satisfaction: summary });
});

/** GET /clinical-dashboard/booking-link — enlace de reserva en línea del podólogo. */
clinicalDashboardRoutes.get('/booking-link', async (c) => {
  const user = c.get('user')!;
  if (user.role !== 'podiatrist') {
    return c.json({ success: false, error: 'Solo el podólogo gestiona su enlace de reserva' }, 403);
  }
  const { token, enabled } = await getOrCreateBookingToken(user.userId);
  const base = getRequestBaseUrl(c.req.url);
  return c.json({ success: true, enabled, token, url: `${base}/reserva/agendar?t=${token}` });
});

/** PUT /clinical-dashboard/booking-link { enabled } — activa/desactiva la reserva en línea. */
clinicalDashboardRoutes.put('/booking-link', async (c) => {
  const user = c.get('user')!;
  if (user.role !== 'podiatrist') {
    return c.json({ success: false, error: 'Solo el podólogo gestiona su enlace de reserva' }, 403);
  }
  const body = await c.req.json().catch(() => ({} as { enabled?: boolean }));
  const { token, enabled } = await getOrCreateBookingToken(user.userId, body.enabled === true);
  const base = getRequestBaseUrl(c.req.url);
  return c.json({ success: true, enabled, token, url: `${base}/reserva/agendar?t=${token}` });
});

export default clinicalDashboardRoutes;
