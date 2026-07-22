import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';
import { sanitizePathParam } from '../utils/sanitization';
import {
  validateData,
  validateQuery,
  createSessionSchema,
  updateSessionSchema,
  sessionsListQuerySchema,
} from '../utils/validation';
import { database } from '../database';
import {
  clinicalSessions as sessionsTable,
  patients as patientsTable,
  createdUsers as createdUsersTable,
  prescriptions as prescriptionsTable,
  sessionInventoryUsage as sessionInventoryUsageTable,
  sessionChecklists as sessionChecklistsTable,
  clinicalEvolutionNotes as clinicalEvolutionNotesTable,
  patientConsentSignatures as patientConsentSignaturesTable,
  labAttachments as labAttachmentsTable,
  creditTransactions as creditTransactionsTable,
} from '../database/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { validateImageDataUri, MAX_SESSION_IMAGE_BYTES, MAX_D1_STORED_DATA_URI_BYTES } from '../utils/logo-upload';
import { syncClinicalRetentionForSession } from '../utils/clinical-retention';
import { isR2Reference, isSessionImageFilePath, getR2Bucket } from '../utils/r2-media';
import { attachSessionImages, replaceSessionImages, loadSessionImagesMap } from '../utils/session-images';
import { canUserAccess } from '../utils/user-retention';
import { checkSessionCreateRateLimit } from '../utils/action-rate-limit';
import {
  getAssignedPodiatristUserIds,
  getPatientAccessDeniedReason,
  getSessionAccessDeniedReason,
  isClinicAdminWithoutClinic,
} from '../utils/tenant-isolation';
import { resolveClinicalListScope, mergeScopeWhere } from '../utils/clinical-list-scope';
import {
  buildSessionSearchCondition,
  buildSessionStatusCondition,
  mergeAnd,
} from '../utils/clinical-list-search';
import { parsePaginationQuery, buildPaginationMeta } from '../utils/pagination';
import type { ClinicalSession } from '../../web/types/clinical';
import {
  normalizeDigitalAlterations,
  normalizeHelomas,
  normalizeLimbAssessment,
  normalizeOnychopathies,
  normalizeSweatDisorders,
  finalizeDigitalAlterations,
  finalizeHelomas,
  finalizeLimbAssessment,
  finalizeOnychopathies,
  finalizeSweatDisorders,
} from '../../web/types/podiatry';
import { mapDbSession, mapDbSessionSummary } from '../utils/clinical-maps';

const DEFAULT_MAX_SESSION_IMAGES = 10;
/** Máximo de imágenes por sesión. Configurable con SESSION_IMAGE_MAX_COUNT (modo ligero). */
const MAX_SESSION_IMAGES =
  typeof process !== 'undefined' && process.env?.SESSION_IMAGE_MAX_COUNT
    ? Math.min(Math.max(parseInt(process.env.SESSION_IMAGE_MAX_COUNT, 10) || DEFAULT_MAX_SESSION_IMAGES, 1), DEFAULT_MAX_SESSION_IMAGES)
    : DEFAULT_MAX_SESSION_IMAGES;

/** Valida un array de imágenes (data URI); devuelve array sanitizado o primer error. */
function validateSessionImages(images: unknown): { ok: true; sanitized: string[] } | { ok: false; error: string; message: string } {
  if (!Array.isArray(images)) return { ok: true, sanitized: [] };
  if (images.length > MAX_SESSION_IMAGES) {
    return { ok: false, error: 'images_limit', message: `Máximo ${MAX_SESSION_IMAGES} imágenes por sesión.` };
  }
  const sanitized: string[] = [];
  for (let i = 0; i < images.length; i++) {
    const raw = typeof images[i] === 'string' ? images[i] : null;
    if (!raw) {
      return { ok: false, error: 'image_invalid', message: 'Imagen no válida o vacía.' };
    }
    if (isSessionImageFilePath(raw) || isR2Reference(raw)) {
      sanitized.push(raw);
      continue;
    }
    const v = validateImageDataUri(raw, MAX_SESSION_IMAGE_BYTES);
    if (!v.valid) return { ok: false, error: v.error, message: v.message };
    sanitized.push(v.sanitized);
  }
  return { ok: true, sanitized };
}

const sessionsRoutes = new Hono();

// UUID criptográfico: imposible de adivinar por fuerza bruta, evita acceso por rutas predecibles
const generateId = () => crypto.randomUUID();

// Serializa una sesión clínica completa en el campo notes (JSON). Imágenes van en clinical_session_images.
function buildNotesPayload(session: ClinicalSession): string {
  const payload = {
    clinicalNotes: session.clinicalNotes,
    anamnesis: session.anamnesis,
    physicalExamination: session.physicalExamination,
    diagnosis: session.diagnosis,
    treatmentPlan: session.treatmentPlan,
    images: [],
    nextAppointmentDate: session.nextAppointmentDate,
    followUpNotes: session.followUpNotes,
    appointmentReason: session.appointmentReason,
    patientWeightKg: session.patientWeightKg,
    patientHeightCm: session.patientHeightCm,
    footType: session.footType,
    archType: session.archType,
    sweatDisorders: session.sweatDisorders,
    limbAssessment: session.limbAssessment,
    helomas: session.helomas,
    digitalAlterations: session.digitalAlterations,
    onychopathies: session.onychopathies,
    customSections: session.customSections ?? {},
    status: session.status,
    completedAt: session.completedAt,
  };

  const json = JSON.stringify(payload);
  if (json.length > MAX_D1_STORED_DATA_URI_BYTES) {
    throw new Error('notes_stored_too_large');
  }
  return json;
}

async function syncPatientVitalsFromSession(
  patientId: string,
  weight?: string | null,
  height?: string | null
): Promise<void> {
  const weightTrimmed = weight?.trim() || null;
  const heightTrimmed = height?.trim() || null;
  if (!weightTrimmed && !heightTrimmed) return;

  const update: Partial<typeof patientsTable.$inferInsert> = {
    updatedAt: new Date().toISOString(),
  };
  if (weightTrimmed) update.weightKg = weightTrimmed;
  if (heightTrimmed) update.heightCm = heightTrimmed;

  await database.update(patientsTable).set(update).where(eq(patientsTable.id, patientId));
}

function sessionSaveErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/notes_stored_too_large/i.test(message)) {
    return {
      status: 413 as const,
      body: {
        error: 'payload_too_large',
        message:
          'El texto de la historia clínica es demasiado extenso. Reduzca notas, tablas o secciones personalizadas e intente de nuevo.',
      },
    };
  }
  if (/image_stored_too_large/i.test(message)) {
    return {
      status: 413 as const,
      body: {
        error: 'payload_too_large',
        message:
          'Una o más fotos son demasiado pesadas para guardarse. Elimine fotos grandes o use imágenes más pequeñas (máx. ~1,3 MB por foto).',
      },
    };
  }
  if (/too large|TOOBIG|SQLITE_FULL|string too long|hung|canceled/i.test(message)) {
    return {
      status: 413 as const,
      body: {
        error: 'payload_too_large',
        message:
          'La sesión es demasiado pesada (fotos o notas). Reduce el tamaño de las imágenes o el texto e intenta de nuevo.',
      },
    };
  }
  return null;
}

// Todas las rutas de sesiones requieren autenticación
sessionsRoutes.use('*', requireAuth);

/**
 * GET /api/sessions
 * Obtiene la lista de sesiones clínicas
 * Requiere: permiso view_sessions
 */
sessionsRoutes.get(
  '/',
  requirePermission('view_sessions'),
  async (c) => {
    try {
      const user = c.get('user')!;
      if (isClinicAdminWithoutClinic(user)) {
        return c.json(
          { error: 'Acceso denegado', message: 'Cuenta de administrador de clínica sin clínica asignada' },
          403
        );
      }
      const queryResult = validateQuery(sessionsListQuerySchema, c.req.query());
      if (!queryResult.success) {
        return c.json({ error: 'Parámetros inválidos', message: queryResult.error, issues: queryResult.issues }, 400);
      }
      const patientFilter = queryResult.data.patient;
      const searchQ = queryResult.data.q;
      const statusFilter = queryResult.data.status ?? 'all';
      const fromDate = queryResult.data.from;
      const toDate = queryResult.data.to;
      const pagination = parsePaginationQuery({
        limit: queryResult.data.limit,
        offset: queryResult.data.offset,
      });

      const scope = await resolveClinicalListScope(user);
      const scopeWhere = mergeScopeWhere(scope, {
        createdBy: sessionsTable.createdBy,
        clinicId: sessionsTable.clinicId,
      });
      const patientEq = patientFilter ? eq(sessionsTable.patientId, patientFilter) : undefined;
      const statusCond =
        statusFilter === 'all' ? undefined : buildSessionStatusCondition(statusFilter);
      const searchCond = buildSessionSearchCondition(searchQ ?? '');
      const fromCond = fromDate ? gte(sessionsTable.sessionDate, fromDate) : undefined;
      const toCond = toDate ? lte(sessionsTable.sessionDate, toDate) : undefined;
      const where = mergeAnd(scopeWhere, patientEq, statusCond, searchCond, fromCond, toCond);

      let query = database
        .select({
          session: sessionsTable,
          patientFirstName: patientsTable.firstName,
          patientLastName: patientsTable.lastName,
        })
        .from(sessionsTable)
        .innerJoin(patientsTable, eq(sessionsTable.patientId, patientsTable.id))
        .$dynamic();
      if (where) query = query.where(where);
      const rows = await query
        .orderBy(desc(sessionsTable.sessionDate))
        .limit(pagination.limit)
        .offset(pagination.offset);

      const sessions = rows.map(({ session, patientFirstName, patientLastName }) => ({
        ...mapDbSessionSummary(session),
        patientName: `${patientFirstName} ${patientLastName}`.trim(),
      }));
      return c.json({
        success: true,
        sessions,
        pagination: buildPaginationMeta(pagination, rows.length),
      });
    } catch (error) {
      console.error('Error obteniendo sesiones:', error);
      return c.json(
        { error: 'Error interno', message: 'Error al obtener sesiones' },
        500
      );
    }
  }
);

/**
 * GET /api/sessions/upcoming-followups
 * Sesiones con seguimiento próximo o vencido (banner en lista de sesiones).
 */
sessionsRoutes.get('/upcoming-followups', requirePermission('view_sessions'), async (c) => {
  try {
    const user = c.get('user')!;
    if (isClinicAdminWithoutClinic(user)) {
      return c.json({ success: true, items: [] });
    }
    const limitRaw = parseInt(c.req.query('limit') || '10', 10);
    const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 10, 1), 50);

    const scope = await resolveClinicalListScope(user);
    const scopeWhere = mergeScopeWhere(scope, {
      createdBy: sessionsTable.createdBy,
      clinicId: sessionsTable.clinicId,
    });

    let query = database
      .select({
        session: sessionsTable,
        patientFirstName: patientsTable.firstName,
        patientLastName: patientsTable.lastName,
      })
      .from(sessionsTable)
      .innerJoin(patientsTable, eq(sessionsTable.patientId, patientsTable.id))
      .$dynamic();
    if (scopeWhere) query = query.where(scopeWhere);
    const rows = await query.orderBy(desc(sessionsTable.sessionDate)).limit(200);

    const now = new Date();
    const items = rows
      .map(({ session, patientFirstName, patientLastName }) => {
        const followUpDate = session.nextAppointmentDate;
        if (!followUpDate) return null;
        const fu = new Date(followUpDate);
        const diffDays = Math.ceil((fu.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 14) return null;
        return {
          id: session.id,
          patientId: session.patientId,
          patientName: `${patientFirstName} ${patientLastName}`.trim(),
          sessionDate: session.sessionDate,
          nextAppointmentDate: followUpDate,
          daysUntil: diffDays,
          isOverdue: diffDays < 0,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, limit);

    return c.json({ success: true, items });
  } catch (error) {
    console.error('Error upcoming-followups:', error);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * GET /api/sessions/:sessionId
 * Obtiene una sesión específica
 * Requiere: permiso view_sessions
 */
sessionsRoutes.get(
  '/:sessionId',
  requirePermission('view_sessions'),
  async (c) => {
    try {
      const sessionId = sanitizePathParam(c.req.param('sessionId'), 64);
      if (!sessionId) {
        return c.json({ error: 'ID de sesión inválido' }, 400);
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
        .from(sessionsTable)
        .where(eq(sessionsTable.id, sessionId))
        .limit(1);

      if (!rows.length) {
        return c.json({ error: 'Sesión no encontrada' }, 404);
      }

      const row = rows[0];

      // Reglas de acceso adicionales:
      // - super_admin: acceso total
      // - podiatrist: solo sesiones que él mismo ha creado
      // - clinic_admin: solo sesiones de su clínica
      // - receptionist: solo sesiones de podólogos asignados
      if (user?.role === 'podiatrist' && row.createdBy !== user.userId) {
        return c.json(
          {
            error: 'Acceso denegado',
            message: 'No tienes permiso para ver esta sesión',
          },
          403
        );
      }
      if (user?.role === 'clinic_admin' && row.clinicId !== user.clinicId) {
        return c.json(
          { error: 'Acceso denegado', message: 'No tienes permiso para ver esta sesión' },
          403
        );
      }
      if (user?.role === 'receptionist') {
        const assignedIds = await getAssignedPodiatristUserIds(user.userId);
        if (!assignedIds.includes(row.createdBy)) {
          return c.json(
            { error: 'Acceso denegado', message: 'No tienes permiso para ver esta sesión' },
            403
          );
        }
      }

      const session = (await attachSessionImages([mapDbSession(row)]))[0];
      return c.json({ success: true, session });
    } catch (error) {
      console.error('Error obteniendo sesión:', error);
      return c.json(
        { error: 'Error interno', message: 'Error al obtener sesión' },
        500
      );
    }
  }
);

/**
 * POST /api/sessions
 * Crea una nueva sesión clínica
 * Requiere: permiso manage_sessions
 */
sessionsRoutes.post(
  '/',
  requirePermission('manage_sessions'),
  async (c) => {
    try {
      const user = c.get('user')!;
      if (isClinicAdminWithoutClinic(user)) {
        return c.json(
          { error: 'Acceso denegado', message: 'Cuenta de administrador de clínica sin clínica asignada' },
          403
        );
      }
      // Restringir creación de sesiones para usuarios en período de gracia (cuenta deshabilitada)
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
                'Tu cuenta está en período de gracia por exceso de pago. Durante 30 días puedes ver tus datos, pero no crear nuevas sesiones clínicas.',
            },
            403
          );
        }
      }
      const rawBody = await c.req.json().catch(() => ({}));
      const validation = validateData(createSessionSchema, rawBody);
      if (!validation.success) {
        return c.json({ error: 'Datos inválidos', message: validation.error, issues: validation.issues }, 400);
      }
      const body = validation.data;

      const patientRows = await database.select().from(patientsTable).where(eq(patientsTable.id, body.patientId)).limit(1);
      const patient = patientRows[0];
      if (!patient) {
        return c.json({ error: 'Paciente no encontrado' }, 404);
      }
      const missing = [];
      if (!patient.firstName?.trim()) missing.push('nombre');
      if (!patient.lastName?.trim()) missing.push('apellido');
      if (!patient.dateOfBirth?.trim()) missing.push('fecha de nacimiento');
      if (!patient.gender?.trim()) missing.push('género');
      if (!patient.idNumber?.trim()) missing.push('DNI (o DNI del padre/tutor si es menor)');
      if (missing.length > 0) {
        return c.json(
          { error: 'paciente_incompleto', message: `Faltan datos obligatorios del paciente: ${missing.join(', ')}. Edite la ficha del paciente antes de crear sesiones.` },
          400
        );
      }

      const patientDeny = await getPatientAccessDeniedReason(user, patient);
      if (patientDeny === 'clinic_admin_sin_clinica') {
        return c.json(
          { error: 'Acceso denegado', message: 'Cuenta de administrador de clínica sin clínica asignada' },
          403
        );
      }
      if (patientDeny) {
        return c.json(
          { error: 'Acceso denegado', message: 'No tienes permiso para crear sesiones para este paciente' },
          403
        );
      }

      const sessionRateLimit = await checkSessionCreateRateLimit(user.userId);
      if (!sessionRateLimit.allowed) {
        c.header('Retry-After', String(sessionRateLimit.retryAfterSeconds ?? 60));
        return c.json(
          { error: 'rate_limit', message: 'Demasiadas sesiones creadas. Espera un momento.' },
          429
        );
      }

      const status: ClinicalSession['status'] =
        body.status === 'completed' ? 'completed' : 'draft';

      const imagesValidation = validateSessionImages(body.images);
      if (!imagesValidation.ok) {
        return c.json({ error: imagesValidation.error, message: imagesValidation.message }, 400);
      }
      const sessionImages = imagesValidation.sanitized;

      const now = new Date().toISOString();
      const id = generateId();

      // La sesión queda atribuida al podólogo titular del paciente si actúa la recepción (listados filtran por createdBy)
      const sessionCreatedBy = user.role === 'receptionist' ? patient.createdBy : user.userId;

      const session: ClinicalSession = {
        id,
        patientId: String(body.patientId),
        sessionDate: String(body.sessionDate),
        status,
        clinicalNotes: String(body.clinicalNotes || ''),
        anamnesis: String(body.anamnesis || ''),
        physicalExamination: String(body.physicalExamination || ''),
        diagnosis: String(body.diagnosis || ''),
        treatmentPlan: String(body.treatmentPlan || ''),
        images: sessionImages,
        createdAt: now,
        updatedAt: now,
        completedAt:
          status === 'completed'
            ? body.completedAt || now
            : null,
        createdBy: sessionCreatedBy,
        nextAppointmentDate: body.nextAppointmentDate || null,
        followUpNotes: body.followUpNotes || null,
        appointmentReason: body.appointmentReason || null,
        patientWeightKg: body.patientWeightKg?.trim() || null,
        patientHeightCm: body.patientHeightCm?.trim() || null,
        footType: body.footType ?? null,
        archType: body.archType ?? null,
        sweatDisorders: finalizeSweatDisorders(normalizeSweatDisorders(body.sweatDisorders)),
        limbAssessment: finalizeLimbAssessment(normalizeLimbAssessment(body.limbAssessment)),
        helomas: finalizeHelomas(normalizeHelomas(body.helomas)),
        digitalAlterations: finalizeDigitalAlterations(normalizeDigitalAlterations(body.digitalAlterations)),
        onychopathies: finalizeOnychopathies(normalizeOnychopathies(body.onychopathies)),
        customSections: body.customSections ?? {},
      };

      await database.insert(sessionsTable).values({
        id: session.id,
        patientId: session.patientId,
        sessionDate: session.sessionDate,
        sessionType: 'routine',
        diagnosis: session.diagnosis || null,
        treatment: session.treatmentPlan || null,
        notes: buildNotesPayload(session),
        creditsUsed: 0,
        createdBy: session.createdBy,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        clinicId: user?.clinicId ?? patient.clinicId ?? null,
      });

      await replaceSessionImages(session.id, sessionImages, {
        bucket: getR2Bucket(c.env as { BUCKET?: R2Bucket }),
        userId: user.userId,
      });

      const resolvedImages =
        (await loadSessionImagesMap([session.id]))[session.id] ?? sessionImages;

      await syncClinicalRetentionForSession({
        sessionId: session.id,
        patientId: session.patientId,
        sessionDate: session.sessionDate,
        completedAt: session.completedAt,
        updatedAtIso: session.updatedAt,
      });

      await syncPatientVitalsFromSession(
        session.patientId,
        session.patientWeightKg,
        session.patientHeightCm
      );

      return c.json({ success: true, session: { ...session, images: resolvedImages } }, 201);
    } catch (error) {
      console.error('Error creando sesión:', error);
      const saveErr = sessionSaveErrorResponse(error);
      if (saveErr) return c.json(saveErr.body, saveErr.status);
      return c.json(
        { error: 'Error interno', message: 'Error al crear sesión' },
        500
      );
    }
  }
);

/**
 * PUT /api/sessions/:sessionId
 * Actualiza una sesión clínica
 * Requiere: permiso manage_sessions
 */
sessionsRoutes.put(
  '/:sessionId',
  requirePermission('manage_sessions'),
  async (c) => {
    try {
      const sessionId = sanitizePathParam(c.req.param('sessionId'), 64);
      if (!sessionId) {
        return c.json({ error: 'ID de sesión inválido' }, 400);
      }
      const user = c.get('user')!;

      const existingRows = await database
        .select()
        .from(sessionsTable)
        .where(eq(sessionsTable.id, sessionId))
        .limit(1);

      if (!existingRows.length) {
        return c.json({ error: 'Sesión no encontrada' }, 404);
      }

      const existingRow = existingRows[0];
      const existingSession = (await attachSessionImages([mapDbSession(existingRow)]))[0];

      const sessionDeny = await getSessionAccessDeniedReason(user, existingRow);
      if (sessionDeny === 'clinic_admin_sin_clinica') {
        return c.json(
          { error: 'Acceso denegado', message: 'Cuenta de administrador de clínica sin clínica asignada' },
          403
        );
      }
      if (sessionDeny) {
        return c.json(
          { error: 'Acceso denegado', message: 'No tienes permiso para modificar esta sesión' },
          403
        );
      }

      const patientRows = await database.select().from(patientsTable).where(eq(patientsTable.id, existingRow.patientId)).limit(1);
      const patient = patientRows[0];
      if (!patient) {
        return c.json({ error: 'Paciente no encontrado' }, 404);
      }
      const missing = [];
      if (!patient.firstName?.trim()) missing.push('nombre');
      if (!patient.lastName?.trim()) missing.push('apellido');
      if (!patient.dateOfBirth?.trim()) missing.push('fecha de nacimiento');
      if (!patient.gender?.trim()) missing.push('género');
      if (!patient.idNumber?.trim()) missing.push('DNI (o DNI del padre/tutor si es menor)');
      if (missing.length > 0) {
        return c.json(
          { error: 'paciente_incompleto', message: `Faltan datos obligatorios del paciente: ${missing.join(', ')}. Edite la ficha del paciente antes de editar sesiones.` },
          400
        );
      }

      // No permitir cambiar de completed a draft
      const rawBody = await c.req.json().catch(() => ({}));
      const validation = validateData(updateSessionSchema, rawBody);
      if (!validation.success) {
        return c.json({ error: 'Datos inválidos', message: validation.error, issues: validation.issues }, 400);
      }
      const body = validation.data;

      const newPatientId =
        body.patientId !== undefined && body.patientId !== null && String(body.patientId) !== String(existingRow.patientId)
          ? String(body.patientId)
          : null;
      if (newPatientId) {
        const npRows = await database.select().from(patientsTable).where(eq(patientsTable.id, newPatientId)).limit(1);
        const np = npRows[0];
        if (!np) {
          return c.json({ error: 'Paciente no encontrado' }, 404);
        }
        const npDeny = await getPatientAccessDeniedReason(user, np);
        if (npDeny) {
          return c.json(
            { error: 'Acceso denegado', message: 'No tienes permiso para vincular la sesión a ese paciente' },
            403
          );
        }
      }

      const requestedStatus: ClinicalSession['status'] | undefined =
        body.status === 'completed' || body.status === 'draft'
          ? body.status
          : undefined;

      if (
        existingSession.status === 'completed' &&
        requestedStatus === 'draft'
      ) {
        return c.json(
          {
            error: 'Operación no permitida',
            message: 'No se puede volver a borrador una sesión completada',
          },
          400
        );
      }

      const now = new Date().toISOString();
      const finalStatus: ClinicalSession['status'] =
        requestedStatus ?? existingSession.status;

      // Imágenes clínicas se conservan también en sesiones completadas (historial / impresión).
      let updatedImages: string[] = existingSession.images;
      if (body.images !== undefined) {
        const imagesValidation = validateSessionImages(body.images);
        if (!imagesValidation.ok) {
          return c.json({ error: imagesValidation.error, message: imagesValidation.message }, 400);
        }
        updatedImages = imagesValidation.sanitized;
      }

      const updatedSession: ClinicalSession = {
        ...existingSession,
        patientId: body.patientId || existingSession.patientId,
        sessionDate: body.sessionDate || existingSession.sessionDate,
        status: finalStatus,
        clinicalNotes:
          body.clinicalNotes !== undefined
            ? String(body.clinicalNotes)
            : existingSession.clinicalNotes,
        anamnesis:
          body.anamnesis !== undefined
            ? String(body.anamnesis)
            : existingSession.anamnesis,
        physicalExamination:
          body.physicalExamination !== undefined
            ? String(body.physicalExamination)
            : existingSession.physicalExamination,
        diagnosis:
          body.diagnosis !== undefined
            ? String(body.diagnosis)
            : existingSession.diagnosis,
        treatmentPlan:
          body.treatmentPlan !== undefined
            ? String(body.treatmentPlan)
            : existingSession.treatmentPlan,
        images: updatedImages,
        createdAt: existingSession.createdAt,
        updatedAt: now,
        completedAt:
          finalStatus === 'completed'
            ? body.completedAt || existingSession.completedAt || now
            : null,
        createdBy: existingSession.createdBy,
        nextAppointmentDate:
          body.nextAppointmentDate !== undefined
            ? body.nextAppointmentDate
            : existingSession.nextAppointmentDate,
        followUpNotes:
          body.followUpNotes !== undefined
            ? body.followUpNotes
            : existingSession.followUpNotes,
        appointmentReason:
          body.appointmentReason !== undefined
            ? body.appointmentReason
            : existingSession.appointmentReason,
        patientWeightKg:
          body.patientWeightKg !== undefined
            ? body.patientWeightKg?.trim() || null
            : existingSession.patientWeightKg,
        patientHeightCm:
          body.patientHeightCm !== undefined
            ? body.patientHeightCm?.trim() || null
            : existingSession.patientHeightCm,
        footType:
          body.footType !== undefined ? body.footType ?? null : existingSession.footType,
        archType:
          body.archType !== undefined ? body.archType ?? null : existingSession.archType,
        sweatDisorders:
          body.sweatDisorders !== undefined
            ? finalizeSweatDisorders(normalizeSweatDisorders(body.sweatDisorders))
            : existingSession.sweatDisorders,
        limbAssessment:
          body.limbAssessment !== undefined
            ? finalizeLimbAssessment(normalizeLimbAssessment(body.limbAssessment))
            : existingSession.limbAssessment,
        helomas:
          body.helomas !== undefined
            ? finalizeHelomas(normalizeHelomas(body.helomas))
            : existingSession.helomas,
        digitalAlterations:
          body.digitalAlterations !== undefined
            ? finalizeDigitalAlterations(normalizeDigitalAlterations(body.digitalAlterations))
            : existingSession.digitalAlterations,
        onychopathies:
          body.onychopathies !== undefined
            ? finalizeOnychopathies(normalizeOnychopathies(body.onychopathies))
            : existingSession.onychopathies,
        customSections:
          body.customSections !== undefined
            ? body.customSections
            : existingSession.customSections,
      };

      await database
        .update(sessionsTable)
        .set({
          patientId: updatedSession.patientId,
          sessionDate: updatedSession.sessionDate,
          diagnosis: updatedSession.diagnosis || null,
          treatment: updatedSession.treatmentPlan || null,
          notes: buildNotesPayload(updatedSession),
          creditsUsed: 0,
          updatedAt: updatedSession.updatedAt,
        })
        .where(eq(sessionsTable.id, sessionId));

      if (body.images !== undefined) {
        await replaceSessionImages(sessionId, updatedImages, {
          bucket: getR2Bucket(c.env as { BUCKET?: R2Bucket }),
          userId: user.userId,
        });
      }

      const imageMap = await loadSessionImagesMap([sessionId]);
      const resolvedImages = imageMap[sessionId] ?? updatedImages;

      await syncClinicalRetentionForSession({
        sessionId,
        patientId: updatedSession.patientId,
        sessionDate: updatedSession.sessionDate,
        completedAt: updatedSession.completedAt,
        updatedAtIso: updatedSession.updatedAt,
      });

      await syncPatientVitalsFromSession(
        updatedSession.patientId,
        updatedSession.patientWeightKg,
        updatedSession.patientHeightCm
      );

      return c.json({ success: true, session: { ...updatedSession, images: resolvedImages } });
    } catch (error) {
      console.error('Error actualizando sesión:', error);
      const saveErr = sessionSaveErrorResponse(error);
      if (saveErr) return c.json(saveErr.body, saveErr.status);
      return c.json(
        { error: 'Error interno', message: 'Error al actualizar sesión' },
        500
      );
    }
  }
);

/**
 * DELETE /api/sessions/:sessionId
 * Elimina una sesión clínica (solo si no está completada)
 * Requiere: permiso manage_sessions
 */
sessionsRoutes.delete(
  '/:sessionId',
  requirePermission('manage_sessions'),
  async (c) => {
    try {
      const sessionId = sanitizePathParam(c.req.param('sessionId'), 64);
      if (!sessionId) {
        return c.json({ error: 'ID de sesión inválido' }, 400);
      }
      const user = c.get('user')!;

      const existingRows = await database
        .select()
        .from(sessionsTable)
        .where(eq(sessionsTable.id, sessionId))
        .limit(1);

      if (!existingRows.length) {
        return c.json({ error: 'Sesión no encontrada' }, 404);
      }

      const existingRow = existingRows[0];
      const existingSession = (await attachSessionImages([mapDbSession(existingRow)]))[0];

      const delDeny = await getSessionAccessDeniedReason(user, existingRow);
      if (delDeny === 'clinic_admin_sin_clinica') {
        return c.json(
          { error: 'Acceso denegado', message: 'Cuenta de administrador de clínica sin clínica asignada' },
          403
        );
      }
      if (delDeny) {
        return c.json(
          { error: 'Acceso denegado', message: 'No tienes permiso para eliminar esta sesión' },
          403
        );
      }

      // No permitir borrar sesiones completadas
      if (existingSession.status === 'completed') {
        return c.json(
          {
            error: 'Operación no permitida',
            message: 'No se pueden eliminar sesiones completadas',
          },
          400
        );
      }

      // D1 exige integridad referencial (PRAGMA foreign_keys=ON): borrar la sesión con
      // registros enlazados fallaba con "Error interno" (violación de FK) antes de este fix.
      // Todo lo que es historial clínico del PACIENTE (recetas, notas de evolución,
      // consentimientos, adjuntos de laboratorio, movimientos de créditos) pivota sobre
      // patientId, no sobre la sesión: se desvincula (sessionId=NULL) para no perderlo.
      // Uso de inventario/checklist son bookkeeping puro de ESA sesión (sin identidad de
      // paciente propia) → se eliminan junto con ella.
      await database
        .update(prescriptionsTable)
        .set({ sessionId: null })
        .where(eq(prescriptionsTable.sessionId, sessionId));
      await database.delete(sessionInventoryUsageTable).where(eq(sessionInventoryUsageTable.sessionId, sessionId));
      await database.delete(sessionChecklistsTable).where(eq(sessionChecklistsTable.sessionId, sessionId));
      await database
        .update(clinicalEvolutionNotesTable)
        .set({ sessionId: null })
        .where(eq(clinicalEvolutionNotesTable.sessionId, sessionId));
      await database
        .update(patientConsentSignaturesTable)
        .set({ sessionId: null })
        .where(eq(patientConsentSignaturesTable.sessionId, sessionId));
      await database
        .update(labAttachmentsTable)
        .set({ sessionId: null })
        .where(eq(labAttachmentsTable.sessionId, sessionId));
      await database
        .update(creditTransactionsTable)
        .set({ sessionId: null })
        .where(eq(creditTransactionsTable.sessionId, sessionId));

      await database
        .delete(sessionsTable)
        .where(eq(sessionsTable.id, sessionId));

      return c.json({
        success: true,
        message: 'Sesión eliminada correctamente',
      });
    } catch (error) {
      console.error('Error eliminando sesión:', error);
      return c.json(
        { error: 'Error interno', message: 'Error al eliminar sesión' },
        500
      );
    }
  }
);

export default sessionsRoutes;

