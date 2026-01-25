import { env } from "cloudflare:workers";

/**
 * Configuración OAuth
 */
export interface OAuthConfig {
  google?: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  apple?: {
    clientId: string;
    teamId: string;
    keyId: string;
    privateKey: string;
    redirectUri: string;
  };
}

/**
 * Obtiene la configuración OAuth desde variables de entorno
 */
export function getOAuthConfig(): OAuthConfig {
  const baseUrl = env.VITE_BASE_URL || env.BASE_URL || 'http://localhost:5173';
  
  return {
    google: env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          redirectUri: `${baseUrl}/api/auth/oauth/google/callback`,
        }
      : undefined,
    apple: env.APPLE_CLIENT_ID && env.APPLE_TEAM_ID && env.APPLE_KEY_ID && env.APPLE_PRIVATE_KEY
      ? {
          clientId: env.APPLE_CLIENT_ID,
          teamId: env.APPLE_TEAM_ID,
          keyId: env.APPLE_KEY_ID,
          privateKey: env.APPLE_PRIVATE_KEY,
          redirectUri: `${baseUrl}/api/auth/oauth/apple/callback`,
        }
      : undefined,
  };
}

/**
 * Genera la URL de autorización de Google OAuth
 */
export function getGoogleAuthUrl(state?: string): string {
  const config = getOAuthConfig();
  if (!config.google) {
    throw new Error('Google OAuth no está configurado');
  }

  const params = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: config.google.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    ...(state && { state }),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Intercambia el código de autorización de Google por tokens
 */
export async function exchangeGoogleCode(code: string): Promise<{
  access_token: string;
  id_token: string;
  refresh_token?: string;
}> {
  const config = getOAuthConfig();
  if (!config.google) {
    throw new Error('Google OAuth no está configurado');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.google.redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error intercambiando código de Google: ${error}`);
  }

  return await response.json();
}

/**
 * Obtiene información del usuario desde Google usando el access token
 */
export async function getGoogleUserInfo(accessToken: string): Promise<{
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  picture?: string;
}> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error obteniendo información de Google: ${error}`);
  }

  return await response.json();
}

/**
 * Genera un JWT para Apple Sign In
 * Apple requiere un JWT firmado con la clave privada
 */
export async function generateAppleClientSecret(): Promise<string> {
  const config = getOAuthConfig();
  if (!config.apple) {
    throw new Error('Apple OAuth no está configurado');
  }

  // Apple requiere un JWT firmado con ES256
  // Nota: En Cloudflare Workers, necesitamos usar Web Crypto API
  // Para simplificar, asumimos que el JWT ya está generado o se genera externamente
  // En producción, esto debería usar una biblioteca JWT con soporte ES256
  
  const header = {
    alg: 'ES256',
    kid: config.apple.keyId,
  };

  const payload = {
    iss: config.apple.teamId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hora
    aud: 'https://appleid.apple.com',
    sub: config.apple.clientId,
  };

  // Nota: La firma real requiere la clave privada en formato PEM
  // Esto es un placeholder - en producción necesitarías una biblioteca JWT completa
  // como jose o similar que soporte ES256 con Web Crypto API
  
  throw new Error('Generación de JWT para Apple requiere implementación con biblioteca JWT (jose)');
}

/**
 * Genera la URL de autorización de Apple OAuth
 */
export function getAppleAuthUrl(state?: string): string {
  const config = getOAuthConfig();
  if (!config.apple) {
    throw new Error('Apple OAuth no está configurado');
  }

  const params = new URLSearchParams({
    client_id: config.apple.clientId,
    redirect_uri: config.apple.redirectUri,
    response_type: 'code',
    response_mode: 'form_post',
    scope: 'name email',
    ...(state && { state }),
  });

  return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
}

/**
 * Intercambia el código de autorización de Apple por tokens
 */
export async function exchangeAppleCode(
  code: string,
  clientSecret: string
): Promise<{
  access_token: string;
  id_token: string;
  refresh_token?: string;
}> {
  const config = getOAuthConfig();
  if (!config.apple) {
    throw new Error('Apple OAuth no está configurado');
  }

  const response = await fetch('https://appleid.apple.com/auth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.apple.clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.apple.redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error intercambiando código de Apple: ${error}`);
  }

  return await response.json();
}

/**
 * Decodifica el ID token de Apple para obtener información del usuario
 */
export function decodeAppleIdToken(idToken: string): {
  sub: string; // Apple user ID
  email?: string;
  email_verified?: boolean;
} {
  // Decodificar JWT (solo el payload, sin verificar firma)
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new Error('ID token de Apple inválido');
  }

  const payload = JSON.parse(
    atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
  );

  return {
    sub: payload.sub,
    email: payload.email,
    email_verified: payload.email_verified,
  };
}

/**
 * Tipo de proveedor OAuth
 */
export type OAuthProvider = 'google' | 'apple';

/**
 * Información del usuario desde OAuth
 */
export interface OAuthUserInfo {
  provider: OAuthProvider;
  providerId: string; // ID único del proveedor
  email: string;
  emailVerified: boolean;
  name: string;
  avatarUrl?: string;
}
