/**
 * Sistema de notificaciones por email para intentos de login fallidos
 * 
 * Usa el servicio de email unificado (Resend, SendGrid, AWS SES, o Mock)
 */
import { sendFailedLoginNotificationEmail } from './email-service';

/**
 * Envía una notificación por email sobre intentos fallidos de login
 * 
 * @param email Email del usuario
 * @param attemptCount Número de intentos fallidos
 * @param blocked Si el usuario está bloqueado
 */
export async function sendFailedLoginNotification(
  email: string,
  attemptCount: number,
  blocked: boolean = false
): Promise<void> {
  try {
    // Usar el servicio de email unificado
    await sendFailedLoginNotificationEmail(email, attemptCount, blocked);
  } catch (error) {
    console.error('Error enviando notificación por email:', error);
    // No lanzar error para no interrumpir el flujo de login
  }
}

/**
 * Determina si se debe enviar una notificación basado en el número de intentos
 */
export function shouldSendNotification(attemptCount: number): boolean {
  // Enviar notificación en puntos críticos
  return (
    attemptCount === 3 || // Primer umbral
    attemptCount === 5 || // Segundo umbral
    attemptCount === 10 || // Bloqueo
    attemptCount > 10 // Intentos adicionales después del bloqueo
  );
}
