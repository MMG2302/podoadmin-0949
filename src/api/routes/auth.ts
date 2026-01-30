import { Hono } from 'hono';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';
import { requireAuth } from '../middleware/auth';
import { formatCookie, getAccessTokenCookieOptions, getRefreshTokenCookieOptions, createDeleteCookie, isProduction } from '../utils/cookies';
import { checkRateLimitD1, recordFailedAttemptD1, clearFailedAttemptsD1, getFailedAttemptCountD1 } from '../utils/rate-limit-d1';
import { sendFailedLoginNotification, shouldSendNotification } from '../utils/email-notifications';
import { validateData, loginSchema, registerSchema, verifyEmailSchema } from '../utils/validation';
import { escapeHtml, sanitizeEmail } from '../utils/sanitization';
import { getClientIP, createRateLimitIdentifier, isIPWhitelisted, getIPWhitelist } from '../utils/ip-tracking';
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
          },
          429 // Too Many Requests
        );
      }

      // Si hay delay requerido
      return c.json(
        {
          error: 'Demasiados intentos',
          message: `Demasiados intentos fallidos. Por favor, espera ${delayMinutes > 1 ? `${delayMinutes} minutos` : `${delaySeconds} segundos`} antes de intentar nuevamente.`,
          retryAfter: delaySeconds,
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
      // Verificar si es un usuario OAuth (sin contraseña)
      if (!dbUser.password && (dbUser.oauthProvider === 'google' || dbUser.oauthProvider === 'apple')) {
        return c.json(
          {
            error: 'Cuenta OAuth',
            message: `Esta cuenta está vinculada con ${dbUser.oauthProvider === 'google' ? 'Google' : 'Apple'}. Por favor, inicia sesión usando el botón de ${dbUser.oauthProvider === 'google' ? 'Google' : 'Apple'}.`,
            requiresOAuth: true,
            oauthProvider: dbUser.oauthProvider,
          },
          400
        );
      }

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
        userAgent: c.req.header('User-Agent') || undefined,
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
      userAgent: c.req.header('User-Agent') || undefined,
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
      userAgent: c.req.header('User-Agent') || undefined,
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
 * POST /api/auth/register
 * Registro público con todas las medidas de seguridad
 */
authRoutes.post('/register', async (c) => {
  try {
    const rawBody = await c.req.json().catch(() => ({}));
    const validation = validateData(registerSchema, rawBody);

    if (!validation.success) {
      // Extraer mensajes de error más específicos
      const errorMessages = validation.issues.map(issue => {
        const path = issue.path.join('.');
        return issue.message;
      });
      
      // No contar errores de validación como intentos fallidos reales
      // Estos son errores del usuario, no intentos maliciosos
      
      return c.json(
        {
          error: 'Datos inválidos',
          message: errorMessages[0] || validation.error || 'Por favor, verifica los datos ingresados',
          errors: errorMessages,
          issues: validation.issues,
        },
        400
      );
    }

    const { email, password, name, termsAccepted, captchaToken, clinicCode } = validation.data;

    if (!termsAccepted) {
      // No contar como intento fallido real (es un error de validación del usuario)
      return c.json(
        {
          error: 'Términos no aceptados',
          message: 'Debes aceptar los términos y condiciones para registrarte',
        },
        400
      );
    }

    const clientIP = getClientIP(c.req.raw.headers);

    // Verificar rate limiting de registro
    const {
      checkRegistrationRateLimit,
      recordFailedRegistration,
      recordSuccessfulRegistration,
    } = await import('../utils/registration-rate-limit');
    const rateLimitCheck = await checkRegistrationRateLimit(clientIP);

    if (!rateLimitCheck.allowed) {
      if (rateLimitCheck.blockedUntil) {
        const blockedUntilDate = new Date(rateLimitCheck.blockedUntil);
        return c.json(
          {
            error: 'IP bloqueada',
            message: `Tu IP está bloqueada hasta ${blockedUntilDate.toLocaleString()}. Por favor, intenta más tarde.`,
            blockedUntil: rateLimitCheck.blockedUntil,
          },
          429
        );
      }

      const delayMinutes = Math.ceil((rateLimitCheck.delay || 0) / 60000);
      const delaySeconds = Math.ceil((rateLimitCheck.delay || 0) / 1000);
      
      // Mensaje personalizado basado en la razón del rate limit
      const errorMessage = rateLimitCheck.reason || `Has alcanzado el límite de registros. Por favor, espera ${delayMinutes} minutos.`;
      
      return c.json(
        {
          error: 'Demasiados registros',
          message: errorMessage,
          retryAfter: delaySeconds,
        },
        429
      );
    }

    // Verificar CAPTCHA (solo si está configurado)
    const { getCaptchaConfig, verifyCaptcha } = await import('../utils/captcha');
    const captchaConfig = getCaptchaConfig();

    if (captchaConfig) {
      // CAPTCHA está configurado, es obligatorio
      if (!captchaToken || captchaToken.trim().length === 0) {
        // CAPTCHA faltante SÍ cuenta como intento fallido (es un error de seguridad)
        await recordFailedRegistration(clientIP, true);
        // Registrar métrica de registro fallido
        const { recordSecurityMetric } = await import('../utils/security-metrics');
        await recordSecurityMetric({
          metricType: 'registration_failed',
          ipAddress: clientIP,
          details: { email: email.toLowerCase(), reason: 'captcha_missing' },
        });
        return c.json(
          {
            error: 'CAPTCHA requerido',
            message: 'Por favor, completa el CAPTCHA para continuar. Si no ves el widget de CAPTCHA, verifica la configuración.',
            requiresCaptcha: true,
          },
          400
        );
      }

      const captchaResult = await verifyCaptcha(captchaToken, captchaConfig);
      if (!captchaResult.success) {
        // CAPTCHA inválido SÍ cuenta como intento fallido (es un error de seguridad)
        await recordFailedRegistration(clientIP, true);
        const { recordSecurityMetric } = await import('../utils/security-metrics');
        await recordSecurityMetric({
          metricType: 'captcha_failed',
          ipAddress: clientIP,
          details: { email: email.toLowerCase(), source: 'registration' },
        });

        return c.json(
          {
            error: 'CAPTCHA inválido',
            message: 'El CAPTCHA no se pudo verificar. Por favor, intenta nuevamente.',
            requiresCaptcha: true,
          },
          400
        );
      }

      const { recordSecurityMetric } = await import('../utils/security-metrics');
      await recordSecurityMetric({
        metricType: 'captcha_passed',
        ipAddress: clientIP,
        details: { email: email.toLowerCase(), source: 'registration' },
      });
    } else {
      // CAPTCHA no está configurado, permitir registro sin CAPTCHA
      // Esto es útil para desarrollo o cuando no se ha configurado aún
      console.log('CAPTCHA no configurado, permitiendo registro sin CAPTCHA');
    }

    // Validar dominio de email
    const { validateEmailDomain } = await import('../utils/email-domains');
    const emailValidation = validateEmailDomain(email);
    if (!emailValidation.valid) {
      // No contar como intento fallido real (es un error de validación del usuario)
      // Registrar métrica de registro fallido
      const { recordSecurityMetric } = await import('../utils/security-metrics');
      await recordSecurityMetric({
        metricType: 'registration_failed',
        ipAddress: clientIP,
        details: { email: email.toLowerCase(), reason: 'invalid_email_domain', error: emailValidation.error },
      });
      return c.json(
        {
          error: 'Email inválido',
          message: emailValidation.error,
        },
        400
      );
    }

    const emailLower = email.toLowerCase().trim();

    // Verificar que el email no exista en DB (sin revelar si existe)
    const { emailExistsInDB } = await import('../utils/user-db');
    const emailExists = await emailExistsInDB(emailLower);

    if (emailExists) {
      // No contar como intento fallido real (es un caso normal, no malicioso)
      // Registrar métrica de registro fallido
      const { recordSecurityMetric } = await import('../utils/security-metrics');
      await recordSecurityMetric({
        metricType: 'registration_failed',
        ipAddress: clientIP,
        details: { email: emailLower, reason: 'email_already_exists' },
      });
      // No revelar que el email existe (seguridad)
      return c.json(
        {
          success: true,
          message: 'Si el email existe, recibirás un correo de verificación',
        },
        200
      );
    }

    // Validar que la contraseña no esté vacía
    if (!password || password.trim().length === 0) {
      // No contar como intento fallido real (es un error de validación del usuario)
      const { recordSecurityMetric } = await import('../utils/security-metrics');
      await recordSecurityMetric({
        metricType: 'registration_failed',
        ipAddress: clientIP,
        details: { email: emailLower, reason: 'password_empty' },
      });
      return c.json(
        {
          error: 'Contraseña requerida',
          message: 'La contraseña es obligatoria',
        },
        400
      );
    }

    // Validar fortaleza de contraseña
    const { validatePasswordStrength } = await import('../utils/password');
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      // No contar como intento fallido real (es un error de validación del usuario)
      // Registrar métrica de registro fallido
      const { recordSecurityMetric } = await import('../utils/security-metrics');
      await recordSecurityMetric({
        metricType: 'registration_failed',
        ipAddress: clientIP,
        details: { email: emailLower, reason: 'weak_password', errors: passwordValidation.errors },
      });
      return c.json(
        {
          error: 'Contraseña débil',
          message: passwordValidation.errors[0],
          errors: passwordValidation.errors,
        },
        400
      );
    }

    // Hash de contraseña
    const { hashPassword } = await import('../utils/password');
    let hashedPassword: string;
    try {
      hashedPassword = await hashPassword(password);
    } catch (hashError: any) {
      console.error('Error hasheando contraseña:', hashError);
      await recordFailedRegistration(clientIP);
      const { recordSecurityMetric } = await import('../utils/security-metrics');
      await recordSecurityMetric({
        metricType: 'registration_failed',
        ipAddress: clientIP,
        details: { email: emailLower, reason: 'password_hash_error', error: hashError.message },
      });
      return c.json(
        {
          error: 'Error procesando contraseña',
          message: 'No se pudo procesar la contraseña. Por favor, intenta nuevamente.',
        },
        500
      );
    }

    // Generar IDs
    const userId = `user_public_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userInternalId = `user_created_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Crear usuario en base de datos
    const { database } = await import('../database');
    const { createdUsers } = await import('../database/schema');

    await database.insert(createdUsers).values({
      id: userInternalId,
      userId: userId,
      email: emailLower,
      name: name,
      role: 'podiatrist',
      clinicId: clinicCode || null,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
      createdBy: 'public_registration',
      isBlocked: false,
      isBanned: false,
      isEnabled: false, // Deshabilitado hasta verificar email
      emailVerified: false,
      termsAccepted: true,
      termsAcceptedAt: now,
      registrationSource: 'public',
    });

    // Generar token de verificación
    const { createVerificationToken } = await import('../utils/email-verification');
    const verificationToken = await createVerificationToken(userInternalId);

    // Enviar email de verificación
    const { sendEmail } = await import('../utils/email-service');
    const baseUrl = process.env.VITE_BASE_URL || 'http://localhost:5173';
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

    const emailSent = await sendEmail({
      to: emailLower,
      subject: 'Verifica tu cuenta de PodoAdmin',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1a1a; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .button { display: inline-block; padding: 12px 24px; background-color: #1a1a1a; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bienvenido a PodoAdmin</h1>
            </div>
            <div class="content">
              <p>Hola ${name},</p>
              <p>Gracias por registrarte en PodoAdmin. Para activar tu cuenta, por favor verifica tu dirección de email haciendo clic en el siguiente botón:</p>
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verificar Email</a>
              </p>
              <p>O copia y pega este enlace en tu navegador:</p>
              <p style="word-break: break-all; color: #6b7280;">${verificationUrl}</p>
              <p><strong>Este enlace expirará en 24 horas.</strong></p>
              <p>Si no creaste esta cuenta, puedes ignorar este email.</p>
            </div>
            <div class="footer">
              <p>Este es un email automático, por favor no respondas.</p>
              <p>&copy; ${new Date().getFullYear()} PodoAdmin. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    // Registrar evento de auditoría
    const { logAuditEvent } = await import('../utils/audit-log');
    await logAuditEvent({
      userId: userId,
      action: 'REGISTER_ATTEMPT',
      resourceType: 'user',
      resourceId: userInternalId,
      ipAddress: clientIP,
      userAgent: c.req.header('User-Agent') || undefined,
      details: {
        email: emailLower,
        name: name,
        emailSent,
        clinicCode: clinicCode || null,
      },
    });

    // Registrar métrica
    const { recordSecurityMetric } = await import('../utils/security-metrics');
    await recordSecurityMetric({
      metricType: 'registration_success',
      userId: userId,
      ipAddress: clientIP,
      details: { email: emailLower, name: name, clinicCode: clinicCode || null },
    });

    await recordSuccessfulRegistration(clientIP);

    return c.json({
      success: true,
      message: 'Si el email no está registrado, recibirás un correo de verificación. Por favor, revisa tu bandeja de entrada.',
    });
  } catch (error: any) {
    console.error('Error en registro:', error);
    console.error('Stack trace:', error.stack);

    const { getClientIP } = await import('../utils/ip-tracking');
    const clientIP = getClientIP(c.req.raw.headers);
    const { recordFailedRegistration } = await import('../utils/registration-rate-limit');
    // Error interno SÍ cuenta como intento fallido (es un error del sistema)
    await recordFailedRegistration(clientIP, true);

    // Registrar métrica de registro fallido
    const { recordSecurityMetric } = await import('../utils/security-metrics');
    await recordSecurityMetric({
      metricType: 'registration_failed',
      ipAddress: clientIP,
      details: { 
        reason: 'internal_error', 
        error: error.message || 'Unknown error',
        stack: error.stack || undefined,
      },
    });

    // Si es un error de validación que no se capturó, devolver mensaje más específico
    if (error.message && (error.message.includes('password') || error.message.includes('contraseña'))) {
      return c.json(
        {
          error: 'Error de validación',
          message: error.message || 'Error al validar los datos. Por favor, verifica que todos los campos estén completos.',
        },
        400
      );
    }

    return c.json(
      {
        error: 'Error interno',
        message: 'Ocurrió un error al procesar el registro. Por favor, intenta más tarde.',
      },
      500
    );
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
      userAgent: c.req.header('User-Agent') || undefined,
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
