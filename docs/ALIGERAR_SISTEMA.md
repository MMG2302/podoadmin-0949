# Cómo hacer más ligero el sistema (respaldo y base de datos)

El peso del respaldo por podólogo viene sobre todo de las **imágenes de sesión** guardadas como data URI (base64) dentro del JSON de cada sesión. Aquí tienes opciones ordenadas por esfuerzo.

---

## 1. Modo ligero por configuración (sin cambiar código)

Puedes **reducir límites** con variables de entorno para que cada sesión guarde menos datos:

| Variable | Descripción | Valor por defecto | Ejemplo “modo ligero” |
|----------|-------------|--------------------|------------------------|
| `SESSION_IMAGE_MAX_COUNT` | Máximo de imágenes por sesión | 10 | `5` |
| `SESSION_IMAGE_MAX_BYTES` | Máximo tamaño por imagen (bytes) | 2.097.152 (2 MB) | `524288` (500 KB) |

Con **5 imágenes × 500 KB** por sesión en lugar de 10 × 2 MB, el techo por sesión baja de ~27 MB a ~2,5 MB (base64). Para 10.000 sesiones, el máximo pasa de ~270 GB a ~25 GB.

- **Dónde se usan:** `src/api/utils/logo-upload.ts` (bytes), `src/api/routes/sessions.ts` (cantidad).
- **Frontend:** Ajusta la UX para no permitir más imágenes de las que el backend acepta (p. ej. si `SESSION_IMAGE_MAX_COUNT=5`, mostrar aviso y deshabilitar subida tras 5).

---

## 2. Procesar imágenes en la app (ya implementado)

Las fotos de sesión se **redimensionan y comprimen en el navegador** antes de enviarlas al API. El usuario no tiene que cambiar la cámara (p. ej. iPhone 4K): la app reduce automáticamente el tamaño.

- **Dónde:** `src/web/lib/image-compress.ts` (`compressImageForSession`) y `src/web/pages/sessions-page.tsx` (handleImageUpload).
- **Qué hace:** lado máximo 1600 px, export a **WebP** calidad 0.85 (menor tamaño que JPEG; fallback a JPEG en navegadores sin WebP). Una foto 4K (4000×3000, 3–5 MB) pasa a ~1600×1200 y ~150–350 KB.
- Ventajas: menos peso por imagen, misma arquitectura (data URI en sesión). El usuario no hace nada; la app “procesa” la imagen por él.

---

## 3. Guardar imágenes en R2 y solo la URL en la base de datos (máximo alivio)

Hoy las imágenes van **dentro** del JSON de la sesión (data URI en base64). Si en su lugar:

1. El cliente o el API sube el **binario** a un bucket **R2** (o S3).
2. Se guarda en la sesión solo la **URL** (o clave) del objeto en R2.

entonces:

- La **base de datos** deja de crecer con el contenido de las imágenes: solo guardas texto (URLs).
- El **respaldo de la BD** se reduce a algo del orden de **decenas de MB** por podólogo (pacientes + sesiones con texto + URLs), aunque haya miles de sesiones con fotos.
- Las imágenes siguen disponibles vía URL (R2 público o firmado, o CDN delante).

Pasos típicos:

- Añadir en el API un **endpoint de subida** que reciba el binario, lo valide (magic bytes, tamaño, píxeles), lo suba a R2 con una clave única y devuelva la URL (o el path).
- En el frontend, en lugar de poner el data URI en `session.images[]`, subir el archivo a ese endpoint y guardar en la sesión la URL devuelta.
- Al mostrar la sesión, usar `<img src={url}>` con esa URL (y CSP `img-src` que permita el dominio de R2/CDN).

Ya tienes **R2** configurado en `wrangler.json` (binding `BUCKET`); solo falta implementar la subida y cambiar el modelo de “imagen = data URI” a “imagen = URL”.

---

## 4. Resumen rápido

| Opción | Esfuerzo | Efecto en peso |
|--------|----------|----------------|
| **1. Variables de entorno** (menos imágenes / menos MB por imagen) | Bajo | Reduce mucho el techo por sesión y por respaldo. |
| **2. Comprimir/redimensionar en el cliente** | Medio (cambios en front) | Menor tamaño por imagen; mismo modelo de datos. |
| **3. Imágenes en R2, BD solo con URLs** | Alto (nuevo flujo de subida + cambios en front y modelo) | Respaldo de BD muy ligero; crecimiento en R2, no en D1. |

Recomendación práctica: activar **1** (modo ligero por env) y, si hace falta más alivio a largo plazo, ir a **3** (R2) y opcionalmente **2** (compresión en cliente) para seguir reduciendo el tamaño de cada foto.

Ver también: `docs/ESTIMACION_RESPALDO_PODOLOGO.md`, `DEFENSA_TEXTO_FOTOS.md` (servir desde storage/CDN), **`docs/MIGRACION_R2_IMAGENES.md`** (guía paso a paso para R2/CDN).
