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
 * Actualiza un usuario (tanto en localStorage como en la base de datos)
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
      
      // Normalizar clinicId: si está vacío, establecerlo como null
      if (rawBody.clinicId !== undefined) {
        rawBody.clinicId = rawBody.clinicId && rawBody.clinicId.trim() !== "" 
          ? rawBody.clinicId.trim() 
          : null;
      }
      
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

      let updatedUser = null;
      let updatedInLocalStorage = false;
      let updatedInDB = false;
      let userExistsInDB = false;

      // Primero verificar si el usuario existe en la base de datos
      try {
        const { database } = await import('../database');
        const { createdUsers } = await import('../database/schema');
        const { eq, or } = await import('drizzle-orm');
        
        // Buscar usuario por id o userId
        const userResult = await database
          .select()
          .from(createdUsers)
          .where(or(
            eq(createdUsers.id, userId),
            eq(createdUsers.userId, userId)
          ))
          .limit(1);
        
        userExistsInDB = userResult.length > 0;
      } catch (dbCheckError) {
        console.warn('Error verificando usuario en base de datos:', dbCheckError);
      }

      // Intentar actualizar en localStorage (usuarios creados)
      try {
        const result = updateCreatedUser(userId, validation.data);
        if (result) {
          updatedUser = result;
          updatedInLocalStorage = true;
        } else {
          // Usuario no encontrado en localStorage, continuar para intentar en BD
          console.log(`Usuario ${userId} no encontrado en localStorage, intentando actualizar en BD`);
        }
      } catch (localError: any) {
        // Si hay un error (ej: email duplicado), registrar pero continuar
        console.warn('Error actualizando usuario en localStorage:', localError.message);
        // Si el error es por email duplicado, no continuar
        if (localError.message && localError.message.includes('correo electrónico')) {
          return c.json(
            { error: 'Error de validación', message: localError.message },
            400
          );
        }
      }

      // Intentar actualizar en la base de datos (usuarios registrados públicamente)
      if (userExistsInDB) {
        try {
          const { database } = await import('../database');
          const { createdUsers } = await import('../database/schema');
          const { eq, or } = await import('drizzle-orm');
          
          // Buscar usuario por id o userId
          const userResult = await database
            .select()
            .from(createdUsers)
            .where(or(
              eq(createdUsers.id, userId),
              eq(createdUsers.userId, userId)
            ))
            .limit(1);
          
          if (userResult.length > 0) {
            const dbUser = userResult[0];
            
            // Preparar datos de actualización
            const updateData: any = {
              updatedAt: new Date().toISOString(),
            };
            
            if (validation.data.name !== undefined) {
              updateData.name = validation.data.name;
            }
            if (validation.data.email !== undefined) {
              updateData.email = validation.data.email.toLowerCase().trim();
            }
            if (validation.data.role !== undefined) {
              updateData.role = validation.data.role;
            }
            if (validation.data.clinicId !== undefined) {
              // Permitir establecer clinicId como null para eliminarlo
              updateData.clinicId = validation.data.clinicId || null;
            }
            
            await database
              .update(createdUsers)
              .set(updateData)
              .where(eq(createdUsers.id, dbUser.id));
            
            updatedInDB = true;
            
            // Si no se actualizó en localStorage, obtener el usuario actualizado de BD
            if (!updatedUser) {
              const updatedDbUser = await database
                .select()
                .from(createdUsers)
                .where(eq(createdUsers.id, dbUser.id))
                .limit(1);
              
              if (updatedDbUser.length > 0) {
                updatedUser = {
                  id: updatedDbUser[0].id,
                  userId: updatedDbUser[0].userId,
                  email: updatedDbUser[0].email,
                  name: updatedDbUser[0].name,
                  role: updatedDbUser[0].role as any,
                  clinicId: updatedDbUser[0].clinicId || undefined,
                } as any;
              }
            }
          }
        } catch (dbError) {
          console.error('Error actualizando usuario en base de datos:', dbError);
          // Si falla la actualización en BD pero el usuario existe en localStorage, continuar
          if (!updatedInLocalStorage) {
            return c.json(
              { error: 'Error al actualizar usuario', message: 'No se pudo actualizar en la base de datos' },
              500
            );
          }
        }
      }

      // Si no se actualizó en ningún lugar, el usuario no existe
      if (!updatedInLocalStorage && !updatedInDB) {
        return c.json({ 
          error: 'Usuario no encontrado',
          message: 'El usuario no existe en localStorage ni en la base de datos'
        }, 404);
      }

      // Registrar evento de auditoría
      const { logAuditEvent } = await import('../utils/audit-log');
      const { getClientIP } = await import('../utils/ip-tracking');
      const currentUser = c.get('user');
      await logAuditEvent({
        userId: currentUser!.userId,
        action: 'UPDATE_USER',
        resourceType: 'user',
        resourceId: userId,
        ipAddress: getClientIP(c.req.raw.headers),
        userAgent: c.req.header('User-Agent') || undefined,
        details: {
          updates: validation.data,
          updatedInLocalStorage: !!updatedUser,
          updatedInDatabase: updatedInDB,
        },
      });

      return c.json({ 
        success: true, 
        user: updatedUser,
        message: 'Usuario actualizado correctamente'
      });
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
 * Verifica si un userId corresponde a un usuario mock (hardcodeado)
 */
function isMockUser(userId: string): boolean {
  const mockUserIds = [
    'user_super_admin',
    'user_admin',
    'user_clinic_admin_001',
    'user_clinic_admin_002',
    'user_clinic_admin_003',
    'user_podiatrist_001',
    'user_podiatrist_002',
    'user_podiatrist_003',
    'user_podiatrist_004',
    'user_podiatrist_005',
    'user_podiatrist_006',
    'user_podiatrist_007',
    'user_podiatrist_008',
    'user_podiatrist_009',
    'user_podiatrist_010',
    'user_podiatrist_011',
    'user_podiatrist_012',
    'user_podiatrist_013',
  ];
  return mockUserIds.includes(userId);
}

/**
 * DELETE /api/users/:userId
 * Elimina un usuario (tanto de localStorage como de la base de datos)
 * Requiere: super_admin
 */
usersRoutes.delete(
  '/:userId',
  requireRole('super_admin'),
  async (c) => {
    try {
      const userId = c.req.param('userId');
      
      // Verificar si es un usuario mock (no se pueden eliminar)
      if (isMockUser(userId)) {
        return c.json({ 
          error: 'No se puede eliminar',
          message: 'Este usuario es un usuario de demostración (mock) y no se puede eliminar. Los usuarios mock están hardcodeados en el sistema para propósitos de prueba.'
        }, 403);
      }
      
      let deleted = false;

      // Intentar eliminar de localStorage (usuarios creados)
      const successLocal = deleteCreatedUser(userId);
      if (successLocal) {
        deleted = true;
      }

      // Intentar eliminar de la base de datos (usuarios registrados públicamente)
      try {
        const { database } = await import('../database');
        const { createdUsers } = await import('../database/schema');
        const { eq, or } = await import('drizzle-orm');
        
        // Buscar por id o userId (ya que algunos usuarios tienen userId diferente)
        const result = await database
          .delete(createdUsers)
          .where(or(
            eq(createdUsers.id, userId),
            eq(createdUsers.userId, userId)
          ));
        
        if (result.changes && result.changes > 0) {
          deleted = true;
        }
      } catch (dbError) {
        console.error('Error eliminando usuario de base de datos:', dbError);
        // Continuar aunque falle la eliminación de BD si ya se eliminó de localStorage
      }

      if (!deleted) {
        return c.json({ 
          error: 'Usuario no encontrado',
          message: 'El usuario no existe en localStorage ni en la base de datos. Si es un usuario mock, no se puede eliminar.'
        }, 404);
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
        details: {
          deletedFromLocalStorage: successLocal,
          deletedFromDatabase: deleted && !successLocal,
        },
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
