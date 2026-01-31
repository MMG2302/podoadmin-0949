# Motor de detección anti-phishing (multi-capa)

Nunca depender de una sola técnica. Este documento mapea las capas **ideales** a lo que **ya tenemos** en PodoAdmin y lo que **tiene sentido** añadir o planificar.

**Contexto PodoAdmin:** riesgo principal = phishing de credenciales (login falso) y enlaces maliciosos en mensajes internos (super_admin → usuarios). No procesamos buzón de correo entrante.

---

## Principio: explicabilidad

> Si el sistema no explica **por qué** bloquea, en entornos enterprise no te lo compran.

Toda decisión de bloqueo debe devolver un **motivo claro** al usuario/API, por ejemplo:

- `"URL ofuscada (hxxp, [.], base64) – no permitida por política anti-phishing"`
- `"El dominio de la URL está en lista de bloqueo (reputación)"`
- `"Solo puedes iniciar sesión en [dominio oficial]; la URL actual no coincide"`

Así el usuario o el soporte pueden entender y escalar sin "caja negra".

---

## A. Heurísticas

### Ya implementado

| Técnica | Uso en PodoAdmin |
|--------|-------------------|
| **Dominio visible vs esperado** | Aviso en login: "Solo inicia sesión en [officialDomain]". El usuario puede comparar la barra de direcciones con el aviso. |
| **URLs ofuscadas** | Detección de hxxp, [.], base64, etc. en asunto/cuerpo de mensajes → 400 con mensaje claro. |
| **HTTPS forzado** | HSTS en producción para evitar sitios falsos por HTTP. |
| **CORS** | Solo orígenes en `ALLOWED_ORIGINS`; un dominio falso no puede llamar a la API con cookies. |

### Recomendable añadir (poco esfuerzo)

| Técnica | Qué hacer | Motivo al bloquear |
|---------|-----------|---------------------|
| **Comprobar origen en frontend** | Al cargar la app (o solo login), si `window.location.origin` no está en la lista que devuelve `/api/public/config` (o no coincide con `officialDomain`), mostrar **aviso grande** tipo: "No estás en el dominio oficial. No introduzcas contraseña aquí." | "La URL actual no es el dominio oficial de la aplicación." |
| **SPF / DKIM / DMARC (correo saliente)** | Configurar en el dominio desde el que enviáis email (verificación, notificaciones). No es "detección" en el producto, sino **dar confianza** a quien recibe vuestros correos. | N/A (no bloqueamos; mejoramos reputación del dominio). |

### Ideal / futuro (más dependencias o complejidad)

| Técnica | Comentario |
|---------|------------|
| **IPs residenciales / ASN sospechosos** | Requiere API o base ASN/geo; falsos positivos (staff en casa). Útil en entornos muy sensibles; para una clínica suele ser opcional. |
| **Edad del dominio** | Aplicable al evaluar **enlaces** en mensajes (ej. dominio de la URL &lt; 30 días). Necesita API de whois/edad; buena segunda capa si ya comprobamos reputación de URL. |
| **Certificados TLS recientes / autofirmados** | Útil al seguir un enlace (comprobar el cert del host). Implica resolver el host y revisar cert; más coste y latencia. |

---

## B. ML / IA

| Técnica | Viabilidad en PodoAdmin |
|---------|--------------------------|
| **Clasificación de texto (NLP)** | Posible con modelo propio o API (ej. clasificar cuerpo del mensaje como "phishing" / "urgente falso"). Coste y mantenimiento altos; más propio de producto de seguridad de correo. |
| **Detección visual (landing)** | Requiere captura de páginas y modelo de visión. Muy costoso; no realista a corto plazo. |
| **Similitud de marca (logos, colores)** | Mismo comentario; encaja en productos tipo "brand protection". |
| **Análisis de intención (urgencia, amenaza, recompensa)** | Se puede hacer algo sencillo con reglas (palabras clave, puntuación excesiva) sin ML; si se quiere ML, de nuevo coste y explicabilidad. |

**Conclusión:** ML/IA es **ideal** para un producto dedicado a detección de phishing; para PodoAdmin, **no es prioritario**. Si en el futuro se quiere una capa extra, empezar por algo simple (reglas heurísticas de "tono urgente" en mensajes) y documentar el motivo de bloqueo.

---

## B.1 Detección visual: OCR, logos, similitud perceptual, formularios de credenciales

> **Opinión:** Hoy el phishing “bueno” ya no se parece a texto; se parece a una **página real clonada**. La detección por texto y URL se queda corta; la capa fuerte sería analizar **cómo se ve** la página (imagen, logo, formularios).

Estas técnicas tienen sentido cuando **tienes una imagen o captura** de la página (screenshot de un enlace, imagen adjunta en un mensaje, etc.) y quieres decidir si es phishing:

| Técnica | Para qué sirve | Dónde encaja |
|--------|----------------|--------------|
| **OCR de imágenes** | Extraer texto de la captura (títulos, botones, campos). Luego se puede comparar con dominios conocidos, buscar “Iniciar sesión”, “Contraseña”, etc. | Pipeline de link preview (screenshot → OCR → reglas/NLP). |
| **Detección de logos** | Saber si aparece un logo de marca (ej. banco, Google, Microsoft). Si la URL no es de esa marca pero el logo sí aparece → señal de clonación. | Mismo pipeline; requiere base de logos o API. |
| **Similitud perceptual (pHash, CLIP, etc.)** | Comparar la imagen con capturas de páginas legítimas. Si es muy parecida a la página de login real pero la URL es otra → phishing clonado. | Comparación contra un conjunto de “páginas oficiales” de referencia. |
| **Detección de formularios de credenciales** | Detectar en la captura la presencia de campos usuario/contraseña y botón de envío. Página desconocida con formulario de login → candidata a phishing. | Reglas sobre DOM o sobre imagen (detección de campos/botones). |

**¿Es aplicable hoy en PodoAdmin?**

- **No**, con el diseño actual. PodoAdmin **no** hace capturas de páginas externas ni analiza imágenes en el contenido de mensajes. Los mensajes son **texto** (asunto + cuerpo); las comprobaciones son sobre URLs en ese texto (ofuscación, Safe Browsing), no sobre cómo se ve una landing.
- **Sí** sería aplicable si añadieras, por ejemplo:
  - **Vista previa de enlaces:** el backend (o un worker) abre la URL, hace screenshot y, antes de devolver la vista previa, ejecuta OCR + detección de logos/formularios o similitud con páginas conocidas; si hay alerta, no muestras la preview o la marcas como “no verificada”.
  - **Análisis de imágenes adjuntas** en mensajes (si en el futuro el cuerpo admite imágenes): pasar cada imagen por OCR/detección de formularios y rechazar o marcar si parece phishing.

**Resumen:** OCR, logos, similitud perceptual y detección de formularios son **la capa que responde a “se parece a una página real clonada”**. Hoy en PodoAdmin no tenemos el flujo que alimenta esa capa (no hay screenshot ni análisis de imágenes). Si en el futuro implementas vista previa de enlaces o análisis de imágenes, entonces tiene sentido planificar esta capa y mantener el **motivo de bloqueo explicable** (ej. “La vista previa contiene un formulario de credenciales en un dominio no reconocido”).

---

## C. Reputación

### Práctico a corto plazo

| Fuente | Uso | Motivo al bloquear |
|--------|-----|---------------------|
| **Listas de URLs maliciosas (ej. Google Safe Browsing)** | Antes de aceptar un mensaje que contenga enlaces, extraer URLs del cuerpo/asunto, comprobar contra la API y rechazar si están en la lista. | "Una o más URLs están en la lista de enlaces no seguros (reputación)." |
| **Historial interno** | Guardar dominios/URLs que los usuarios han reportado o que han sido bloqueados antes; rechazar o marcar si vuelven a aparecer. | "Este enlace fue previamente marcado como no seguro." |

Implementar **una** capa de reputación (p. ej. Safe Browsing) ya da una **segunda técnica independiente** de las heurísticas de ofuscación: primera capa = "parece ofuscado", segunda capa = "está en lista de maliciosos". Ambas con mensaje claro.

### Ideal / futuro

| Fuente | Comentario |
|--------|------------|
| **Greylists / señales comunitarias** | Útil si tenéis muchos clientes y podéis agregar señales (ej. "N dominios lo han marcado"). Requiere producto multi-tenant y modelo de datos. |

---

## Vectores habituales: QR, OAuth, MFA fatigue, calendar, HTML attachments, Drive links

> Si no tienes al menos **detección básica** de estos vectores, estás atrasado. Aquí se mapea cada uno al contexto de PodoAdmin.

| Vector | ¿Aplica a PodoAdmin? | Detección básica | Estado |
|--------|----------------------|-------------------|--------|
| **QR phishing** | No hoy | Si hubiera QR: solo generar/aceptar URLs del dominio oficial; no redirigir a URLs arbitrarias. | No hay flujo de QR (login, mensajes, etc.); si se añade, limitar a dominio oficial. |
| **OAuth phishing** | Sí | Usar solo URLs oficiales de Google/Apple; validar `state` en el callback; intercambiar el código en el servidor (no confiar en redirect_uri del cliente). | **Hecho**: `state` se guarda en cookie y se verifica en callback (Google y Apple); el código se intercambia en backend. |
| **MFA fatigue** | Parcial | Evitar 2FA por push que el usuario solo “acepta”; usar TOTP (código) o al menos limitar reintentos y alertar tras N fallos. | **Mitigado**: 2FA es TOTP (código), no push; no hay “fatiga” por aprobaciones repetidas. Recomendable: rate limit y alerta tras varios códigos 2FA fallidos (ya hay métricas/auditoría). |
| **Calendar invites maliciosos** | No hoy | Si se enviaran/importaran .ics: no seguir enlaces automáticamente; validar origen; no ejecutar contenido embebido. | No hay envío ni importación de invitaciones de calendario; si se añade, aplicar política de enlaces y no auto-abrir. |
| **HTML attachments (.html, .htm)** | No hoy en mensajes | Si hay adjuntos: bloquear o no procesar .html/.htm (y ejecutables); en correos salientes, no adjuntar HTML de usuario sin sanitizar. | Mensajes internos son solo texto (sin adjuntos). Emails salientes usan plantillas propias, no adjuntos de usuario. Si en el futuro se permiten adjuntos, **bloquear por política** .html/.htm y ejecutables. |
| **Drive links compartidos** | Sí (enlaces en mensajes) | Tratar enlaces a drive/shared (drive.google.com, etc.) como sensibles: misma comprobación que el resto (ofuscación + reputación); opcional: marcar o avisar “enlace a Drive” para que el usuario verifique. | **Hecho**: todas las URLs en asunto/cuerpo pasan por ofuscación y Safe Browsing. Opcional a futuro: heurística “es un enlace a Drive/OneDrive” para mostrar aviso en UI (“comprueba que el archivo es de confianza”). |

**Resumen:** No estamos atrasados en lo que **sí aplica**: OAuth con `state`, 2FA por TOTP (sin MFA fatigue por push), y enlaces en mensajes (ofuscación + reputación). Lo que **no aplica** hoy (QR, calendar, adjuntos HTML en mensajes) queda documentado para cuando se añadan flujos nuevos; entonces conviene tener al menos la detección básica indicada.

---

## Resumen: qué nos sirve y qué sería ideal

| Capa | ¿Nos sirve? | Acción recomendada |
|------|-------------|--------------------|
| **Heurísticas: dominio visible vs real** | Sí | Ya tenemos aviso en login; **añadir comprobación en frontend** de que `origin` coincide con dominio oficial y aviso grande si no. |
| **Heurísticas: ofuscación de URLs** | Sí | **Hecho**: bloqueo en mensajes con motivo claro. |
| **Heurísticas: SPF/DKIM/DMARC** | Sí (correo saliente) | **Recomendación de configuración** en PRODUCCION_CONFIG o doc de email: configurar en el dominio que envía correo. |
| **Heurísticas: IP/ASN, edad dominio, TLS** | Opcional | **Ideal/futuro**: documentar; implementar solo si el riesgo lo justifica (ej. sector muy regulado). |
| **ML/IA** | Ideal, no prioritario | **No implementar** a corto plazo; si se hace algo, empezar por reglas simples y mensaje explicable. |
| **Reputación (Safe Browsing, etc.)** | Sí | **Práctico**: segunda capa para URLs en mensajes; respuesta con motivo claro ("URL en lista de bloqueo"). |
| **Reputación (historial interno)** | Sí a medio plazo | **Ideal**: tabla de dominios/URLs bloqueados o reportados; rechazar o marcar en mensajes. |
| **Detección visual (OCR, logos, similitud, formularios)** | Ideal; no aplicable hoy | **Futuro**: solo si hay pipeline de captura/análisis (vista previa de enlaces, imágenes en mensajes). Requiere APIs/ML e infra; mantener motivo de bloqueo claro. |
| **Explicabilidad** | Sí, siempre | **Obligatorio**: todo bloqueo debe incluir un `reason` o `message` entendible en la respuesta de la API y, si aplica, en la UI. |

---

## Siguiente paso concreto

1. **Frontend:** Comprobar que `window.location.origin` coincida con el dominio oficial (o con la lista de orígenes permitidos) y, si no, mostrar aviso claro sin bloquear la página (el usuario puede estar en un entorno de pruebas). Opcional: en login, si no coincide, no enviar el formulario y mostrar el motivo.
2. **Backend – mensajes:** Añadir una capa de **reputación de URL** (ej. Google Safe Browsing API o similar) para las URLs extraídas del asunto/cuerpo; si alguna está en la lista, rechazar el mensaje con código 400 y mensaje tipo: *"El contenido contiene un enlace que está en la lista de enlaces no seguros. Por política anti-phishing no se puede enviar."*
3. **Documentación:** Incluir en PRODUCCION_CONFIG (o en doc de email) la recomendación de configurar **SPF, DKIM y DMARC** en el dominio desde el que se envían correos.

Así se mantiene un enfoque **multi-capa** (heurísticas + reputación), **explicable** (motivo en cada bloqueo) y **realista** para el tamaño y contexto de PodoAdmin.
