# Defensas por tipo de dato (texto y fotos)

Mapa de riesgos y defensas aplicadas en el repo para **texto** y **fotos**, con ubicaciones en código.

---

## Tabla resumen

| Tipo  | Riesgo principal   | Defensa clave           | Dónde está / pendiente |
|-------|--------------------|-------------------------|-------------------------|
| Texto | XSS                | Escapar al render       | React escapa por defecto; no usar `dangerouslySetInnerHTML` con contenido de usuario. |
| Texto | SQL/NoSQL          | Queries parametrizadas  | Drizzle ORM en todo el API; path params validados con `sanitizePathParam` en clinics/professionals. |
| Texto | Spam               | Rate limit              | Login y registro; **mensajes** (20/min), **logos** (10/min), **sesiones** (30/min): `action-rate-limit.ts`. |
| Fotos | Archivo falso      | Magic bytes             | `logo-upload.ts`: cabeceras JPEG/PNG/WebP. Imágenes de sesión: `validateImageDataUri` en POST/PUT sessions. |
| Fotos | Payload oculto     | Escaneo anti-polyglot   | `logo-upload.ts`: escaneo inicio/fin del binario por `<?php`, `<script`, etc. Mismo en `validateImageDataUri`. |
| Fotos | Bombas             | Límite de píxeles       | `logo-upload.ts`: `MAX_IMAGE_PIXELS` (4096×4096); lectura de dimensiones en cabecera PNG/JPEG/WebP. |
| Fotos | Ejecución          | Nunca servir directo    | Logos e imágenes de sesión se devuelven en JSON (data URI en `<img src="...">`); no hay URL que sirva el blob crudo. |

---

## 1. Texto

### 1.1 XSS (escapar al render)

- **Frontend:** React escapa por defecto al renderizar `{variable}`. No se usa `dangerouslySetInnerHTML` en el repo.
- **API:** El middleware de sanitización aplica `sanitizeInput` (escape HTML) a query y body; ver `src/api/middleware/sanitization.ts` y `src/api/utils/sanitization.ts`.
- **Criterio:** Escapar **solo al render**, no al guardar. Texto plano → escapar al render; texto con formato (HTML/Markdown) → sanitizer estricto (allowlist).
- **Importante:** No confiar en React si ese texto se usa en **emails, PDFs, exports, logs o templates**. En esos contextos el contenido se interpreta como HTML o texto; hay que escapar/sanitizar en el punto de uso (p. ej. al generar el HTML del email con `escapeHtml` de `sanitization.ts`). Ver `src/api/utils/email-service.ts`: si en el futuro se incluye contenido de usuario en el cuerpo HTML del email, debe escaparse antes de interpolar.
- **Recomendación:** No introducir `dangerouslySetInnerHTML` con contenido de usuario o API. Si se genera HTML (export PDF/HTML, emails), usar solo valores escapados o allowlist estricto.

### 1.2 SQL / NoSQL (queries parametrizadas)

- **API:** Todas las lecturas/escrituras usan **Drizzle ORM** (`src/api/database/`). No hay SQL crudo; los valores se enlazan como parámetros.
- **Path params:** En `src/api/routes/clinics.ts` y `src/api/routes/professionals.ts` se valida `clinicId` y `userId` con `sanitizePathParam` antes de usarlos en consultas; ver `src/api/INPUT_SECURITY.md` sección 4.
- **Recomendación:** En el resto de rutas que usan `:id`, `:userId`, `:sessionId`, etc., validar con `sanitizePathParam` antes de usarlos en DB o logs.

### 1.3 Spam (rate limit)

- **Implementado:** Rate limiting para **login** (`rate-limit-d1.ts`, `auth.ts`), **registro** (`registration-rate-limit.ts`) y, para abuso económico: **mensajes** (20/min por usuario), **subida de logos** (10/min por usuario), **creación de sesiones** (30/min por usuario) en `src/api/utils/action-rate-limit.ts`; aplicado en `messages.ts`, `clinics.ts`, `professionals.ts`, `sessions.ts`.

---

## 2. Fotos

### 2.1 Archivo falso (magic bytes)

- **Logos (clínicas y profesionales):** `src/api/utils/logo-upload.ts` comprueba **bytes reales** del binario decodificado (JPEG `FF D8 FF`, PNG `89 50 4E 47...`, WebP `RIFF` + `WEBP`); no se confía en el header `Content-Type` ni en el prefijo del data URI. Rutas: `PUT /api/clinics/:clinicId/logo`, `PUT /api/professionals/logo/:userId`.
- **Imágenes de sesiones clínicas:** `validateImageDataUri` en `logo-upload.ts` aplica la misma lógica. Se usa en `POST /api/sessions` y `PUT /api/sessions/:sessionId` al validar `body.images[]` (helper `validateSessionImages` en `src/api/routes/sessions.ts`).
- **Fallar rápido:** La validación (tamaño → magic bytes → WebP extra → polyglot → píxeles) se hace antes de cualquier escritura en DB o procesamiento pesado.

### 2.2 Payload oculto (anti-polyglot / “conversión forzada”)

- **Defensa actual:** Escaneo del binario (inicio y últimos 8 KB) en busca de cadenas como `<?php`, `<?=`, `<script`, `javascript:`, `onerror=`, `data:text/html`, etc. Si aparecen, se rechaza el archivo. **Limitación:** los polyglots modernos pueden pasar este chequeo; EXIF y chunks intermedios siguen siendo vectores. Esta barrera ayuda pero no es defensa fuerte.
- **Dónde:** `logo-upload.ts` (logos y `validateImageDataUri` para sesiones).
- **Defensa real recomendada:** Re-encode forzado y eliminación del archivo original. Si el servidor redimensiona o re-codifica la imagen (p. ej. con librería de imágenes), el resultado no contendrá payload oculto. Sin conversión server-side, el escaneo es solo una capa adicional.

### 2.3 Bombas (límite de píxeles)

- **Implementado:** En `logo-upload.ts`, constante `MAX_IMAGE_PIXELS = 4096×4096`. Se leen dimensiones desde la **cabecera** (PNG: IHDR; JPEG: SOF0; WebP: VP8) y se rechaza si `width × height > MAX_IMAGE_PIXELS`.
- **Aplica a:** Logos y a imágenes de sesión (vía `validateImageDataUri`).
- **Limitación:** Leer solo cabeceras no siempre es seguro; hay imágenes maliciosas con headers “normales” cuya bomba explota en el decode. **Refuerzos recomendados:** limitar píxeles totales (ya hecho), usar librería que falle antes del full decode si se añade re-encoding, y timeouts duros si la validación se ejecuta en un worker o proceso acotado.

### 2.4 Ejecución (nunca servir directo)

- **Comportamiento actual:** Logos e imágenes de sesión se almacenan como string (data URI o en JSON de `notes`) y se devuelven en respuestas JSON. El frontend usa el data URI en `<img src="...">`. No existe una ruta que sirva el blob crudo con `Content-Type` ejecutable ni se pasa el blob a ningún intérprete.
- **Recomendación:** Si en el futuro se sirven imágenes por URL (p. ej. R2), usar siempre `Content-Type: image/jpeg` (o el tipo real) y no servir con `Content-Type: text/html` ni ejecutar el contenido.

---

## 3. Ubicaciones en código

| Defensa              | Archivo(s) / ubicación |
|----------------------|-------------------------|
| Sanitización query/body (XSS) | `src/api/middleware/sanitization.ts`, `src/api/utils/sanitization.ts` |
| Path params (SQL/inyección)   | `src/api/routes/clinics.ts` (`getValidatedClinicId`), `src/api/routes/professionals.ts` (`getValidatedUserId`), `src/api/utils/sanitization.ts` (`sanitizePathParam`) |
| Rate limit login/registro     | `src/api/utils/rate-limit-d1.ts`, `src/api/utils/registration-rate-limit.ts`, `src/api/routes/auth.ts` |
| Rate limit mensajes/logos/sesiones | `src/api/utils/action-rate-limit.ts`, `messages.ts`, `clinics.ts`, `professionals.ts`, `sessions.ts` |
| Magic bytes + polyglot + píxeles (logos) | `src/api/utils/logo-upload.ts` (`validateLogoPayload`) |
| Imágenes de sesión (misma validación)     | `src/api/utils/logo-upload.ts` (`validateImageDataUri`), `src/api/routes/sessions.ts` (`validateSessionImages`, POST/PUT) |
| Límite píxeles                | `src/api/utils/logo-upload.ts` (`MAX_IMAGE_PIXELS`, `getImageDimensions`) |

---

## 4. Resumen de constantes (fotos)

- **Logos:** `MAX_LOGO_BYTES = 2 MB`, `MAX_IMAGE_PIXELS = 4096×4096`, escaneo anti-polyglot en primeros/últimos 8 KB.
- **Imágenes de sesión:** `MAX_SESSION_IMAGE_BYTES = 2 MB`, máximo 10 imágenes por sesión (`MAX_SESSION_IMAGES` en `sessions.ts`), misma validación de tipo, magic bytes, polyglot y píxeles que los logos.

Referencias: `INPUT_SECURITY.md`, `UPLOAD_ISOLATION.md`, `PRODUCCION_CONFIG.md`.
