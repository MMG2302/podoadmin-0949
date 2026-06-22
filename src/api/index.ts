import './utils/validate-production-safety';

import { Hono } from 'hono';
import { cors } from "hono/cors";
import type { AppVariables } from './types';
import { blockSensitivePaths } from './middleware/block-sensitive-paths';
import { authMiddleware } from './middleware/auth';
import { csrfProtection } from './middleware/csrf';
import { cspMiddleware } from './middleware/csp';
import { sanitizationMiddleware } from './middleware/sanitization';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import patientsRoutes from './routes/patients';
import sessionsRoutes from './routes/sessions';
import csrfRoutes from './routes/csrf';
import testXssRoutes from './routes/test-xss';
import twoFactorRoutes from './routes/two-factor-auth';
import metricsRoutes from './routes/security-metrics';
import auditLogRoutes from './routes/audit-logs';
import clinicsRoutes from './routes/clinics';
import professionalsRoutes from './routes/professionals';
import receptionistsRoutes from './routes/receptionists';
import consentDocumentRoutes from './routes/consent-document';
import appointmentsRoutes from './routes/appointments';
import notificationsRoutes from './routes/notifications';
import messagesRoutes from './routes/messages';
import supportRoutes from './routes/support';
import registrationListsRoutes from './routes/registration-lists';
import whatsappRoutes from './routes/whatsapp';
import whatsappMessagesRoutes from './routes/whatsapp-messages';
import prescriptionsRoutes from './routes/prescriptions';
import subscriptionsRoutes from './routes/subscriptions';
import clinicalFeaturesRoutes from './routes/clinical-features';
import complianceRoutes from './routes/compliance';
import labAttachmentsRoutes from './routes/lab-attachments';
import whatsappCampaignsRoutes from './routes/whatsapp-campaigns';
import stripeWebhookRoutes from './routes/stripe-webhook';
import trialActivationRoutes from './routes/trial-activation';
import { requireActiveSubscription } from './middleware/subscription';
import { getCaptchaConfig, isCaptchaExplicitlyDisabledInDev } from './utils/captcha';
import { isEmailVerificationRequired } from './utils/email-verification';
import { isStripeConfigured, getStripePublishableKey } from './utils/stripe-client';
import { requestIdMiddleware } from './middleware/request-id';
import {
  globalRateLimitMiddleware,
  tenantRateLimitMiddleware,
} from './middleware/rate-limit-middleware';
import { logger } from './utils/logger';
import { captureServerError } from './utils/sentry-server';

export type { AppVariables } from './types';

const app = new Hono<{ Variables: AppVariables }>()
  .basePath('api');

// CORS configuration
// IMPORTANTE: No se puede usar origin: "*" con credentials: true
// Los navegadores rechazan esta combinación por seguridad
const getAllowedOrigins = (): string[] => {
  const origins: string[] = [];
  
  // Orígenes de desarrollo (localhost con diferentes puertos)
  origins.push('http://localhost:5173'); // Vite dev server por defecto
  origins.push('http://localhost:3000');
  origins.push('http://localhost:8080');
  origins.push('http://127.0.0.1:5173');
  origins.push('http://127.0.0.1:3000');
  origins.push('http://127.0.0.1:8080');
  
  // Orígenes de producción desde variables de entorno
  const allowedOrigins = process.env.ALLOWED_ORIGINS;
  if (allowedOrigins) {
    origins.push(...allowedOrigins.split(',').map(o => o.trim()));
  }
  
  return origins;
};

// Función para validar origen dinámicamente
const originValidator = (origin: string | null): boolean => {
  // Permitir solicitudes sin origen (mismo origen, ej: Postman, curl)
  if (!origin) {
    return true;
  }
  
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
};

// Bloquear acceso por URL a archivos/carpetas sensibles (node_modules, .sql, migraciones, etc.)
app.use('*', blockSensitivePaths);

// Webhook Stripe (cuerpo raw; sin CSRF ni suscripción activa)
app.route('/stripe/webhook', stripeWebhookRoutes);

// Correlation ID para trazabilidad (logs + respuestas de error)
app.use('*', requestIdMiddleware);

app.use(cors({
  origin: originValidator,
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-Id'],
}));

// Content Security Policy y headers de seguridad
// Debe aplicarse temprano para proteger todas las respuestas
app.use('*', cspMiddleware);

// Sanitización de inputs (debe aplicarse antes de procesar datos)
app.use('*', sanitizationMiddleware);

// Aplicar middleware de autenticación a todas las rutas
// Esto adjunta el usuario al contexto si hay un token válido
// IMPORTANTE: Esto NO protege las rutas, solo adjunta el usuario si hay token
// Cada ruta debe usar requireAuth() explícitamente para protección
app.use('*', authMiddleware);

// Rate limiting global (IP + ráfaga) y por tenant (clinicId) — escalado multi-clínica
app.use('*', globalRateLimitMiddleware);
app.use('*', tenantRateLimitMiddleware);

// Rutas públicas (no requieren autenticación)
app.get('/ping', (c) => c.json({ message: `Pong! ${Date.now()}` }));

// Configuración pública para anti-phishing: dominio oficial (frontend puede mostrar "Solo accede desde [este dominio]")
app.get('/public/config', (c) => {
  const officialDomain = process.env.OFFICIAL_APP_DOMAIN || process.env.ALLOWED_ORIGINS?.split(',')[0]?.trim() || '';
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.ADMIN_EMAIL || '';
  const captchaConfig = getCaptchaConfig();
  const sentryDsn = process.env.SENTRY_DSN?.trim() || null;
  return c.json({
    officialDomain: officialDomain || null,
    supportEmail: supportEmail || null,
    captcha: captchaConfig
      ? { provider: captchaConfig.provider, siteKey: captchaConfig.siteKey }
      : null,
    captchaDisabledInDev: isCaptchaExplicitlyDisabledInDev(),
    captchaRequired: process.env.NODE_ENV === 'production',
    emailVerificationRequired: isEmailVerificationRequired(),
    publicRegistrationEnabled: true,
    googleOAuthEnabled: Boolean(process.env.GOOGLE_CLIENT_ID?.trim()),
    stripeEnabled: isStripeConfigured(),
    stripePublishableKey: getStripePublishableKey(),
    sentryDsn,
    sentryEnvironment: process.env.NODE_ENV || 'development',
  });
});

// Ruta para obtener token CSRF (debe estar antes de la protección CSRF)
app.route('/csrf', csrfRoutes);

// Rutas de prueba (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
  app.route('/test', testXssRoutes);
}

// Rutas de autenticación
// Login es público y no requiere CSRF (el usuario aún no está autenticado)
// Logout requiere autenticación pero puede requerir CSRF
app.route('/auth', authRoutes);

// Aplicar protección CSRF a todas las rutas que modifican estado
// EXCEPCIONES: /auth/login, /auth/refresh no requieren CSRF
app.use('*', async (c, next) => {
  const path = c.req.path;
  const method = c.req.method;
  
  if (
    (path === '/api/auth/login' && method === 'POST') ||
    (path === '/api/auth/refresh' && method === 'POST') ||
    (path === '/api/auth/register' && method === 'POST') ||
    (path === '/api/auth/verify-email' && method === 'POST') ||
    (path === '/api/auth/forgot-password' && method === 'POST') ||
    (path === '/api/auth/reset-password' && method === 'POST') ||
    (path === '/api/auth/google/callback' && method === 'POST') ||
    (path === '/api/auth/google/url' && method === 'GET') ||
    (path === '/api/subscriptions/stripe/checkout' && method === 'POST') ||
    (path === '/api/subscriptions/stripe/portal' && method === 'POST')
  ) {
    return next();
  }
  
  return csrfProtection(c, next);
});

// Rutas protegidas - requieren autenticación, suscripción activa (excepto admin) y autorización
app.use('/users/*', requireActiveSubscription);
app.use('/patients', requireActiveSubscription);
app.use('/patients/*', requireActiveSubscription);
app.use('/sessions', requireActiveSubscription);
app.use('/sessions/*', requireActiveSubscription);
app.use('/appointments/*', requireActiveSubscription);
app.use('/prescriptions/*', requireActiveSubscription);
app.use('/clinical/*', requireActiveSubscription);
app.use('/whatsapp-messages/*', requireActiveSubscription);
app.use('/whatsapp-campaigns/*', requireActiveSubscription);
app.use('/integrations/whatsapp/*', requireActiveSubscription);
app.use('/receptionists/*', requireActiveSubscription);
app.use('/professionals/*', requireActiveSubscription);
app.use('/consent-document/*', requireActiveSubscription);
app.use('/clinics/*', requireActiveSubscription);
app.use('/lab-attachments/*', requireActiveSubscription);

app.route('/users', usersRoutes);
app.route('/patients', patientsRoutes);
app.route('/sessions', sessionsRoutes);
app.route('/prescriptions', prescriptionsRoutes);
app.route('/subscriptions', subscriptionsRoutes);
app.route('/trial', trialActivationRoutes);
app.route('/clinical', clinicalFeaturesRoutes);
app.route('/compliance', complianceRoutes);
app.route('/lab-attachments', labAttachmentsRoutes);
app.route('/whatsapp-campaigns', whatsappCampaignsRoutes);
app.route('/2fa', twoFactorRoutes);
app.route('/security-metrics', metricsRoutes);
app.route('/audit-logs', auditLogRoutes);
app.route('/clinics', clinicsRoutes);
app.route('/professionals', professionalsRoutes);
app.route('/receptionists', receptionistsRoutes);
app.route('/consent-document', consentDocumentRoutes);
app.route('/appointments', appointmentsRoutes);
app.route('/notifications', notificationsRoutes);
app.route('/messages', messagesRoutes);
app.route('/support', supportRoutes);
app.route('/registration-lists', registrationListsRoutes);
app.route('/integrations/whatsapp', whatsappRoutes);
app.route('/whatsapp-messages', whatsappMessagesRoutes);

app.onError((err, c) => {
  const requestId = c.get('requestId');
  logger.error({
    event: 'unhandled_api_error',
    requestId,
    path: c.req.path,
    method: c.req.method,
    message: err instanceof Error ? err.message : String(err),
  });
  captureServerError(err, { requestId, path: c.req.path, method: c.req.method });
  return c.json({ error: 'Error interno', requestId }, 500);
});

// IMPORTANTE: Todas las rutas que manejen datos sensibles DEBEN usar:
// 1. requireAuth() - para verificar que el usuario está autenticado
// 2. requireRole() o requirePermission() - para verificar permisos específicos
// 3. Validación adicional de ownership/clinicId cuando sea necesario

export default app;