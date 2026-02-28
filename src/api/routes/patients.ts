import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';
import { sanitizePathParam } from '../utils/sanitization';
import { validateData, createPatientSchema, updatePatientSchema } from '../utils/validation';
import { database } from '../database';
import { patients as patientsTable, clinicalSessions as sessionsTable, appointments as appointmentsTable, creditTransactions as creditTransactionsTable, createdUsers as createdUsersTable } from '../database/schema';
import { canUserAccess } from '../utils/user-retention';
import { eq, inArray } from 'drizzle-orm';
import { logAuditEvent } from '../utils/audit-log';
import { getClientIP } from '../utils/ip-tracking';
import { getSafeUserAgent } from '../utils/request-headers';

const patientsRoutes = new Hono();

// UUID criptográfico: imposible de adivinar por fuerza bruta, evita acceso por rutas predecibles
const generateId = () => crypto.randomUUID();

type DbPatient = typeof patientsTable.$inferSelect;

// Mapea el registro de DB al shape esperado por el frontend (Patient de storage.ts)
function mapDbPatient(row: DbPatient) {
  let medicalHistory: any = { allergies: [], medications: [], conditions: [] };
  let consent: any = { given: false, date: null };

  try {
    if (row.medicalHistory) {
      const parsed = JSON.parse(row.medicalHistory);
      medicalHistory = {
        allergies: parsed.allergies || [],
        medications: parsed.medications || [],
        conditions: parsed.conditions || [],
      };
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
    medicalHistory,
    consent,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
  };
}

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

// Genera folio simple basado en clinicId (o IND) y año
async function generateFolio(clinicId?: string | null): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = clinicId || 'IND';

  const all = await database.select().from(patientsTable);
  const re = new RegExp(`^${prefix}-${year}-(\\d+)$`);
  let maxSeq = 0;
  for (const p of all) {
    const m = p.folio.match(re);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!Number.isNaN(n) && n > maxSeq) maxSeq = n;
    }
  }
  const next = (maxSeq + 1).toString().padStart(5, '0');
  return `${prefix}-${year}-${next}`;
}

// Todas las rutas de pacientes requieren autenticación
patientsRoutes.use('*', requireAuth);

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
      const user = c.get('user');
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

      // En clinic_admin, restringir a su clínica cuando exista clinicId
      if (user?.role === 'clinic_admin' && user.clinicId) {
        // Si el paciente tiene clinicId, debe coincidir. Si no, igualmente validamos por destino (podólogo de la clínica).
        if (patient.clinicId && patient.clinicId !== user.clinicId) {
          return c.json({ error: 'Acceso denegado' }, 403);
        }
      }

      // Validar que el destino exista y sea podiatrist (y, si aplica, de la misma clínica)
      const targetRows = await database
        .select()
        .from(createdUsersTable)
        .where(eq(createdUsersTable.id, newPodiatristId))
        .limit(1);
      const target = targetRows[0];
      if (!target || target.role !== 'podiatrist') {
        return c.json({ error: 'Podólogo destino no encontrado' }, 404);
      }
      if (user?.role === 'clinic_admin' && user.clinicId) {
        if (target.clinicId !== user.clinicId) {
          return c.json({ error: 'Acceso denegado' }, 403);
        }
      }

      const previousPodiatristId = patient.createdBy;
      const now = new Date().toISOString();

      // Persistir reasignación en DB (paciente + todas sus sesiones)
      await database
        .update(patientsTable)
        .set({ createdBy: newPodiatristId, updatedAt: now })
        .where(eq(patientsTable.id, patientId));

      await database
        .update(sessionsTable)
        .set({ createdBy: newPodiatristId, updatedAt: now })
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
          toUserId: newPodiatristId,
        },
        ipAddress: getClientIP(c.req.raw.headers),
        userAgent: getSafeUserAgent(c),
        clinicId: user.clinicId ?? undefined,
      });

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
      const user = c.get('user');

      // Cargar todos los pacientes desde la DB
      let rows = await database.select().from(patientsTable);

      // Reglas de visibilidad en backend:
      // - super_admin: todos
      // - podiatrist: solo sus pacientes (createdBy === user.userId)
      // - receptionist: solo pacientes de los podólogos asignados (createdBy in assignedPodiatristIds)
      // - clinic_admin: solo pacientes de su clínica (clinicId === user.clinicId)
      if (user?.role === 'podiatrist') {
        rows = rows.filter((p) => p.createdBy === user.userId);
      } else if (user?.role === 'receptionist') {
        const assignedIds = await getAssignedPodiatristIds(user.userId);
        if (assignedIds.length === 0) {
          rows = [];
        } else {
          rows = rows.filter((p) => assignedIds.includes(p.createdBy));
        }
      } else if (user?.role === 'clinic_admin' && user.clinicId) {
        rows = rows.filter((p) => p.clinicId === user.clinicId);
      }

      const patients = rows.map(mapDbPatient);
      return c.json({ success: true, patients });
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
      const user = c.get('user');

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
        const assignedIds = await getAssignedPodiatristIds(user.userId);
        if (!assignedIds.includes(row.createdBy)) {
          return c.json(
            { error: 'Acceso denegado', message: 'No tienes permiso para ver este paciente' },
            403
          );
        }
      }
      if (user?.role === 'clinic_admin' && user.clinicId && row.clinicId !== user.clinicId) {
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
      const user = c.get('user');

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

      // Recepcionista: debe enviar createdBy (podólogo asignado) y debe estar en sus asignados
      if (user?.role === 'receptionist') {
        const podiatristId = (body as { createdBy?: string }).createdBy?.trim();
        if (!podiatristId) {
          return c.json(
            { error: 'createdBy requerido', message: 'Debes seleccionar un podólogo para asignar el paciente' },
            400
          );
        }
        const assignedIds = await getAssignedPodiatristIds(user.userId);
        if (!assignedIds.includes(podiatristId)) {
          return c.json(
            { error: 'Acceso denegado', message: 'No puedes asignar pacientes a ese podólogo' },
            403
          );
        }
        createdBy = podiatristId;
        // Obtener clinicId del podólogo para el folio/clínica del paciente
        const podRows = await database
          .select({ clinicId: createdUsersTable.clinicId })
          .from(createdUsersTable)
          .where(eq(createdUsersTable.id, podiatristId))
          .limit(1);
        if (podRows[0]?.clinicId) clinicIdForPatient = podRows[0].clinicId;
      }

      const now = new Date().toISOString();
      const id = generateId();
      const folio = await generateFolio(clinicIdForPatient);

      const medicalHistory = JSON.stringify(
        body.medicalHistory || { allergies: [], medications: [], conditions: [] }
      );
      const consent = JSON.stringify(
        body.consent || { given: false, date: null }
      );

      // Asegurar que idNumber sea siempre string (evita error si llega como número o undefined)
      const idNumber = typeof body.idNumber === 'string' ? body.idNumber : String(body.idNumber ?? '');

      await database.insert(patientsTable).values({
        id,
        folio,
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: body.dateOfBirth,
        gender: body.gender,
        idNumber,
        phone: body.phone,
        email: body.email || null,
        address: body.address || null,
        city: body.city || null,
        postalCode: body.postalCode || null,
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
      const user = c.get('user');

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
        const assignedIds = await getAssignedPodiatristIds(user.userId);
        if (!assignedIds.includes(existing.createdBy)) {
          return c.json(
            { error: 'Acceso denegado', message: 'No tienes permiso para modificar este paciente' },
            403
          );
        }
      }
      if (user?.role === 'clinic_admin' && user.clinicId && existing.clinicId !== user.clinicId) {
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
      if (body.phone !== undefined) updateData.phone = body.phone;
      if (body.email !== undefined) updateData.email = body.email || null;
      if (body.address !== undefined) updateData.address = body.address || null;
      if (body.city !== undefined) updateData.city = body.city || null;
      if (body.postalCode !== undefined) updateData.postalCode = body.postalCode || null;
      if (body.medicalHistory !== undefined) {
        updateData.medicalHistory = JSON.stringify(
          body.medicalHistory || { allergies: [], medications: [], conditions: [] }
        );
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
      const user = c.get('user');

      const existingRows = await database
        .select()
        .from(patientsTable)
        .where(eq(patientsTable.id, patientId))
        .limit(1);

      if (!existingRows.length) {
        return c.json({ error: 'Paciente no encontrado' }, 404);
      }

      const existing = existingRows[0];

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
      if (user?.role === 'clinic_admin' && user.clinicId && existing.clinicId !== user.clinicId) {
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
      if (hasSessions) {
        const sessionIds = sessionsOfPatient.map((s) => s.id);
        await database.delete(creditTransactionsTable).where(inArray(creditTransactionsTable.sessionId, sessionIds));
        await database.delete(sessionsTable).where(eq(sessionsTable.patientId, patientId));
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

