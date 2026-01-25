import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { requireRole, requirePermission } from '../middleware/authorization';
import { validateData, createUserSchema, updateUserSchema } from '../utils/validation';
import { getAllUsers, getCreatedUsers, saveCreatedUser, updateCreatedUser, deleteCreatedUser, getUserStatus, blockUser, unblockUser, enableUser, disableUser, banUser, unbanUser } from '../../web/lib/storage';

const usersRoutes = new Hono();

// Todas las rutas de usuarios requieren autenticación
usersRoutes.use('*', requireAuth);

/**
 * GET /api/users
 * Obtiene la lista de usuarios
 * Requiere: super_admin o admin
 */
usersRoutes.get(
  '/',
  requireRole('super_admin', 'admin'),
  async (c) => {
    try {
      const users = getAllUsers();
      return c.json({ success: true, users });
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      return c.json(
        { error: 'Error interno', message: 'Error al obtener usuarios' },
        500
      );
    }
  }
);

/**
 * GET /api/users/:userId
 * Obtiene información de un usuario específico
 * Requiere: super_admin, admin, o el mismo usuario
 */
usersRoutes.get(
  '/:userId',
  async (c) => {
    try {
      const user = c.get('user');
      const userId = c.req.param('userId');

      // Verificar que el usuario tiene permisos
      if (user?.role !== 'super_admin' && user?.role !== 'admin' && user?.userId !== userId) {
        return c.json(
          { error: 'Acceso denegado', message: 'No tienes permisos para ver este usuario' },
          403
        );
      }

      const allUsers = getAllUsers();
      const foundUser = allUsers.find((u) => u.id === userId);

      if (!foundUser) {
        return c.json({ error: 'Usuario no encontrado' }, 404);
      }

      return c.json({ success: true, user: foundUser });
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      return c.json(
        { error: 'Error interno', message: 'Error al obtener usuario' },
        500
      );
    }
  }
);

/**
 * POST /api/users
 * Crea un nuevo usuario
 * Requiere: super_admin
 */
usersRoutes.post(
  '/',
  requireRole('super_admin'),
  async (c) => {
    try {
      // Validar y sanitizar datos de entrada
      const rawBody = await c.req.json().catch(() => ({}));
      const validation = validateData(createUserSchema, rawBody);

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

      const { email, name, role, clinicId, password } = validation.data;
      const currentUser = c.get('user');

      const newUser = saveCreatedUser(
        { email, name, role, clinicId },
        password,
        currentUser!.userId
      );

      // Registrar evento de auditoría
      const { logAuditEvent } = await import('../utils/audit-log');
      const { getClientIP } = await import('../utils/ip-tracking');
      await logAuditEvent({
        userId: currentUser!.userId,
        action: 'CREATE_USER',
        resourceType: 'user',
        resourceId: newUser.id,
        ipAddress: getClientIP(c.req.raw.headers),
        userAgent: c.req.header('User-Agent') || undefined,
        details: { email: newUser.email, role: newUser.role, clinicId: newUser.clinicId },
      });

      return c.json({ success: true, user: newUser }, 201);
    } catch (error: any) {
      console.error('Error creando usuario:', error);
      return c.json(
        { error: 'Error al crear usuario', message: error.message || 'Error desconocido' },
        400
      );
    }
  }
);

/**
 * PUT /api/users/:userId
 * Actualiza un usuario
 * Requiere: super_admin
 */
usersRoutes.put(
  '/:userId',
  requireRole('super_admin'),
  async (c) => {
    try {
      const userId = c.req.param('userId');
      
      // Validar y sanitizar datos de entrada
      const rawBody = await c.req.json().catch(() => ({}));
      const validation = validateData(updateUserSchema, rawBody);

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

      const updatedUser = updateCreatedUser(userId, validation.data);

      if (!updatedUser) {
        return c.json({ error: 'Usuario no encontrado' }, 404);
      }

      return c.json({ success: true, user: updatedUser });
    } catch (error: any) {
      console.error('Error actualizando usuario:', error);
      return c.json(
        { error: 'Error al actualizar usuario', message: error.message || 'Error desconocido' },
        400
      );
    }
  }
);

/**
 * DELETE /api/users/:userId
 * Elimina un usuario
 * Requiere: super_admin
 */
usersRoutes.delete(
  '/:userId',
  requireRole('super_admin'),
  async (c) => {
    try {
      const userId = c.req.param('userId');
      const success = deleteCreatedUser(userId);

      if (!success) {
        return c.json({ error: 'Usuario no encontrado' }, 404);
      }

      // Registrar evento de auditoría
      const { logAuditEvent } = await import('../utils/audit-log');
      const { getClientIP } = await import('../utils/ip-tracking');
      const currentUser = c.get('user');
      await logAuditEvent({
        userId: currentUser!.userId,
        action: 'DELETE_USER',
        resourceType: 'user',
        resourceId: userId,
        ipAddress: getClientIP(c.req.raw.headers),
        userAgent: c.req.header('User-Agent') || undefined,
      });

      return c.json({ success: true, message: 'Usuario eliminado correctamente' });
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      return c.json(
        { error: 'Error interno', message: 'Error al eliminar usuario' },
        500
      );
    }
  }
);

/**
 * POST /api/users/:userId/block
 * Bloquea un usuario
 * Requiere: super_admin
 */
usersRoutes.post(
  '/:userId/block',
  requireRole('super_admin'),
  async (c) => {
    try {
      const userId = c.req.param('userId');
      const success = blockUser(userId);

      if (!success) {
        return c.json({ error: 'Usuario no encontrado' }, 404);
      }

      // Registrar eventos
      const { logAuditEvent } = await import('../utils/audit-log');
      const { recordSecurityMetric } = await import('../utils/security-metrics');
      const { getClientIP } = await import('../utils/ip-tracking');
      const currentUser = c.get('user');
      
      await logAuditEvent({
        userId: currentUser!.userId,
        action: 'BLOCK_USER',
        resourceType: 'user',
        resourceId: userId,
        ipAddress: getClientIP(c.req.raw.headers),
        userAgent: c.req.header('User-Agent') || undefined,
      });

      await recordSecurityMetric({
        metricType: 'blocked_user',
        userId,
        ipAddress: getClientIP(c.req.raw.headers),
      });

      return c.json({ success: true, message: 'Usuario bloqueado correctamente' });
    } catch (error) {
      console.error('Error bloqueando usuario:', error);
      return c.json(
        { error: 'Error interno', message: 'Error al bloquear usuario' },
        500
      );
    }
  }
);

/**
 * POST /api/users/:userId/unblock
 * Desbloquea un usuario
 * Requiere: super_admin
 */
usersRoutes.post(
  '/:userId/unblock',
  requireRole('super_admin'),
  async (c) => {
    try {
      const userId = c.req.param('userId');
      const success = unblockUser(userId);

      if (!success) {
        return c.json({ error: 'Usuario no encontrado' }, 404);
      }

      // Registrar eventos
      const { logAuditEvent } = await import('../utils/audit-log');
      const { recordSecurityMetric } = await import('../utils/security-metrics');
      const { getClientIP } = await import('../utils/ip-tracking');
      const currentUser = c.get('user');
      
      await logAuditEvent({
        userId: currentUser!.userId,
        action: 'UNBLOCK_USER',
        resourceType: 'user',
        resourceId: userId,
        ipAddress: getClientIP(c.req.raw.headers),
        userAgent: c.req.header('User-Agent') || undefined,
      });

      await recordSecurityMetric({
        metricType: 'unblocked_user',
        userId,
        ipAddress: getClientIP(c.req.raw.headers),
      });

      return c.json({ success: true, message: 'Usuario desbloqueado correctamente' });
    } catch (error) {
      console.error('Error desbloqueando usuario:', error);
      return c.json(
        { error: 'Error interno', message: 'Error al desbloquear usuario' },
        500
      );
    }
  }
);

/**
 * POST /api/users/:userId/ban
 * Banea un usuario
 * Requiere: super_admin
 */
usersRoutes.post(
  '/:userId/ban',
  requireRole('super_admin'),
  async (c) => {
    try {
      const userId = c.req.param('userId');
      const success = banUser(userId);

      if (!success) {
        return c.json({ error: 'Usuario no encontrado' }, 404);
      }

      // Registrar eventos
      const { logAuditEvent } = await import('../utils/audit-log');
      const { recordSecurityMetric } = await import('../utils/security-metrics');
      const { getClientIP } = await import('../utils/ip-tracking');
      const currentUser = c.get('user');
      
      await logAuditEvent({
        userId: currentUser!.userId,
        action: 'BAN_USER',
        resourceType: 'user',
        resourceId: userId,
        ipAddress: getClientIP(c.req.raw.headers),
        userAgent: c.req.header('User-Agent') || undefined,
      });

      await recordSecurityMetric({
        metricType: 'banned_user',
        userId,
        ipAddress: getClientIP(c.req.raw.headers),
      });

      return c.json({ success: true, message: 'Usuario baneado correctamente' });
    } catch (error) {
      console.error('Error baneando usuario:', error);
      return c.json(
        { error: 'Error interno', message: 'Error al banear usuario' },
        500
      );
    }
  }
);

/**
 * POST /api/users/:userId/enable
 * Habilita un usuario
 * Requiere: super_admin
 */
usersRoutes.post(
  '/:userId/enable',
  requireRole('super_admin'),
  async (c) => {
    try {
      const userId = c.req.param('userId');
      const success = enableUser(userId);

      if (!success) {
        return c.json({ error: 'Usuario no encontrado' }, 404);
      }

      return c.json({ success: true, message: 'Usuario habilitado correctamente' });
    } catch (error) {
      console.error('Error habilitando usuario:', error);
      return c.json(
        { error: 'Error interno', message: 'Error al habilitar usuario' },
        500
      );
    }
  }
);

/**
 * POST /api/users/:userId/disable
 * Deshabilita un usuario
 * Requiere: super_admin
 */
usersRoutes.post(
  '/:userId/disable',
  requireRole('super_admin'),
  async (c) => {
    try {
      const userId = c.req.param('userId');
      const success = disableUser(userId);

      if (!success) {
        return c.json({ error: 'Usuario no encontrado' }, 404);
      }

      return c.json({ success: true, message: 'Usuario deshabilitado correctamente' });
    } catch (error) {
      console.error('Error deshabilitando usuario:', error);
      return c.json(
        { error: 'Error interno', message: 'Error al deshabilitar usuario' },
        500
      );
    }
  }
);

/**
 * POST /api/users/:userId/unban
 * Desbanea un usuario
 * Requiere: super_admin
 */
usersRoutes.post(
  '/:userId/unban',
  requireRole('super_admin'),
  async (c) => {
    try {
      const userId = c.req.param('userId');
      const success = unbanUser(userId);

      if (!success) {
        return c.json({ error: 'Usuario no encontrado' }, 404);
      }

      return c.json({ success: true, message: 'Usuario desbaneado correctamente' });
    } catch (error) {
      console.error('Error desbaneando usuario:', error);
      return c.json(
        { error: 'Error interno', message: 'Error al desbanear usuario' },
        500
      );
    }
  }
);

/**
 * GET /api/users/:userId/status
 * Obtiene el estado de un usuario
 * Requiere: super_admin o admin
 */
usersRoutes.get(
  '/:userId/status',
  requireRole('super_admin', 'admin'),
  async (c) => {
    try {
      const userId = c.req.param('userId');
      const status = getUserStatus(userId);

      return c.json({ success: true, status });
    } catch (error) {
      console.error('Error obteniendo estado de usuario:', error);
      return c.json(
        { error: 'Error interno', message: 'Error al obtener estado' },
        500
      );
    }
  }
);

export default usersRoutes;
