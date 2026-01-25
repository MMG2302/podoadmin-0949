import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';
import {
  generateTOTPSecret,
  enable2FA,
  disable2FA,
  get2FAConfig,
  is2FAEnabled,
  generateBackupCodes,
  verify2FACode,
} from '../utils/two-factor-auth';
import { logAuditEvent } from '../utils/audit-log';
import { recordSecurityMetric } from '../utils/security-metrics';
import { getClientIP } from '../utils/ip-tracking';
import { getAllUsersWithCredentials } from '../../web/lib/storage';

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

    // Obtener email del usuario
    const allUsers = getAllUsersWithCredentials();
    const matchedUser = allUsers.find((u) => u.user.id === user.userId);

    if (!matchedUser) {
      return c.json({ error: 'Usuario no encontrado' }, 404);
    }

    // Generar secreto y QR code
    const { secret, qrCodeUrl } = generateTOTPSecret(user.userId, matchedUser.user.email);

    // Registrar evento de auditoría
    await logAuditEvent({
      userId: user.userId,
      action: '2FA_SETUP_INITIATED',
      resourceType: '2fa',
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: c.req.header('User-Agent') || undefined,
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
      userAgent: c.req.header('User-Agent') || undefined,
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
      userAgent: c.req.header('User-Agent') || undefined,
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

export default twoFactorRoutes;
