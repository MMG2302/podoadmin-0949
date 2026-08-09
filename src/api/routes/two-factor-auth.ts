import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/authorization';
import {
  generateTOTPSecret,
  enable2FA,
  disable2FA,
  get2FAConfig,
  is2FAEnabled,
  generateBackupCodes,
  verify2FACode,
  resetTwoFactorForUser,
} from '../utils/two-factor-auth';
import { twoFactorResetDeniedReason } from '../utils/two-factor-admin-scope';
import { logAuditEvent } from '../utils/audit-log';
import { recordSecurityMetric } from '../utils/security-metrics';
import { getClientIP } from '../utils/ip-tracking';
import { getSafeUserAgent } from '../utils/request-headers';
import { getUserByIdFromDB } from '../utils/user-db';
import { getUserRowByAnyId } from '../utils/clinical-admin';
import { sanitizePathParam } from '../utils/sanitization';
import { database } from '../database';
import { notifications as notificationsTable } from '../database/schema';

const twoFactorRoutes = new Hono();

// Todas las rutas requieren autenticación
twoFactorRoutes.use('*', requireAuth);

/**
 * GET /api/2fa/status
 * Obtiene el estado de 2FA del usuario actual
 */
twoFactorRoutes.get('/status', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'No autorizado' }, 401);
    }

    const config = await get2FAConfig(user.userId);
    const enabled = config?.enabled || false;

    return c.json({
      success: true,
      enabled,
      // No devolver secret ni backup codes por seguridad
    });
  } catch (error) {
    console.error('Error obteniendo estado 2FA:', error);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * POST /api/2fa/setup
 * Inicia el proceso de configuración de 2FA
 * Genera un secreto y QR code
 */
twoFactorRoutes.post('/setup', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'No autorizado' }, 401);
    }

    // Verificar si ya está habilitado
    const alreadyEnabled = await is2FAEnabled(user.userId);
    if (alreadyEnabled) {
      return c.json(
        { error: '2FA ya está habilitado', message: '2FA ya está configurado para esta cuenta' },
        400
      );
    }

    // Obtener usuario desde DB (para email del QR)
    const dbUser = await getUserByIdFromDB(user.userId);
    if (!dbUser) {
      return c.json({ error: 'Usuario no encontrado' }, 404);
    }

    // Generar secreto y QR code
    const { secret, qrCodeUrl } = generateTOTPSecret(user.userId, dbUser.email);

    // Registrar evento de auditoría
    await logAuditEvent({
      userId: user.userId,
      action: '2FA_SETUP_INITIATED',
      resourceType: '2fa',
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
    });

    return c.json({
      success: true,
      secret, // En producción, esto debería ser temporal y solo mostrarse una vez
      qrCodeUrl,
      message: 'Escanea el código QR con tu aplicación de autenticación',
    });
  } catch (error) {
    console.error('Error configurando 2FA:', error);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * POST /api/2fa/enable
 * Habilita 2FA después de verificar el código inicial
 */
twoFactorRoutes.post('/enable', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'No autorizado' }, 401);
    }

    const body = await c.req.json().catch(() => ({}));
    const { secret, verificationCode } = body;

    if (!secret || !verificationCode) {
      return c.json(
        { error: 'Datos faltantes', message: 'Se requiere secret y verificationCode' },
        400
      );
    }

    // Verificar el código antes de habilitar
    const { verifyTOTPCode } = await import('../utils/two-factor-auth');
    const isValid = verifyTOTPCode(secret, verificationCode);
    if (!isValid) {
      return c.json(
        { error: 'Código inválido', message: 'El código de verificación es incorrecto' },
        400
      );
    }

    // Generar códigos de respaldo
    const backupCodes = generateBackupCodes(10);

    // Habilitar 2FA
    await enable2FA(user.userId, secret, backupCodes);

    // Registrar eventos
    await logAuditEvent({
      userId: user.userId,
      action: '2FA_ENABLED',
      resourceType: '2fa',
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
    });

    await recordSecurityMetric({
      metricType: '2fa_enabled',
      userId: user.userId,
      ipAddress: getClientIP(c.req.raw.headers),
    });

    return c.json({
      success: true,
      backupCodes, // Mostrar solo una vez, el usuario debe guardarlos
      message: '2FA habilitado correctamente. Guarda los códigos de respaldo en un lugar seguro.',
    });
  } catch (error) {
    console.error('Error habilitando 2FA:', error);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * POST /api/2fa/disable
 * Deshabilita 2FA (requiere código de verificación o código de respaldo)
 */
twoFactorRoutes.post('/disable', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'No autorizado' }, 401);
    }

    const body = await c.req.json().catch(() => ({}));
    const { verificationCode } = body;

    if (!verificationCode) {
      return c.json(
        { error: 'Código requerido', message: 'Se requiere código de verificación para deshabilitar 2FA' },
        400
      );
    }

    // Verificar código
    const result = await verify2FACode(user.userId, verificationCode);
    if (!result.valid) {
      return c.json(
        { error: 'Código inválido', message: 'El código de verificación es incorrecto' },
        400
      );
    }

    // Deshabilitar 2FA
    await disable2FA(user.userId);

    // Registrar eventos
    await logAuditEvent({
      userId: user.userId,
      action: '2FA_DISABLED',
      resourceType: '2fa',
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
    });

    await recordSecurityMetric({
      metricType: '2fa_disabled',
      userId: user.userId,
      ipAddress: getClientIP(c.req.raw.headers),
    });

    return c.json({
      success: true,
      message: '2FA deshabilitado correctamente',
    });
  } catch (error) {
    console.error('Error deshabilitando 2FA:', error);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * POST /api/2fa/verify
 * Verifica un código 2FA (útil para verificar antes de operaciones sensibles)
 */
twoFactorRoutes.post('/verify', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'No autorizado' }, 401);
    }

    const body = await c.req.json().catch(() => ({}));
    const { code } = body;

    if (!code) {
      return c.json({ error: 'Código requerido' }, 400);
    }

    const result = await verify2FACode(user.userId, code);
    if (!result.valid) {
      return c.json({ error: 'Código inválido' }, 400);
    }

    return c.json({
      success: true,
      valid: true,
      usedBackupCode: result.usedBackupCode,
    });
  } catch (error) {
    console.error('Error verificando código 2FA:', error);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * POST /api/2fa/admin/reset/:userId
 *
 * Retira la verificación en dos pasos de OTRA cuenta. Es la única vía de recuperación
 * cuando alguien pierde el teléfono y los códigos de respaldo: `/2fa/disable` exige un
 * código válido, así que sin esto la cuenta queda inaccesible de forma permanente.
 *
 * No es un "desactivar 2FA" genérico: reservado a `super_admin` y nunca sobre la cuenta
 * propia. La regla completa está en `twoFactorResetDeniedReason`; `requireRole` aquí es la
 * primera barrera, no la única.
 *
 * Deja rastro por triplicado a propósito — audit log, métrica de seguridad y notificación
 * al usuario afectado — porque quitarle el 2FA a alguien es exactamente lo que haría una
 * cuenta de administrador comprometida antes de atacar al resto.
 */
twoFactorRoutes.post(
  '/admin/reset/:userId',
  requireRole('super_admin'),
  async (c) => {
    try {
      const requester = c.get('user');
      if (!requester) {
        return c.json({ error: 'No autorizado' }, 401);
      }

      const targetId = sanitizePathParam(c.req.param('userId'), 128);
      if (!targetId) {
        return c.json({ error: 'ID de usuario inválido', message: 'Parámetro userId no válido' }, 400);
      }

      const target = await getUserRowByAnyId(targetId);
      if (!target) {
        return c.json({ error: 'Usuario no encontrado' }, 404);
      }

      const denied = twoFactorResetDeniedReason(requester, target);
      if (denied) {
        return c.json({ error: 'Acceso denegado', message: denied }, 403);
      }

      // `two_factor_auth` se indexa por el id de negocio (`createdUsers.userId`), que es el
      // que viaja en el JWT y con el que escribe las filas `/2fa/enable`. Hoy coincide con la
      // PK `createdUsers.id` porque el alta pone los dos al mismo valor, pero el borrado tiene
      // que ir por el mismo campo que la escritura para no depender de esa coincidencia.
      const { wasEnabled } = await resetTwoFactorForUser(target.userId);

      const ipAddress = getClientIP(c.req.raw.headers);
      const userAgent = getSafeUserAgent(c);

      await logAuditEvent({
        userId: requester.userId,
        action: '2FA_ADMIN_RESET',
        resourceType: '2fa',
        resourceId: target.userId,
        ipAddress,
        userAgent,
        clinicId: target.clinicId ?? undefined,
        details: {
          targetEmail: target.email,
          targetRole: target.role,
          requesterRole: requester.role,
          wasEnabled,
        },
      });

      await recordSecurityMetric({
        metricType: '2fa_disabled',
        userId: target.userId,
        ipAddress,
        clinicId: target.clinicId ?? undefined,
        details: { reason: 'admin_reset', resetBy: requester.userId, wasEnabled },
      });

      // El usuario afectado se entera aunque no haya pedido el reseteo: si no lo pidió él,
      // es la señal de que alguien con acceso administrativo le está tocando la cuenta.
      if (wasEnabled) {
        try {
          await database.insert(notificationsTable).values({
            id: `notif_${crypto.randomUUID().replace(/-/g, '')}`,
            userId: target.userId,
            type: 'system',
            title: 'Verificación en dos pasos restablecida',
            message:
              'Un administrador retiró la verificación en dos pasos de tu cuenta. Si no lo solicitaste, avisa de inmediato. Para volver a protegerla, actívala otra vez desde Ajustes > Seguridad.',
            read: false,
            metadata: JSON.stringify({ reason: '2fa_admin_reset', resetBy: requester.userId }),
            createdAt: new Date().toISOString(),
          });
        } catch (err) {
          console.error('Error creando notificación de reseteo 2FA:', err);
        }
      }

      return c.json({
        success: true,
        wasEnabled,
        message: wasEnabled
          ? 'Verificación en dos pasos restablecida. El usuario puede entrar solo con su contraseña y volver a activarla desde Ajustes.'
          : 'El usuario no tenía la verificación en dos pasos activa. No había nada que restablecer.',
      });
    } catch (error) {
      console.error('Error restableciendo 2FA:', error);
      return c.json({ error: 'Error interno' }, 500);
    }
  }
);

export default twoFactorRoutes;
