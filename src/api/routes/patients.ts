import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';
import { validateData, createPatientSchema, updatePatientSchema } from '../utils/validation';
import { database } from '../database';
import { patients as patientsTable } from '../database/schema';
import { eq } from 'drizzle-orm';

const patientsRoutes = new Hono();

// Helper local para generar IDs (evitamos depender de web/lib/storage en el backend)
const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

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
      if (user?.role === 'podiatrist') {
        rows = rows.filter((p) => p.createdBy === user.userId);
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
      const patientId = c.req.param('patientId');
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
      if (user?.role === 'podiatrist' && row.createdBy !== user.userId) {
        return c.json(
          {
            error: 'Acceso denegado',
            message: 'No tienes permiso para ver este paciente',
          },
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

      const now = new Date().toISOString();
      const id = generateId();
      const folio = await generateFolio(user?.clinicId ?? null);

      const medicalHistory = JSON.stringify(
        body.medicalHistory || { allergies: [], medications: [], conditions: [] }
      );
      const consent = JSON.stringify(
        body.consent || { given: false, date: null }
      );

      await database.insert(patientsTable).values({
        id,
        folio,
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: body.dateOfBirth,
        gender: body.gender,
        idNumber: body.idNumber,
        phone: body.phone,
        email: body.email || null,
        address: body.address || null,
        city: body.city || null,
        postalCode: body.postalCode || null,
        medicalHistory,
        consent,
        createdAt: now,
        updatedAt: now,
        createdBy: user!.userId,
        clinicId: user?.clinicId || null,
      });

      const [row] = await database
        .select()
        .from(patientsTable)
        .where(eq(patientsTable.id, id))
        .limit(1);

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
      const patientId = c.req.param('patientId');
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
      if (user?.role === 'podiatrist' && existing.createdBy !== user.userId) {
        return c.json(
          {
            error: 'Acceso denegado',
            message: 'No tienes permiso para modificar este paciente',
          },
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
      const patientId = c.req.param('patientId');
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
      // - super_admin: puede borrar cualquier paciente
      // - podiatrist: solo puede borrar pacientes que él mismo creó
      if (user?.role === 'podiatrist' && existing.createdBy !== user.userId) {
        return c.json(
          {
            error: 'Acceso denegado',
            message: 'No tienes permiso para eliminar este paciente',
          },
          403
        );
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

