import { Hono } from 'hono';
import { generateTokenPair, verifyRefreshToken, type JWTPayload } from '../utils/jwt';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/authorization';
import { formatCookie, getAccessTokenCookieOptions, getRefreshTokenCookieOptions, createDeleteCookie, isProduction } from '../utils/cookies';
import { checkRateLimitD1, recordFailedAttemptD1, clearFailedAttemptsD1, getFailedAttemptCountD1, checkLoginIPRateLimitD1, recordLoginIPFailedAttemptD1 } from '../utils/rate-limit-d1';
import { sendFailedLoginNotification, shouldSendNotification } from '../utils/email-notifications';
import { validateData, loginSchema, registerSchema, verifyEmailSchema, forgotPasswordSchema, resetPasswordSchema } from '../utils/validation';
import { escapeHtml, sanitizeEmail, sanitizePathParam } from '../utils/sanitization';
import { getClientIP, createRateLimitIdentifier, isIPWhitelisted, getIPWhitelist } from '../utils/ip-tracking';
import { getSafeUserAgent } from '../utils/request-headers';
import type { User } from '../../web/contexts/auth-context';
import { getUserByIdFromDB } from '../utils/user-db';
import { RETENTION } from '../utils/user-retention';
import { isAdministrativelyBlocked, resolveSystemAccess } from '../utils/access-control';
import { requireNonProductionDev } from '../middleware/dev-only';

const authRoutes = new Hono();

/**
 * POST /api/auth/login
 * Autentica un usuario y devuelve un token JWT
 * Incluye rate limiting progresivo para intentos fallidos
 */
authRoutes.post('/login', async (c) => {
  try {
    // Validar y sanitizar datos de entrada
    const rawBody = await c.req.json().catch(() => ({}));
    const validation = validateData(loginSchema, rawBody);

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

    const { email, password } = validation.data;
    const body = await c.req.json().catch(() => ({}));
    const captchaToken = body.captchaToken;
    const twoFactorCode = body.twoFactorCode;

    // Normalizar email
    const emailLower = email.toLowerCase().trim();
    
    // Obtener IP del cliente
    const clientIP = getClientIP(c.req.raw.headers);
    
    // Verificar si la IP está en whitelist (bypass rate limiting)
    const ipWhitelist = getIPWhitelist();
    const isWhitelisted = isIPWhitelisted(clientIP, ipWhitelist);
    
    // Usar email + IP como identificador para mayor seguridad
    // Si la IP está en whitelist, solo usar email
    const identifier = isWhitelisted ? emailLower : createRateLimitIdentifier(emailLower, clientIP);

    // Verificar rate limit antes de procesar (skip si IP está en whitelist)
    let rateLimitCheck = { allowed: true as boolean };
    let attemptCount = 0;
    if (!isWhitelisted) {
      const ipRateLimit = await checkLoginIPRateLimitD1(clientIP);
      if (!ipRateLimit.allowed) {
        const delaySeconds = ipRateLimit.retryAfterSeconds ?? Math.ceil((ipRateLimit.delay ?? 60_000) / 1000);
        const delayMinutes = Math.ceil(delaySeconds / 60);
        return c.json(
          {
            error: 'Demasiados intentos',
            message: `Demasiados intentos fallidos desde esta red. Por favor, espera ${delayMinutes > 1 ? `${delayMinutes} minutos` : `${delaySeconds} segundos`} antes de intentar nuevamente.`,
            retryAfter: delaySeconds,
            isIPBlocked: true,
          },
          429
        );
      }

      rateLimitCheck = await checkRateLimitD1(identifier);
      attemptCount = await getFailedAttemptCountD1(identifier);
    }

    // Verificar CAPTCHA si hay muchos intentos fallidos
    if (!isWhitelisted && attemptCount >= 3) {
      const { getCaptchaConfig, verifyCaptcha, shouldShowCaptcha } = await import('../utils/captcha');
      const captchaConfig = getCaptchaConfig();
      
      if (captchaConfig && shouldShowCaptcha(attemptCount, 3)) {
        if (!captchaToken) {
          return c.json(
            {
              error: 'CAPTCHA requerido',
              message: 'Por favor, completa el CAPTCHA para continuar',
              requiresCaptcha: true,
              attemptCount,
            },
            400
          );
        }

        const captchaResult = await verifyCaptcha(captchaToken, captchaConfig);
        if (!captchaResult.success) {
          // Registrar métrica
          const { recordSecurityMetric } = await import('../utils/security-metrics');
          await recordSecurityMetric({
            metricType: 'captcha_failed',
            ipAddress: clientIP,
            details: { email: emailLower, error: captchaResult.error },
          });

          return c.json(
            {
              error: 'CAPTCHA inválido',
              message: 'El CAPTCHA no se pudo verificar. Por favor, intenta nuevamente.',
              requiresCaptcha: true,
              attemptCount,
            },
            400
          );
        }

        // Registrar métrica de CAPTCHA exitoso
        const { recordSecurityMetric } = await import('../utils/security-metrics');
        await recordSecurityMetric({
          metricType: 'captcha_passed',
          ipAddress: clientIP,
          details: { email: emailLower },
        });
      }
    }

    if (!rateLimitCheck.allowed) {
      const delayMs = rateLimitCheck.delay || 0;
      const delaySeconds = Math.ceil(delayMs / 1000);
      const delayMinutes = Math.ceil(delayMs / 60000);

      // Si está bloqueado por 15 minutos
      if (rateLimitCheck.blockedUntil) {
        const blockedUntilDate = new Date(rateLimitCheck.blockedUntil);
        return c.json(
          {
            error: 'Cuenta temporalmente bloqueada',
            message: `Demasiados intentos fallidos. Tu cuenta está bloqueada hasta ${blockedUntilDate.toLocaleTimeString()}. Por favor, intenta más tarde.`,
            retryAfter: delaySeconds,
            blockedUntil: rateLimitCheck.blockedUntil,
            attemptCount,
            isBlocked: true,
            blockDurationMinutes: 15,
          },
          429 // Too Many Requests
        );
      }

      // Si hay delay requerido (5s o 30s)
      return c.json(
        {
          error: 'Demasiados intentos',
          message: `Demasiados intentos fallidos. Por favor, espera ${delayMinutes > 1 ? `${delayMinutes} minutos` : `${delaySeconds} segundos`} antes de intentar nuevamente.`,
          retryAfter: delaySeconds,
          attemptCount,
        },
        429 // Too Many Requests
      );
    }

    // Buscar usuario solo en base de datos (usuarios seed + registrados)
    const { getUserByEmailFromDB } = await import('../utils/user-db');
    const dbUser = await getUserByEmailFromDB(emailLower);
    let matchedUser: { email: string; password: string; user: User } | null = null;
    let passwordValid = false;

    if (dbUser) {
      // Usuario de base de datos - verificar contraseña hasheada
      if (!dbUser.password) {
        return c.json(
          {
            error: 'Credenciales inválidas',
            message: 'Email o contraseña incorrectos',
          },
          401
        );
      }

      const { verifyPassword } = await import('../utils/password');
      passwordValid = await verifyPassword(password, dbUser.password);
      
      if (passwordValid) {
        matchedUser = {
          email: dbUser.email,
          password: dbUser.password,
          user: {
            id: dbUser.userId,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role as any,
            clinicId: dbUser.clinicId || undefined,
            assignedPodiatristIds: dbUser.assignedPodiatristIds ?? undefined,
            isBlocked: dbUser.isBlocked,
            isEnabled: dbUser.isEnabled,
            isBanned: dbUser.isBanned,
            mustChangePassword: dbUser.mustChangePassword || false,
          },
        };
      }
    }

    if (!matchedUser || !passwordValid) {
      // Registrar intento fallido (skip si IP está en whitelist)
      let failedAttempt = { count: 0 };
      let attemptCount = 0;
      
      if (!isWhitelisted) {
        failedAttempt = await recordFailedAttemptD1(identifier);
        await recordLoginIPFailedAttemptD1(clientIP);
        attemptCount = failedAttempt.count;
      }

      // Registrar métrica de seguridad
      const { recordSecurityMetric } = await import('../utils/security-metrics');
      await recordSecurityMetric({
        metricType: 'failed_login',
        ipAddress: clientIP,
        details: { email: emailLower, attemptCount },
      });

      // Registrar evento de auditoría
      const { logAuditEvent } = await import('../utils/audit-log');
      await logAuditEvent({
        userId: 'anonymous',
        action: 'LOGIN_FAILED',
        resourceType: 'authentication',
        ipAddress: clientIP,
        userAgent: getSafeUserAgent(c),
        details: { email: emailLower, attemptCount },
      });

      // Enviar notificación por email si es necesario
      if (shouldSendNotification(attemptCount)) {
        const isBlocked = attemptCount >= 10;
        await sendFailedLoginNotification(emailLower, attemptCount, isBlocked);
      }

      // Notificación in-app para super_admin cuando se alcanzan exactamente 10 intentos (evitar spam)
      if (attemptCount === 10) {
        try {
          const { database } = await import('../database');
          const schema = await import('../database/schema');
          const { createdUsers, notifications: notificationsTable } = schema;
          const { eq } = await import('drizzle-orm');
          const superAdminRows = await database
            .select({ userId: createdUsers.userId })
            .from(createdUsers)
            .where(eq(createdUsers.role, 'super_admin'));
          const now = new Date().toISOString();
          const title = '⚠️ Alerta de seguridad: 10+ intentos de login fallidos';
          const message = `Se han registrado ${attemptCount} intentos fallidos de inicio de sesión para el correo ${emailLower}. La cuenta está bloqueada temporalmente (15 min).`;
          const metadata = JSON.stringify({ email: emailLower, attemptCount, blocked: true });
          for (const row of superAdminRows) {
            const notifId = `notif_${crypto.randomUUID().replace(/-/g, '')}`;
            await database.insert(notificationsTable).values({
              id: notifId,
              userId: row.userId,
              type: 'system',
              title,
              message,
              read: false,
              metadata,
              createdAt: now,
            });
          }
        } catch (err) {
          console.error('Error creando notificación de login fallido para super_admin:', err);
        }
      }

      // Calcular delay para el siguiente intento (solo si no está whitelisted)
      let nextDelay = 0;
      if (!isWhitelisted && attemptCount > 0) {
        nextDelay = attemptCount >= 10
          ? 15 * 60 // 15 minutos
          : attemptCount >= 5
          ? 30 // 30 segundos
          : attemptCount >= 3
          ? 5 // 5 segundos
          : 0;
      }

      // Determinar si se requiere CAPTCHA
      const { getCaptchaConfig, shouldShowCaptcha } = await import('../utils/captcha');
      const captchaConfig = getCaptchaConfig();
      const requiresCaptcha = captchaConfig && shouldShowCaptcha(attemptCount, 3);

      return c.json(
        {
          error: 'Credenciales inválidas',
          message: 'Email o contraseña incorrectos',
          attemptCount: isWhitelisted ? 0 : attemptCount, // No mostrar count si whitelisted
          retryAfter: nextDelay,
          requiresCaptcha,
        },
        401
      );
    }

    // Verificar email solo en producción (dev: registro sin correo de verificación)
    if (dbUser && dbUser.registrationSource === 'public') {
      const { isEmailVerificationRequired } = await import('../utils/email-verification');
      if (isEmailVerificationRequired() && !dbUser.emailVerified) {
        return c.json(
          {
            error: 'Email no verificado',
            message: 'Por favor, verifica tu email antes de iniciar sesión. Revisa tu bandeja de entrada.',
            requiresEmailVerification: true,
          },
          403
        );
      }
    }

    // Verificar estados de cuenta (desde DB, ya en matchedUser.user)
    if (matchedUser.user.isBanned) {
      const { recordSecurityMetric } = await import('../utils/security-metrics');
      await recordSecurityMetric({
        metricType: 'banned_user',
        userId: matchedUser.user.id,
        ipAddress: clientIP,
        details: { email: emailLower },
      });
      return c.json(
        {
          error: 'Cuenta baneada',
          message: 'Tu cuenta ha sido baneada permanentemente. Contacta al administrador.',
        },
        403
      );
    }
    if (matchedUser.user.isBlocked) {
      const { recordSecurityMetric } = await import('../utils/security-metrics');
      await recordSecurityMetric({
        metricType: 'blocked_user',
        userId: matchedUser.user.id,
        ipAddress: clientIP,
        details: { email: emailLower },
      });
      return c.json(
        {
          error: 'Cuenta bloqueada',
          message: 'Tu cuenta está bloqueada temporalmente. Contacta al administrador.',
        },
        403
      );
    }
    if (isAdministrativelyBlocked(matchedUser.user.isEnabled, dbUser?.disabledAt ?? null)) {
      const disabledAt = dbUser?.disabledAt ?? null;
      let daysLeftText = '';
      if (disabledAt != null) {
        const MS_PER_DAY = 24 * 60 * 60 * 1000;
        const elapsedDays = (Date.now() - disabledAt) / MS_PER_DAY;
        const daysLeft = Math.max(0, Math.round(RETENTION.DELETION_AFTER_DAYS - elapsedDays));
        if (daysLeft > 0) {
          daysLeftText = ` Tu cuenta será dada de baja de forma permanente en aproximadamente ${daysLeft} día(s).`;
        }
      }
      return c.json(
        {
          error: 'Cuenta deshabilitada',
          message:
            'Tu cuenta está deshabilitada y no puedes acceder a la aplicación.' +
            daysLeftText +
            ' Si crees que se trata de un error, contacta con el administrador o con PodoAdmin.',
        },
        403
      );
    }

    // Verificar 2FA si está habilitado
    const { is2FAEnabled, verify2FACode } = await import('../utils/two-factor-auth');
    const has2FA = await is2FAEnabled(matchedUser.user.id);

    if (has2FA) {
      if (!twoFactorCode) {
        return c.json(
          {
            error: 'Código 2FA requerido',
            message: 'Por favor, ingresa el código de autenticación de dos factores',
            requires2FA: true,
          },
          400
        );
      }

      const twoFactorResult = await verify2FACode(matchedUser.user.id, twoFactorCode);
      if (!twoFactorResult.valid) {
        // Registrar métrica
        const { recordSecurityMetric } = await import('../utils/security-metrics');
        await recordSecurityMetric({
          metricType: '2fa_failed',
          userId: matchedUser.user.id,
          ipAddress: clientIP,
          details: { email: emailLower },
        });

        return c.json(
          {
            error: 'Código 2FA inválido',
            message: 'El código de autenticación de dos factores es incorrecto',
            requires2FA: true,
          },
          400
        );
      }

      // Registrar métrica de 2FA exitoso
      const { recordSecurityMetric } = await import('../utils/security-metrics');
      await recordSecurityMetric({
        metricType: '2fa_used',
        userId: matchedUser.user.id,
        ipAddress: clientIP,
        details: { email: emailLower, usedBackupCode: twoFactorResult.usedBackupCode },
      });
    }

    // Generar par de tokens (access + refresh)
    const { accessToken, refreshToken } = await generateTokenPair({
      userId: matchedUser.user.id,
      email: matchedUser.user.email,
      role: matchedUser.user.role,
      clinicId: matchedUser.user.clinicId,
    });

    // Determinar si estamos en producción
    const isProd = isProduction(
      { NODE_ENV: process.env.NODE_ENV },
      c.req.raw.headers
    );

    // Configurar cookies HTTP-only
    const accessCookieOptions = getAccessTokenCookieOptions(isProd);
    const refreshCookieOptions = getRefreshTokenCookieOptions(isProd);

    const accessCookie = formatCookie('access-token', accessToken, accessCookieOptions);
    const refreshCookie = formatCookie('refresh-token', refreshToken, refreshCookieOptions);

    // Establecer cookies en la respuesta
    c.header('Set-Cookie', [accessCookie, refreshCookie].join(', '));

    // Limpiar intentos fallidos en login exitoso (solo si no está whitelisted)
    if (!isWhitelisted) {
      await clearFailedAttemptsD1(identifier);
    }

    // Registrar métrica de login exitoso
    const { recordSecurityMetric } = await import('../utils/security-metrics');
    await recordSecurityMetric({
      metricType: 'successful_login',
      userId: matchedUser.user.id,
      ipAddress: clientIP,
      details: { email: emailLower, has2FA: has2FA },
    });

    // Registrar evento de auditoría
    const { logAuditEvent } = await import('../utils/audit-log');
    await logAuditEvent({
      userId: matchedUser.user.id,
      action: 'LOGIN_SUCCESS',
      resourceType: 'authentication',
      ipAddress: clientIP,
      userAgent: getSafeUserAgent(c),
      clinicId: matchedUser.user.clinicId,
      details: { email: emailLower, has2FA },
    });

    // Créditos del usuario están en DB; el endpoint /credits/me crea la fila si no existe

    const { tryGrantIpTrialForUser } = await import('../utils/ip-trial-service');
    await tryGrantIpTrialForUser(
      matchedUser.user.id,
      matchedUser.user.role,
      matchedUser.user.clinicId,
      clientIP
    );

    const access = await resolveSystemAccess(matchedUser.user.id, matchedUser.user.role);

    const { checkIpTrialEligibility } = await import('../utils/ip-trial-service');
    const trialEligibility =
      matchedUser.user.role === 'clinic_admin' || matchedUser.user.role === 'podiatrist'
        ? await checkIpTrialEligibility(clientIP, matchedUser.user.role)
        : undefined;

    // NO devolver tokens en el body por seguridad (están en cookies HTTP-only)
    return c.json({
      success: true,
      user: {
        id: matchedUser.user.id,
        email: matchedUser.user.email,
        name: matchedUser.user.name,
        role: matchedUser.user.role,
        clinicId: matchedUser.user.clinicId,
        assignedPodiatristIds: matchedUser.user.assignedPodiatristIds,
        mustChangePassword: matchedUser.user.mustChangePassword,
        systemAccess: access.granted,
        accessReason: access.reason,
        accessMessage: access.granted ? undefined : access.message,
      },
      trialEligibility,
    });
  } catch (error) {
    console.error('Error en login:', error);
    return c.json(
      { error: 'Error interno', message: 'Ocurrió un error al procesar la solicitud' },
      500
    );
  }
});

/**
 * POST /api/auth/logout
 * Cierra sesión y elimina las cookies de tokens
 * También agrega los tokens a la blacklist para invalidarlos
 */
authRoutes.post('/logout', requireAuth, async (c) => {
  const user = c.get('user');
  
  // Obtener tokens de las cookies
  const cookieHeader = c.req.header('Cookie');
  const { extractCookie } = await import('../utils/cookies');
  const accessToken = extractCookie(cookieHeader, 'access-token');
  const refreshToken = extractCookie(cookieHeader, 'refresh-token');

  // Agregar tokens a la blacklist si existen
  if (user && accessToken) {
    const { addTokenToBlacklist } = await import('../utils/token-blacklist');
    // Access token expira en 15 minutos (900000 ms)
    const accessExpiresAt = Date.now() + 15 * 60 * 1000;
    await addTokenToBlacklist(accessToken, user.userId, 'access', accessExpiresAt);
  }

  if (user && refreshToken) {
    const { addTokenToBlacklist } = await import('../utils/token-blacklist');
    // Refresh token expira en 7 días (604800000 ms)
    const refreshExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    await addTokenToBlacklist(refreshToken, user.userId, 'refresh', refreshExpiresAt);
  }

  // Registrar evento de auditoría
  if (user) {
    const { logAuditEvent } = await import('../utils/audit-log');
    const { getClientIP } = await import('../utils/ip-tracking');
    await logAuditEvent({
      userId: user.userId,
      action: 'LOGOUT',
      resourceType: 'session',
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
    });
  }

  // Crear cookies de eliminación
  const deleteAccessCookie = createDeleteCookie('access-token');
  const deleteRefreshCookie = createDeleteCookie('refresh-token');

  // Establecer cookies vacías que expiran inmediatamente
  c.header('Set-Cookie', [deleteAccessCookie, deleteRefreshCookie].join(', '));

  return c.json({ success: true, message: 'Sesión cerrada correctamente' });
});

/**
 * GET /api/auth/verify
 * Verifica si el token es válido y devuelve información del usuario
 */
authRoutes.get('/verify', requireAuth, async (c) => {
  const user = c.get('user');

  if (!user) {
    return c.json({ error: 'Token inválido' }, 401);
  }

  // Obtener usuario desde DB
  const dbUser = await getUserByIdFromDB(user.userId);
  if (!dbUser) {
    return c.json({ error: 'Usuario no encontrado' }, 404);
  }

  if (dbUser.isBanned || dbUser.isBlocked) {
    return c.json(
      { error: 'Cuenta no disponible', message: 'Tu cuenta no está disponible' },
      403
    );
  }
  if (isAdministrativelyBlocked(dbUser.isEnabled, dbUser.disabledAt)) {
    return c.json(
      { error: 'Cuenta no disponible', message: 'Tu cuenta no está disponible' },
      403
    );
  }

  const clientIP = getClientIP(c.req.raw.headers);
  const { tryGrantIpTrialForUser } = await import('../utils/ip-trial-service');
  await tryGrantIpTrialForUser(dbUser.userId, dbUser.role, dbUser.clinicId, clientIP);

  const access = await resolveSystemAccess(dbUser.userId, dbUser.role);

  return c.json({
    success: true,
    user: {
      id: dbUser.userId,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      clinicId: dbUser.clinicId || undefined,
      assignedPodiatristIds: dbUser.assignedPodiatristIds ?? undefined,
      mustChangePassword: dbUser.mustChangePassword ?? false,
      systemAccess: access.granted,
      accessReason: access.reason,
    },
  });
});

/**
 * Schema para cambiar contraseña (usuario autenticado)
 */
const changePasswordSchema = {
  currentPassword: (val: unknown) => typeof val === 'string' && val.length >= 1,
  newPassword: (val: unknown) => typeof val === 'string' && val.length >= 1,
};

/**
 * POST /api/auth/change-password
 * Cambia la contraseña del usuario autenticado (obligatorio tras contraseña temporal)
 */
authRoutes.post('/change-password', requireAuth, async (c) => {
  try {
    const rawBody = await c.req.json().catch(() => ({}));
    const { currentPassword, newPassword } = rawBody as { currentPassword?: string; newPassword?: string };

    if (!changePasswordSchema.currentPassword(currentPassword) || !changePasswordSchema.newPassword(newPassword)) {
      return c.json(
        { error: 'Datos inválidos', message: 'Contraseña actual y nueva son requeridas' },
        400
      );
    }

    const user = c.get('user');
    const dbUser = await getUserByIdFromDB(user.userId);
    if (!dbUser || !dbUser.password) {
      return c.json({ error: 'Usuario no encontrado' }, 404);
    }

    const { verifyPassword } = await import('../utils/password');
    const valid = await verifyPassword(currentPassword, dbUser.password);
    if (!valid) {
      return c.json(
        { error: 'Contraseña incorrecta', message: 'La contraseña actual no es correcta' },
        400
      );
    }

    const { validatePasswordStrength, hashPassword } = await import('../utils/password');
    const validation = validatePasswordStrength(newPassword);
    if (!validation.valid) {
      return c.json(
        { error: 'Contraseña débil', message: validation.errors[0], errors: validation.errors },
        400
      );
    }

    const { createdUsers } = await import('../database/schema');
    const { database } = await import('../database');
    const { eq } = await import('drizzle-orm');

    const hashedPassword = await hashPassword(newPassword);
    const now = new Date().toISOString();

    await database
      .update(createdUsers)
      .set({ password: hashedPassword, updatedAt: now, mustChangePassword: false })
      .where(eq(createdUsers.userId, user.userId));

    const { logAuditEvent } = await import('../utils/audit-log');
    await logAuditEvent({
      userId: user.userId,
      action: 'PASSWORD_CHANGED',
      resourceType: 'authentication',
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
      details: { source: 'change_password' },
    });

    return c.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error en change-password:', error);
    return c.json(
      { error: 'Error interno', message: 'Ocurrió un error al cambiar la contraseña' },
      500
    );
  }
});

/**
 * POST /api/auth/refresh
 * Renueva el access token usando el refresh token
 * No requiere autenticación (usa refresh token de cookie)
 */
authRoutes.post('/refresh', async (c) => {
  try {
    // Obtener refresh token de la cookie
    const cookieHeader = c.req.header('Cookie');
    const { extractCookie } = await import('../utils/cookies');
    const refreshToken = extractCookie(cookieHeader, 'refresh-token');

    if (!refreshToken) {
      return c.json(
        { error: 'Refresh token faltante', message: 'No se encontró refresh token' },
        401
      );
    }

    // Verificar refresh token
    const payload = await verifyRefreshToken(refreshToken);

    if (!payload) {
      return c.json(
        { error: 'Refresh token inválido', message: 'El refresh token no es válido o ha expirado' },
        401
      );
    }

    // Verificar estados de cuenta desde DB
    const dbUser = await getUserByIdFromDB(payload.userId);
    if (!dbUser || dbUser.isBanned || dbUser.isBlocked) {
      return c.json(
        { error: 'Cuenta no disponible', message: 'Tu cuenta no está disponible' },
        403
      );
    }
    if (isAdministrativelyBlocked(dbUser.isEnabled, dbUser.disabledAt)) {
      return c.json(
        { error: 'Cuenta no disponible', message: 'Tu cuenta no está disponible' },
        403
      );
    }

    // Tokens siempre alineados con la BD (rol/clínica actuales; evita escalada con JWT obsoleto)
    const { generateTokenPair } = await import('../utils/jwt');
    const { accessToken, refreshToken: newRefreshToken } = await generateTokenPair({
      userId: dbUser.userId,
      email: dbUser.email,
      role: dbUser.role as JWTPayload['role'],
      clinicId: dbUser.clinicId ?? undefined,
    });

    // Determinar si estamos en producción
    const isProd = isProduction(
      { NODE_ENV: process.env.NODE_ENV },
      c.req.raw.headers
    );

    // Configurar nuevas cookies
    const accessCookieOptions = getAccessTokenCookieOptions(isProd);
    const refreshCookieOptions = getRefreshTokenCookieOptions(isProd);

    const accessCookie = formatCookie('access-token', accessToken, accessCookieOptions);
    const refreshCookie = formatCookie('refresh-token', newRefreshToken, refreshCookieOptions);

    // Establecer nuevas cookies
    c.header('Set-Cookie', [accessCookie, refreshCookie].join(', '));

    return c.json({
      success: true,
      message: 'Tokens renovados correctamente',
    });
  } catch (error) {
    console.error('Error renovando tokens:', error);
    return c.json(
      { error: 'Error interno', message: 'No se pudieron renovar los tokens' },
      500
    );
  }
});

/**
 * POST /api/auth/forgot-password
 * Solicita recuperación de contraseña. Envía email con enlace si el usuario existe y tiene contraseña.
 * Respuesta genérica por seguridad (no revelar si el email existe).
 */
authRoutes.post('/forgot-password', async (c) => {
  try {
    const rawBody = await c.req.json().catch(() => ({}));
    const validation = validateData(forgotPasswordSchema, rawBody);

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

    const { email } = validation.data;
    const emailLower = email.toLowerCase().trim();
    const clientIP = getClientIP(c.req.raw.headers);

    const { checkAndRecordActionRateLimit } = await import('../utils/action-rate-limit');
    const rateLimit = await checkAndRecordActionRateLimit(
      'forgot_password',
      clientIP,
      5,
      60 * 60 * 1000
    ); // 5 por hora por IP

    if (!rateLimit.allowed) {
      return c.json(
        {
          error: 'Demasiadas solicitudes',
          message: 'Por favor, espera un momento antes de volver a solicitar el restablecimiento de contraseña.',
          retryAfter: rateLimit.retryAfterSeconds,
        },
        429
      );
    }

    const { getUserByEmailFromDB } = await import('../utils/user-db');
    const dbUser = await getUserByEmailFromDB(emailLower);

    if (!dbUser) {
      return c.json({
        success: true,
        message: 'Si el email está registrado, recibirás un correo con instrucciones para restablecer tu contraseña.',
      });
    }

    if (!dbUser.password) {
      return c.json({
        success: true,
        message: 'Si el email está registrado, tu solicitud será revisada por un administrador o soporte.',
      });
    }

    // Crear solicitud pendiente de revisión (no se envía email automáticamente)
    const { database } = await import('../database');
    const { passwordResetRequests } = await import('../database/schema');
    const requestId = crypto.randomUUID();

    await database.insert(passwordResetRequests).values({
      id: requestId,
      userId: dbUser.id,
      email: emailLower,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      ipAddress: clientIP,
      userAgent: getSafeUserAgent(c),
    });

    const { logAuditEvent } = await import('../utils/audit-log');
    await logAuditEvent({
      userId: dbUser.userId,
      action: 'PASSWORD_RESET_REQUESTED',
      resourceType: 'authentication',
      ipAddress: clientIP,
      userAgent: getSafeUserAgent(c),
      details: { email: emailLower, requestId },
    });

    return c.json({
      success: true,
      message: 'Si el email está registrado, tu solicitud será revisada por un administrador o soporte. Te contactaremos cuando esté disponible.',
    });
  } catch (error) {
    console.error('Error en forgot-password:', error);
    return c.json(
      {
        error: 'Error interno',
        message: 'Ocurrió un error al procesar la solicitud. Por favor, intenta más tarde.',
      },
      500
    );
  }
});

/**
 * POST /api/auth/reset-password
 * Restablece la contraseña con el token recibido por email. Tras éxito, se limpian los intentos fallidos de login.
 */
authRoutes.post('/reset-password', async (c) => {
  try {
    const clientIP = getClientIP(c.req.raw.headers);
    const { checkAndRecordActionRateLimit } = await import('../utils/action-rate-limit');
    const rateLimit = await checkAndRecordActionRateLimit(
      'reset_password',
      clientIP,
      10,
      60 * 60 * 1000
    ); // 10 intentos por hora por IP

    if (!rateLimit.allowed) {
      c.header('Retry-After', String(rateLimit.retryAfterSeconds ?? 3600));
      return c.json(
        {
          error: 'Demasiadas solicitudes',
          message: 'Has superado el límite de intentos. Espera un momento e inténtalo de nuevo.',
          retryAfter: rateLimit.retryAfterSeconds,
        },
        429
      );
    }

    const rawBody = await c.req.json().catch(() => ({}));
    const validation = validateData(resetPasswordSchema, rawBody);

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

    const { token, newPassword } = validation.data;

    const { verifyPasswordResetToken, verifyAndConsumePasswordResetToken } = await import('../utils/password-reset');
    const verifyResult = await verifyPasswordResetToken(token);

    if (!verifyResult.valid || !verifyResult.userId || !verifyResult.tokenId) {
      const { recordSecurityMetric } = await import('../utils/security-metrics');
      await recordSecurityMetric({
        metricType: 'password_reset_failed',
        ipAddress: getClientIP(c.req.raw.headers),
        details: { reason: verifyResult.error || 'invalid_token' },
      });
      return c.json(
        {
          error: 'Token inválido o expirado',
          message: verifyResult.error || 'El enlace de recuperación no es válido o ha expirado. Solicita uno nuevo.',
        },
        400
      );
    }

    const { validatePasswordStrength } = await import('../utils/password');
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return c.json(
        {
          error: 'Contraseña débil',
          message: passwordValidation.errors[0],
          errors: passwordValidation.errors,
        },
        400
      );
    }

    const { database } = await import('../database');
    const { createdUsers } = await import('../database/schema');
    const { eq } = await import('drizzle-orm');
    const { hashPassword } = await import('../utils/password');

    const userRow = await database
      .select()
      .from(createdUsers)
      .where(eq(createdUsers.id, verifyResult.userId))
      .limit(1);

    if (userRow.length === 0) {
      return c.json({ error: 'Usuario no encontrado' }, 404);
    }

    const consumeResult = await verifyAndConsumePasswordResetToken(token);
    if (!consumeResult.valid || !consumeResult.userId) {
      const { recordSecurityMetric } = await import('../utils/security-metrics');
      await recordSecurityMetric({
        metricType: 'password_reset_failed',
        ipAddress: getClientIP(c.req.raw.headers),
        details: { reason: consumeResult.error || 'token_already_used' },
      });
      return c.json(
        {
          error: 'Token no válido',
          message: 'El enlace ya fue usado o expiró. Solicita uno nuevo si quieres restablecer la contraseña.',
        },
        400
      );
    }

    const hashedPassword = await hashPassword(newPassword);
    await database
      .update(createdUsers)
      .set({
        password: hashedPassword,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(createdUsers.id, consumeResult.userId));

    const userEmail = userRow[0].email;
    const { clearFailedAttemptsByEmailD1 } = await import('../utils/rate-limit-d1');
    await clearFailedAttemptsByEmailD1(userEmail);

    const { logAuditEvent } = await import('../utils/audit-log');
    await logAuditEvent({
      userId: userRow[0].userId,
      action: 'PASSWORD_RESET_COMPLETED',
      resourceType: 'authentication',
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
      details: { email: userEmail },
    });

    const { recordSecurityMetric } = await import('../utils/security-metrics');
    await recordSecurityMetric({
      metricType: 'password_reset_success',
      userId: userRow[0].userId,
      ipAddress: getClientIP(c.req.raw.headers),
      details: { email: userEmail },
    });

    return c.json({
      success: true,
      message: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.',
    });
  } catch (error) {
    console.error('Error en reset-password:', error);
    return c.json(
      {
        error: 'Error interno',
        message: 'Ocurrió un error al restablecer la contraseña. Por favor, intenta de nuevo.',
      },
      500
    );
  }
});

/**
 * GET /api/auth/password-reset-requests
 * Lista solicitudes pendientes de recuperación de contraseña (solo super_admin, admin)
 */
authRoutes.get('/password-reset-requests', requireAuth, requireRole('super_admin', 'admin'), async (c) => {
  try {
    const { database } = await import('../database');
    const { passwordResetRequests, createdUsers } = await import('../database/schema');
    const { eq, desc } = await import('drizzle-orm');

    const rows = await database
      .select({
        id: passwordResetRequests.id,
        userId: passwordResetRequests.userId,
        email: passwordResetRequests.email,
        status: passwordResetRequests.status,
        requestedAt: passwordResetRequests.requestedAt,
        ipAddress: passwordResetRequests.ipAddress,
        reviewedBy: passwordResetRequests.reviewedBy,
        reviewedAt: passwordResetRequests.reviewedAt,
        rejectionReason: passwordResetRequests.rejectionReason,
        userName: createdUsers.name,
      })
      .from(passwordResetRequests)
      .leftJoin(createdUsers, eq(passwordResetRequests.userId, createdUsers.id))
      .orderBy(desc(passwordResetRequests.requestedAt))
      .limit(100);

    const requests = rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      email: r.email,
      userName: r.userName,
      status: r.status,
      requestedAt: r.requestedAt,
      ipAddress: r.ipAddress,
      reviewedBy: r.reviewedBy,
      reviewedAt: r.reviewedAt,
      rejectionReason: r.rejectionReason,
    }));

    return c.json({ success: true, requests });
  } catch (error) {
    console.error('Error listando solicitudes de recuperación:', error);
    return c.json({ error: 'Error interno', message: 'Error al obtener solicitudes' }, 500);
  }
});

/**
 * POST /api/auth/password-reset-requests/:id/approve
 * Aprueba una solicitud y envía el email con enlace de recuperación
 */
authRoutes.post('/password-reset-requests/:id/approve', requireAuth, requireRole('super_admin', 'admin'), async (c) => {
  try {
    const requestId = sanitizePathParam(c.req.param('id'), 64);
    if (!requestId) return c.json({ error: 'ID de solicitud inválido' }, 400);
    const reviewer = c.get('user');

    const { database } = await import('../database');
    const { passwordResetRequests, createdUsers } = await import('../database/schema');
    const { eq } = await import('drizzle-orm');

    const [reqRow] = await database
      .select()
      .from(passwordResetRequests)
      .where(eq(passwordResetRequests.id, requestId))
      .limit(1);

    if (!reqRow || reqRow.status !== 'pending') {
      return c.json({ error: 'Solicitud no encontrada o ya procesada' }, 404);
    }

    const [userRow] = await database
      .select()
      .from(createdUsers)
      .where(eq(createdUsers.id, reqRow.userId))
      .limit(1);

    if (!userRow) {
      return c.json({ error: 'Usuario no encontrado' }, 404);
    }

    const { createPasswordResetToken } = await import('../utils/password-reset');
    const token = await createPasswordResetToken(reqRow.userId);

    const baseUrl = process.env.APP_BASE_URL || process.env.VITE_BASE_URL || process.env.ALLOWED_ORIGINS?.split(',')[0]?.trim() || 'http://localhost:5173';
    const resetUrl = baseUrl.startsWith('http') ? `${baseUrl}/reset-password?token=${token}` : `https://${baseUrl}/reset-password?token=${token}`;

    const { sendPasswordResetEmail, isEmailProviderConfigured } = await import('../utils/email-service');
    const emailSent = await sendPasswordResetEmail(userRow.email, userRow.name, resetUrl);

    if (!emailSent && process.env.NODE_ENV === 'production') {
      return c.json(
        {
          error: 'Email no configurado',
          message:
            'No se pudo enviar el correo (falta RESEND_API_KEY o SENDGRID_API_KEY). Copia el enlace y envíalo manualmente al usuario.',
          resetUrl,
        },
        503
      );
    }

    await database
      .update(passwordResetRequests)
      .set({
        status: 'approved',
        reviewedBy: reviewer.userId,
        reviewedAt: new Date().toISOString(),
      })
      .where(eq(passwordResetRequests.id, requestId));

    const { logAuditEvent } = await import('../utils/audit-log');
    await logAuditEvent({
      userId: reviewer.userId,
      action: 'PASSWORD_RESET_APPROVED',
      resourceType: 'authentication',
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
      details: { requestId, targetEmail: userRow.email, emailSent },
    });

    const emailNote = emailSent
      ? 'Se ha enviado el enlace al correo del usuario.'
      : isEmailProviderConfigured()
        ? 'No se pudo enviar el correo automáticamente.'
        : 'Modo desarrollo: email simulado (Mock).';

    return c.json({
      success: true,
      message: `Solicitud aprobada. ${emailNote} También puedes copiar el enlace y enviarlo manualmente.`,
      resetUrl,
      emailSent,
    });
  } catch (error) {
    console.error('Error aprobando solicitud:', error);
    return c.json({ error: 'Error interno', message: 'Error al aprobar la solicitud' }, 500);
  }
});

/**
 * POST /api/auth/password-reset-requests/:id/reject
 * Rechaza una solicitud de recuperación
 */
authRoutes.post('/password-reset-requests/:id/reject', requireAuth, requireRole('super_admin', 'admin'), async (c) => {
  try {
    const requestId = sanitizePathParam(c.req.param('id'), 64);
    if (!requestId) return c.json({ error: 'ID de solicitud inválido' }, 400);
    const reviewer = c.get('user');
    const rawBody = await c.req.json().catch(() => ({}));
    const reason = (rawBody as { reason?: string }).reason || '';

    const { database } = await import('../database');
    const { passwordResetRequests, createdUsers } = await import('../database/schema');
    const { eq } = await import('drizzle-orm');

    const [reqRow] = await database
      .select()
      .from(passwordResetRequests)
      .where(eq(passwordResetRequests.id, requestId))
      .limit(1);

    if (!reqRow || reqRow.status !== 'pending') {
      return c.json({ error: 'Solicitud no encontrada o ya procesada' }, 404);
    }

    const [userRow] = await database.select().from(createdUsers).where(eq(createdUsers.id, reqRow.userId)).limit(1);

    await database
      .update(passwordResetRequests)
      .set({
        status: 'rejected',
        reviewedBy: reviewer.userId,
        reviewedAt: new Date().toISOString(),
        rejectionReason: reason || null,
      })
      .where(eq(passwordResetRequests.id, requestId));

    const { logAuditEvent } = await import('../utils/audit-log');
    await logAuditEvent({
      userId: reviewer.userId,
      action: 'PASSWORD_RESET_REJECTED',
      resourceType: 'authentication',
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
      details: { requestId, targetEmail: reqRow.email, reason },
    });

    return c.json({
      success: true,
      message: 'Solicitud rechazada.',
    });
  } catch (error) {
    console.error('Error rechazando solicitud:', error);
    return c.json({ error: 'Error interno', message: 'Error al rechazar la solicitud' }, 500);
  }
});

/** Respuesta genérica de registro (no revela si el email ya existe). */
const REGISTER_GENERIC_SUCCESS = {
  success: true,
  message:
    'Si el email no está registrado, recibirás un correo de verificación. Por favor, revisa tu bandeja de entrada.',
} as const;

function getAppBaseUrl(): string {
  const base =
    process.env.APP_BASE_URL || process.env.VITE_BASE_URL || process.env.ALLOWED_ORIGINS?.split(',')[0]?.trim() || 'http://localhost:5173';
  return base.startsWith('http') ? base.replace(/\/$/, '') : `https://${base.replace(/\/$/, '')}`;
}

/**
 * POST /api/auth/register
 * Registro público: rate limit por IP, CAPTCHA, verificación de email obligatoria.
 */
authRoutes.post('/register', async (c) => {
  const clientIP = getClientIP(c.req.raw.headers);
  const genericResponse = () => c.json(REGISTER_GENERIC_SUCCESS);

  try {
    const rawBody = await c.req.json().catch(() => ({}));
    const validation = validateData(registerSchema, rawBody);

    if (!validation.success) {
      await import('../utils/registration-rate-limit').then((m) =>
        m.recordFailedRegistration(clientIP, false)
      );
      return c.json(
        { error: 'Datos inválidos', message: validation.error, issues: validation.issues },
        400
      );
    }

    const { email, password, name, termsAccepted, privacyPolicyAccepted, captchaToken, clinicCode } = validation.data;
    const emailLower = email.toLowerCase().trim();

    const { checkPublicRegistrationIpTrialPolicy } = await import('../utils/ip-trial-service');
    const ipTrialPolicy = await checkPublicRegistrationIpTrialPolicy({
      clientIp: clientIP,
      role: 'podiatrist',
      joiningExistingClinic: Boolean(clinicCode?.trim()),
    });
    if (!ipTrialPolicy.allowed) {
      const { recordFailedRegistration } = await import('../utils/registration-rate-limit');
      await recordFailedRegistration(clientIP, true);
      const { recordSecurityMetric } = await import('../utils/security-metrics');
      await recordSecurityMetric({
        metricType: 'registration_ip_trial_blocked',
        ipAddress: clientIP,
        details: { reason: ipTrialPolicy.reason },
      });
      return c.json(
        {
          error: 'Prueba gratuita no disponible',
          code: ipTrialPolicy.reason ?? 'ip_trial_blocked',
          message:
            ipTrialPolicy.message ??
            'Esta conexión ya utilizó el periodo de prueba gratuito.',
        },
        403
      );
    }

    const { checkRegistrationRateLimit } = await import('../utils/registration-rate-limit');
    const rateLimit = await checkRegistrationRateLimit(clientIP);
    if (!rateLimit.allowed) {
      const retryAfter = rateLimit.delay
        ? Math.ceil(rateLimit.delay / 1000)
        : rateLimit.blockedUntil
          ? Math.ceil((rateLimit.blockedUntil - Date.now()) / 1000)
          : 3600;
      c.header('Retry-After', String(retryAfter));
      return c.json(
        {
          error: 'Demasiados intentos',
          message: rateLimit.reason || 'Has superado el límite de registros. Intenta más tarde.',
          retryAfter,
        },
        429
      );
    }

    const { getCaptchaConfig, verifyCaptcha } = await import('../utils/captcha');
    const captchaConfig = getCaptchaConfig();
    if (captchaConfig) {
      if (!captchaToken) {
        return c.json(
          { error: 'CAPTCHA requerido', message: 'Completa el CAPTCHA para registrarte.' },
          400
        );
      }
      const captchaResult = await verifyCaptcha(captchaToken, captchaConfig);
      if (!captchaResult.success) {
        const { recordFailedRegistration } = await import('../utils/registration-rate-limit');
        await recordFailedRegistration(clientIP, true);
        const { recordSecurityMetric } = await import('../utils/security-metrics');
        await recordSecurityMetric({
          metricType: 'captcha_failed',
          ipAddress: clientIP,
          details: { context: 'register', error: captchaResult.error },
        });
        return c.json(
          { error: 'CAPTCHA inválido', message: 'No se pudo verificar el CAPTCHA. Intenta de nuevo.' },
          400
        );
      }
    } else if (process.env.NODE_ENV === 'production') {
      return c.json(
        {
          error: 'Registro no disponible',
          message: 'El registro público requiere CAPTCHA configurado (CAPTCHA_PROVIDER, CAPTCHA_SITE_KEY, CAPTCHA_SECRET_KEY).',
        },
        503
      );
    }

    const { validateEmailDomain } = await import('../utils/email-domains');
    const domainCheck = validateEmailDomain(emailLower);
    if (!domainCheck.valid) {
      return c.json({ error: 'Email no permitido', message: domainCheck.error }, 400);
    }

    const { validatePasswordStrength } = await import('../utils/password');
    const pwdCheck = validatePasswordStrength(password);
    if (!pwdCheck.valid) {
      return c.json(
        { error: 'Contraseña débil', message: pwdCheck.errors.join('. ') },
        400
      );
    }

    const { getUserByEmailFromDB } = await import('../utils/user-db');
    const existing = await getUserByEmailFromDB(emailLower);
    if (existing) {
      const { recordFailedRegistration } = await import('../utils/registration-rate-limit');
      await recordFailedRegistration(clientIP, true);
      const { logAuditEvent } = await import('../utils/audit-log');
      await logAuditEvent({
        userId: 'anonymous',
        action: 'REGISTER_DUPLICATE_EMAIL',
        resourceType: 'authentication',
        ipAddress: clientIP,
        userAgent: getSafeUserAgent(c),
        details: { email: emailLower },
      });
      return c.json(
        {
          error: 'Email ya registrado',
          code: 'email_already_registered',
          message:
            'Este correo ya tiene una cuenta en PodoAdmin. Inicia sesión o recupera tu contraseña si la olvidaste.',
        },
        409
      );
    }

    let clinicId: string | null = null;
    if (clinicCode?.trim()) {
      const { database } = await import('../database');
      const { clinics: clinicsTable } = await import('../database/schema');
      const { eq } = await import('drizzle-orm');
      const [clinicRow] = await database
        .select({ clinicId: clinicsTable.clinicId })
        .from(clinicsTable)
        .where(eq(clinicsTable.clinicCode, clinicCode.trim()))
        .limit(1);
      if (!clinicRow) {
        const { recordFailedRegistration } = await import('../utils/registration-rate-limit');
        await recordFailedRegistration(clientIP, true);
        return c.json(
          { error: 'Código de clínica inválido', message: 'El código de clínica no existe.' },
          400
        );
      }
      clinicId = clinicRow.clinicId;
    }

    const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date().toISOString();
    const { hashPassword } = await import('../utils/password');
    const hashedPwd = await hashPassword(password);

    const { database } = await import('../database');
    const { createdUsers } = await import('../database/schema');

    const emailVerificationRequired = (await import('../utils/email-verification')).isEmailVerificationRequired();

    await database.insert(createdUsers).values({
      id,
      userId: id,
      email: emailLower,
      name,
      role: 'podiatrist',
      clinicId,
      password: hashedPwd,
      createdAt: now,
      updatedAt: now,
      createdBy: 'public_register',
      isBlocked: false,
      isBanned: false,
      isEnabled: false,
      emailVerified: !emailVerificationRequired,
      termsAccepted: termsAccepted === true,
      termsAcceptedAt: termsAccepted ? now : null,
      privacyPolicyAccepted: privacyPolicyAccepted === true,
      privacyPolicyAcceptedAt: privacyPolicyAccepted ? now : null,
      registrationSource: 'public',
      assignedPodiatristIds: null,
      googleId: null,
      appleId: null,
      oauthProvider: null,
      avatarUrl: null,
      mustChangePassword: false,
    } as typeof createdUsers.$inferInsert);

    let emailSent = false;
    if (emailVerificationRequired) {
      const { createVerificationToken } = await import('../utils/email-verification');
      const token = await createVerificationToken(id);
      const verificationUrl = `${getAppBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;

      const { sendVerificationEmail } = await import('../utils/email-service');
      emailSent = await sendVerificationEmail(emailLower, name, verificationUrl);
    } else {
      console.info('[register:dev] Cuenta creada con email auto-verificado (sin envío de correo):', emailLower);
    }

    const { recordSuccessfulRegistration } = await import('../utils/registration-rate-limit');
    await recordSuccessfulRegistration(clientIP);

    const { logAuditEvent } = await import('../utils/audit-log');
    await logAuditEvent({
      userId: id,
      action: 'REGISTER_PUBLIC',
      resourceType: 'user',
      resourceId: id,
      ipAddress: clientIP,
      userAgent: getSafeUserAgent(c),
      details: { email: emailLower, clinicId, emailSent, termsAccepted },
    });

    const { recordSecurityMetric } = await import('../utils/security-metrics');
    await recordSecurityMetric({
      metricType: 'registration_success',
      userId: id,
      ipAddress: clientIP,
      details: { email: emailLower, emailSent },
    });

    if (!emailSent && emailVerificationRequired && process.env.NODE_ENV === 'production') {
      console.error('[register] Usuario creado pero email de verificación no enviado:', emailLower);
    }

    if (emailVerificationRequired) {
      return genericResponse();
    }

    return c.json({
      success: true,
      message: 'Cuenta creada. Inicia sesión y activa la prueba en Facturación (SMS + tarjeta).',
      emailVerificationSkipped: true,
    });
  } catch (error) {
    console.error('Error en registro público:', error);
    const { recordFailedRegistration } = await import('../utils/registration-rate-limit');
    await recordFailedRegistration(clientIP, true);
    return c.json({ error: 'Error interno', message: 'No se pudo completar el registro' }, 500);
  }
});

/**
 * POST /api/auth/verify-email
 * Verifica el email usando el token de verificación
 */
authRoutes.post('/verify-email', async (c) => {
  try {
    const rawBody = await c.req.json().catch(() => ({}));
    const validation = validateData(verifyEmailSchema, rawBody);

    if (!validation.success) {
      return c.json(
        {
          error: 'Token inválido',
          message: validation.error,
          issues: validation.issues,
        },
        400
      );
    }

    const { token } = validation.data;

    const { verifyEmailToken } = await import('../utils/email-verification');
    const verificationResult = await verifyEmailToken(token);

    if (!verificationResult.valid || !verificationResult.userId) {
      // Registrar métrica de verificación fallida
      const { recordSecurityMetric } = await import('../utils/security-metrics');
      const { getClientIP } = await import('../utils/ip-tracking');
      await recordSecurityMetric({
        metricType: 'email_verification_failed',
        ipAddress: getClientIP(c.req.raw.headers),
        details: { 
          reason: verificationResult.error || 'invalid_or_expired_token',
          tokenProvided: !!token 
        },
      });
      return c.json(
        {
          error: 'Token inválido',
          message: verificationResult.error || 'El token de verificación no es válido o ha expirado',
        },
        400
      );
    }

    const userId = verificationResult.userId;

    // Activar cuenta en base de datos
    const { database } = await import('../database');
    const { createdUsers } = await import('../database/schema');
    const { eq } = await import('drizzle-orm');

    await database
      .update(createdUsers)
      .set({
        emailVerified: true,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(createdUsers.id, userId));

    const userResult = await database
      .select()
      .from(createdUsers)
      .where(eq(createdUsers.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return c.json({ error: 'Usuario no encontrado' }, 404);
    }

    const user = userResult[0];

    // Registrar evento de auditoría
    const { logAuditEvent } = await import('../utils/audit-log');
    const { getClientIP } = await import('../utils/ip-tracking');
    await logAuditEvent({
      userId: user.userId,
      action: 'EMAIL_VERIFIED',
      resourceType: 'user',
      resourceId: userId,
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
      details: { email: user.email },
    });

    // Registrar métrica
    const { recordSecurityMetric } = await import('../utils/security-metrics');
    await recordSecurityMetric({
      metricType: 'email_verified',
      userId: user.userId,
      ipAddress: getClientIP(c.req.raw.headers),
      details: { email: user.email },
    });

    const verifyClientIP = getClientIP(c.req.raw.headers);
    if (user.role === 'clinic_admin' || user.role === 'podiatrist') {
      const { tryGrantIpTrialForUser } = await import('../utils/ip-trial-service');
      await tryGrantIpTrialForUser(user.userId, user.role, user.clinicId, verifyClientIP);
    }

    const { checkIpTrialEligibility } = await import('../utils/ip-trial-service');
    const trialEligibility =
      user.role === 'clinic_admin' || user.role === 'podiatrist'
        ? await checkIpTrialEligibility(verifyClientIP, user.role)
        : undefined;

    return c.json({
      success: true,
      message:
        'Email verificado correctamente. Inicia sesión y completa el pago en Facturación o espera la aprobación de un super administrador.',
      trialEligibility,
      user: {
        id: user.userId,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Error verificando email:', error);
    // Registrar métrica de verificación fallida
    const { recordSecurityMetric } = await import('../utils/security-metrics');
    const { getClientIP } = await import('../utils/ip-tracking');
    await recordSecurityMetric({
      metricType: 'email_verification_failed',
      ipAddress: getClientIP(c.req.raw.headers),
      details: { reason: 'internal_error', error: error instanceof Error ? error.message : 'Unknown error' },
    });
    return c.json(
      {
        error: 'Error interno',
        message: 'Ocurrió un error al verificar el email',
      },
      500
    );
  }
});

/**
 * POST /api/auth/clear-ip-block
 * Limpia el bloqueo de una IP (solo en desarrollo)
 * Útil para testing y desarrollo
 * 
 * Uso: POST /api/auth/clear-ip-block
 * Body: { "ipAddress": "opcional" } - Si no se proporciona, limpia la IP del request
 */
if (process.env.NODE_ENV !== 'production') {
  authRoutes.use('/clear-ip-block', requireNonProductionDev);
  authRoutes.post('/clear-ip-block', async (c) => {
    try {
      const rawBody = await c.req.json().catch(() => ({}));
      const requestedIP = rawBody.ipAddress;
      const clientIP = getClientIP(c.req.raw.headers);
      const ipAddress = requestedIP || clientIP;
      
      const { clearIPBlock } = await import('../utils/registration-rate-limit');
      await clearIPBlock(ipAddress);
      
      return c.json({
        success: true,
        message: `Bloqueo de IP ${ipAddress} limpiado correctamente`,
        ipAddress,
      });
    } catch (error: any) {
      console.error('Error limpiando bloqueo de IP:', error);
      return c.json(
        {
          error: 'Error interno',
          message: 'No se pudo limpiar el bloqueo de IP',
        },
        500
      );
    }
  });
  
  // También permitir GET para facilitar el uso
  authRoutes.get('/clear-ip-block', async (c) => {
    try {
      const requestedIP = c.req.query('ip');
      const clientIP = getClientIP(c.req.raw.headers);
      const ipAddress = requestedIP || clientIP;
      
      const { clearIPBlock } = await import('../utils/registration-rate-limit');
      await clearIPBlock(ipAddress);
      
      return c.json({
        success: true,
        message: `Bloqueo de IP ${ipAddress} limpiado correctamente`,
        ipAddress,
      });
    } catch (error: any) {
      console.error('Error limpiando bloqueo de IP:', error);
      return c.json(
        {
          error: 'Error interno',
          message: 'No se pudo limpiar el bloqueo de IP',
        },
        500
      );
    }
  });
}

/**
 * GET /api/auth/google/url
 */
authRoutes.get('/google/url', async (c) => {
  const { buildGoogleAuthUrl, isGoogleOAuthConfigured } = await import('../utils/google-oauth');
  if (!isGoogleOAuthConfigured()) {
    return c.json({ success: false, configured: false, error: 'Google OAuth no configurado' });
  }
  const state = crypto.randomUUID();
  const url = buildGoogleAuthUrl(state);
  return c.json({ success: true, configured: true, url, state });
});

/**
 * POST /api/auth/google/callback
 * Body: { code: string }
 */
authRoutes.post('/google/callback', async (c) => {
  try {
    const { exchangeGoogleCode, fetchGoogleUserInfo, isGoogleOAuthConfigured } = await import('../utils/google-oauth');
    if (!isGoogleOAuthConfigured()) {
      return c.json({ error: 'Google OAuth no configurado' }, 503);
    }

    const body = await c.req.json().catch(() => ({}));
    const code = typeof body.code === 'string' ? body.code : '';
    if (!code) return c.json({ error: 'Código requerido' }, 400);

    const tokens = await exchangeGoogleCode(code);
    const googleUser = await fetchGoogleUserInfo(tokens.access_token);
    if (!googleUser.email_verified) {
      return c.json({ error: 'Email de Google no verificado' }, 400);
    }

    const emailLower = googleUser.email.toLowerCase().trim();
    const { database } = await import('../database');
    const { createdUsers } = await import('../database/schema');
    const { eq, or } = await import('drizzle-orm');

    let rows = await database
      .select()
      .from(createdUsers)
      .where(or(eq(createdUsers.googleId, googleUser.sub), eq(createdUsers.email, emailLower)))
      .limit(1);

    let row = rows[0];
    if (!row) {
      return c.json(
        {
          error: 'user_not_found',
          message: 'No hay cuenta con este correo de Google. Solicita acceso a tu clínica o regístrate.',
        },
        404
      );
    }

    const now = new Date().toISOString();
    if (!row.googleId) {
      await database
        .update(createdUsers)
        .set({
          googleId: googleUser.sub,
          oauthProvider: 'google',
          avatarUrl: googleUser.picture ?? row.avatarUrl,
          emailVerified: true,
          updatedAt: now,
        })
        .where(eq(createdUsers.id, row.id));
      row = { ...row, googleId: googleUser.sub, oauthProvider: 'google' };
    }

    if (row.isBlocked || row.isBanned) {
      return c.json({ error: 'account_disabled', message: 'Cuenta no disponible' }, 403);
    }
    if (isAdministrativelyBlocked(row.isEnabled, row.disabledAt)) {
      return c.json({ error: 'account_disabled', message: 'Cuenta en período de baja' }, 403);
    }

    const { accessToken, refreshToken } = await generateTokenPair({
      userId: row.userId,
      email: row.email,
      role: row.role,
      clinicId: row.clinicId ?? undefined,
    });

    const isProd = isProduction({ NODE_ENV: process.env.NODE_ENV }, c.req.raw.headers);
    const accessCookie = formatCookie('access-token', accessToken, getAccessTokenCookieOptions(isProd));
    const refreshCookie = formatCookie('refresh-token', refreshToken, getRefreshTokenCookieOptions(isProd));
    c.header('Set-Cookie', [accessCookie, refreshCookie].join(', '));

    const googleClientIP = getClientIP(c.req.raw.headers);
    const { tryGrantIpTrialForUser } = await import('../utils/ip-trial-service');
    await tryGrantIpTrialForUser(row.userId, row.role, row.clinicId, googleClientIP);

    const access = await resolveSystemAccess(row.userId, row.role);

    const { logAuditEvent } = await import('../utils/audit-log');
    await logAuditEvent({
      userId: row.userId,
      action: 'LOGIN_GOOGLE',
      resourceType: 'authentication',
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
      clinicId: row.clinicId ?? undefined,
      details: { email: emailLower },
    });

    return c.json({
      success: true,
      user: {
        id: row.userId,
        email: row.email,
        name: row.name,
        role: row.role,
        clinicId: row.clinicId ?? undefined,
        avatarUrl: googleUser.picture ?? row.avatarUrl,
        systemAccess: access.granted,
        accessReason: access.reason,
      },
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    return c.json({ error: 'Error en autenticación con Google' }, 500);
  }
});

export default authRoutes;
