import bcrypt from 'bcryptjs';

/**
 * Utilidades para hashing y verificación de contraseñas
 * Usa bcryptjs para compatibilidad con Cloudflare Workers
 */

const SALT_ROUNDS = 12; // Cost factor recomendado para producción

/**
 * Hashea una contraseña usando bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifica una contraseña contra un hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Valida la fortaleza de una contraseña
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('La contraseña debe tener al menos 12 caracteres');
  }

  if (password.length > 128) {
    errors.push('La contraseña no puede tener más de 128 caracteres');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una letra mayúscula');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una letra minúscula');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Debe contener al menos un número');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Debe contener al menos un carácter especial');
  }

  // Verificar contraseñas comunes
  const commonPasswords = [
    'password',
    '12345678',
    'qwerty',
    'abc123',
    'password123',
    'admin123',
  ];
  if (commonPasswords.some((common) => password.toLowerCase().includes(common))) {
    errors.push('La contraseña es demasiado común');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
