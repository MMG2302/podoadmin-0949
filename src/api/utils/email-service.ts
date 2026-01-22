/**
 * Servicio de email unificado
 * Soporta múltiples proveedores: Resend, SendGrid, AWS SES
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailService {
  sendEmail(options: EmailOptions): Promise<boolean>;
}

/**
 * Implementación con Resend
 */
class ResendEmailService implements EmailService {
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@podoadmin.com';
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.apiKey) {
      console.warn('Resend API key no configurada');
      return false;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text || options.html.replace(/<[^>]*>/g, ''),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Error enviando email con Resend:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en servicio Resend:', error);
      return false;
    }
  }
}

/**
 * Implementación con SendGrid
 */
class SendGridEmailService implements EmailService {
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || '';
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@podoadmin.com';
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.apiKey) {
      console.warn('SendGrid API key no configurada');
      return false;
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: options.to }],
          }],
          from: { email: this.fromEmail },
          subject: options.subject,
          content: [
            {
              type: 'text/html',
              value: options.html,
            },
            ...(options.text ? [{
              type: 'text/plain',
              value: options.text,
            }] : []),
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Error enviando email con SendGrid:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en servicio SendGrid:', error);
      return false;
    }
  }
}

/**
 * Implementación con AWS SES
 */
class AWSEmailService implements EmailService {
  private accessKeyId: string;
  private secretAccessKey: string;
  private region: string;
  private fromEmail: string;

  constructor() {
    this.accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
    this.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.fromEmail = process.env.AWS_SES_FROM_EMAIL || 'noreply@podoadmin.com';
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.accessKeyId || !this.secretAccessKey) {
      console.warn('AWS credentials no configuradas');
      return false;
    }

    // AWS SES requiere firma de requests (AWS Signature Version 4)
    // Para simplificar, aquí solo mostramos la estructura
    // En producción, usar AWS SDK o implementar firma manual
    console.warn('AWS SES requiere implementación de firma de requests');
    console.log('Email que se enviaría:', {
      to: options.to,
      subject: options.subject,
      from: this.fromEmail,
    });

    return false; // Implementación pendiente
  }
}

/**
 * Servicio de email mock (para desarrollo)
 */
class MockEmailService implements EmailService {
  async sendEmail(options: EmailOptions): Promise<boolean> {
    console.log('📧 [MOCK EMAIL]');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('HTML:', options.html.substring(0, 200) + '...');
    return true;
  }
}

/**
 * Obtiene el servicio de email configurado
 */
function getEmailService(): EmailService {
  // Prioridad: Resend > SendGrid > AWS SES > Mock
  if (process.env.RESEND_API_KEY) {
    return new ResendEmailService();
  }
  
  if (process.env.SENDGRID_API_KEY) {
    return new SendGridEmailService();
  }
  
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return new AWSEmailService();
  }

  // En desarrollo, usar mock
  return new MockEmailService();
}

/**
 * Envía un email usando el servicio configurado
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const service = getEmailService();
  return service.sendEmail(options);
}

/**
 * Envía notificación de intentos fallidos de login
 */
export async function sendFailedLoginNotificationEmail(
  email: string,
  attemptCount: number,
  blocked: boolean
): Promise<boolean> {
  const subject = blocked
    ? '⚠️ Tu cuenta ha sido bloqueada temporalmente'
    : `⚠️ Múltiples intentos de login fallidos (${attemptCount})`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${blocked ? '🔒 Cuenta Bloqueada' : '⚠️ Alerta de Seguridad'}</h1>
        </div>
        <div class="content">
          <p>Hola,</p>
          <p>Hemos detectado ${attemptCount} intento(s) fallido(s) de inicio de sesión en tu cuenta.</p>
          
          ${blocked ? `
            <div class="warning">
              <strong>Tu cuenta ha sido bloqueada temporalmente por 15 minutos</strong>
              <p>Por seguridad, tu cuenta está bloqueada. Podrás intentar iniciar sesión nuevamente después del bloqueo.</p>
            </div>
          ` : `
            <div class="warning">
              <strong>Si no fuiste tú, cambia tu contraseña inmediatamente</strong>
              <p>Si reconoces estos intentos, puedes ignorar este mensaje.</p>
            </div>
          `}
          
          <p><strong>Recomendaciones de seguridad:</strong></p>
          <ul>
            <li>Usa una contraseña segura y única</li>
            <li>No compartas tus credenciales</li>
            <li>Si no reconoces estos intentos, contacta al soporte</li>
          </ul>
        </div>
        <div class="footer">
          <p>Este es un email automático, por favor no respondas.</p>
          <p>&copy; ${new Date().getFullYear()} PodoAdmin. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
  });
}
