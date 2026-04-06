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
 * Genera una plantilla HTML para el email
 */
function generateEmailTemplate(
  subject: string,
  body: string,
  attemptCount: number,
  blocked: boolean
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .content { padding: 20px; }
        .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${subject}</h1>
        </div>
        <div class="content">
          <p>${body}</p>
          <div class="warning">
            <strong>Detalles:</strong><br>
            Intentos fallidos: ${attemptCount}<br>
            Estado: ${blocked ? 'Bloqueado temporalmente (15 minutos)' : 'Activo'}
          </div>
          <p>Si no fuiste tú quien intentó acceder, por favor:</p>
          <ul>
            <li>Cambia tu contraseña inmediatamente</li>
            <li>Revisa la seguridad de tu cuenta</li>
            <li>Contacta al soporte si sospechas actividad no autorizada</li>
          </ul>
        </div>
        <div class="footer">
          <p>Este es un email automático de seguridad. Por favor, no respondas a este mensaje.</p>
        </div>
      </div>
    </body>
    </html>
  `;
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
