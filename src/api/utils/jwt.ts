import { SignJWT, jwtVerify } from 'jose';

function encodeSecret(name: 'JWT_SECRET' | 'REFRESH_TOKEN_SECRET'): Uint8Array {
  const v = process.env[name];
  if (!v || v.length < 32) {
    throw new Error(`${name} no válida; debe existir antes de usar JWT (validate-env debería haber fallado al arrancar)`);
  }
  return new TextEncoder().encode(v);
}

let _access: Uint8Array | undefined;
let _refresh: Uint8Array | undefined;

function getAccessSecret(): Uint8Array {
  _access ??= encodeSecret('JWT_SECRET');
  return _access;
}

function getRefreshSecret(): Uint8Array {
  _refresh ??= encodeSecret('REFRESH_TOKEN_SECRET');
  return _refresh;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'super_admin' | 'clinic_admin' | 'admin' | 'podiatrist' | 'receptionist';
  clinicId?: string;
  iat?: number;
  exp?: number;
  type?: 'access' | 'refresh'; // Tipo de token
}

/**
 * Genera un access token JWT (corto, 60 minutos)
 */
export async function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'type'>): Promise<string> {
  const token = await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    clinicId: payload.clinicId,
    type: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('60m') // Access token expira en 60 minutos
    .sign(getAccessSecret());

  return token;
}

/**
 * Genera un refresh token JWT (largo, 7 días)
 */
export async function generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'type'>): Promise<string> {
  const token = await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    clinicId: payload.clinicId,
    type: 'refresh',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Refresh token expira en 7 días
    .sign(getRefreshSecret());

  return token;
}

/**
 * Genera ambos tokens (access y refresh)
 */
export async function generateTokenPair(
  payload: Omit<JWTPayload, 'iat' | 'exp' | 'type'>
): Promise<{ accessToken: string; refreshToken: string }> {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken(payload),
  ]);

  return { accessToken, refreshToken };
}

/**
 * Verifica y decodifica un access token JWT
 */
export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAccessSecret());
    const typedPayload = payload as JWTPayload;
    
    // Verificar que sea un access token
    if (typedPayload.type !== 'access') {
      return null;
    }
    
    return typedPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Verifica y decodifica un refresh token JWT
 */
export async function verifyRefreshToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getRefreshSecret());
    const typedPayload = payload as JWTPayload;
    
    // Verificar que sea un refresh token
    if (typedPayload.type !== 'refresh') {
      return null;
    }
    
    return typedPayload;
  } catch (error) {
    return null;
  }
}

/**
 * @deprecated Usar generateAccessToken en su lugar
 * Mantenido para compatibilidad temporal
 */
export async function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  return generateAccessToken(payload);
}

/**
 * @deprecated Usar verifyAccessToken en su lugar
 * Mantenido para compatibilidad temporal
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  return verifyAccessToken(token);
}

/**
 * Extrae el token del header Authorization
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}
