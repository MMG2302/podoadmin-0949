import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { createMiddleware } from 'hono/factory';
import {
  canConfigureWhatsApp,
  deleteWhatsAppConfig,
  getWhatsAppConfigPublic,
  resolveWhatsAppWorkspaceForUser,
  saveWhatsAppConfig,
  testStoredWhatsAppConfig,
} from '../utils/whatsapp-integration';
import { logAuditEvent } from '../utils/audit-log';
import { getClientIP } from '../utils/ip-tracking';
import { getSafeUserAgent } from '../utils/request-headers';
import { getUserByIdFromDB } from '../utils/user-db';

const whatsappRoutes = new Hono();

whatsappRoutes.use('*', requireAuth);

/**
 * GET /api/integrations/whatsapp/workspace
 * Acceso de mensajería (Web + API delegada para recepción).
 */
whatsappRoutes.get('/workspace', async (c) => {
  try {
    const user = c.get('user');
    const workspace = await resolveWhatsAppWorkspaceForUser(user);
    return c.json({
      success: true,
      ...workspace,
    });
  } catch (error) {
    console.error('Error GET whatsapp workspace:', error);
    return c.json({ error: 'Error interno' }, 500);
  }
});

const requireWhatsAppConfigRole = createMiddleware(async (c, next) => {
  const user = c.get('user');
  if (!user || !canConfigureWhatsApp(user.role)) {
    return c.json(
      {
        error: 'Acceso denegado',
        message:
          'Solo podólogos y administradores de clínica pueden configurar WhatsApp. Los recepcionistas no tienen acceso.',
      },
      403
    );
  }
  return next();
});

whatsappRoutes.use('*', requireWhatsAppConfigRole);

const saveSchema = z.object({
  phoneNumberId: z.string().min(1).max(64),
  wabaId: z.string().max(64).optional().nullable(),
  accessToken: z.string().min(20).max(4096).optional(),
  businessPhoneE164: z.string().max(32).optional().nullable(),
  enabled: z.boolean().optional(),
  remindersEnabled: z.boolean().optional(),
  reminderHoursBefore: z.array(z.number().int().min(1).max(168)).max(12).optional(),
  reminderSchedule: z
    .object({
      daysBefore: z.array(z.union([z.literal(5), z.literal(2), z.literal(1)])).max(3).optional(),
      hoursBefore: z.array(z.number().int().min(1).max(168)).max(12).optional(),
    })
    .optional(),
  templateName: z.string().min(1).max(128).optional().nullable(),
  templateLanguage: z.string().min(2).max(10).optional(),
  defaultExtraNote: z.string().max(500).optional().nullable(),
  receptionistApiEnabled: z.boolean().optional(),
});

/**
 * GET /api/integrations/whatsapp/me
 */
whatsappRoutes.get('/me', async (c) => {
  try {
    const user = c.get('user');
    const config = await getWhatsAppConfigPublic(user.userId);
    return c.json({ success: true, config });
  } catch (error) {
    console.error('Error GET whatsapp config:', error);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * PUT /api/integrations/whatsapp/me
 */
whatsappRoutes.put('/me', async (c) => {
  try {
    const user = c.get('user');
    const raw = await c.req.json().catch(() => ({}));
    const parsed = saveSchema.safeParse(raw);
    if (!parsed.success) {
      return c.json(
        { error: 'Datos inválidos', issues: parsed.error.flatten() },
        400
      );
    }

    const row = await getUserByIdFromDB(user.userId);
    if (!row) return c.json({ error: 'Usuario no encontrado' }, 404);

    try {
      const { config, testError } = await saveWhatsAppConfig(user.userId, row.clinicId, parsed.data);
      await logAuditEvent({
        userId: user.userId,
        action: 'WHATSAPP_CONFIG_UPDATE',
        resourceType: 'whatsapp_integration',
        resourceId: user.userId,
        ipAddress: getClientIP(c.req.raw.headers),
        userAgent: getSafeUserAgent(c),
        clinicId: row.clinicId ?? undefined,
        details: {
          enabled: config.enabled,
          status: config.status,
          phoneNumberId: config.phoneNumberId,
        },
      });

      return c.json({
        success: true,
        config,
        connectionWarning: testError || undefined,
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'ACCESS_TOKEN_REQUIRED') {
        return c.json(
          {
            error: 'Token requerido',
            message: 'Debes indicar el token de acceso de Meta (o guardar uno previamente).',
          },
          400
        );
      }
      throw err;
    }
  } catch (error) {
    console.error('Error PUT whatsapp config:', error);
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('WHATSAPP_TOKEN_ENCRYPTION_KEY') || msg.includes('CSRF_SECRET')) {
      return c.json(
        {
          error: 'Configuración del servidor',
          message: 'Falta clave de cifrado en el servidor (WHATSAPP_TOKEN_ENCRYPTION_KEY o CSRF_SECRET).',
        },
        503
      );
    }
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * POST /api/integrations/whatsapp/me/test
 */
whatsappRoutes.post('/me/test', async (c) => {
  try {
    const user = c.get('user');
    const result = await testStoredWhatsAppConfig(user.userId);
    if (result.error === 'NOT_CONFIGURED') {
      return c.json({ error: 'Sin configuración', message: 'Guarda la configuración antes de probar.' }, 404);
    }
    const config = await getWhatsAppConfigPublic(user.userId);
    return c.json({
      success: result.ok,
      config,
      displayPhoneNumber: result.displayPhoneNumber,
      error: result.error,
    });
  } catch (error) {
    console.error('Error test whatsapp:', error);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * DELETE /api/integrations/whatsapp/me
 */
whatsappRoutes.delete('/me', async (c) => {
  try {
    const user = c.get('user');
    await deleteWhatsAppConfig(user.userId);
    const row = await getUserByIdFromDB(user.userId);
    await logAuditEvent({
      userId: user.userId,
      action: 'WHATSAPP_CONFIG_DELETE',
      resourceType: 'whatsapp_integration',
      resourceId: user.userId,
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
      clinicId: row?.clinicId ?? undefined,
    });
    return c.json({ success: true });
  } catch (error) {
    console.error('Error DELETE whatsapp config:', error);
    return c.json({ error: 'Error interno' }, 500);
  }
});

export default whatsappRoutes;
