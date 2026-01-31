# Arquitectura SaaS – Revisión de seguridad y escalabilidad

Revisión dura de **seguridad interna**, **multi-tenant** y **escalabilidad** aplicada al contexto de PodoAdmin (Cloudflare Workers + D1, clínicas como “tenant”).

---

## 4.1 Seguridad interna (muy crítico)

### Zero Trust interno

| Aspecto | Qué implica | Estado en PodoAdmin |
|--------|-------------|----------------------|
| **No confiar en la red** | Cada petición se autentica y autoriza; no asumir que “interno” es seguro. | **Parcial**: Auth con JWT + cookies; middleware `requireAuth` y `requireRole`/`requirePermission` en rutas; no hay segmentación de red “interna” (todo pasa por la API). |
| **Verificar identidad y permisos por request** | Validar token y `clinicId`/rol en cada operación. | **Hecho**: Rutas usan `c.get('user')` y comprueban `clinicId` y permisos; datos filtrados por `clinicId` donde aplica. |
| **Mínimo privilegio** | Cada componente y cada usuario con el mínimo acceso necesario. | **Hecho**: Roles y permisos granulares (`rolePermissions`); super_admin sin `clinicId`, resto acotado a su clínica. |

**Recomendación:** Mantener “nunca confiar, siempre verificar” en cada endpoint; no añadir bypasses por “origen interno” sin autenticación.

---

### Secrets en vault (no env vars planas)

| Aspecto | Qué implica | Estado en PodoAdmin |
|--------|-------------|----------------------|
| **Secrets en vault** | Claves en un sistema dedicado (HashiCorp Vault, AWS Secrets Manager, Cloudflare Workers Secrets) con acceso auditado y rotación. | **Parcial**: Uso de **Wrangler Secrets** (Cloudflare); no son “env vars planas” en el repo; no hay vault externo tipo Vault/Secrets Manager. |
| **No env vars planas en código** | No poner JWT_SECRET, etc. en `wrangler.toml` ni en el repo. | **Hecho**: Secretos sensibles se definen con `wrangler secret put`; en doc se recomienda no ponerlos en `[vars]`. |

**Recomendación:** Para el tamaño actual (Workers + D1), **Wrangler Secrets** es una detección básica aceptable. Si el producto crece o hay requisitos de auditoría fuertes, valorar integración con **Cloudflare Workers Secrets** + política de acceso y/o un vault externo con rotación automática.

---

### Rotación de keys

| Aspecto | Qué implica | Estado en PodoAdmin |
|--------|-------------|----------------------|
| **Rotación de JWT / refresh / CSRF** | Cambiar periódicamente las claves y tener estrategia para no invalidar todas las sesiones a la vez. | **No implementado**: No hay rotación automática ni proceso documentado. Las claves se cambian manualmente (nuevo secret) y las sesiones se invalidan. |
| **Rotación de API keys (email, Safe Browsing, etc.)** | Renovar claves de terceros y actualizar secrets. | **Manual**: Depende de procedimiento operativo; no hay rotación desde la app. |

**Recomendación:** Documentar en **PRODUCCION_CONFIG** o en runbook: (1) cómo rotar JWT_SECRET / REFRESH_TOKEN_SECRET / CSRF_SECRET (y que implica “cerrar sesiones” o ventana de gracia con doble clave); (2) periodicidad recomendada para API keys externas. A futuro, valorar rotación automática si se usa vault.

---

### Logs inmutables

| Aspecto | Qué implica | Estado en PodoAdmin |
|--------|-------------|----------------------|
| **Logs que no se puedan alterar ni borrar** | WORM, append-only o almacenamiento con retención y sin delete por app. | **No**: Los audit logs se insertan en D1 (`auditLog`); no hay política de inmutabilidad ni retención fija; un admin con acceso a la DB podría modificar/borrar. |
| **Integridad (hash/cadena)** | Opcional: firma o encadenado para detectar manipulación. | **No**. |

**Recomendación:** A corto plazo: documentar que los audit logs son “confidenciales y de solo escritura por la app”; no exponer borrado/edición por API. A medio plazo, si hay requisitos de cumplimiento: export periódico a almacenamiento inmutable (ej. bucket con Object Lock) o uso de un servicio de log con retención e inmutabilidad.

---

## 4.2 Multi-tenant real

### Aislamiento de datos por tenant

| Aspecto | Qué implica | Estado en PodoAdmin |
|--------|-------------|----------------------|
| **Datos separados por organización (clínica)** | Cada fila sensible con `clinicId`; las consultas siempre filtran por el tenant del usuario. | **Hecho**: Tablas con `clinicId`; rutas usan `user.clinicId` y filtros `eq(table.clinicId, clinicId)`; super_admin sin `clinicId` puede ver todas las clínicas. |
| **Evitar fuga entre tenants** | No devolver datos de otra clínica por error (IDs, listados, exports). | **Hecho**: Autorización por rol y `requirePermission`; listados y detalles acotados a la clínica del usuario (o a todas solo para super_admin). |
| **DB por tenant vs schema por tenant** | Opción: una DB por cliente o un schema por cliente. | **No**: Una sola D1; tenant = `clinicId` en filas. Adecuado para tamaño actual; si crece mucho o hay requisitos legales muy estrictos, valorar DB/schema por tenant. |

**Recomendación:** Revisar de forma periódica que **todas** las rutas que tocan datos por clínica filtren por `user.clinicId` (o por lista de clínicas permitidas para el rol) y que no existan APIs “globales” sin control de tenant.

---

### Rate limiting por cliente

| Aspecto | Qué implica | Estado en PodoAdmin |
|--------|-------------|----------------------|
| **Límites por organización (clínica)** | Evitar que un solo tenant consuma todos los recursos; cuotas por `clinicId` o por API key por org. | **No**: Rate limiting actual es por **identificador de login** (email+IP) y por **IP en registro**; no por `clinicId` ni por organización. |
| **Límites globales por IP** | Evitar abuso desde una IP. | **Parcial**: Login y registro tienen rate limit (D1); no hay límite global por IP en el resto de la API. |

**Recomendación:** Si el producto se ofrece como SaaS con muchas clínicas, añadir **rate limiting por tenant** (por `clinicId` o por organización): por ejemplo, X requests/minuto por clínica, con límites distintos por plan. Opcional: límite global por IP en endpoints costosos (ej. export, mensajes).

---

### Configuración por organización

| Aspecto | Qué implica | Estado en PodoAdmin |
|--------|-------------|----------------------|
| **Config por clínica (features, límites, branding)** | Cada tenant con su configuración (módulos, cuotas, logo, dominio). | **Parcial**: Hay configuración por clínica (ej. logo, datos de la clínica); no hay “planes” ni features flags por organización ni configuración de dominio por tenant. |
| **Config central vs por tenant** | Variables globales vs por org. | **Actual**: Config global (env); por clínica solo lo que está en tablas (clinics, etc.). |

**Recomendación:** Si se comercializa por planes o por organización, definir un modelo de “config por organización” (tabla o servicio) para límites, features y branding, y usarlo en autorización y rate limiting.

---

## 4.3 Escalabilidad

### Procesamiento async

| Aspecto | Qué implica | Estado en PodoAdmin |
|--------|-------------|----------------------|
| **Operaciones largas fuera del request** | No bloquear la respuesta HTTP; encolar tareas (emails, informes, Safe Browsing, etc.). | **No**: Todo es síncrono en el Worker (login, mensajes, Safe Browsing, email de notificación). Si una llamada externa tarda, el usuario espera. |
| **Workers y tiempo de CPU** | En Workers, el tiempo de ejecución por request es limitado. | **Relevante**: En Workers hay límite de tiempo; si se añaden más llamadas externas o lógica pesada, conviene moverlas a cola. |

**Recomendación:** Para flujos que no necesiten respuesta inmediata (envío de email, generación de informes, futuras comprobaciones pesadas), valorar **Queue (Cloudflare Queues)** o equivalente: el endpoint encola y responde “aceptado”; un consumer procesa en background. Así se mantiene tiempo de respuesta bajo y “phishing no espera” en lo que sí es crítico (validación de login, mensajes).

---

### Colas (SQS, PubSub, Rabbit)

| Aspecto | Qué implica | Estado en PodoAdmin |
|--------|-------------|----------------------|
| **Colas para tareas async** | Mensajería entre API y workers que procesan emails, informes, etc. | **No**: No hay colas; todo en línea. |
| **En Cloudflare** | Alternativa: **Cloudflare Queues** + consumer Worker. | **No usado**. |

**Recomendación:** No obligatorio para el tamaño actual. Si se añaden envíos masivos de email, informes pesados o más comprobaciones externas, introducir una cola (ej. Queues) y mantener en la API solo la parte que debe responder rápido (incluida la decisión de bloquear por phishing).

---

### Timeouts claros (phishing no espera)

| Aspecto | Qué implica | Estado en PodoAdmin |
|--------|-------------|----------------------|
| **Timeouts en llamadas externas** | No esperar indefinidamente a Safe Browsing, email, etc.; fallar de forma controlada. | **Parcial**: La llamada a Safe Browsing en mensajes usa `fetch` sin timeout explícito (depende del runtime). Si la API externa tarda, el envío del mensaje se bloquea hasta que falle o responda. |
| **Degradación controlada** | Si Safe Browsing no responde en X segundos, decidir: rechazar el mensaje (seguro) o permitir sin esa comprobación (documentado). | **No definido**: Si `checkUrlsWithSafeBrowsing` falla por red, se devuelve `{ unsafe: [] }` y el mensaje se permite (evitar bloqueo por caída de API); no hay timeout corto explícito. |

**Recomendación:** Añadir **timeout explícito** (ej. 5 s) a la llamada a Safe Browsing (y a otras llamadas externas críticas). Si se supera el timeout: tratar como “no disponible” y aplicar la misma política que hoy (no bloquear el mensaje por fallo de red) y registrarlo en logs para métricas. Documentar la decisión: “timeout = no bloqueamos por phishing en ese mensaje, pero lo registramos”.

---

## Resumen: qué tenemos y qué priorizar

| Área | Tema | Estado | Prioridad sugerida |
|------|------|--------|--------------------|
| **4.1** | Zero Trust interno | Parcial / hecho (auth + permisos + clinicId) | Mantener y revisar en cada nuevo endpoint. |
| **4.1** | Secrets en vault | Parcial (Wrangler Secrets) | Aceptable ahora; valorar vault/rotación si crece o hay compliance. |
| **4.1** | Rotación de keys | No implementada | Documentar proceso y periodicidad; después valorar automatización. |
| **4.1** | Logs inmutables | No | Documentar política; a medio plazo valorar export/bucket inmutable. |
| **4.2** | Aislamiento por tenant | Hecho (clinicId) | Revisar rutas nuevas para no fugas. |
| **4.2** | Rate limiting por cliente | No (solo por login/registro) | Añadir cuando el SaaS tenga muchos tenants o planes. |
| **4.2** | Config por organización | Parcial | Extender si hay planes o features por clínica. |
| **4.3** | Procesamiento async | No | Valorar cuando haya tareas pesadas o muchos tenants. |
| **4.3** | Colas | No | Valorar con async (Queues, etc.). |
| **4.3** | Timeouts claros | Parcial | Añadir timeout a Safe Browsing (y otras llamadas externas); documentar política. |

Con esto se cubre una **revisión dura** de arquitectura SaaS aplicada a PodoAdmin: seguridad interna, multi-tenant real y escalabilidad, con estado actual y pasos concretos.
