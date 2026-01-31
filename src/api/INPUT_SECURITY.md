# Seguridad de entradas (pipeline único, headers, URLs ofuscadas)

## 1. Normalización de entradas (pipeline único)

Todo lo que llega por **query** y **body** pasa por el mismo flujo:

1. **Normalizar** (`normalizeString`): trim, límite de longitud (por defecto 10.000), opcional lowercase.
2. **Escapar/sanitizar** (`escapeHtml` / `sanitizeInput`): escape HTML para evitar XSS.

- **Middleware:** `sanitizationMiddleware` aplica `sanitizeInput` a `c.req.query()` y al body JSON. Dentro de `escapeHtml` ya se llama a `normalizeString`.
- **Utilidades:** `src/api/utils/sanitization.ts`
  - `normalizeString(input, { maxLength, trim, lowerCase })` – uso explícito cuando necesites solo normalizar.
  - `sanitizeInput(obj)` – objetos (query/body): normaliza y escapa recursivamente.
- **Path params:** el middleware no tiene acceso al match de rutas; validar/sanitizar en cada ruta (p. ej. con schemas de validación).

## 2. Parsing robusto de headers

Los headers que pueden ser influenciados por el cliente o usados en logs se parsean y sanitizan:

- Eliminación de caracteres de control y newlines (`\r\n`).
- Límite de longitud por valor (2048 caracteres).

- **Utilidades:** `src/api/utils/request-headers.ts`
  - `parseAndSanitizeHeaders(headers, keys?)` – devuelve un objeto con solo los headers indicados y sus valores sanitizados.
  - `getSanitizedHeader(headers, name)` – devuelve un solo header sanitizado.
  - `HEADERS_TO_SANITIZE`: referer, user-agent, origin, x-forwarded-*, cookie, authorization, etc.

- **Middleware:** tras sanitizar query/body, se llama a `parseAndSanitizeHeaders(c.req.raw.headers)` y se guarda el resultado en **`c.set('safeHeaders', parsed)`**. El tipo de la app (`AppVariables`) declara `safeHeaders` para que `c.get('safeHeaders')` esté tipado.
- **Helper para logs:** `getSafeUserAgent(c)` devuelve el User-Agent sanitizado (usa `safeHeaders` si está disponible). Todas las rutas que pasan `userAgent` a `logAuditEvent` usan este helper.

## 3. Extracción de URLs ofuscadas (anti-phishing)

Detección y normalización de URLs usadas en phishing (hxxp, base64, [.], etc.):

- **Utilidades:** `src/api/utils/sanitization.ts`
  - `decodeObfuscatedUrl(input)` – desofusca y devuelve la URL normalizada o `null`.
    - Patrones: `hxxp`/`hxxps`/`h**p` → http(s), `[.]`/`(dot)`/`[dot]` → `.`
    - Intenta decodificar base64 si el contenido parece una URL.
  - `containsObfuscatedOrSuspiciousUrl(input)` – indica si el texto contiene una URL ofuscada o sospechosa.
  - `sanitizeUrlField(input)` – para campos que deben ser URL: desofusca, valida (solo http/https) y devuelve la URL limpia o `null`.

**Uso recomendado:** al aceptar o mostrar campos que puedan ser URLs (mensajes, perfiles, audit), usar `sanitizeUrlField()` antes de guardar o `containsObfuscatedOrSuspiciousUrl()` para marcar/rechazar contenido sospechoso.

- **Path params:** `sanitizePathParam(value, maxLength?)` – normaliza y rechaza si hay caracteres de control o peligrosos. Usar en rutas que reciben `:id`, `:userId`, etc., antes de usarlos en DB o logs.
- **Redirects/shorteners:** `looksLikeRedirectOrShortener(url)` – indica si la URL parece acortador o redirección (bit.ly, t.co, /redirect/, etc.) para marcar como sospechosa en contextos anti-phishing.

## 4. Inyección SQL

**Estado actual:** Todas las lecturas y escrituras a base de datos se hacen con **Drizzle ORM** (`src/api/database/`). No se usa SQL crudo (no `sql\`...\`` ni `.execute()` con strings).

- Drizzle genera **consultas parametrizadas** (prepared statements): los valores que vienen del body, query o path params se enlazan como parámetros, no se concatenan en el SQL. Así, aunque un usuario envíe `' OR 1=1--` en un campo, ese valor se trata como el string literal y no como parte de la sentencia.
- **Insert/Update:** `database.insert(table).values({ col: value })` y `database.update(table).set({ col: value }).where(eq(...))` usan siempre parámetros para `value`. Las “celdas” escribibles (campos de formularios, logos, etc.) están por tanto protegidas frente a inyección SQL.
- **Recomendación:** No introducir nunca SQL crudo. Si en el futuro se necesitan consultas complejas, usar el query builder de Drizzle o, si es imprescindible, `sql` de Drizzle con placeholders (`sql\`... WHERE id = ${param}\``) para que sigan enlazándose como parámetros.
- **Defensa en profundidad:** Los path params (`:clinicId`, `:userId`, `:id`, etc.) se validan con `sanitizePathParam()` en las rutas que escriben o usan esos IDs en consultas. Si el param contiene caracteres de control o no pasa la validación, se responde 400 y no se ejecuta la consulta.

## 5. orderBy, filtros dinámicos y claves desde input

**Regla:** El usuario solo puede elegir **valores**, nunca **claves** (nombres de columnas, claves de ordenación, etc.).

- **orderBy:** En este repo todos los `orderBy` están fijos en código (p. ej. `desc(auditLog.createdAt)`). No se construye la columna de orden desde query/body. Si en el futuro se permite ordenar por parámetro, mapear el valor del usuario a una allowlist de columnas permitidas (p. ej. `sort=createdAt` → `desc(auditLog.createdAt)`), nunca usar el string del usuario como nombre de columna.
- **Filtros dinámicos:** En export de auditoría (`audit-logs/export`) los parámetros son `from`, `to`, `userId`, `clinicId`, `action`, `limit`: claves fijas; el usuario solo aporta los valores. No se construye `where` desde un JSON cuyas claves vengan del usuario.
- **Recomendación:** Cualquier filtro u ordenación que dependa de input debe usar allowlist de columnas/operadores y valores parametrizados.
