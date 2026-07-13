/**
 * Cliente API para hacer solicitudes al servidor
 * Incluye manejo automático de tokens de autenticación (cookies HTTP-only) y CSRF
 * 
 * Los tokens ahora se almacenan en cookies HTTP-only con flags Secure
 * No se pueden leer desde JavaScript por seguridad
 */

const API_BASE_URL = '/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  httpStatus?: number;
  // Campos adicionales que pueden venir en respuestas de error (ej: rate limiting)
  retryAfter?: number;
  blockedUntil?: number;
  attemptCount?: number;
  isBlocked?: boolean;
  blockDurationMinutes?: number;
  requiresCaptcha?: boolean;
}

// Variable para evitar múltiples renovaciones simultáneas
let refreshPromise: Promise<boolean> | null = null;

/**
 * Intenta renovar el access token usando el refresh token
 */
async function refreshAccessToken(): Promise<boolean> {
  // Si ya hay una renovación en curso, esperarla
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Importante para enviar cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return true;
      }

      // Si el refresh falla, limpiar estado
      if (response.status === 401) {
        localStorage.removeItem('podoadmin_user');
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }

      return false;
    } catch (error) {
      console.error('Error renovando token:', error);
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Obtiene el token CSRF de la cookie
 */
function getCsrfToken(): string | null {
  // Leer de la cookie csrf-token
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf-token' && value) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Obtiene o genera un token CSRF del servidor
 */
let csrfTokenPromise: Promise<string> | null = null;

async function ensureCsrfToken(): Promise<string | null> {
  // Si ya tenemos un token en la cookie, usarlo
  const existingToken = getCsrfToken();
  if (existingToken) {
    return existingToken;
  }

  // Si ya hay una solicitud en curso, esperarla
  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }

  // Generar nuevo token
  csrfTokenPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/csrf/token`, {
        method: 'GET',
        credentials: 'include', // Importante para recibir cookies
      });

      if (!response.ok) {
        console.error('Error obteniendo token CSRF');
        return null;
      }

      const data = await response.json();
      
      // El token también se establece como cookie automáticamente
      // Pero lo guardamos del body por si acaso
      if (data.success && data.token) {
        return data.token;
      }

      // Si no viene en el body, intentar leer de la cookie
      return getCsrfToken();
    } catch (error) {
      console.error('Error obteniendo token CSRF:', error);
      return null;
    } finally {
      csrfTokenPromise = null;
    }
  })();

  return csrfTokenPromise;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Worker de Miniflare reiniciando: devuelve HTML de error de Vite en lugar de JSON. */
function isWorkerUnavailable(status: number, rawText: string, contentType: string | null): boolean {
  const trimmed = rawText.trimStart();
  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html") || trimmed.startsWith("<")) {
    return true;
  }
  if (contentType?.includes("text/html")) {
    return true;
  }
  // Errores JSON del API (p. ej. 500 con cuerpo JSON) no son caídas del worker.
  const trimmedStart = rawText.trimStart();
  if (trimmedStart.startsWith("{") || trimmedStart.startsWith("[")) {
    return false;
  }
  return status >= 500 && status <= 599;
}

async function fetchApiResponse(
  url: string,
  options: RequestInit,
  maxAttempts = 4
): Promise<{ response: Response; rawText: string }> {
  let lastResponse: Response | null = null;
  let lastText = "";

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(url, options);
    const rawText = await response.text();
    lastResponse = response;
    lastText = rawText;

    const unavailable = isWorkerUnavailable(
      response.status,
      rawText,
      response.headers.get("content-type")
    );

    if (!unavailable || attempt === maxAttempts - 1) {
      return { response, rawText };
    }

    // Esperar a que Miniflare termine de recargar el worker (dev local).
    await sleep(1200 * (attempt + 1));
  }

  return { response: lastResponse!, rawText: lastText };
}

/**
 * Realiza una solicitud HTTP al servidor con autenticación automática y CSRF
 * Los tokens se envían automáticamente en cookies HTTP-only
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  _retry401 = true
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const method = options.method || 'GET';

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Agregar token CSRF para métodos que modifican estado
  // EXCEPCIÓN: login y refresh no requieren CSRF
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  const isStateChanging = stateChangingMethods.includes(method);
  const isLogin = endpoint === '/auth/login' && method === 'POST';
  const isRefresh = endpoint === '/auth/refresh' && method === 'POST';
  const isPublicAuth =
    (endpoint === '/auth/register' && method === 'POST') ||
    (endpoint === '/auth/verify-email' && method === 'POST') ||
    (endpoint === '/auth/forgot-password' && method === 'POST') ||
    (endpoint === '/auth/reset-password' && method === 'POST');

  if (isStateChanging && !isLogin && !isRefresh && !isPublicAuth) {
    const csrfToken = await ensureCsrfToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    } else {
      console.warn('No se pudo obtener token CSRF');
    }
  }

  try {
    const { response, rawText } = await fetchApiResponse(url, {
      ...options,
      headers,
      credentials: 'include', // CRÍTICO: Necesario para enviar cookies HTTP-only
    });

    let data: any = {};
    try {
      if (rawText) data = JSON.parse(rawText);
    } catch {
      // Body vacío o no JSON: data queda {}
    }

    const isHtmlBody = isWorkerUnavailable(
      response.status,
      rawText,
      response.headers.get("content-type")
    );

    // Si el access token expiró (401), intentar renovar con refresh token
    if (response.status === 401 && !isLogin && !isRefresh && endpoint !== '/auth/refresh' && _retry401) {
      const refreshed = await refreshAccessToken();
      
      if (refreshed) {
        // Reintentar la solicitud original con el nuevo token
        return apiRequest<T>(endpoint, options, false);
      } else {
        // Si la renovación falla, limpiar y redirigir al login
        localStorage.removeItem('podoadmin_user');
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return {
          success: false,
          error: data.error || 'No autorizado',
          message: data.message || 'Tu sesión expiró. Vuelve a iniciar sesión.',
          httpStatus: 401,
          data,
        };
      }
    }

    // Si hay error de CSRF, intentar obtener nuevo token y reintentar una vez
    if (
      response.status === 403 &&
      (data.error === 'Token CSRF faltante' || data.error === 'Token CSRF inválido')
    ) {
      // Limpiar token CSRF y obtener uno nuevo
      csrfTokenPromise = null;
      const newCsrfToken = await ensureCsrfToken();
      
      if (newCsrfToken && isStateChanging) {
        // Reintentar la solicitud con el nuevo token
        headers['X-CSRF-Token'] = newCsrfToken;
        const retryResponse = await fetch(url, {
          ...options,
          headers,
          credentials: 'include',
        });
        
        const retryData = await retryResponse.json();
        
        if (!retryResponse.ok) {
          return {
            success: false,
            error: retryData.error || 'Error en la solicitud',
            message: retryData.message,
            retryAfter: retryData.retryAfter,
            blockedUntil: retryData.blockedUntil,
            attemptCount: retryData.attemptCount,
            requiresCaptcha: retryData.requiresCaptcha,
            data: retryData,
          };
        }
        
        return {
          success: true,
          data: retryData,
        };
      }
    }

    if (response.status === 402 && (data.error === 'subscription_inactive' || data.error === 'access_not_granted')) {
      window.dispatchEvent(
        new CustomEvent('subscription:inactive', {
          detail: { billingPath: data.billingPath || '/settings?tab=billing' },
        })
      );
    }

    if (!response.ok) {
      const fallbackError =
        response.status === 401
          ? 'No autorizado'
          : response.status === 402
            ? 'access_not_granted'
            : response.status >= 500
              ? 'Error del servidor'
              : 'Error en la solicitud';
      return {
        success: false,
        error: data.error || fallbackError,
        message:
          data.message ||
          (isHtmlBody
            ? 'El servidor local está reiniciando. Espera unos segundos y pulsa Reintentar, o reinicia con npm run dev.'
            : undefined),
        httpStatus: response.status,
        data, // Incluir body completo para que el frontend pueda leer data.message
        // Pasar campos de rate limiting para login
        retryAfter: data.retryAfter,
        blockedUntil: data.blockedUntil,
        attemptCount: data.attemptCount,
        isBlocked: data.isBlocked,
        blockDurationMinutes: data.blockDurationMinutes,
        requiresCaptcha: data.requiresCaptcha,
      };
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Error en solicitud API:', error);
    return {
      success: false,
      error: 'Error de conexión',
      message: 'No se pudo conectar con el servidor',
    };
  }
}

/**
 * Métodos de conveniencia para diferentes tipos de solicitudes HTTP
 */
export const api = {
  get: <T = any>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  
  post: <T = any>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  
  put: <T = any>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  
  delete: <T = any>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
  
  patch: <T = any>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
};
