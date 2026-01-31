import { Hono } from 'hono';
import { database } from '../database';
import { createdUsers } from '../database/schema';
import { eq, or } from 'drizzle-orm';
import { generateTokenPair } from '../utils/jwt';
import { formatCookie, getAccessTokenCookieOptions, getRefreshTokenCookieOptions, isProduction } from '../utils/cookies';
import { getOAuthConfig, getGoogleAuthUrl, exchangeGoogleCode, getGoogleUserInfo, getAppleAuthUrl, exchangeAppleCode, decodeAppleIdToken, type OAuthUserInfo } from '../utils/oauth';
import { getClientIP } from '../utils/ip-tracking';
import { logAuditEvent } from '../utils/audit-log';
import { recordSecurityMetric } from '../utils/security-metrics';
import { SignJWT } from 'jose';

const oauthRoutes = new Hono();

/**
 * Genera un JWT para Apple Sign In usando jose
 */
async function generateAppleClientSecret(): Promise<string> {
  const config = getOAuthConfig();
  if (!config.apple) {
    throw new Error('Apple OAuth no está configurado');
  }

  // jose puede importar directamente desde PEM
  // La clave privada debe estar en formato PEM completo
  const privateKeyPem = config.apple.privateKey;
  
  // Importar la clave privada usando jose
  // jose soporta importación directa desde PEM
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    // Convertir PEM a ArrayBuffer
    Uint8Array.from(
      atob(
        privateKeyPem
          .replace(/-----BEGIN PRIVATE KEY-----/, '')
          .replace(/-----END PRIVATE KEY-----/, '')
          .replace(/\s/g, '')
      ),
      c => c.charCodeAt(0)
    ),
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    false,
    ['sign']
  );

  // Crear el JWT usando jose
  const jwt = await new SignJWT({
    iss: config.apple.teamId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hora
    aud: 'https://appleid.apple.com',
    sub: config.apple.clientId,
  })
    .setProtectedHeader({
      alg: 'ES256',
      kid: config.apple.keyId,
    })
    .sign(privateKey);

  return jwt;
}

/**
 * Crea o actualiza un usuario desde información OAuth
 */
async function createOrUpdateOAuthUser(
  userInfo: OAuthUserInfo,
  clientIP: string
): Promise<{ id: string; userId: string; email: string; name: string; role: string }> {
  const now = new Date().toISOString();
  
  // Buscar usuario existente por email o por provider ID
  const existingUser = await database
    .select()
    .from(createdUsers)
    .where(
      or(
        eq(createdUsers.email, userInfo.email.toLowerCase()),
        userInfo.provider === 'google'
          ? eq(createdUsers.googleId, userInfo.providerId)
          : eq(createdUsers.appleId, userInfo.providerId)
      )
    )
    .limit(1)
    .get();

  if (existingUser) {
    // Actualizar usuario existente con información OAuth
    const updateData: any = {
      updatedAt: now,
      emailVerified: userInfo.emailVerified || existingUser.emailVerified,
      oauthProvider: userInfo.provider,
      ...(userInfo.provider === 'google' && { googleId: userInfo.providerId }),
      ...(userInfo.provider === 'apple' && { appleId: userInfo.providerId }),
      ...(userInfo.avatarUrl && { avatarUrl: userInfo.avatarUrl }),
    };

    await database
      .update(createdUsers)
      .set(updateData)
      .where(eq(createdUsers.id, existingUser.id));

    return {
      id: existingUser.id,
      userId: existingUser.userId,
      email: existingUser.email,
      name: existingUser.name,
      role: existingUser.role,
    };
  }

  // Crear nuevo usuario
  const userId = crypto.randomUUID();
  const id = crypto.randomUUID();
  const defaultRole = 'podiatrist'; // Rol por defecto para usuarios OAuth

  const newUser = {
    id,
    userId,
    email: userInfo.email.toLowerCase(),
    name: userInfo.name,
    role: defaultRole,
    password: null, // Sin contraseña para OAuth
    createdAt: now,
    updatedAt: now,
    createdBy: null,
    isBlocked: false,
    isBanned: false,
    isEnabled: true,
    emailVerified: userInfo.emailVerified,
    termsAccepted: true, // OAuth implica aceptación implícita
    termsAcceptedAt: now,
    registrationSource: userInfo.provider,
    googleId: userInfo.provider === 'google' ? userInfo.providerId : null,
    appleId: userInfo.provider === 'apple' ? userInfo.providerId : null,
    oauthProvider: userInfo.provider,
    avatarUrl: userInfo.avatarUrl || null,
  };

  await database.insert(createdUsers).values(newUser);

  // Registrar evento de auditoría
  await logAuditEvent({
    userId: userId,
    action: 'REGISTER_OAUTH',
    resourceType: 'user',
    resourceId: id,
    ipAddress: clientIP,
    details: {
      provider: userInfo.provider,
      email: userInfo.email,
    },
  });

  // Registrar métrica
  await recordSecurityMetric({
    metricType: 'oauth_login',
    userId: userId,
    ipAddress: clientIP,
    details: { provider: userInfo.provider },
  });

  return {
    id,
    userId,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
  };
}

/**
 * GET /api/auth/oauth/google
 * Inicia el flujo de autenticación con Google
 */
oauthRoutes.get('/google', async (c) => {
  try {
    const config = getOAuthConfig();
    if (!config.google) {
      return c.json({ error: 'Google OAuth no está configurado' }, 503);
    }

    // Generar state para CSRF protection
    const state = crypto.randomUUID();
    
    // Guardar state en cookie (opcional, para verificación adicional)
    c.cookie('oauth_state', state, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 600, // 10 minutos
    });

    const authUrl = getGoogleAuthUrl(state);
    
    return c.redirect(authUrl);
  } catch (error: any) {
    console.error('Error iniciando Google OAuth:', error);
    return c.json({ error: 'Error iniciando autenticación con Google' }, 500);
  }
});

/**
 * GET /api/auth/oauth/google/callback
 * Callback de Google OAuth
 */
oauthRoutes.get('/google/callback', async (c) => {
  try {
    const config = getOAuthConfig();
    if (!config.google) {
      return c.json({ error: 'Google OAuth no está configurado' }, 503);
    }

    const code = c.req.query('code');
    const state = c.req.query('state');
    const error = c.req.query('error');

    if (error) {
      return c.redirect(`/login?error=oauth_error&message=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return c.redirect('/login?error=missing_code');
    }

    // Verificar state (opcional pero recomendado)
    const savedState = c.req.cookie('oauth_state');
    if (state && savedState && state !== savedState) {
      return c.redirect('/login?error=invalid_state');
    }

    // Intercambiar código por tokens
    const tokens = await exchangeGoogleCode(code);
    
    // Obtener información del usuario
    const googleUser = await getGoogleUserInfo(tokens.access_token);

    const clientIP = getClientIP(c.req.raw.headers);

    // Crear o actualizar usuario
    const userInfo: OAuthUserInfo = {
      provider: 'google',
      providerId: googleUser.id,
      email: googleUser.email,
      emailVerified: googleUser.verified_email,
      name: googleUser.name,
      avatarUrl: googleUser.picture,
    };

    const user = await createOrUpdateOAuthUser(userInfo, clientIP);

    // Verificar si el usuario está bloqueado o baneado
    const dbUser = await database
      .select()
      .from(createdUsers)
      .where(eq(createdUsers.id, user.id))
      .limit(1)
      .get();

    if (!dbUser || !dbUser.isEnabled) {
      return c.redirect('/login?error=account_disabled');
    }

    if (dbUser.isBlocked) {
      await recordSecurityMetric({
        metricType: 'blocked_user',
        userId: user.userId,
        ipAddress: clientIP,
      });
      return c.redirect('/login?error=account_blocked');
    }

    if (dbUser.isBanned) {
      await recordSecurityMetric({
        metricType: 'banned_user',
        userId: user.userId,
        ipAddress: clientIP,
      });
      return c.redirect('/login?error=account_banned');
    }

    // Generar tokens JWT
    const { accessToken, refreshToken } = await generateTokenPair({
      userId: user.userId,
      email: user.email,
      role: user.role,
      clinicId: dbUser.clinicId || undefined,
    });

    // Registrar login exitoso
    await logAuditEvent({
      userId: user.userId,
      action: 'LOGIN_OAUTH',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress: clientIP,
      userAgent: getSafeUserAgent(c),
      details: { provider: 'google' },
    });

    await recordSecurityMetric({
      metricType: 'successful_login',
      userId: user.userId,
      ipAddress: clientIP,
      details: { method: 'oauth_google' },
    });

    // Determinar si estamos en producción
    const isProd = isProduction(
      { NODE_ENV: process.env.NODE_ENV },
      c.req.raw.headers
    );

    // Configurar cookies HTTP-only (usar guiones para consistencia con el resto de la aplicación)
    const accessCookieOptions = getAccessTokenCookieOptions(isProd);
    const refreshCookieOptions = getRefreshTokenCookieOptions(isProd);
    const accessCookie = formatCookie('access-token', accessToken, accessCookieOptions);
    const refreshCookie = formatCookie('refresh-token', refreshToken, refreshCookieOptions);
    c.header('Set-Cookie', [accessCookie, refreshCookie].join(', '));

    // Limpiar cookie de state
    c.cookie('oauth_state', '', { maxAge: 0 });

    // Redirigir al dashboard
    return c.redirect('/');
  } catch (error: any) {
    console.error('Error en callback de Google OAuth:', error);
    return c.redirect(`/login?error=oauth_error&message=${encodeURIComponent(error.message || 'Error desconocido')}`);
  }
});

/**
 * GET /api/auth/oauth/apple
 * Inicia el flujo de autenticación con Apple
 */
oauthRoutes.get('/apple', async (c) => {
  try {
    const config = getOAuthConfig();
    if (!config.apple) {
      return c.json({ error: 'Apple OAuth no está configurado' }, 503);
    }

    // Generar state para CSRF protection
    const state = crypto.randomUUID();
    
    // Guardar state en cookie
    c.cookie('oauth_state', state, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 600, // 10 minutos
    });

    const authUrl = getAppleAuthUrl(state);
    
    return c.redirect(authUrl);
  } catch (error: any) {
    console.error('Error iniciando Apple OAuth:', error);
    return c.json({ error: 'Error iniciando autenticación con Apple' }, 500);
  }
});

/**
 * POST /api/auth/oauth/apple/callback
 * Callback de Apple OAuth (Apple usa POST)
 */
oauthRoutes.post('/apple/callback', async (c) => {
  try {
    const config = getOAuthConfig();
    if (!config.apple) {
      return c.json({ error: 'Apple OAuth no está configurado' }, 503);
    }

    const body = await c.req.formData();
    const code = body.get('code') as string;
    const state = body.get('state') as string;
    const error = body.get('error') as string;
    const appleUserDataString = body.get('user') as string; // JSON string con nombre (solo en primer login)

    if (error) {
      return c.redirect(`/login?error=oauth_error&message=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return c.redirect('/login?error=missing_code');
    }

    // Verificar state
    const savedState = c.req.cookie('oauth_state');
    if (state && savedState && state !== savedState) {
      return c.redirect('/login?error=invalid_state');
    }

    // Generar client secret JWT
    const clientSecret = await generateAppleClientSecret();

    // Intercambiar código por tokens
    const tokens = await exchangeAppleCode(code, clientSecret);
    
    // Decodificar ID token para obtener información del usuario
    const appleUser = decodeAppleIdToken(tokens.id_token);

    // Parsear información adicional del usuario (si está disponible)
    let userName = 'Usuario Apple';
    if (appleUserDataString) {
      try {
        const userData = JSON.parse(appleUserDataString);
        if (userData.name) {
          userName = `${userData.name.firstName || ''} ${userData.name.lastName || ''}`.trim() || 'Usuario Apple';
        }
      } catch {
        // Ignorar error de parsing
      }
    }

    const clientIP = getClientIP(c.req.raw.headers);

    // Crear o actualizar usuario
    const userInfo: OAuthUserInfo = {
      provider: 'apple',
      providerId: appleUser.sub,
      email: appleUser.email || `${appleUser.sub}@privaterelay.appleid.com`, // Apple puede usar email privado
      emailVerified: appleUser.email_verified !== false,
      name: userName,
    };

    const user = await createOrUpdateOAuthUser(userInfo, clientIP);

    // Verificar si el usuario está bloqueado o baneado
    const dbUser = await database
      .select()
      .from(createdUsers)
      .where(eq(createdUsers.id, user.id))
      .limit(1)
      .get();

    if (!dbUser || !dbUser.isEnabled) {
      return c.redirect('/login?error=account_disabled');
    }

    if (dbUser.isBlocked) {
      await recordSecurityMetric({
        metricType: 'blocked_user',
        userId: user.userId,
        ipAddress: clientIP,
      });
      return c.redirect('/login?error=account_blocked');
    }

    if (dbUser.isBanned) {
      await recordSecurityMetric({
        metricType: 'banned_user',
        userId: user.userId,
        ipAddress: clientIP,
      });
      return c.redirect('/login?error=account_banned');
    }

    // Generar tokens JWT
    const { accessToken, refreshToken } = await generateTokenPair({
      userId: user.userId,
      email: user.email,
      role: user.role,
      clinicId: dbUser.clinicId || undefined,
    });

    // Registrar login exitoso
    await logAuditEvent({
      userId: user.userId,
      action: 'LOGIN_OAUTH',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress: clientIP,
      userAgent: getSafeUserAgent(c),
      details: { provider: 'apple' },
    });

    await recordSecurityMetric({
      metricType: 'successful_login',
      userId: user.userId,
      ipAddress: clientIP,
      details: { method: 'oauth_apple' },
    });

    // Determinar si estamos en producción
    const isProd = isProduction(
      { NODE_ENV: process.env.NODE_ENV },
      c.req.raw.headers
    );

    // Configurar cookies HTTP-only (usar guiones para consistencia con el resto de la aplicación)
    const accessCookieOptions = getAccessTokenCookieOptions(isProd);
    const refreshCookieOptions = getRefreshTokenCookieOptions(isProd);
    const accessCookie = formatCookie('access-token', accessToken, accessCookieOptions);
    const refreshCookie = formatCookie('refresh-token', refreshToken, refreshCookieOptions);
    c.header('Set-Cookie', [accessCookie, refreshCookie].join(', '));

    // Limpiar cookie de state
    c.cookie('oauth_state', '', { maxAge: 0 });

    // Redirigir al dashboard
    return c.redirect('/');
  } catch (error: any) {
    console.error('Error en callback de Apple OAuth:', error);
    return c.redirect(`/login?error=oauth_error&message=${encodeURIComponent(error.message || 'Error desconocido')}`);
  }
});

export default oauthRoutes;
