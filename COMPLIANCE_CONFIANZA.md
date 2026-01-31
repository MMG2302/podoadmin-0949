# Compliance y confianza (esto vende)

Para vender a empresas y clínicas que exigen cumplimiento normativo, debes poder responder **sí** a varios de estos puntos. Este documento mapea cada uno al estado actual de PodoAdmin y a lo que falta.

---

## ¿Puedes responder sí?

| Tema | ¿Hoy? | Comentario |
|------|--------|------------|
| **GDPR / LFPDPPP (México)** | Parcial | Bases cubiertas (consent, borrado de usuario/paciente); faltan exportación de datos del interesado y retención configurable documentada. |
| **Retención de datos configurable** | No | No hay política ni job que borre/archive por antigüedad; no hay configuración por organización. |
| **Exportación de evidencias** | Parcial | Los logs de auditoría se pueden consultar por API (por usuario, por acción, todos); no hay “exportar a CSV/JSON” ni paquete de evidencias listo. |
| **Auditoría de decisiones** | Sí | Acciones sensibles registradas en `audit_log`; bloqueos (phishing, login, etc.) con mensaje claro y trazabilidad. |
| **SLA y uptime claros** | Fuera de producto | Depende de contrato y de Cloudflare/operador; no está en la app. |

Resumen: **auditoría de decisiones** ya se puede afirmar; **GDPR/LFPDPPP** y **exportación de evidencias** se acercan con poco desarrollo; **retención configurable** y **SLA/uptime** requieren diseño operativo y/o contractual.

---

## 1. GDPR / LFPDPPP (México)

### Qué suelen pedir

- **Base legal y consentimiento** para el tratamiento (registro, términos aceptados).
- **Derecho de acceso** (saber qué datos tienes).
- **Derecho de portabilidad** (exportar mis datos en formato usable).
- **Derecho de supresión** (“derecho al olvido”, borrar mis datos).
- **Retención limitada** (no conservar más de lo necesario, documentado).
- **Seguridad y registro** (medidas técnicas, registro de accesos/decisiones).

### Estado en PodoAdmin

| Requisito | Estado | Dónde |
|-----------|--------|-------|
| Consentimiento / términos | Parcial | `termsAccepted`, `termsAcceptedAt` en usuarios; falta flujo explícito de “acepto política de privacidad” si lo exigen por separado. |
| Derecho de acceso | Parcial | El usuario puede ver su perfil y datos en la app; no hay endpoint tipo “dame todos los datos que tienes de mí” en un solo lugar. |
| Portabilidad / exportación | No | No hay endpoint “exportar mis datos” (JSON/CSV) para el titular. |
| Supresión | Parcial | Borrado de usuario (super_admin) y de paciente; no hay flujo único “borrar toda mi cuenta y datos asociados” documentado como “derecho al olvido”. |
| Retención documentada | No | No hay política de retención en producto ni jobs de borrado por antigüedad. |
| Seguridad y registro | Sí | Audit log, permisos, clinicId; medidas descritas en PRODUCCION_CONFIG y ARQUITECTURA_SAAS_SEGURIDAD. |

**Recomendación:** Añadir (1) endpoint **GET /api/me/export** (o similar) que devuelva todos los datos del usuario autenticado (perfil, sesiones, créditos, etc.) en JSON; (2) flujo o documento de “solicitud de supresión” (borrado de cuenta + datos asociados) y cumplir en plazo; (3) documento de **política de retención** (cuánto se guarda cada tipo de dato y por qué). Con eso puedes responder mucho mejor a GDPR/LFPDPPP.

---

## 2. Retención de datos configurable

### Qué implica

- Definir **cuánto tiempo** se conservan logs, backups, datos inactivos (ej. 90 días, 1 año).
- **Configurable por organización** (por clínica) o global.
- **Ejecución automática** (job/cron) que borre o archive según esa política.

### Estado en PodoAdmin

- **No** hay retención configurable en la app.
- **No** hay job que borre `audit_log`, `rate_limit_attempts`, etc. por antigüedad.
- **No** hay tabla de “configuración de retención por clínica”.

**Recomendación:** (1) Documentar en **política de privacidad / retención** los plazos por tipo de dato (audit, rate limit, usuarios inactivos, etc.) aunque sea fijos al principio. (2) A medio plazo: tabla de configuración (ej. “audit_log_retention_days”) global o por `clinicId`, y un Worker cron o script que ejecute borrados/archivos según esa config. Así puedes decir “retención configurable” y “cumplimos LFPDPPP/GDPR en retención”.

---

## 3. Exportación de evidencias

### Qué implica

- Poder **exportar** logs de auditoría (y si aplica, decisiones de seguridad) para investigaciones, auditorías externas o autoridades.
- Formato **usable** (CSV, JSON, “paquete de evidencias” con metadatos).

### Estado en PodoAdmin

- **Sí** hay registro de decisiones: `audit_log` con userId, action, resourceType, resourceId, details, ipAddress, userAgent, createdAt, clinicId.
- **Sí** hay API de lectura: GET `/api/audit-logs/user/:userId`, `/api/audit-logs/action/:action`, `/api/audit-logs/all` (super_admin); devuelven JSON.
- **No** hay endpoint tipo “exportar auditoría en CSV” ni “descargar paquete de evidencias (ZIP/JSON)” desde la UI.

**Recomendación:** Añadir endpoint **GET /api/audit-logs/export** (o similar) con filtros (rango de fechas, usuario, clínica, acción) que devuelva **CSV** o **JSON** descargable (y solo para roles con `view_audit_log` / super_admin). Opcional: “paquete de evidencias” con metadatos (quién exportó, cuándo, filtros). Con eso puedes afirmar “exportación de evidencias para auditoría y cumplimiento”.

---

## 4. Auditoría de decisiones

### Qué implica

- Que las **decisiones sensibles** (login, bloqueos, cambios de permisos, envío de mensajes, etc.) queden **registradas** con quién, cuándo y qué.
- Que los **bloqueos de seguridad** (phishing, rate limit, etc.) tengan **motivo explicable** (“URL ofuscada”, “demasiados intentos”, “URL en lista de bloqueo”).

### Estado en PodoAdmin

- **Sí**: `logAuditEvent` en auth, logout, registro, 2FA, OAuth, usuarios, pacientes, citas, créditos, clínicas, profesionales, recepcionistas, mensajes, etc.
- **Sí**: Cada bloqueo (mensajes con URL ofuscada o Safe Browsing, login fallido, registro bloqueado) devuelve un **mensaje claro** al cliente; las respuestas 400/429 incluyen razón.
- **Sí**: Los logs incluyen userId, action, resourceType, resourceId, details, ipAddress, userAgent, clinicId, createdAt.

**Recomendación:** Mantener este modelo en todos los flujos nuevos; documentar en ofertas/compliance que “todas las decisiones sensibles son auditables y los bloqueos son explicables”. Esto **sí vende** y ya lo tienes.

---

## 5. SLA y uptime claros

### Qué implica

- **Contrato o documento** que defina disponibilidad (ej. 99,5 % mensual), ventanas de mantenimiento y consecuencias si no se cumple.
- **Monitoreo** (uptime, latencia) y **comunicación** ante incidentes.

### Estado en PodoAdmin

- **No** está en la aplicación: es **operativo y contractual**.
- Depende de **Cloudflare Workers/D1** (y de tu configuración): ver SLA de Cloudflare y definir el tuyo hacia el cliente.

**Recomendación:** Redactar un **documento de SLA** (aunque sea simple: disponibilidad objetivo, exclusiones, mantenimiento) y dejarlo en carpeta comercial/legal. Opcional: integración con status page o monitor (ej. UptimeRobot) y enlace en condiciones. Con eso puedes responder “sí, tenemos SLA y uptime claros” a nivel comercial.

---

## Resumen: qué afirmar ya y qué añadir

| Tema | Puedes decir hoy | Para decir “sí” fuerte |
|------|-------------------|-------------------------|
| **GDPR / LFPDPPP** | “Medidas de seguridad y auditoría; borrado de usuario/paciente; consentimiento en registro.” | Exportación de datos del interesado, política de retención documentada, flujo de supresión documentado. |
| **Retención configurable** | No. | Política documentada + (opcional) configuración y job de borrado/archivo. |
| **Exportación de evidencias** | “Los logs de auditoría son consultables por API con permisos.” | Endpoint de export (CSV/JSON) con filtros y control de acceso. |
| **Auditoría de decisiones** | **Sí.** | Mantener y documentar en propuestas. |
| **SLA y uptime** | “Infraestructura en Cloudflare con alta disponibilidad.” | Documento de SLA + (opcional) status o monitor. |

**Conclusión:** **Auditoría de decisiones** aplica y ya vende. **GDPR/LFPDPPP**, **exportación de evidencias** y **SLA** se acercan con poco código y documentación. **Retención configurable** es el siguiente paso para redondear la oferta de compliance y confianza.
