import { Hono } from 'hono';
import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { requireActiveSubscription } from '../middleware/subscription';
import { database } from '../database';
import { clinicalSessions, patients, createdUsers, professionalLicenses } from '../database/schema';
import { mergeScopeWhere, resolveClinicalListScope } from '../utils/clinical-list-scope';
import { fetchAppointmentMetrics } from '../utils/clinic-appointment-metrics';
import { sanitizePathParam } from '../utils/sanitization';

const clinicalDashboardRoutes = new Hono();

clinicalDashboardRoutes.use('*', requireAuth, requireActiveSubscription);

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
        totals: {
          attended: 0,
          noShow: 0,
          cancelled: 0,
          scheduled: 0,
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

export default clinicalDashboardRoutes;
