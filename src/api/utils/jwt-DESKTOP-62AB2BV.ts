import { SignJWT, jwtVerify } from 'jose';

// Secret keys para firmar JWT - en producción deben estar en variables de entorno
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-key-change-in-production-min-32-chars'
);

const REFRESH_TOKEN_SECRET = new TextEncoder().encode(
  process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret-key-change-in-production-min-32-chars'
);

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
    .sign(JWT_SECRET);

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
    .sign(REFRESH_TOKEN_SECRET);

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
    const { payload } = await jwtVerify(token, JWT_SECRET);
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
    const { payload } = await jwtVerify(token, REFRESH_TOKEN_SECRET);
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
