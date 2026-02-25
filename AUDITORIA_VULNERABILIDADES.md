# Auditoría de vulnerabilidades y riesgos de seguridad

**Fecha:** Febrero 2025  
**Alcance:** Repositorio podoadmin-0949 (API Hono + frontend React, Cloudflare Workers/D1)

Este documento lista las vulnerabilidades y situaciones de riesgo detectadas según los criterios solicitados. *Los secretos expuestos en código no se consideran críticos mientras el repo esté en GitHub privado; aun así deben corregirse antes de pasar a público o a producción.*

---

## 1. CORS (Configuración demasiado permisiva)

**Estado: ✅ NO VULNERABLE**

- **Detección:** En `src/api/index.ts` se usa `cors` de Hono con **validador de origen**, no `*`.
- **Implementación:** `getAllowedOrigins()` construye una whitelist (localhost en dev + `ALLOWED_ORIGINS` en prod). `originValidator` solo acepta orígenes de esa lista; `credentials: true` está correctamente usado con orígenes explícitos.
- **Recomendación:** Mantener en producción `ALLOWED_ORIGINS` con solo los dominios oficiales (sin wildcards).

---

## 2. Cookies de sesión / JWT en localStorage o sin HttpOnly/Secure/SameSite

**Estado: ⚠️ RIESGO PARCIAL**

**Backend (API):**
- Las cookies de sesión (access-token, refresh-token) están bien configuradas en `src/api/utils/cookies.ts`: **HttpOnly**, **Secure** en producción, **SameSite=Lax**.
- La cookie CSRF (`csrf-token`) no es HttpOnly por diseño (double-submit: el JS debe leerla para enviarla en `X-CSRF-Token`); es un patrón aceptable.

**Frontend (riesgo):**
- En `src/web/contexts/auth-context.tsx` se guarda el objeto **user** en `localStorage.setItem("podoadmin_user", JSON.stringify(...))`. El token JWT no está en localStorage (está en cookie), pero el objeto user contiene datos como `userId`, `email`, `role`, `clinicId`. En caso de **XSS**, un script podría leer esos datos.
- **Mitigación:** Reducir lo que se guarda en localStorage (p. ej. solo un flag “logged_in” o nada) y obtener el user siempre desde `/auth/verify`; o aceptar el riesgo bajo si la CSP y la sanitización reducen bien el XSS.

**Otros usos de localStorage:** `seed-data.ts`, `storage.ts`, `users-page.tsx`, `language-context.tsx` usan localStorage para datos de app/seed; no almacenan tokens. Revisar que en producción no se dependa de datos sensibles solo en localStorage.

---

## 3. CSRF en endpoints que usan cookies de sesión

**Estado: ✅ IMPLEMENTADO**

- Middleware CSRF en `src/api/middleware/csrf.ts`; tokens en `src/api/utils/csrf.ts` y endpoint `GET /api/csrf/token`.
- Excepciones correctas: `POST /api/auth/login` y `POST /api/auth/refresh` no requieren CSRF (usuario aún no autenticado o solo refresh).
- Cliente en `src/web/lib/api-client.ts` envía automáticamente `X-CSRF-Token` en mutaciones y reintenta si el token es inválido.

---

## 4. Autenticación / Autorización insuficiente

**Estado: ✅ EN GENERAL CORRECTO; revisar detalles**

- Rutas bajo `src/api/routes/` usan `requireAuth` (y donde aplica `requireRole` / `requirePermission`). Las rutas públicas son:
  - `GET /api/ping`
  - `GET /api/public/config` (dominio oficial y email de soporte; aceptable como público)
  - `GET /api/csrf/token`
  - `POST /api/auth/login`, `POST /api/auth/refresh`
  - Registro, forgot-password, reset-password, verify-email (flujos sin sesión)
- **Riesgo:** En entornos **no production** (`process.env.NODE_ENV !== 'production'`):
  - `POST/GET /api/auth/clear-ip-block` están **sin autenticación**. Cualquiera puede limpiar el bloqueo de IP de registro. Asegurar que en staging/preprod no se exponga sin control (o proteger con auth/admin).
  - `app.route('/test', testXssRoutes)` expone rutas de prueba XSS. Verificar que en staging no esté accesible desde internet si no se desea.

**Recomendación:** Documentar que `clear-ip-block` y `/api/test` son solo para desarrollo local y no deben estar en producción.

---

## 5. Inyección SQL / raw SQL sin parametrización

**Estado: ✅ SIN EVIDENCIA DE VULNERABILIDAD**

- No se encontraron usos de `sql\`...\`` con concatenación de entrada ni `db.query` con template strings.
- Uso de Drizzle ORM con schema y consultas parametrizadas (ej. `eq()`, `where()` con valores del schema). La guía `src/api/INPUT_SECURITY.md` desaconseja SQL crudo y recomienda placeholders si se usara `sql`.

**Recomendación:** Mantener la política de no introducir SQL crudo; para consultas complejas usar el query builder de Drizzle o `sql` con placeholders.

---

## 6. Exposición de datos sensibles en errores o logs

**Estado: ⚠️ VULNERABLE EN VARIOS PUNTOS**

- **Respuestas HTTP que exponen `error.message` o detalles de excepciones:**
  - `src/api/routes/clinics.ts` (aprox. línea 198):  
    `return c.json({ error: 'Error al crear clínica', message: error.message || 'Error desconocido' }, 400);`
  - `src/api/routes/users.ts`: respuestas 400/500 con `message: error.message` o `message: validation.error` (validation puede ser aceptable; `error.message` no).
  - `src/api/routes/appointments.ts` (aprox. líneas 284-285):  
    `const message = err instanceof Error ? err.message : String(err);`  
    `return c.json({ error: 'Error interno', message }, 500);`
  - `src/api/routes/registration-lists.ts` (aprox. línea 717): se usa `err.message` en contexto a revisar (si se devuelve al cliente, es riesgo).

- **Logs internos:** En `auth.ts` (aprox. línea 1235) el `error.message` se envía solo a `recordSecurityMetric` (detalles internos), no al cliente; el `return c.json` solo devuelve mensaje genérico. Eso es correcto.

**Mitigación:** En respuestas al cliente (sobre todo 4xx/5xx), no devolver `error.message` ni stack traces. Devolver solo códigos de error o IDs de correlación y mensajes genéricos; registrar el detalle solo en servidor (logs / métricas).

---

## 7. Rate limiting en endpoints críticos

**Estado: ✅ PARCIALMENTE CUBIERTO; una mejora recomendada**

- **Login:** Rate limit con D1 en `auth.ts` (`checkRateLimitD1`).
- **Registro:** Rate limit por IP en `registration-rate-limit.ts`.
- **Forgot-password:** Rate limit en `auth.ts` (5 por hora por IP con `checkAndRecordActionRateLimit('forgot_password', ...)`).
- **Reset-password:** **No** tiene rate limit por IP. Un atacante podría intentar muchos cuerpos de petición con distintos tokens (p. ej. si obtuviera tokens por otro medio). El token es aleatorio, pero un rate limit por IP (p. ej. N intentos por hora) reduciría abuso.
- **Mensajes, logos, sesiones:** Rate limit por usuario en `action-rate-limit.ts`.

**Recomendación:** Añadir rate limit por IP a `POST /api/auth/reset-password` (p. ej. 10–20 intentos por hora por IP).

---

## 8. Dependencias desactualizadas con CVEs

**Estado: ⚠️ NO COMPROBADO (lockfile)**

- El proyecto usa **Bun** (`bun.lock`). `npm audit` no puede ejecutarse sin `package-lock.json`.
- **Recomendación:** Ejecutar regularmente `bun audit` (o el equivalente del gestor usado) y/o integrar un escáner de dependencias (Snyk, Dependabot, etc.). Revisar CVEs de paquetes como `bcryptjs`, `drizzle-orm`, `hono`, `zod`, `better-auth` y el resto de dependencias.

---

## 9. CSP mal configurada o inexistente (riesgo XSS)

**Estado: ⚠️ RIESGO EN FRONTEND; backend mejor en producción**

- **Backend:** En `src/api/middleware/csp.ts` en producción se usa `script-src 'self'` (sin `unsafe-inline` ni `unsafe-eval`). Headers adicionales (X-Frame-Options, X-Content-Type-Options, etc.) están configurados.
- **Frontend (index.html):** La etiqueta meta CSP incluye:
  - `script-src 'self' 'unsafe-inline' 'unsafe-eval'`
  - `style-src 'self' 'unsafe-inline'`
  Esto **debilita la protección XSS**: cualquier script inline o eval puede ejecutarse. En muchas apps Vite/React el build genera hashes para scripts; en ese caso se puede evitar `unsafe-inline`/`unsafe-eval` usando nonces o hashes en la CSP.
- El header CSP enviado por la API (middleware) tiene precedencia sobre el meta cuando la página se sirve desde la misma API; si el HTML se sirve estático (p. ej. desde otro origen o CDN), el meta del `index.html` podría seguir aplicándose.

**Mitigación:**  
- Ajustar la CSP del frontend para no usar `'unsafe-inline'` ni `'unsafe-eval'` en producción (usar nonces o hashes si hace falta).  
- Revisar que en producción el header CSP de la API se aplique a las respuestas HTML que sirvan la app.  
- Añadir `report-uri` o `report-to` para recibir informes de violaciones de CSP.

---

## 10. Secretos por defecto en código (riesgo si env no está definido)

**Estado: ⚠️ RIESGO OPERACIONAL**

- `src/api/utils/csrf.ts`:  
  `CSRF_SECRET = process.env.CSRF_SECRET || 'csrf-secret-key-change-in-production-min-32-chars'`
- `src/api/utils/jwt.ts`:  
  `JWT_SECRET` y `REFRESH_TOKEN_SECRET` con cadenas por defecto tipo `'your-super-secret-key-change-in-production-min-32-chars'`.

Si en producción (o en un entorno expuesto) no se definen `CSRF_SECRET`, `JWT_SECRET` y `REFRESH_TOKEN_SECRET`, se usarían estos valores, con riesgo de falsificación de tokens y CSRF.

**Mitigación:** En producción, no usar fallback: si falta alguna variable, que la aplicación no arranque o falle explícitamente. Ejemplo:  
`if (!process.env.CSRF_SECRET || process.env.CSRF_SECRET.length < 32) throw new Error('CSRF_SECRET required');`

---

## Resumen de prioridades

| Prioridad | Tema | Acción recomendada |
|-----------|------|---------------------|
| Alta | Exposición de `error.message` en respuestas (clinics, users, appointments, registration-lists) | Devolver solo mensajes genéricos al cliente; loguear detalle en servidor. |
| Alta | CSP con `unsafe-inline`/`unsafe-eval` en index.html | Restringir script-src en producción (nonces/hashes); añadir report-uri. |
| Alta | Secretos por defecto (CSRF, JWT, REFRESH) | Exigir env en producción; sin valor por defecto o fail-fast. |
| Media | localStorage con objeto `user` (auth-context) | Reducir datos en localStorage o aceptar riesgo controlado con CSP/sanitización. |
| Media | Rate limit en `POST /api/auth/reset-password` | Añadir rate limit por IP. |
| Media | Endpoints de desarrollo (clear-ip-block, /api/test) | Asegurar que no estén en producción; documentar y/o proteger en staging. |
| Baja | Auditoría de dependencias | Ejecutar `bun audit` (o equivalente) y escáner de CVEs de forma periódica. |

---

*Este informe se generó a partir de una revisión estática del código según los criterios indicados. No sustituye una auditoría de penetración ni una revisión de configuración en vivo (env, Wrangler, dominios, etc.).*
