import { database } from '../database';
import { createdUsers } from '../database/schema';
import { eq } from 'drizzle-orm';

/**
 * Utilidades para trabajar con usuarios en la base de datos
 */

/**
 * Obtiene un usuario por email desde la base de datos
 */
function safeJsonParseArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export async function getUserByEmailFromDB(email: string): Promise<{
  id: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  clinicId?: string | null;
  password: string;
  emailVerified: boolean;
  isEnabled: boolean;
  isBlocked: boolean;
  isBanned: boolean;
  registrationSource?: string | null;
  oauthProvider?: string | null;
  assignedPodiatristIds?: string[] | null;
} | null> {
  try {
    const emailLower = email.toLowerCase().trim();
    
    const result = await database
      .select()
      .from(createdUsers)
      .where(eq(createdUsers.email, emailLower))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const user = result[0];
    return {
      id: user.id,
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
      clinicId: user.clinicId,
      password: user.password,
      emailVerified: user.emailVerified || false,
      isEnabled: user.isEnabled || false,
      isBlocked: user.isBlocked || false,
      isBanned: user.isBanned || false,
      registrationSource: user.registrationSource || null,
      oauthProvider: user.oauthProvider || null,
      assignedPodiatristIds: user.assignedPodiatristIds ? safeJsonParseArray(user.assignedPodiatristIds) : undefined,
    };
  } catch (error) {
    console.error('Error obteniendo usuario por email:', error);
    return null;
  }
}

/**
 * Obtiene un usuario por userId desde la base de datos
 */
export async function getUserByIdFromDB(userId: string): Promise<{
  id: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  clinicId?: string | null;
  password: string;
  emailVerified: boolean;
  isEnabled: boolean;
  isBlocked: boolean;
  isBanned: boolean;
  registrationSource?: string | null;
  assignedPodiatristIds?: string[] | null;
} | null> {
  try {
    const result = await database
      .select()
      .from(createdUsers)
      .where(eq(createdUsers.userId, userId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const user = result[0];
    return {
      id: user.id,
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
      clinicId: user.clinicId,
      password: user.password,
      emailVerified: user.emailVerified || false,
      isEnabled: user.isEnabled || false,
      isBlocked: user.isBlocked || false,
      isBanned: user.isBanned || false,
      registrationSource: user.registrationSource || null,
      assignedPodiatristIds: user.assignedPodiatristIds ? safeJsonParseArray(user.assignedPodiatristIds) : undefined,
    };
  } catch (error) {
    console.error('Error obteniendo usuario por ID:', error);
    return null;
  }
}

/**
 * Verifica si un email existe en la base de datos
 */
export async function emailExistsInDB(email: string): Promise<boolean> {
  const user = await getUserByEmailFromDB(email);
  return user !== null;
}
