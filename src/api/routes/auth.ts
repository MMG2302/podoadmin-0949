import { Hono } from 'hono';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/authorization';
import { formatCookie, getAccessTokenCookieOptions, getRefreshTokenCookieOptions, createDeleteCookie, isProduction } from '../utils/cookies';
import { checkRateLimitD1, recordFailedAttemptD1, clearFailedAttemptsD1, getFailedAttemptCountD1 } from '../utils/rate-limit-d1';
import { sendFailedLoginNotification, shouldSendNotification } from '../utils/email-notifications';
import { validateData, loginSchema, verifyEmailSchema, forgotPasswordSchema, resetPasswordSchema } from '../utils/validation';
import { escapeHtml, sanitizeEmail } from '../utils/sanitization';
import { getClientIP, createRateLimitIdentifier, isIPWhitelisted, getIPWhitelist } from '../utils/ip-tracking';
import { getSafeUserAgent } from '../utils/request-headers';
import type { User } from '../../web/contexts/auth-context';
import { getUserByIdFromDB } from '../utils/user-db';

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

    // Verificar que el email esté verificado (para usuarios registrados públicamente)
    if (dbUser && dbUser.registrationSource === 'public') {
      if (!dbUser.emailVerified) {
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
    if (matchedUser.user.isEnabled === false) {
      return c.json(
        {
          error: 'Cuenta deshabilitada',
          message: 'Tu cuenta está deshabilitada. Contacta al administrador.',
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
      },
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

  if (dbUser.isBanned || dbUser.isBlocked || dbUser.isEnabled === false) {
    return c.json(
      {
        error: 'Cuenta no disponible',
        message: 'Tu cuenta no está disponible',
      },
      403
    );
  }

  return c.json({
    success: true,
    user: {
      id: dbUser.userId,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      clinicId: dbUser.clinicId || undefined,
      assignedPodiatristIds: dbUser.assignedPodiatristIds ?? undefined,
    },
  });
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
    if (!dbUser || dbUser.isBanned || dbUser.isBlocked || dbUser.isEnabled === false) {
      return c.json(
        {
          error: 'Cuenta no disponible',
          message: 'Tu cuenta no está disponible',
        },
        403
      );
    }

    // Generar nuevo par de tokens
    const { generateTokenPair } = await import('../utils/jwt');
    const { accessToken, refreshToken: newRefreshToken } = await generateTokenPair({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      clinicId: payload.clinicId,
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

    const { verifyPasswordResetToken } = await import('../utils/password-reset');
    const result = await verifyPasswordResetToken(token);

    if (!result.valid || !result.userId) {
      const { recordSecurityMetric } = await import('../utils/security-metrics');
      await recordSecurityMetric({
        metricType: 'password_reset_failed',
        ipAddress: getClientIP(c.req.raw.headers),
        details: { reason: result.error || 'invalid_token' },
      });
      return c.json(
        {
          error: 'Token inválido o expirado',
          message: result.error || 'El enlace de recuperación no es válido o ha expirado. Solicita uno nuevo.',
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
      .where(eq(createdUsers.id, result.userId))
      .limit(1);

    if (userRow.length === 0) {
      return c.json({ error: 'Usuario no encontrado' }, 404);
    }

    const hashedPassword = await hashPassword(newPassword);
    await database
      .update(createdUsers)
      .set({
        password: hashedPassword,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(createdUsers.id, result.userId));

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
    const requestId = c.req.param('id');
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

    const baseUrl = process.env.VITE_BASE_URL || process.env.ALLOWED_ORIGINS?.split(',')[0]?.trim() || 'http://localhost:5173';
    const resetUrl = baseUrl.startsWith('http') ? `${baseUrl}/reset-password?token=${token}` : `https://${baseUrl}/reset-password?token=${token}`;

    const { sendPasswordResetEmail } = await import('../utils/email-service');
    await sendPasswordResetEmail(userRow.email, userRow.name, resetUrl);

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
      details: { requestId, targetEmail: userRow.email },
    });

    return c.json({
      success: true,
      message: 'Solicitud aprobada. Se ha enviado el enlace al correo del usuario. También puedes copiarlo y enviarlo manualmente.',
      resetUrl,
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
    const requestId = c.req.param('id');
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
        isEnabled: true,
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

    return c.json({
      success: true,
      message: 'Email verificado correctamente. Ya puedes iniciar sesión.',
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

export default authRoutes;
