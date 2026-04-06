/**
 * Utilidades para manejar cookies HTTP-only con flags de seguridad
 */

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'Strict' | 'Lax' | 'None';
  path: string;
  maxAge?: number;
  expires?: Date;
  domain?: string;
}

/**
 * Determina si estamos en producción
 */
export function isProduction(env?: { NODE_ENV?: string }, headers?: Headers): boolean {
  if (env?.NODE_ENV === 'production') return true;
  if (headers?.get('x-forwarded-proto') === 'https') return true;
  return false;
}

/**
 * Genera opciones de cookie seguras para tokens de sesión
 */
export function getSecureCookieOptions(
  isProd: boolean = false,
  maxAgeDays: number = 7
): CookieOptions {
  return {
    httpOnly: true, // No accesible desde JavaScript (protección XSS)
    secure: isProd, // Solo HTTPS en producción
    sameSite: 'Lax', // Protección CSRF
    path: '/',
    maxAge: maxAgeDays * 24 * 60 * 60, // En segundos
  };
}

/**
 * Genera opciones de cookie para access tokens (cortos)
 */
export function getAccessTokenCookieOptions(isProd: boolean = false): CookieOptions {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60, // 60 minutos en segundos
  };
}

/**
 * Genera opciones de cookie para refresh tokens (largos)
 */
export function getRefreshTokenCookieOptions(isProd: boolean = false): CookieOptions {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'Lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 días en segundos
  };
}

/**
 * Formatea una cookie con las opciones especificadas
 */
export function formatCookie(name: string, value: string, options: CookieOptions): string {
  const parts: string[] = [`${name}=${encodeURIComponent(value)}`];
  
  if (options.path) {
    parts.push(`Path=${options.path}`);
  }
  
  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
  }
  
  if (options.expires) {
    parts.push(`Expires=${options.expires.toUTCString()}`);
  }
  
  if (options.domain) {
    parts.push(`Domain=${options.domain}`);
  }
  
  if (options.secure) {
    parts.push('Secure');
  }
  
  if (options.httpOnly) {
    parts.push('HttpOnly');
  }
  
  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  }
  
  return parts.join('; ');
}

/**
 * Extrae el valor de una cookie del header Cookie
 */
export function extractCookie(cookieHeader: string | null, cookieName: string): string | null {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').map(c => c.trim());
  for (const cookie of cookies) {
    const [name, value] = cookie.split('=');
    if (name === cookieName && value) {
      return decodeURIComponent(value);
    }
  }
  
  return null;
}

/**
 * Crea una cookie de eliminación (para logout)
 */
export function createDeleteCookie(name: string, path: string = '/'): string {
  return `${name}=; Path=${path}; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`;
}
