import { Hono } from 'hono';
import { generateCsrfToken, formatCookie, getCsrfCookieOptions } from '../utils/csrf';

const csrfRoutes = new Hono();

/**
 * GET /api/csrf/token
 * Genera y devuelve un token CSRF
 * El token se establece como cookie y también se devuelve en el body
 * 
 * Esta es una ruta pública que no requiere autenticación
 */
csrfRoutes.get('/token', async (c) => {
  try {
    // Generar nuevo token CSRF
    const token = await generateCsrfToken();
    
    // Determinar si estamos en producción
    const isProduction = process.env.NODE_ENV === 'production' || 
                        c.req.header('x-forwarded-proto') === 'https';
    
    // Obtener opciones de cookie
    const cookieOptions = getCsrfCookieOptions(isProduction);
    
    // Formatear cookie
    const cookie = formatCookie('csrf-token', token, cookieOptions);
    
    // Establecer cookie en la respuesta
    c.header('Set-Cookie', cookie);
    
    // También devolver el token en el body para que el cliente pueda leerlo
    // (aunque también puede leerlo de la cookie)
    return c.json({
      success: true,
      token,
      message: 'Token CSRF generado correctamente',
    });
  } catch (error) {
    console.error('Error generando token CSRF:', error);
    return c.json(
      {
        error: 'Error interno',
        message: 'No se pudo generar el token CSRF',
      },
      500
    );
  }
});

export default csrfRoutes;
