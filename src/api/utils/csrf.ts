// Secret key para CSRF - en producción debe estar en variables de entorno
const CSRF_SECRET = process.env.CSRF_SECRET || 'csrf-secret-key-change-in-production-min-32-chars';

/**
 * Genera bytes aleatorios usando Web Crypto API (compatible con Cloudflare Workers)
 */
async function generateRandomBytes(length: number): Promise<Uint8Array> {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return array;
}

/**
 * Convierte bytes a string hexadecimal
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Crea un hash SHA-256 usando Web Crypto API
 */
async function createHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Genera un token CSRF seguro
 * Usa el patrón double-submit cookie: el token se almacena en cookie y se envía en header
 */
export async function generateCsrfToken(): Promise<string> {
  // Generar token aleatorio (32 bytes = 64 caracteres hex)
  const randomBytes = await generateRandomBytes(32);
  const randomToken = bytesToHex(randomBytes);
  
  // Crear hash del token con el secreto para validación adicional
  const hash = await createHash(randomToken + CSRF_SECRET);
  
  // Combinar token y hash
  return `${randomToken}.${hash}`;
}

/**
 * Valida un token CSRF
 * Verifica que el token tenga el formato correcto y el hash sea válido
 */
export async function validateCsrfToken(token: string): Promise<boolean> {
  if (!token || typeof token !== 'string') {
    return false;
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 2) {
      return false;
    }

    const [randomToken, hash] = parts;
    
    // Verificar que el hash coincida
    const expectedHash = await createHash(randomToken + CSRF_SECRET);
    
    return hash === expectedHash;
  } catch (error) {
    return false;
  }
}

/**
 * Extrae el token CSRF del header X-CSRF-Token
 */
export function extractCsrfTokenFromHeader(header: string | null): string | null {
  if (!header) return null;
  return header.trim();
}

/**
 * Extrae el token CSRF de una cookie
 */
export function extractCsrfTokenFromCookie(cookieHeader: string | null, cookieName: string = 'csrf-token'): string | null {
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
 * Genera opciones de cookie seguras para CSRF
 */
export function getCsrfCookieOptions(isProduction: boolean = false): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'Strict' | 'Lax' | 'None';
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: false, // Debe ser false para que JavaScript pueda leerlo
    secure: isProduction, // Solo HTTPS en producción
    sameSite: 'Lax', // Protección CSRF con flexibilidad para navegación
    path: '/',
    maxAge: 60 * 60 * 24, // 24 horas
  };
}

/**
 * Formatea una cookie con las opciones especificadas
 */
export function formatCookie(
  name: string,
  value: string,
  options: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
    path?: string;
    maxAge?: number;
    domain?: string;
  } = {}
): string {
  const parts: string[] = [`${name}=${encodeURIComponent(value)}`];
  
  if (options.path) {
    parts.push(`Path=${options.path}`);
  }
  
  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
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
