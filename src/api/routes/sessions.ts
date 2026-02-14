import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';
import { sanitizePathParam } from '../utils/sanitization';
import { database } from '../database';
import { clinicalSessions as sessionsTable, patients as patientsTable, createdUsers as createdUsersTable } from '../database/schema';
import { eq } from 'drizzle-orm';
import { validateImageDataUri, MAX_SESSION_IMAGE_BYTES } from '../utils/logo-upload';
import { checkSessionCreateRateLimit } from '../utils/action-rate-limit';
import type { ClinicalSession } from '../../web/lib/storage';

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
    const v = validateImageDataUri(typeof images[i] === 'string' ? images[i] : null, MAX_SESSION_IMAGE_BYTES);
    if (!v.valid) return { ok: false, error: v.error, message: v.message };
    sanitized.push(v.sanitized);
  }
  return { ok: true, sanitized };
}

const sessionsRoutes = new Hono();

// UUID criptográfico: imposible de adivinar por fuerza bruta, evita acceso por rutas predecibles
const generateId = () => crypto.randomUUID();

/** Obtiene los IDs de podólogos asignados a una recepcionista (desde DB). */
async function getAssignedPodiatristIds(userId: string): Promise<string[]> {
  const rows = await database
    .select({ assignedPodiatristIds: createdUsersTable.assignedPodiatristIds })
    .from(createdUsersTable)
    .where(eq(createdUsersTable.id, userId))
    .limit(1);
  if (!rows[0]?.assignedPodiatristIds) return [];
  try {
    const parsed = JSON.parse(rows[0].assignedPodiatristIds) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

type DbSession = typeof sessionsTable.$inferSelect;

// Mapea el registro de DB al shape esperado por el frontend (ClinicalSession de storage.ts)
function mapDbSession(row: DbSession): ClinicalSession {
  type NotesPayload = {
    clinicalNotes?: string;
    anamnesis?: string;
    physicalExamination?: string;
    diagnosis?: string;
    treatmentPlan?: string;
    images?: string[];
    nextAppointmentDate?: string | null;
    followUpNotes?: string | null;
    appointmentReason?: string | null;
    status?: ClinicalSession['status'];
    completedAt?: string | null;
    creditReservedAt?: string | null;
  };

  let extra: NotesPayload = {};

  if (row.notes) {
    try {
      const parsed = JSON.parse(row.notes) as NotesPayload | string;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        extra = parsed as NotesPayload;
      }
    } catch {
      // Si no es JSON, usamos el valor de notes solo como texto clínico
    }
  }

  const status: ClinicalSession['status'] =
    extra.status ?? (row.creditsUsed && row.creditsUsed > 0 ? 'completed' : 'draft');

  return {
    id: row.id,
    patientId: row.patientId,
    sessionDate: row.sessionDate,
    status,
    clinicalNotes: extra.clinicalNotes ?? row.notes ?? '',
    anamnesis: extra.anamnesis ?? '',
    physicalExamination: extra.physicalExamination ?? '',
    diagnosis: extra.diagnosis ?? row.diagnosis ?? '',
    treatmentPlan: extra.treatmentPlan ?? row.treatment ?? '',
    images: extra.images ?? [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    completedAt:
      extra.completedAt ??
      (status === 'completed' ? row.updatedAt : null),
    createdBy: row.createdBy,
    creditReservedAt: extra.creditReservedAt ?? null,
    nextAppointmentDate: extra.nextAppointmentDate ?? null,
    followUpNotes: extra.followUpNotes ?? null,
    appointmentReason: extra.appointmentReason ?? null,
  };
}

// Serializa una sesión clínica completa en el campo notes (JSON)
function buildNotesPayload(session: ClinicalSession): string {
  const payload = {
    clinicalNotes: session.clinicalNotes,
    anamnesis: session.anamnesis,
    physicalExamination: session.physicalExamination,
    diagnosis: session.diagnosis,
    treatmentPlan: session.treatmentPlan,
    images: session.images,
    nextAppointmentDate: session.nextAppointmentDate,
    followUpNotes: session.followUpNotes,
    appointmentReason: session.appointmentReason,
    status: session.status,
    completedAt: session.completedAt,
    creditReservedAt: session.creditReservedAt,
  };

  return JSON.stringify(payload);
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
      const user = c.get('user');
      const patientFilter = c.req.query('patient');

      let rows = await database.select().from(sessionsTable);

      // Reglas de visibilidad:
      // - super_admin: todas
      // - podiatrist: solo sus propias sesiones (createdBy === user.userId)
      // - clinic_admin: solo sesiones de su clínica (clinicId === user.clinicId)
      // - receptionist: solo sesiones de podólogos asignados
      if (user?.role === 'podiatrist') {
        rows = rows.filter((s) => s.createdBy === user.userId);
      } else if (user?.role === 'clinic_admin' && user.clinicId) {
        rows = rows.filter((s) => s.clinicId === user.clinicId);
      } else if (user?.role === 'receptionist') {
        const assignedIds = await getAssignedPodiatristIds(user.userId);
        if (assignedIds.length === 0) {
          rows = [];
        } else {
          rows = rows.filter((s) => assignedIds.includes(s.createdBy));
        }
      }

      if (patientFilter) {
        rows = rows.filter((s) => s.patientId === patientFilter);
      }

      const sessions = rows.map(mapDbSession);
      return c.json({ success: true, sessions });
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
      const user = c.get('user');

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
      if (user?.role === 'clinic_admin' && user.clinicId && row.clinicId !== user.clinicId) {
        return c.json(
          { error: 'Acceso denegado', message: 'No tienes permiso para ver esta sesión' },
          403
        );
      }
      if (user?.role === 'receptionist') {
        const assignedIds = await getAssignedPodiatristIds(user.userId);
        if (!assignedIds.includes(row.createdBy)) {
          return c.json(
            { error: 'Acceso denegado', message: 'No tienes permiso para ver esta sesión' },
            403
          );
        }
      }

      const session = mapDbSession(row);
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
      const user = c.get('user');
      const body = await c.req.json().catch(() => ({}));

      if (!body.patientId || !body.sessionDate) {
        return c.json(
          {
            error: 'Datos inválidos',
            message: 'patientId y sessionDate son requeridos',
          },
          400
        );
      }

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

      // Solo almacenar imágenes en sesiones en progreso (draft). Completadas no guardan imágenes (respaldo más ligero).
      let sessionImages: string[] = [];
      if (status === 'draft') {
        const imagesValidation = validateSessionImages(body.images);
        if (!imagesValidation.ok) {
          return c.json({ error: imagesValidation.error, message: imagesValidation.message }, 400);
        }
        sessionImages = imagesValidation.sanitized;
      }

      const now = new Date().toISOString();
      const id = generateId();

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
        createdBy: user!.userId,
        creditReservedAt: body.creditReservedAt || null,
        nextAppointmentDate: body.nextAppointmentDate || null,
        followUpNotes: body.followUpNotes || null,
        appointmentReason: body.appointmentReason || null,
      };

      await database.insert(sessionsTable).values({
        id: session.id,
        patientId: session.patientId,
        sessionDate: session.sessionDate,
        sessionType: 'routine',
        diagnosis: session.diagnosis || null,
        treatment: session.treatmentPlan || null,
        notes: buildNotesPayload(session),
        creditsUsed: status === 'completed' ? 1 : 0,
        createdBy: session.createdBy,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        clinicId: user?.clinicId || null,
      });

      return c.json({ success: true, session }, 201);
    } catch (error) {
      console.error('Error creando sesión:', error);
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
      const user = c.get('user');

      const existingRows = await database
        .select()
        .from(sessionsTable)
        .where(eq(sessionsTable.id, sessionId))
        .limit(1);

      if (!existingRows.length) {
        return c.json({ error: 'Sesión no encontrada' }, 404);
      }

      const existingRow = existingRows[0];
      const existingSession = mapDbSession(existingRow);

      // Reglas de modificación:
      // - super_admin: puede actualizar cualquier sesión
      // - podiatrist: solo puede actualizar sesiones que él mismo creó
      if (user?.role === 'podiatrist' && existingRow.createdBy !== user.userId) {
        return c.json(
          {
            error: 'Acceso denegado',
            message: 'No tienes permiso para modificar esta sesión',
          },
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
      const body = await c.req.json().catch(() => ({}));

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

      // Solo almacenar imágenes en sesiones en progreso (draft). Al completar, vaciar.
      let updatedImages: string[] = existingSession.images;
      if (finalStatus === 'completed') {
        updatedImages = [];
      } else if (body.images !== undefined) {
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
        creditReservedAt:
          body.creditReservedAt !== undefined
            ? body.creditReservedAt
            : existingSession.creditReservedAt,
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
      };

      await database
        .update(sessionsTable)
        .set({
          patientId: updatedSession.patientId,
          sessionDate: updatedSession.sessionDate,
          diagnosis: updatedSession.diagnosis || null,
          treatment: updatedSession.treatmentPlan || null,
          notes: buildNotesPayload(updatedSession),
          creditsUsed: updatedSession.status === 'completed' ? 1 : 0,
          updatedAt: updatedSession.updatedAt,
        })
        .where(eq(sessionsTable.id, sessionId));

      return c.json({ success: true, session: updatedSession });
    } catch (error) {
      console.error('Error actualizando sesión:', error);
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
      const user = c.get('user');

      const existingRows = await database
        .select()
        .from(sessionsTable)
        .where(eq(sessionsTable.id, sessionId))
        .limit(1);

      if (!existingRows.length) {
        return c.json({ error: 'Sesión no encontrada' }, 404);
      }

      const existingRow = existingRows[0];
      const existingSession = mapDbSession(existingRow);

      // Reglas de borrado:
      // - super_admin: puede borrar cualquier sesión
      // - podiatrist: solo puede borrar sesiones que él mismo creó
      if (user?.role === 'podiatrist' && existingRow.createdBy !== user.userId) {
        return c.json(
          {
            error: 'Acceso denegado',
            message: 'No tienes permiso para eliminar esta sesión',
          },
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

