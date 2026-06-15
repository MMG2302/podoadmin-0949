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
/** Umbrales alineados con rate limiting progresivo de login (3, 5, 10). */
export const LOGIN_NOTIFICATION_THRESHOLDS = [3, 5, 10] as const;

/**
 * Solo notificar en umbrales críticos (máx. 3 emails por oleada de intentos).
 * No re-notificar tras el bloqueo para evitar abuso de cuota del proveedor de email.
 */
export function shouldSendNotification(attemptCount: number): boolean {
  return (LOGIN_NOTIFICATION_THRESHOLDS as readonly number[]).includes(attemptCount);
}
