# Migración de imágenes de sesión a R2 / CDN

Guía para pasar de almacenar imágenes como **data URI en el JSON de la sesión** a almacenarlas en **Cloudflare R2** (o S3) y guardar solo **URLs** en la base de datos. Reduce el tamaño del respaldo y mejora tiempos de respuesta.

Ver también: `docs/ALIGERAR_SISTEMA.md` (opción 3), `DEFENSA_TEXTO_FOTOS.md`, `UPLOAD_ISOLATION.md`.

---

## 1. Estado actual

- **Sesiones:** Las imágenes van en `session.images[]` como data URI (base64) dentro del campo `notes` (JSON) en D1.
- **Solo sesiones en progreso (draft)** almacenan imágenes; al completar la sesión se vacía `images` para aligerar el respaldo.
- **Logos** (clínica y profesional) se guardan como data URI en columnas de la BD; R2 podría aplicarse también a logos con el mismo patrón.

---

## 2. Objetivo

1. Subir el **binario** de la imagen a un bucket **R2** (binding `BUCKET` en `wrangler.json`).
2. Guardar en la sesión solo la **URL** (o clave) del objeto.
3. Servir imágenes con `Content-Type` correcto (p. ej. `image/webp`) desde R2 o desde un CDN delante (p. ej. Cloudflare con dominio público en el bucket).

Beneficios: respaldo de D1 mucho más ligero, menos payload en listados de sesiones, posibilidad de cache y CDN.

---

## 3. Configuración existente

En `wrangler.json` ya existe:

```json
"r2_buckets": [
  { "bucket_name": "sandbox-website-template", "binding": "BUCKET" }
]
```

El Worker recibe `env.BUCKET` (tipo `R2Bucket`). No hace falta nueva variable de entorno para el binding; opcionalmente puedes definir un **dominio público** para las URLs (p. ej. `SESSION_IMAGES_PUBLIC_URL=https://img.tudominio.com` o el dominio de acceso público de R2).

---

## 4. Pasos en el API

### 4.1 Endpoint de subida

Crear un endpoint que:

- **Método:** `POST /api/sessions/upload-image` (o `POST /api/upload/session-image`).
- **Autenticación:** `requireAuth` + permiso `manage_sessions`.
- **Entrada:** `multipart/form-data` con un campo `file` (o body binario con `Content-Type: image/*`). Alternativa: seguir aceptando base64 en JSON para no cambiar el cliente de golpe.
- **Validación:** Misma lógica que imágenes de sesión hoy:
  - Magic bytes (JPEG/PNG/WebP) leyendo el binario, no el Content-Type.
  - Tamaño ≤ `MAX_SESSION_IMAGE_BYTES`.
  - Píxeles ≤ límite (p. ej. 4096×4096) leyendo cabecera.
  - Opcional: re-encode server-side cuando esté disponible (WASM/Cloudflare Images) para defensa fuerte contra polyglots.
- **Subida a R2:** Clave única, por ejemplo `sessions/{userId}/{sessionId}/{uuid}.webp` (o `.jpg` si mantienes formato). `userId` y `sessionId` del contexto/body validados (no tomados de la URL sin comprobar pertenencia).
- **Respuesta:** `{ "url": "https://..." }` o `{ "key": "sessions/..." }` para que el frontend guarde en `session.images[]`.

### 4.2 Cómo exponer la URL

- **Opción A – Dominio público de R2:** Configurar en Cloudflare el bucket con “Public access” y usar la URL que te den (p. ej. `https://pub-xxx.r2.dev/...`). Guardar en sesión esa URL completa.
- **Opción B – URLs firmadas:** No hacer el bucket público; generar una URL firmada (presigned) en el endpoint de subida o en un `GET /api/sessions/:id/image/:index` que devuelva un redirect 302 a URL firmada de R2 (válida 1 h). En la sesión guardar `key` y servir la URL firmada al cargar la vista.
- **Opción C – Proxy por Worker:** `GET /api/sessions/:sessionId/images/:key` que verifique permisos, lea de R2 con `BUCKET.get(key)` y devuelva el body con `Content-Type: image/webp` (o el que corresponda). En sesión guardas `key`; la URL es tu API.

### 4.3 Tipo de dato en sesión

- **Durante migración:** Aceptar en `session.images[]` tanto **data URI** (strings que empiezan por `data:`) como **URL** (strings que empiezan por `http://` o `https://`). En el frontend, `<img src={item}>` funciona en ambos casos.
- **A largo plazo:** Solo URLs (o solo `key` si usas proxy o URLs firmadas).

---

## 5. Pasos en el frontend

1. **Subir antes de guardar la sesión:** En el formulario de sesión (draft), al elegir una imagen:
   - Llamar a `POST /api/sessions/upload-image` con el archivo (o el blob ya comprimido con `compressImageForSession` exportado como `Blob` y subido).
   - Recibir `url` (o `key`) y añadirla a `formData.images` en lugar del data URI.
2. **Mostrar:** Sigue siendo `<img src={urlOrDataUri} />`; si el string es una URL, el navegador pide la imagen a R2/CDN.
3. **CSP:** Si las imágenes se sirven desde un dominio distinto (p. ej. `pub-xxx.r2.dev`), añadir ese origen a `img-src` en `src/api/middleware/csp.ts`.

---

## 6. Límites y rate limit

- Reutilizar el mismo límite de **cantidad** de imágenes por sesión (`SESSION_IMAGE_MAX_COUNT`, `MAX_SESSION_IMAGES`) y el **rate limit** de creación de sesiones; opcionalmente un rate limit específico para “subidas de imagen” (p. ej. 30/min por usuario) para no abusar de R2.

---

## 7. Resumen de tareas

| Tarea | Dónde |
|-------|--------|
| Endpoint `POST /api/sessions/upload-image` (o `/api/upload/session-image`) | Nueva ruta o en `sessions.ts` |
| Validar binario (magic bytes, tamaño, píxeles) | Reutilizar `logo-upload.ts` / `validateImageDataUri` leyendo buffer desde multipart o base64 |
| Subir a R2 con clave `sessions/{userId}/{sessionId}/{uuid}.webp` | `env.BUCKET.put(key, body, { httpMetadata: { contentType: 'image/webp' } })` |
| Devolver URL o key | Respuesta JSON |
| Frontend: subir archivo y poner URL en `session.images` | `sessions-page.tsx` (flujo de imágenes) |
| Aceptar en backend `images[]` con URLs además de data URI | `validateSessionImages` / persistencia: si es URL, no validar como data URI |
| CSP `img-src` con dominio R2/CDN | `csp.ts` |
| (Opcional) Variable `SESSION_IMAGES_PUBLIC_URL` para construir URL | `ENV_VARIABLES.md` |

Con esto se deja preparada la migración a R2/CDN sin cambiar aún el flujo actual (data URI) hasta que implementes el endpoint y el cliente.
