# Aislamiento de cargas (logos e imágenes)

Objetivo: que una carga corrupta o maliciosa de un usuario (por ejemplo un logo o una foto) **no contamine ni dañe el resto del sistema**. Se aplican validación en la entrada, límites de tamaño y tipos permitidos.

## Medidas implementadas

### 1. Validación en la subida (puerta de entrada)

- **Logos (clínicas y profesionales)**  
  - Solo se aceptan imágenes **JPEG, PNG o WebP** (data URI base64).  
  - **No se acepta SVG** para evitar ejecución de código (XSS/XXE) y posibles fallos en parsers.  
  - **Tamaño máximo**: 2 MB del binario (antes de base64).  
  - **Magic bytes**: se comprueba que el binario empiece con la cabecera real del tipo declarado (JPEG: `FF D8 FF`; PNG: `89 50 4E 47...`; WebP: `RIFF....WEBP`). Así se rechazan archivos .php o .js subidos como “imagen”.  
  - **Anti-polyglot**: se escanea solo el **inicio y el final** del binario (primeros y últimos 8 KB), donde suelen inyectarse payloads; se buscan cadenas como `<?php`, `<?=`, `<script`, `javascript:`, `onerror=`, `onload=`, etc. Si aparecen, se rechaza. Así se reduce el riesgo de falsos positivos en datos binarios legítimos y se acelera la validación.  
  - La validación se hace en el API en `src/api/utils/logo-upload.ts` y se usa en:
    - `PUT /api/clinics/:clinicId/logo`
    - `PUT /api/professionals/logo/:userId`  
  - Si el payload no es válido, se responde **400** con `error` y `message` (por ejemplo `logo_type_not_allowed`, `logo_too_large`, `logo_invalid_signature`, `logo_suspicious_content`).  
  - El frontend (ajustes) solo permite seleccionar PNG, JPG y WebP y limita a 2 MB.

Con esto, un logo corrupto o malicioso **no entra** en la base de datos: se rechaza en la API.

### 2. Aislamiento por entidad en base de datos

- **Logos de clínicas**: columna `logo` en la tabla `clinics` (una fila por clínica).  
- **Logos de profesionales**: tabla `professional_logos` (una fila por usuario).  

Cada entidad tiene su propio campo o tabla. Un valor corrupto en una fila no “infecta” otras filas; el riesgo que mitigamos es sobre todo **entrada** de datos no válidos y **tamaño** (evitar que un solo usuario sature la DB con un payload enorme).

### 3. Sin procesamiento ejecutable del contenido

- Los logos se almacenan como **string** (data URI o base64) y se sirven en JSON.  
- El navegador los usa en `<img src="data:...">`. El servidor **no** pasa el blob a ningún intérprete (no eval, no include PHP, no ejecución de scripts); solo valida, guarda y devuelve el string.  
- La validación (magic bytes + detección de PHP/JS) se hace sobre el binario decodificado en memoria y luego se descarta; el blob nunca se escribe a disco como archivo ejecutable ni se incluye en ningún contexto que lo interprete como código.

### 4. Auditoría de rechazos

- Cada vez que se rechaza un logo (tipo no permitido, firma inválida, contenido sospechoso, tamaño), se registra un evento de auditoría **LOGO_UPLOAD_REJECTED** con `reason` (código de error), sin guardar el payload. Así se puede detectar abuso o intentos repetidos en los logs.

### 5. Posibles extensiones futuras

- **Rate limiting en subidas**: limitar subidas de logo por usuario o por IP (ej. N por minuto) para evitar abuso o saturación. Hoy no está implementado; recomendable en producción si hay muchos usuarios.  
- **Sesiones clínicas (imágenes en `notes`)**: las imágenes de sesión se guardan en el JSON de la sesión. Se puede aplicar una validación similar (tipo JPEG/PNG/WebP, tamaño máximo por imagen y por sesión) al crear/actualizar sesiones para aislar también esas cargas.  
- **Almacenamiento en R2**: mover logos (y en su caso imágenes de sesión) a **Cloudflare R2** con claves del tipo `logos/clinic/{clinicId}` y `logos/professional/{userId}` permitiría:
  - Limitar tamaño por objeto en R2.  
  - No guardar binarios grandes en D1.  
  - Servir los logos con `Content-Type: image/png` (etc.) directamente desde R2, sin que el servidor de la API manipule el contenido.  

## Resumen

| Aspecto              | Cómo se aísla |
|----------------------|----------------|
| Tipos permitidos     | Solo JPEG, PNG, WebP (validado en API y frontend). |
| Tamaño               | Máx. 2 MB por logo (validado en API). |
| Formatos peligrosos  | SVG y otros tipos rechazados en la API. |
| Almacenamiento       | Un logo por clínica / por profesional (tabla/columna separada). |
| Uso en servidor      | No se decodifica ni se renderiza el contenido; solo se guarda y se devuelve el string. |

Con esto, el sistema queda **aislado** frente a logos corruptos o maliciosos: no pueden dañar el resto de la aplicación ni saturar la base de datos porque se rechazan en la entrada y se limitan por tipo y tamaño.

---

## Riesgos concretos y controles

| Riesgo | Qué hacemos ahora | Si cambias el diseño |
|--------|-------------------|----------------------|
| **Payload oculto** (ej. .jpg con PHP/JS dentro) | Magic bytes al inicio + escaneo del binario en busca de `<?php`, `<?=`, `<script`, `javascript:`, `onerror=`, `onload=`, `eval(`, `<iframe`, `data:text/html`, etc. Si aparece, 400 y no se guarda. | Mantener siempre validación en la API antes de guardar; no confiar solo en extensión o Content-Type del cliente. |
| **MIME spoofing** (dicen ser imagen, no lo son) | No confiamos en el cliente: comprobamos **magic bytes** del binario (JPEG `FF D8 FF`, PNG `89 50 4E 47...`, WebP `RIFF` + `WEBP`). Si la cabecera no coincide con el tipo declarado en el data URI, rechazamos. | Cualquier nuevo tipo: validar firma binaria, no solo el header MIME. |
| **RCE indirecto** (si luego procesas la imagen mal) | No hay procesamiento: no resize, no ImageMagick, no conversión. Solo validar → guardar string → devolver. El blob no se pasa a ningún intérprete ni librería que pueda ejecutar código. | Si añades procesamiento (redimensionar, recortar, etc.): usar librería de confianza (ej. sharp en Worker), sin eval/exec; límites de tamaño y tiempo; no interpretar el contenido como código. |
| **Path traversal** | No escribimos a disco con rutas controladas por el usuario. Los logos van a D1 como string en una columna; no hay `clinicId` o `userId` en una ruta de archivo. | Si pasas a almacenamiento por archivo (ej. R2): claves fijas del tipo `logos/clinic/{clinicId}` o `logos/professional/{userId}` con `clinicId`/`userId` validados por sesión (no tomados del body ni de la URL); nunca concatenar entrada del usuario a una ruta. |
| **Ataques persistentes** (el archivo vive en tu sistema) | El “archivo” es un string en D1; no se ejecuta. Hoy los logos se devuelven **dentro de JSON** (`{ success, logo }`), no como recurso con URL propia; el frontend usa el data URI en `<img src="...">`. No hay ruta que sirva el blob crudo, así que no hay riesgo de que se interprete como HTML/JS. Si más adelante sirves logos por URL (ej. R2 o `/api/logo/xxx`): enviar siempre `Content-Type: image/jpeg` (o el tipo real) para que nunca se interprete como HTML/JS. | Al servir desde R2 o desde API: fijar `Content-Type` según el tipo real del objeto; no servir con `Content-Type: text/html` ni ejecutar el contenido. |
