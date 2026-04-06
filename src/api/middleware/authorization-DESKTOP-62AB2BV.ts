import { createMiddleware } from 'hono/factory';
import type { UserRole } from '../../web/contexts/auth-context';

type Permission =
  | 'view_dashboard'
  | 'view_patients'
  | 'manage_patients'
  | 'view_sessions'
  | 'manage_sessions'
  | 'manage_appointments'
  | 'view_credits'
  | 'manage_credits'
  | 'purchase_credits'
  | 'view_users'
  | 'manage_users'
  | 'view_audit_log'
  | 'export_data'
  | 'print_documents'
  | 'view_settings'
  | 'manage_settings'
  | 'view_clinic_stats'
  | 'reassign_patients'
  | 'adjust_credits';

const rolePermissions: Record<UserRole, Permission[]> = {
  super_admin: [
    'view_dashboard',
    'view_patients',
    'manage_patients',
    'view_credits',
    'manage_credits',
    'view_users',
    'manage_users',
    'view_audit_log',
    'export_data',
    'view_settings',
    'manage_settings',
  ],
  clinic_admin: [
    'view_dashboard',
    'view_patients',
    'view_sessions',
    'manage_appointments',
    'view_credits',
    'view_clinic_stats',
    'reassign_patients',
    'print_documents',
    'view_settings',
  ],
  admin: [
    'view_dashboard',
    'view_users',
    'view_credits',
    'adjust_credits',
    'view_settings',
  ],
  podiatrist: [
    'view_dashboard',
    'view_patients',
    'manage_patients',
    'view_sessions',
    'manage_sessions',
    'manage_appointments',
    'view_credits',
    'print_documents',
    'view_settings',
  ],
  receptionist: [
    'view_dashboard',
    'view_patients',
    'manage_patients',
    'view_sessions',
    'manage_appointments',
    'view_settings',
  ],
};

/**
 * Middleware que requiere un rol específico
 */
export function requireRole(...roles: UserRole[]) {
  return createMiddleware(async (c, next) => {
    const user = c.get('user');

    if (!user) {
      return c.json(
        { error: 'No autorizado', message: 'Se requiere autenticación' },
        401
      );
    }

    if (!roles.includes(user.role as UserRole)) {
      return c.json(
        {
          error: 'Acceso denegado',
          message: `Se requiere uno de los siguientes roles: ${roles.join(', ')}`,
        },
        403
      );
    }

    return next();
  });
}

/**
 * Middleware que requiere un permiso específico
 */
export function requirePermission(...permissions: Permission[]) {
  return createMiddleware(async (c, next) => {
    const user = c.get('user');

    if (!user) {
      return c.json(
        { error: 'No autorizado', message: 'Se requiere autenticación' },
        401
      );
    }

    const userRole = user.role as UserRole;
    const userPermissions = rolePermissions[userRole] || [];

    const hasPermission = permissions.some((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      return c.json(
        {
          error: 'Acceso denegado',
          message: `Se requiere uno de los siguientes permisos: ${permissions.join(', ')}`,
        },
        403
      );
    }

    return next();
  });
}

/**
 * Middleware que verifica que el usuario pertenece a la misma clínica
 * Útil para operaciones que requieren acceso a datos de clínica
 */
export function requireSameClinic() {
  return createMiddleware(async (c, next) => {
    const user = c.get('user');

    if (!user) {
      return c.json(
        { error: 'No autorizado', message: 'Se requiere autenticación' },
        401
      );
    }

    // Super admin puede acceder a todo
    if (user.role === 'super_admin') {
      return next();
    }

    // Obtener clinicId de la solicitud (query param, body, o path param)
    const clinicIdFromRequest =
      c.req.query('clinicId') ||
      (await c.req.json().catch(() => ({}))).clinicId ||
      c.req.param('clinicId');

    // Si el usuario tiene clinicId, debe coincidir
    if (user.clinicId && clinicIdFromRequest && user.clinicId !== clinicIdFromRequest) {
      return c.json(
        {
          error: 'Acceso denegado',
          message: 'No tienes acceso a esta clínica',
        },
        403
      );
    }

    return next();
  });
}

/**
 * Middleware que verifica que el usuario es el propietario del recurso o tiene permisos
 */
export function requireOwnershipOrPermission(permission: Permission) {
  return createMiddleware(async (c, next) => {
    const user = c.get('user');

    if (!user) {
      return c.json(
        { error: 'No autorizado', message: 'Se requiere autenticación' },
        401
      );
    }

    // Super admin puede hacer todo
    if (user.role === 'super_admin') {
      return next();
    }

    // Obtener userId de la solicitud
    const userIdFromRequest =
      c.req.query('userId') ||
      (await c.req.json().catch(() => ({}))).userId ||
      c.req.param('userId');

    // Si es el propietario, permitir
    if (userIdFromRequest && user.userId === userIdFromRequest) {
      return next();
    }

    // Verificar permiso
    const userRole = user.role as UserRole;
    const userPermissions = rolePermissions[userRole] || [];

    if (!userPermissions.includes(permission)) {
      return c.json(
        {
          error: 'Acceso denegado',
          message: `Se requiere el permiso: ${permission}`,
        },
        403
      );
    }

    return next();
  });
}
