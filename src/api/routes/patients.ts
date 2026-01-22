import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { requirePermission, requireSameClinic } from '../middleware/authorization';
import { validateData, createPatientSchema, updatePatientSchema } from '../utils/validation';
import { getPatients, getPatientById, savePatient, updatePatient, deletePatient } from '../../web/lib/storage';

const patientsRoutes = new Hono();

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
      let patients = getPatients();

      // Filtrar por clínica si el usuario no es super_admin
      if (user?.role !== 'super_admin' && user?.clinicId) {
        // Los pacientes deben tener el mismo clinicId o ser creados por usuarios de la misma clínica
        // Por ahora, simplificamos: todos los pacientes son accesibles si tienen view_patients
        // En producción, esto debería filtrarse por clinicId del paciente
      }

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
      const patient = getPatientById(patientId);

      if (!patient) {
        return c.json({ error: 'Paciente no encontrado' }, 404);
      }

      // Verificar acceso a la clínica si aplica
      const user = c.get('user');
      if (user?.role !== 'super_admin' && user?.clinicId) {
        // Aquí se debería verificar que el paciente pertenece a la misma clínica
        // Por ahora, permitimos el acceso si tiene el permiso
      }

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

      // Obtener código de clínica si aplica
      const clinicCode = user?.clinicId ? user.clinicId : null;

      const newPatient = savePatient(
        {
          ...body,
          createdBy: user!.userId,
        },
        clinicCode
      );

      return c.json({ success: true, patient: newPatient }, 201);
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

      const updatedPatient = updatePatient(patientId, validation.data);

      if (!updatedPatient) {
        return c.json({ error: 'Paciente no encontrado' }, 404);
      }

      return c.json({ success: true, patient: updatedPatient });
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
      const success = deletePatient(patientId);

      if (!success) {
        return c.json({ error: 'Paciente no encontrado' }, 404);
      }

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
