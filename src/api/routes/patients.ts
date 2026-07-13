import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';
import { sanitizePathParam } from '../utils/sanitization';
import { validateData, createPatientSchema, updatePatientSchema, patientsListQuerySchema, validateQuery } from '../utils/validation';
import { database } from '../database';
import { patients as patientsTable, clinicalSessions as sessionsTable, appointments as appointmentsTable, creditTransactions as creditTransactionsTable, createdUsers as createdUsersTable } from '../database/schema';
import { canUserAccess } from '../utils/user-retention';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { logAuditEvent } from '../utils/audit-log';
import { notifyPatientReassignment } from '../utils/notifications-service';
import { getClientIP } from '../utils/ip-tracking';
import { getSafeUserAgent } from '../utils/request-headers';
import {
  getAssignedPodiatristUserIds,
  getCreatedUserByIdOrUserId,
  isClinicAdminWithoutClinic,
} from '../utils/tenant-isolation';
import { normalizePhoneE164 } from '../../lib/phone-country';
import { resolvePatientPhoneCountry } from '../utils/tenant-country';
import { resolveClinicalListScope, mergeScopeWhere } from '../utils/clinical-list-scope';
import { buildPatientSearchCondition, mergeAnd } from '../utils/clinical-list-search';
import { parsePaginationQuery, buildPaginationMeta } from '../utils/pagination';
import { generateNextPatientFolio } from '../utils/patient-folio';
import {
  buildDemographicsSummary,
  computeAgeYears,
  computePatientSegment,
  fetchSessionStatsByPatientIds,
  patientMatchesDemographicsFilters,
  type PatientSegment,
} from '../utils/patient-demographics';
import { createDefaultMedicalHistory, normalizeMedicalHistory } from '../../web/types/medical-history';
import { getR2Bucket } from '../utils/r2-media';
import { purgePatientMediaR2 } from '../utils/r2-purge';

const patientsRoutes = new Hono();

// UUID criptográfico: imposible de adivinar por fuerza bruta, evita acceso por rutas predecibles
const generateId = () => crypto.randomUUID();

type DbPatient = typeof patientsTable.$inferSelect;

// Mapea el registro de DB al shape esperado por el frontend (Patient en web/types/clinical.ts)
function mapDbPatient(row: DbPatient) {
  let medicalHistory = createDefaultMedicalHistory();
  let consent: any = { given: false, date: null };

  try {
    if (row.medicalHistory) {
      medicalHistory = normalizeMedicalHistory(JSON.parse(row.medicalHistory));
    }
  } catch {
    // dejar valores por defecto
  }

  try {
    if (row.consent) {
      const parsed = JSON.parse(row.consent);
      consent = {
        given: parsed.given ?? false,
        date: parsed.date ?? null,
        consentedToVersion: parsed.consentedToVersion ?? null,
      };
    }
  } catch {
    // dejar valores por defecto
  }

  return {
    id: row.id,
    folio: row.folio,
    firstName: row.firstName,
    lastName: row.lastName,
    dateOfBirth: row.dateOfBirth,
    gender: row.gender,
    idNumber: row.idNumber,
    phone: row.phone,
    email: row.email ?? '',
    address: row.address ?? '',
    city: row.city ?? '',
    postalCode: row.postalCode ?? '',
    weightKg: row.weightKg ?? null,
    heightCm: row.heightCm ?? null,
    medicalHistory,
    consent,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
  };
}

/** Mapeo ligero para listados (sin historial médico ni alertas). */
function mapDbPatientListItem(row: {
  id: string;
  folio: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  idNumber: string;
  phone: string;
  email: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  clinicId?: string | null;
}) {
  return {
    id: row.id,
    folio: row.folio,
    firstName: row.firstName,
    lastName: row.lastName,
    dateOfBirth: row.dateOfBirth,
    gender: row.gender,
    idNumber: row.idNumber,
    phone: row.phone,
    email: row.email ?? '',
    address: '',
    city: '',
    postalCode: '',
    medicalHistory: createDefaultMedicalHistory(),
    consent: { given: false, date: null },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    clinicId: row.clinicId ?? null,
  };
}

// Folio IND (independientes) o por clínica — sin full table scan
async function generateFolio(clinicId?: string | null): Promise<string> {
  return generateNextPatientFolio(clinicId);
}

// Todas las rutas de pacientes requieren autenticación
patientsRoutes.use('*', requireAuth);

/**
 * GET /api/patients/demographics-summary
 * Conteos por segmento y rangos de edad (ámbito del usuario).
 */
patientsRoutes.get(
  '/demographics-summary',
  requirePermission('view_patients'),
  async (c) => {
    try {
      const user = c.get('user')!;
      if (isClinicAdminWithoutClinic(user)) {
        return c.json(
          { error: 'Acceso denegado', message: 'Cuenta de administrador de clínica sin clínica asignada' },
          403
        );
      }

      const createdBy = sanitizePathParam(c.req.query('createdBy') ?? '', 128) || undefined;

      const scope = await resolveClinicalListScope(user);
      const scopeWhere = mergeScopeWhere(scope, {
        createdBy: patientsTable.createdBy,
        clinicId: patientsTable.clinicId,
      });
      let where = scopeWhere;
      if (createdBy) {
        where = mergeAnd(where, eq(patientsTable.createdBy, createdBy));
      }

      let query = database
        .select({
          id: patientsTable.id,
          dateOfBirth: patientsTable.dateOfBirth,
        })
        .from(patientsTable)
        .$dynamic();
      if (where) query = query.where(where);
      const scopedPatients = await query;

      const sessionStats = await fetchSessionStatsByPatientIds(scopedPatients.map((p) => p.id));
      const summary = buildDemographicsSummary(scopedPatients, sessionStats);

      return c.json({ success: true, demographics: summary });
    } catch (error) {
      console.error('Error obteniendo demografía de pacientes:', error);
      return c.json({ error: 'Error interno', message: 'Error al obtener demografía' }, 500);
    }
  }
);

/**
 * POST /api/patients/:patientId/reassign
 * Reasigna el paciente (y todas sus sesiones) a otro podólogo.
 * Body: { newPodiatristId: string }
 * Requiere: permiso reassign_patients (clinic_admin)
 */
patientsRoutes.post(
  '/:patientId/reassign',
  requirePermission('reassign_patients'),
  async (c) => {
    try {
      const user = c.get('user')!;
      if (isClinicAdminWithoutClinic(user)) {
        return c.json(
          { error: 'Acceso denegado', message: 'Cuenta de administrador de clínica sin clínica asignada' },
          403
        );
      }

      const patientId = sanitizePathParam(c.req.param('patientId'), 64);
      if (!patientId) {
        return c.json({ error: 'ID de paciente inválido' }, 400);
      }
      const body = (await c.req.json().catch(() => ({}))) as { newPodiatristId?: string };
      const newPodiatristId = String(body.newPodiatristId ?? '').trim();

      if (!newPodiatristId) {
        return c.json({ error: 'newPodiatristId es requerido' }, 400);
      }

      // Validar paciente existente
      const patientRows = await database
        .select()
        .from(patientsTable)
        .where(eq(patientsTable.id, patientId))
        .limit(1);
      const patient = patientRows[0];
      if (!patient) return c.json({ error: 'Paciente no encontrado' }, 404);

      if (user?.role === 'clinic_admin') {
        if (patient.clinicId !== user.clinicId) {
          return c.json({ error: 'Acceso denegado' }, 403);
        }
      }

      const target = await getCreatedUserByIdOrUserId(newPodiatristId);
      if (!target || target.role !== 'podiatrist') {
        return c.json({ error: 'Podólogo destino no encontrado' }, 404);
      }
      if (user?.role === 'clinic_admin') {
        if (target.clinicId !== user.clinicId) {
          return c.json({ error: 'Acceso denegado' }, 403);
        }
      }

      const newOwnerUserId = target.userId;
      const previousPodiatristId = patient.createdBy;
      const now = new Date().toISOString();

      // createdBy en pacientes/sesiones es siempre user_id (mismo valor que JWT), no la PK interna
      await database
        .update(patientsTable)
        .set({ createdBy: newOwnerUserId, updatedAt: now })
        .where(eq(patientsTable.id, patientId));

      await database
        .update(sessionsTable)
        .set({ createdBy: newOwnerUserId, updatedAt: now })
        .where(eq(sessionsTable.patientId, patientId));

      await logAuditEvent({
        userId: user.userId,
        action: 'REASSIGN',
        resourceType: 'reassignment',
        resourceId: patientId,
        details: {
          action: 'patient_reassignment',
          patientId,
          fromUserId: previousPodiatristId,
          toUserId: newOwnerUserId,
        },
        ipAddress: getClientIP(c.req.raw.headers),
        userAgent: getSafeUserAgent(c),
        clinicId: user.clinicId ?? undefined,
      });

      const patientFullName = `${patient.firstName} ${patient.lastName}`.trim();
      const adminNameRow = await database
        .select({ name: createdUsersTable.name })
        .from(createdUsersTable)
        .where(eq(createdUsersTable.userId, user.userId))
        .limit(1);
      const clinicAdminName = adminNameRow[0]?.name ?? user.email;
      await notifyPatientReassignment({
        clinicAdminUserId: user.userId,
        clinicAdminName,
        previousPodiatristUserId: previousPodiatristId,
        newPodiatristUserId: newOwnerUserId,
        patientId,
        patientFullName: patientFullName || patientId,
      }).catch((err) => console.error('Error enviando notificaciones de reasignación:', err));

      const updatedPatient = (
        await database.select().from(patientsTable).where(eq(patientsTable.id, patientId)).limit(1)
      )[0];

      return c.json({
        success: true,
        patient: updatedPatient ? mapDbPatient(updatedPatient) : null,
      });
    } catch (error) {
      console.error('Error reasignando paciente:', error);
      return c.json({ error: 'Error interno', message: 'Error al reasignar paciente' }, 500);
    }
  }
);

/**
 * GET /api/patients
 * Obtiene la lista de pacientes
 * Requiere: permiso view_patients
 */
patientsRoutes.get(
  '/',
  requirePermission('view_patients'),
  async (c) => {
    try {
      const user = c.get('user')!;
      if (isClinicAdminWithoutClinic(user)) {
        return c.json(
          { error: 'Acceso denegado', message: 'Cuenta de administrador de clínica sin clínica asignada' },
          403
        );
      }

      const queryResult = validateQuery(patientsListQuerySchema, c.req.query());
      if (!queryResult.success) {
        return c.json({ error: 'Parámetros inválidos', message: queryResult.error, issues: queryResult.issues }, 400);
      }
      const pagination = parsePaginationQuery({
        limit: queryResult.data.limit,
        offset: queryResult.data.offset,
      });
      const searchQ = queryResult.data.q;
      const idsRaw = queryResult.data.ids;
      const createdByFilter = queryResult.data.createdBy?.trim() || undefined;
      const segmentFilter = queryResult.data.segment as PatientSegment | undefined;
      const ageMin = queryResult.data.ageMin;
      const ageMax = queryResult.data.ageMax;
      const hasDemographicsFilter =
        Boolean(segmentFilter) || ageMin !== undefined || ageMax !== undefined;

      const scope = await resolveClinicalListScope(user);
      const scopeWhere = mergeScopeWhere(scope, {
        createdBy: patientsTable.createdBy,
        clinicId: patientsTable.clinicId,
      });
      let idsWhere;
      if (idsRaw) {
        const ids = idsRaw
          .split(',')
          .map((id) => sanitizePathParam(id.trim(), 64))
          .filter((id): id is string => Boolean(id))
          .slice(0, 100);
        if (ids.length > 0) idsWhere = inArray(patientsTable.id, ids);
      }
      let where = mergeAnd(scopeWhere, buildPatientSearchCondition(searchQ ?? ''), idsWhere);
      if (createdByFilter) {
        where = mergeAnd(where, eq(patientsTable.createdBy, createdByFilter));
      }

      const listSelect = {
        id: patientsTable.id,
        folio: patientsTable.folio,
        firstName: patientsTable.firstName,
        lastName: patientsTable.lastName,
        dateOfBirth: patientsTable.dateOfBirth,
        gender: patientsTable.gender,
        idNumber: patientsTable.idNumber,
        phone: patientsTable.phone,
        email: patientsTable.email,
        createdAt: patientsTable.createdAt,
        updatedAt: patientsTable.updatedAt,
        createdBy: patientsTable.createdBy,
        clinicId: patientsTable.clinicId,
      };

      let rows: Array<{
        id: string;
        folio: string;
        firstName: string;
        lastName: string;
        dateOfBirth: string;
        gender: string;
        idNumber: string;
        phone: string;
        email: string | null;
        createdAt: string;
        updatedAt: string;
        createdBy: string;
        clinicId: string | null;
      }>;
      let hasMore = false;

      if (hasDemographicsFilter) {
        let allQuery = database.select(listSelect).from(patientsTable).$dynamic();
        if (where) allQuery = allQuery.where(where);
        const allRows = await allQuery.orderBy(patientsTable.updatedAt);
        const allIds = allRows.map((r) => r.id);
        const allSessionStats = await fetchSessionStatsByPatientIds(allIds);
        const filtered = allRows.filter((row) =>
          patientMatchesDemographicsFilters(row.dateOfBirth, allSessionStats.get(row.id) ?? {
            sessionCount: 0,
            lastSessionDate: null,
            previousSessionDate: null,
          }, { segment: segmentFilter, ageMin, ageMax })
        );
        rows = filtered.slice(pagination.offset, pagination.offset + pagination.limit);
        hasMore = pagination.offset + pagination.limit < filtered.length;
      } else {
        let query = database.select(listSelect).from(patientsTable).$dynamic();
        if (where) query = query.where(where);
        rows = await query
          .orderBy(patientsTable.updatedAt)
          .limit(pagination.limit)
          .offset(pagination.offset);
        hasMore = rows.length >= pagination.limit;
      }

      const patientIds = rows.map((r) => r.id);
      const sessionStats = await fetchSessionStatsByPatientIds(patientIds);

      const patients = rows.map((row) => {
        const stats = sessionStats.get(row.id) ?? {
          sessionCount: 0,
          lastSessionDate: null,
          previousSessionDate: null,
        };
        return {
          ...mapDbPatientListItem(row),
          sessionCount: stats.sessionCount,
          lastSessionDate: stats.lastSessionDate,
          previousSessionDate: stats.previousSessionDate,
          ageYears: computeAgeYears(row.dateOfBirth),
          patientSegment: computePatientSegment(
            stats.sessionCount,
            stats.lastSessionDate,
            stats.previousSessionDate
          ),
        };
      });
      return c.json({
        success: true,
        patients,
        pagination: {
          limit: pagination.limit,
          offset: pagination.offset,
          hasMore,
        },
      });
    } catch (error) {
      console.error('Error obteniendo pacientes:', error);
      return c.json(
        { error: 'Error interno', message: 'Error al obtener pacientes' },
        500
      );
    }
  }
);

/**
 * GET /api/patients/:patientId
 * Obtiene un paciente específico
 * Requiere: permiso view_patients
 */
patientsRoutes.get(
  '/:patientId',
  requirePermission('view_patients'),
  async (c) => {
    try {
      const patientId = sanitizePathParam(c.req.param('patientId'), 64);
      if (!patientId) {
        return c.json({ error: 'ID de paciente inválido' }, 400);
      }
      const user = c.get('user')!;
      if (isClinicAdminWithoutClinic(user)) {
        return c.json(
          { error: 'Acceso denegado', message: 'Cuenta de administrador de clínica sin clínica asignada' },
          403
        );
      }

      const rows = await database
        .select()
        .from(patientsTable)
        .where(eq(patientsTable.id, patientId))
        .limit(1);

      if (!rows.length) {
        return c.json({ error: 'Paciente no encontrado' }, 404);
      }

      const row = rows[0];

      // Reglas de acceso adicionales:
      // - super_admin: acceso total
      // - podiatrist: solo pacientes que él mismo ha creado
      // - receptionist: solo pacientes de podólogos asignados
      if (user?.role === 'podiatrist' && row.createdBy !== user.userId) {
        return c.json(
          {
            error: 'Acceso denegado',
            message: 'No tienes permiso para ver este paciente',
          },
          403
        );
      }
      if (user?.role === 'receptionist') {
        const assignedIds = await getAssignedPodiatristUserIds(user.userId);
        if (!assignedIds.includes(row.createdBy)) {
          return c.json(
            { error: 'Acceso denegado', message: 'No tienes permiso para ver este paciente' },
            403
          );
        }
      }
      if (user?.role === 'clinic_admin' && row.clinicId !== user.clinicId) {
        return c.json(
          { error: 'Acceso denegado', message: 'No tienes permiso para ver este paciente' },
          403
        );
      }

      const patient = mapDbPatient(row);
      return c.json({ success: true, patient });
    } catch (error) {
      console.error('Error obteniendo paciente:', error);
      return c.json(
        { error: 'Error interno', message: 'Error al obtener paciente' },
        500
      );
    }
  }
);

/**
 * POST /api/patients
 * Crea un nuevo paciente
 * Requiere: permiso manage_patients
 */
patientsRoutes.post(
  '/',
  requirePermission('manage_patients'),
  async (c) => {
    try {
      const user = c.get('user')!;
      if (isClinicAdminWithoutClinic(user)) {
        return c.json(
          { error: 'Acceso denegado', message: 'Cuenta de administrador de clínica sin clínica asignada' },
          403
        );
      }

      // Restringir creación de pacientes para usuarios en período de gracia (cuenta deshabilitada)
      if (user?.userId) {
        const creatorRows = await database
          .select()
          .from(createdUsersTable)
          .where(eq(createdUsersTable.userId, user.userId))
          .limit(1);
        const creator = creatorRows[0];
        if (creator && creator.isEnabled === false && canUserAccess(creator.disabledAt)) {
          return c.json(
            {
              error: 'usuario_en_periodo_gracia',
              message:
                'Tu cuenta está en período de gracia por exceso de pago. Durante 30 días puedes ver tus datos, pero no crear nuevos pacientes.',
            },
            403
          );
        }
      }

      // Validar y sanitizar datos de entrada
      const rawBody = await c.req.json().catch(() => ({}));
      const validation = validateData(createPatientSchema, rawBody);

      if (!validation.success) {
        return c.json(
          {
            error: 'Datos inválidos',
            message: validation.error,
            issues: validation.issues,
          },
          400
        );
      }

      const body = validation.data;

      let createdBy = user!.userId;
      let clinicIdForPatient: string | null = user?.clinicId || null;

      // Recepcionista: debe enviar createdBy (id interno o user_id del podólogo) y debe estar en sus asignados
      if (user?.role === 'receptionist') {
        const podiatristId = (body as { createdBy?: string }).createdBy?.trim();
        if (!podiatristId) {
          return c.json(
            { error: 'createdBy requerido', message: 'Debes seleccionar un podólogo para asignar el paciente' },
            400
          );
        }
        const targetPod = await getCreatedUserByIdOrUserId(podiatristId);
        if (!targetPod || targetPod.role !== 'podiatrist') {
          return c.json({ error: 'Podólogo no encontrado' }, 404);
        }
        const assignedIds = await getAssignedPodiatristUserIds(user.userId);
        if (!assignedIds.includes(targetPod.userId)) {
          return c.json(
            { error: 'Acceso denegado', message: 'No puedes asignar pacientes a ese podólogo' },
            403
          );
        }
        createdBy = targetPod.userId;
        if (targetPod.clinicId) clinicIdForPatient = targetPod.clinicId;
      }

      const now = new Date().toISOString();
      const id = generateId();
      const folio = await generateFolio(clinicIdForPatient);

      const medicalHistory = JSON.stringify(normalizeMedicalHistory(body.medicalHistory));
      const consent = JSON.stringify(
        body.consent || { given: false, date: null }
      );

      // Asegurar que idNumber sea siempre string (evita error si llega como número o undefined)
      const idNumber = typeof body.idNumber === 'string' ? body.idNumber : String(body.idNumber ?? '');

      const phoneCountry = await resolvePatientPhoneCountry({
        clinicId: clinicIdForPatient,
        createdByUserId: createdBy,
      });
      const normalizedPhone = normalizePhoneE164(body.phone, phoneCountry) ?? body.phone.trim();

      await database.insert(patientsTable).values({
        id,
        folio,
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: body.dateOfBirth,
        gender: body.gender,
        idNumber,
        curp: body.curp?.trim() ? body.curp.trim().toUpperCase() : null,
        phone: normalizedPhone,
        email: body.email || null,
        address: body.address || null,
        city: body.city || null,
        postalCode: body.postalCode || null,
        weightKg: body.weightKg?.trim() || null,
        heightCm: body.heightCm?.trim() || null,
        medicalHistory,
        consent,
        createdAt: now,
        updatedAt: now,
        createdBy,
        clinicId: clinicIdForPatient,
      });

      const [row] = await database
        .select()
        .from(patientsTable)
        .where(eq(patientsTable.id, id))
        .limit(1);

      if (!row) {
        console.error('Paciente creado pero no encontrado al leer:', id);
        return c.json(
          { error: 'Error interno', message: 'No se pudo recuperar el paciente creado' },
          500
        );
      }
      const patient = mapDbPatient(row);
      return c.json({ success: true, patient }, 201);
    } catch (error) {
      console.error('Error creando paciente:', error);
      return c.json(
        { error: 'Error interno', message: 'Error al crear paciente' },
        500
      );
    }
  }
);

/**
 * PUT /api/patients/:patientId
 * Actualiza un paciente
 * Requiere: permiso manage_patients
 */
patientsRoutes.put(
  '/:patientId',
  requirePermission('manage_patients'),
  async (c) => {
    try {
      const patientId = sanitizePathParam(c.req.param('patientId'), 64);
      if (!patientId) {
        return c.json({ error: 'ID de paciente inválido' }, 400);
      }
      const user = c.get('user')!;
      if (isClinicAdminWithoutClinic(user)) {
        return c.json(
          { error: 'Acceso denegado', message: 'Cuenta de administrador de clínica sin clínica asignada' },
          403
        );
      }

      // Verificar existencia
      const existingRows = await database
        .select()
        .from(patientsTable)
        .where(eq(patientsTable.id, patientId))
        .limit(1);

      if (!existingRows.length) {
        return c.json({ error: 'Paciente no encontrado' }, 404);
      }

      const existing = existingRows[0];

      // Reglas de modificación:
      // - super_admin: puede actualizar cualquier paciente
      // - podiatrist: solo puede actualizar pacientes que él mismo creó
      // - receptionist: solo pacientes de podólogos asignados
      // - clinic_admin: solo pacientes de su clínica
      if (user?.role === 'podiatrist' && existing.createdBy !== user.userId) {
        return c.json(
          {
            error: 'Acceso denegado',
            message: 'No tienes permiso para modificar este paciente',
          },
          403
        );
      }
      if (user?.role === 'receptionist') {
        const assignedIds = await getAssignedPodiatristUserIds(user.userId);
        if (!assignedIds.includes(existing.createdBy)) {
          return c.json(
            { error: 'Acceso denegado', message: 'No tienes permiso para modificar este paciente' },
            403
          );
        }
      }
      if (user?.role === 'clinic_admin' && existing.clinicId !== user.clinicId) {
        return c.json(
          { error: 'Acceso denegado', message: 'No tienes permiso para modificar este paciente' },
          403
        );
      }

      // Validar y sanitizar datos de entrada
      const rawBody = await c.req.json().catch(() => ({}));
      const validation = validateData(updatePatientSchema, rawBody);

      if (!validation.success) {
        return c.json(
          {
            error: 'Datos inválidos',
            message: validation.error,
            issues: validation.issues,
          },
          400
        );
      }

      const body = validation.data;
      const updateData: Partial<DbPatient> = {
        updatedAt: new Date().toISOString(),
      };

      if (body.firstName !== undefined) updateData.firstName = body.firstName;
      if (body.lastName !== undefined) updateData.lastName = body.lastName;
      if (body.dateOfBirth !== undefined) updateData.dateOfBirth = body.dateOfBirth;
      if (body.gender !== undefined) updateData.gender = body.gender;
      if (body.idNumber !== undefined) updateData.idNumber = body.idNumber;
      if (body.curp !== undefined) {
        const existingCurp = existing.curp?.trim();
        const nextCurp = body.curp?.trim() ? body.curp.trim().toUpperCase() : null;
        if (existingCurp) {
          if (nextCurp && nextCurp !== existingCurp.toUpperCase()) {
            return c.json(
              {
                error: 'Campo inmutable',
                message: 'La CURP no puede modificarse una vez registrada.',
              },
              400
            );
          }
        } else if (nextCurp) {
          updateData.curp = nextCurp;
        } else {
          updateData.curp = null;
        }
      }
      if (body.phone !== undefined) {
        const phoneCountry = await resolvePatientPhoneCountry({
          clinicId: existing.clinicId,
          createdByUserId: existing.createdBy,
        });
        updateData.phone = normalizePhoneE164(body.phone, phoneCountry) ?? body.phone.trim();
      }
      if (body.email !== undefined) updateData.email = body.email || null;
      if (body.address !== undefined) updateData.address = body.address || null;
      if (body.city !== undefined) updateData.city = body.city || null;
      if (body.postalCode !== undefined) updateData.postalCode = body.postalCode || null;
      if (body.weightKg !== undefined) updateData.weightKg = body.weightKg?.trim() || null;
      if (body.heightCm !== undefined) updateData.heightCm = body.heightCm?.trim() || null;
      if (body.medicalHistory !== undefined) {
        updateData.medicalHistory = JSON.stringify(normalizeMedicalHistory(body.medicalHistory));
      }
      if (body.consent !== undefined) {
        updateData.consent = JSON.stringify(
          body.consent || { given: false, date: null }
        );
      }

      await database
        .update(patientsTable)
        .set(updateData)
        .where(eq(patientsTable.id, patientId));

      const [row] = await database
        .select()
        .from(patientsTable)
        .where(eq(patientsTable.id, patientId))
        .limit(1);

      const patient = mapDbPatient(row);
      return c.json({ success: true, patient });
    } catch (error) {
      console.error('Error actualizando paciente:', error);
      return c.json(
        { error: 'Error interno', message: 'Error al actualizar paciente' },
        500
      );
    }
  }
);

/**
 * DELETE /api/patients/:patientId
 * Elimina un paciente
 * Requiere: permiso manage_patients
 */
patientsRoutes.delete(
  '/:patientId',
  requirePermission('manage_patients'),
  async (c) => {
    try {
      const patientId = sanitizePathParam(c.req.param('patientId'), 64);
      if (!patientId) {
        return c.json({ error: 'ID de paciente inválido' }, 400);
      }
      const user = c.get('user')!;
      if (isClinicAdminWithoutClinic(user)) {
        return c.json(
          { error: 'Acceso denegado', message: 'Cuenta de administrador de clínica sin clínica asignada' },
          403
        );
      }

      const existingRows = await database
        .select()
        .from(patientsTable)
        .where(eq(patientsTable.id, patientId))
        .limit(1);

      if (!existingRows.length) {
        return c.json({ error: 'Paciente no encontrado' }, 404);
      }

      const existing = existingRows[0];

      const { hasActiveLegalHold } = await import('../utils/legal-hold');
      if (await hasActiveLegalHold('patient', patientId) || existing.legalHold) {
        return c.json(
          {
            error: 'legal_hold_active',
            message:
              'Este expediente tiene un bloqueo legal activo (legal hold). No puede eliminarse hasta que un administrador levante el bloqueo.',
          },
          409
        );
      }

      const { isPatientProtectedFromDeletion } = await import('../utils/clinical-retention-purge');
      const retentionBlock = await isPatientProtectedFromDeletion(patientId);
      if (retentionBlock === 'retention_period_active') {
        return c.json(
          {
            error: 'retention_period_active',
            message:
              'Este expediente aún está dentro del plazo legal de conservación (NOM-004 / política global). No puede eliminarse hasta que expire retain_until.',
          },
          409
        );
      }

      // Reglas de borrado:
      // - receptionist: no puede eliminar pacientes
      // - super_admin: puede borrar cualquier paciente
      // - podiatrist: solo puede borrar pacientes que él mismo creó
      // - clinic_admin: solo pacientes de su clínica
      if (user?.role === 'receptionist') {
        return c.json(
          { error: 'Acceso denegado', message: 'No tienes permiso para eliminar pacientes' },
          403
        );
      }
      if (user?.role === 'podiatrist' && existing.createdBy !== user.userId) {
        return c.json(
          {
            error: 'Acceso denegado',
            message: 'No tienes permiso para eliminar este paciente',
          },
          403
        );
      }
      if (user?.role === 'clinic_admin' && existing.clinicId !== user.clinicId) {
        return c.json(
          { error: 'Acceso denegado', message: 'No tienes permiso para eliminar este paciente' },
          403
        );
      }

      // Comprobar si tiene sesiones o citas (restricción FK impediría el borrado)
      const sessionsOfPatient = await database
        .select({ id: sessionsTable.id })
        .from(sessionsTable)
        .where(eq(sessionsTable.patientId, patientId));
      const appointmentsOfPatient = await database
        .select()
        .from(appointmentsTable)
        .where(eq(appointmentsTable.patientId, patientId));

      const hasSessions = sessionsOfPatient.length > 0;
      const hasAppointments = appointmentsOfPatient.length > 0;
      const cascade = c.req.query('cascade') === 'true';

      // Si tiene sesiones o citas y no se pide cascade, devolver error claro
      if ((hasSessions || hasAppointments) && !cascade) {
        const parts: string[] = [];
        if (hasSessions) parts.push(`${sessionsOfPatient.length} sesión(es) clínica(s)`);
        if (hasAppointments) parts.push(`${appointmentsOfPatient.length} cita(s)`);
        return c.json(
          {
            error: 'patient_has_records',
            message: `No se puede eliminar: el paciente tiene ${parts.join(' y ')}. Use "Eliminar todo" para borrar también sesiones y citas.`,
          },
          400
        );
      }

      // Cascade: eliminar en orden por restricciones FK
      const bucket = getR2Bucket(c.env as { BUCKET?: R2Bucket });
      if (hasSessions) {
        const sessionIds = sessionsOfPatient.map((s) => s.id);
        await purgePatientMediaR2(patientId, sessionIds, bucket);
        await database.delete(creditTransactionsTable).where(inArray(creditTransactionsTable.sessionId, sessionIds));
        await database.delete(sessionsTable).where(eq(sessionsTable.patientId, patientId));
      } else {
        await purgePatientMediaR2(patientId, [], bucket);
      }
      if (hasAppointments) {
        await database.delete(appointmentsTable).where(eq(appointmentsTable.patientId, patientId));
      }

      await database
        .delete(patientsTable)
        .where(eq(patientsTable.id, patientId));

      return c.json({ success: true, message: 'Paciente eliminado correctamente' });
    } catch (error) {
      console.error('Error eliminando paciente:', error);
      return c.json(
        { error: 'Error interno', message: 'Error al eliminar paciente' },
        500
      );
    }
  }
);

export default patientsRoutes;

