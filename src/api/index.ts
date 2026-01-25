import { Hono } from 'hono';
import { cors } from "hono/cors";
import { authMiddleware } from './middleware/auth';
import { csrfProtection } from './middleware/csrf';
import { cspMiddleware } from './middleware/csp';
import { sanitizationMiddleware } from './middleware/sanitization';
import authRoutes from './routes/auth';
import oauthRoutes from './routes/oauth';
import usersRoutes from './routes/users';
import patientsRoutes from './routes/patients';
import csrfRoutes from './routes/csrf';
import testXssRoutes from './routes/test-xss';
import twoFactorRoutes from './routes/two-factor-auth';
import metricsRoutes from './routes/security-metrics';
import auditLogRoutes from './routes/audit-logs';

const app = new Hono()
  .basePath('api');

// CORS configuration
// IMPORTANTE: No se puede usar origin: "*" con credentials: true
// Los navegadores rechazan esta combinación por seguridad
const getAllowedOrigins = (): string[] => {
  const origins: string[] = [];
  
  // Orígenes de desarrollo (localhost con diferentes puertos)
  origins.push('http://localhost:5173'); // Vite dev server por defecto
  origins.push('http://localhost:3000');
  origins.push('http://localhost:8080');
  origins.push('http://127.0.0.1:5173');
  origins.push('http://127.0.0.1:3000');
  origins.push('http://127.0.0.1:8080');
  
  // Orígenes de producción desde variables de entorno
  const allowedOrigins = process.env.ALLOWED_ORIGINS;
  if (allowedOrigins) {
    origins.push(...allowedOrigins.split(',').map(o => o.trim()));
  }
  
  return origins;
};

// Función para validar origen dinámicamente
const originValidator = (origin: string | null): boolean => {
  // Permitir solicitudes sin origen (mismo origen, ej: Postman, curl)
  if (!origin) {
    return true;
  }
  
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
};

app.use(cors({
  origin: originValidator,
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));

// Content Security Policy y headers de seguridad
// Debe aplicarse temprano para proteger todas las respuestas
app.use('*', cspMiddleware);

// Sanitización de inputs (debe aplicarse antes de procesar datos)
app.use('*', sanitizationMiddleware);

// Aplicar middleware de autenticación a todas las rutas
// Esto adjunta el usuario al contexto si hay un token válido
// IMPORTANTE: Esto NO protege las rutas, solo adjunta el usuario si hay token
// Cada ruta debe usar requireAuth() explícitamente para protección
app.use('*', authMiddleware);

// Rutas públicas (no requieren autenticación)
app.get('/ping', (c) => c.json({ message: `Pong! ${Date.now()}` }));

// Ruta para obtener token CSRF (debe estar antes de la protección CSRF)
app.route('/csrf', csrfRoutes);

// Rutas de prueba (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
  app.route('/test', testXssRoutes);
}

// Rutas de autenticación
// Login es público y no requiere CSRF (el usuario aún no está autenticado)
// Logout requiere autenticación pero puede requerir CSRF
app.route('/auth', authRoutes);

// Rutas OAuth (públicas, no requieren CSRF)
app.route('/auth/oauth', oauthRoutes);

// Aplicar protección CSRF a todas las rutas que modifican estado
// EXCEPCIONES: /auth/login y /auth/refresh no requieren CSRF
app.use('*', async (c, next) => {
  const path = c.req.path;
  const method = c.req.method;
  
  // Excluir login y refresh de protección CSRF
  if (
    (path === '/api/auth/login' && method === 'POST') ||
    (path === '/api/auth/refresh' && method === 'POST')
  ) {
    return next();
  }
  return csrfProtection(c, next);
});

// Rutas protegidas - requieren autenticación y autorización
app.route('/users', usersRoutes);
app.route('/patients', patientsRoutes);
app.route('/2fa', twoFactorRoutes);
app.route('/security-metrics', metricsRoutes);
app.route('/audit-logs', auditLogRoutes);

// IMPORTANTE: Todas las rutas que manejen datos sensibles DEBEN usar:
// 1. requireAuth() - para verificar que el usuario está autenticado
// 2. requireRole() o requirePermission() - para verificar permisos específicos
// 3. Validación adicional de ownership/clinicId cuando sea necesario

export default app;