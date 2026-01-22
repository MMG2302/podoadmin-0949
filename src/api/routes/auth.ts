import { Hono } from 'hono';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';
import { requireAuth } from '../middleware/auth';
import { formatCookie, getAccessTokenCookieOptions, getRefreshTokenCookieOptions, createDeleteCookie, isProduction } from '../utils/cookies';
import { checkRateLimit, recordFailedAttempt, clearFailedAttempts, getFailedAttemptCount } from '../utils/rate-limit';
import { sendFailedLoginNotification, shouldSendNotification } from '../utils/email-notifications';
import { validateData, loginSchema } from '../utils/validation';
import { escapeHtml, sanitizeEmail } from '../utils/sanitization';
import { getClientIP, createRateLimitIdentifier, isIPWhitelisted, getIPWhitelist } from '../utils/ip-tracking';
import type { User } from '../../web/contexts/auth-context';
import { getAllUsersWithCredentials, getUserStatus } from '../../web/lib/storage';

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
    if (!isWhitelisted) {
      rateLimitCheck = checkRateLimit(identifier);
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

    // Obtener usuarios (mock + creados)
    const allUsers = getAllUsersWithCredentials();
    const matchedUser = allUsers.find(
      (u) => u.email.toLowerCase() === emailLower && u.password === password
    );

    if (!matchedUser) {
      // Registrar intento fallido (skip si IP está en whitelist)
      let failedAttempt = { count: 0 };
      let attemptCount = 0;
      
      if (!isWhitelisted) {
        failedAttempt = recordFailedAttempt(identifier);
        attemptCount = failedAttempt.count;
      }

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

      return c.json(
        {
          error: 'Credenciales inválidas',
          message: 'Email o contraseña incorrectos',
          attemptCount: isWhitelisted ? 0 : attemptCount, // No mostrar count si whitelisted
          retryAfter: nextDelay,
        },
        401
      );
    }

    // Verificar estados de cuenta en el servidor
    try {
      const userStatus = getUserStatus(matchedUser.user.id);

      if (userStatus.isBanned) {
        return c.json(
          {
            error: 'Cuenta baneada',
            message: 'Tu cuenta ha sido baneada permanentemente. Contacta al administrador.',
          },
          403
        );
      }

      if (userStatus.isBlocked) {
        return c.json(
          {
            error: 'Cuenta bloqueada',
            message: 'Tu cuenta está bloqueada temporalmente. Contacta al administrador.',
          },
          403
        );
      }

      if (userStatus.isEnabled === false) {
        return c.json(
          {
            error: 'Cuenta deshabilitada',
            message: 'Tu cuenta está deshabilitada. Contacta al administrador.',
          },
          403
        );
      }
    } catch (error) {
      console.error('Error verificando estado de usuario:', error);
      // Continuar con el login si hay error verificando estado
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
      clearFailedAttempts(identifier);
    }

    // Inicializar créditos si es necesario (esto debería moverse a la base de datos)
    // Por ahora lo mantenemos para compatibilidad
    const { initializeUserCredits } = await import('../../web/lib/storage');
    initializeUserCredits(matchedUser.user.id, matchedUser.user.role);

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
 */
authRoutes.post('/logout', requireAuth, async (c) => {
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

  // Obtener información completa del usuario
  const allUsers = getAllUsersWithCredentials();
  const matchedUser = allUsers.find((u) => u.user.id === user.userId);

  if (!matchedUser) {
    return c.json({ error: 'Usuario no encontrado' }, 404);
  }

  // Verificar estados de cuenta
  const userStatus = getUserStatus(matchedUser.user.id);

  if (userStatus.isBanned || userStatus.isBlocked || userStatus.isEnabled === false) {
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
      id: matchedUser.user.id,
      email: matchedUser.user.email,
      name: matchedUser.user.name,
      role: matchedUser.user.role,
      clinicId: matchedUser.user.clinicId,
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

    // Verificar estados de cuenta
    const userStatus = getUserStatus(payload.userId);
    if (userStatus.isBanned || userStatus.isBlocked || userStatus.isEnabled === false) {
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

export default authRoutes;
