/**
 * Rutas que la SPA sabe renderizar.
 *
 * **Es un espejo manual de los `<Route>` de `src/web/App.tsx` y
 * `src/web/pages/dashboard.tsx`.** No se puede derivar en tiempo de compilación: el Worker
 * corre en Node/workerd y no puede importar los `.tsx` de React.
 *
 * Por qué existe: antes, `not_found_handling: "single-page-application"` devolvía
 * index.html con **200** para cualquier ruta, incluida `/loquesea`. Ahora el asset handler
 * responde solo por archivos reales y todo lo demás cae en el Worker, que usa esta lista
 * para decidir entre servir la SPA (200) o un 404 de verdad.
 *
 * ⚠️ Si se agrega un `<Route>` en la SPA y no se agrega acá, esa pantalla deja de cargar:
 * el visitante recibe un 404 real. Al tocar el router, tocar también este archivo.
 */

/** Rutas exactas. El orden no importa; se consulta por igualdad. */
const EXACT = new Set<string>([
  '/',

  // --- Públicas y de sesión (App.tsx) ---
  '/login',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/change-password',
  '/terms',
  '/privacy',
  '/faq',
  '/landing',
  '/auth/google/callback',

  // --- Enlaces de WhatsApp al paciente, autenticados por token en la query ---
  '/reserva/confirmar',
  '/reserva/cancelar',
  '/reserva/reagendar',
  '/reserva/opinion',
  '/reserva/agendar',

  // --- Panel (dashboard.tsx). Se renderizan según el rol, pero la ruta existe
  //     para todos: quien no tenga permiso ve el redirect de ProtectedRoute,
  //     no un 404 del servidor. ---
  '/users',
  '/messages',
  '/support',
  '/audit-log',
  '/security-metrics',
  '/sponsored-announcements',
  '/patients',
  '/sessions',
  '/calendar',
  '/checkout',
  '/clinic',
  '/whatsapp-messages',
  '/whatsapp-campaigns',
  '/clinical-tools',
  '/billing',
  '/settings',
  '/notifications',
]);

/**
 * Prefijos de las rutas con parámetro (`/patients/:id`, `/sessions/:id`). Cualquier cosa
 * bajo ellos es válida: el id lo valida la propia pantalla, no el servidor.
 */
const PREFIXES = ['/patients/', '/sessions/'] as const;

/** Normaliza `/settings/` → `/settings` para que la barra final no falsee la comparación. */
function normalize(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
  return pathname;
}

export function isKnownSpaRoute(pathname: string): boolean {
  const path = normalize(pathname);
  if (EXACT.has(path)) return true;
  return PREFIXES.some((prefix) => path.startsWith(prefix) && path.length > prefix.length);
}

/** Solo para pruebas y para poder listarlas en un script de verificación. */
export const SPA_ROUTES_FOR_TESTS = { EXACT, PREFIXES };
