# PodoAdmin — Pendientes Críticos y Roadmap Técnico AI-Friendly

## Objetivo

Este documento resume TODO lo que falta para endurecer, escalar y profesionalizar PodoAdmin como SaaS clínico multi-tenant sobre Cloudflare Workers + D1.

La intención es que una IA Fullstack pueda:

- Auditar el repositorio
- Priorizar trabajo
- Ejecutar migraciones
- Refactorizar arquitectura
- Mejorar seguridad
- Escalar el sistema
- Eliminar deuda técnica
- Preparar producción real

**Empaquetar repo para IA:** `npm run repomix` → `repomix-output.xml`  
**Deploy:** `LISTA_DESPLIEGUE.md` · **Seguridad pre-prod:** `CHECKLIST_DEPLOY_PRODUCCION.md`

---

## Estado auditado en repo (actualizar al cerrar tareas)

| Área | Estado real (código) | Notas |
|------|----------------------|-------|
| Registro público | ✅ `POST /api/auth/register` + `/register` UI | Rate limit IP, CAPTCHA si configurado |
| Límites gasto email | ✅ Parcial | Sin Mock en prod; tope notificaciones login 3/5/10 |
| Forgot password | ✅ Rate limit 5/h por IP | Flujo vía solicitud admin, no email automático siempre |
| Reset password (`POST /reset-password`) | ✅ Rate limit | 10 intentos/hora por IP (`action-rate-limit`) |
| CSP producción | ✅ Parcial+CAPTCHA | Turnstile/hCaptcha/reCAPTCHA vía `csp-captcha.ts` si hay `CAPTCHA_*` |
| localStorage datos clínicos | ✅ Hecho (páginas principales) | `users-page`, `patients-page`, `calendar-page` vía API; getters LS obsoletos |
| API → storage types | ✅ Tipos en `web/types/clinical.ts` | `sessions.ts` y `clinical-maps.ts` compartidos |
| D1 rate limit login/acciones | ✅ Mayoría en D1 | `rate-limit-d1.ts`, `action-rate-limit.ts` |
| Rate limit en memoria | ⚠️ Legacy | `rate-limit.ts` (login viejo) — verificar si aún se usa |
| Queues / async email | ❌ No implementado | Emails síncronos en Worker |
| Observabilidad enterprise | ✅ Parcial | Sentry (Worker + React), logs JSON, X-Request-Id; dashboard `/security-metrics` |
| CI/CD | ❌ No visible en repo | Sin GitHub Actions |

---

# STACK ACTUAL

## Backend
- Cloudflare Workers
- Hono
- Drizzle ORM
- D1
- R2 (archivos/imágenes)
- JWT Auth
- CSRF Protection
- RBAC
- Rate limiting (parcial, D1 + algunas acciones)

## Frontend
- React
- Vite
- TypeScript
- Tailwind
- LocalStorage híbrido (**deuda crítica**)

---

# PRIORIDAD CRÍTICA (HACER PRIMERO)

---

# 1. ELIMINAR DEPENDENCIAS DE LOCALSTORAGE COMO FUENTE DE VERDAD

## Problema

Todavía existen múltiples flujos usando:
- localStorage
- memoria del worker
- storage híbrido frontend/backend

Esto rompe:
- persistencia
- consistencia
- seguridad
- escalabilidad horizontal
- multi-dispositivo

## Archivos involucrados

### Frontend
- `src/web/lib/storage.ts`
- `src/web/pages/users-page.tsx` (escritura directa pacientes/sesiones en LS)
- `src/web/pages/patients-page.tsx`
- `src/web/pages/sessions-page.tsx`
- `src/web/pages/dashboard.tsx`
- `src/web/pages/calendar-page.tsx`
- `src/web/pages/clinic-page.tsx`
- `src/web/contexts/auth-context.tsx` (cache usuario UI — aceptable si solo sesión display)

### Backend
- `src/api/routes/users.ts` (verificar que CRUD sea 100% D1)
- `src/api/routes/auth.ts`
- `src/api/routes/two-factor-auth.ts`
- `src/api/routes/sessions.ts` (import de **tipos** desde `web/lib/storage` — mover a `src/shared/types`)

---

## Objetivo

La API + D1 deben ser la ÚNICA fuente de verdad.

localStorage solo puede guardar:
- tema
- idioma
- preferencias UI
- cache temporal no sensible
- snapshot de usuario para UI (`podoadmin_user`) si cookies HTTP-only son la auth real

Nunca:
- usuarios
- pacientes
- sesiones clínicas
- permisos
- historiales

---

## Tasks

### Backend
- [ ] Eliminar imports desde `../../web/lib/storage` (mover tipos a `src/shared/` o `src/api/types/`)
- [ ] Reescribir CRUD users completamente sobre D1
- [ ] Reescribir auth fallback storage → D1
- [ ] Reescribir 2FA para usar exclusivamente DB
- [ ] Eliminar memoria temporal del worker

### Frontend
- [x] Reemplazar `getPatients()` / `getSessions()` en páginas de usuarios y pacientes
- [x] Eliminar escrituras directas a localStorage en transferencia de historial (`POST /api/users/transfer-clinical-history`)
- [ ] Revisar otros usos legacy de `storage.ts` (seed, exportPatientData local)
- [ ] Crear cache react-query/SWR opcional
- [ ] Implementar invalidación cache

---

# 2. CONSOLIDAR RATE LIMITING

## Problema

Hay rate limiting parcial:
- login (D1)
- registro (`registration-rate-limit.ts`)
- forgot-password (5/h IP)
- mensajes, logos, sesiones (`action-rate-limit.ts`)

Pero falta:
- tenant rate limiting
- `POST /auth/reset-password` hardening
- global API protection
- adaptive throttling

---

## Tasks

### Seguridad
- [ ] Añadir rate limit a `POST /auth/reset-password`
- [ ] Añadir rate limit global por IP (middleware)
- [ ] Añadir rate limit por tenant (`clinicId`)
- [ ] Añadir burst protection
- [ ] Añadir sliding window (opcional)
- [ ] Añadir detección de abuso distribuido

### Arquitectura
- [ ] Migrar TODO a D1/shared persistent rate limit
- [ ] Eliminar Maps en memoria (`rate-limit.ts` si obsoleto)
- [ ] Crear middleware centralizado `rate-limit-middleware.ts`

---

# 3. ENDURECER CSP Y XSS PROTECTION

## Problema

El frontend y Turnstile/reCAPTCHA requieren dominios externos en CSP.

En `csp.ts`:
- Producción: `script-src 'self'` (sin unsafe-inline/eval) ✅
- `style-src 'self' 'unsafe-inline'` en prod ⚠️
- `connect-src 'self'` puede bloquear CAPTCHA y APIs externas ⚠️

---

## Tasks

### CSP
- [ ] Mantener prod sin `'unsafe-eval'`
- [ ] Reducir `'unsafe-inline'` en styles (nonces/hashes)
- [ ] Añadir `script-src`/`connect-src` para Turnstile, Resend, dominio prod
- [ ] Implementar nonces CSP si Vite lo permite
- [ ] Añadir `report-uri` / `report-to`
- [ ] Evaluar Trusted Types

### Sanitización
- [ ] Revisar TODOS los `dangerouslySetInnerHTML`
- [ ] Añadir sanitización DOMPurify estricta donde aplique
- [ ] Revisar payloads XSS (`src/api/tests/xss-payloads.test.md`)
- [ ] Añadir CSP violation logging

---

# 4. ELIMINAR EXPOSICIÓN DE ERRORES INTERNOS

## Problema

Algunas rutas retornan:
- `error.message`
- `validation.error` detallado
- mensajes internos

---

## Tasks

- [ ] Reemplazar errores internos por mensajes genéricos en prod
- [ ] Crear sistema centralizado de error handling (`api/errors.ts`)
- [ ] Crear correlation IDs (`X-Request-Id`)
- [ ] Loggear detalles SOLO en servidor
- [ ] Añadir clasificación de errores
- [ ] Añadir error boundaries frontend

---

# 5. IMPLEMENTAR OBSERVABILIDAD REAL

## Problema

Actualmente existen logs básicos (Wrangler / `observability` en wrangler.toml), pero no observabilidad enterprise.

---

## Objetivos

Implementar:
- logs centralizados
- métricas
- alertas
- tracing
- monitoreo

---

## Tasks

### Logging
- [x] Integrar Sentry o similar
- [ ] Integrar Better Stack / Datadog / Logtail
- [x] Crear structured logs JSON
- [x] Añadir correlation IDs

### Métricas
- [ ] Tiempo respuesta endpoint
- [ ] Error rates
- [ ] Login failures
- [ ] Tenant usage
- [ ] D1 latency
- [ ] Queue latency (cuando existan colas)

### Alertas
- [ ] Alertas errores 500
- [ ] Alertas brute force
- [ ] Alertas spam email/API
- [ ] Alertas D1 failures
- [ ] Alertas consumo APIs externas (ver `CHECKLIST_DEPLOY_PRODUCCION.md` §0)

---

# PRIORIDAD ALTA

---

# 6. IMPLEMENTAR PROCESAMIENTO ASYNC

## Problema

Actualmente:
- emails
- Safe Browsing
- validaciones externas

son síncronas en el Worker.

Eso rompe escalabilidad y tiempo de CPU.

---

## Tasks

- [ ] Integrar Cloudflare Queues
- [ ] Mover emails a background jobs
- [ ] Mover análisis externos a colas
- [ ] Añadir retry policies
- [ ] Añadir dead-letter queue
- [ ] Añadir idempotencia

---

# 7. HARDENING DE SECRETOS

## Problema

Los secretos usan Wrangler Secrets pero:
- no hay rotación
- no hay versionado
- no hay invalidación masiva de sesiones al rotar

---

## Tasks

- [ ] Implementar rotación JWT
- [ ] Implementar rotación refresh tokens
- [ ] Añadir key versioning
- [ ] Añadir expiración configurable
- [ ] Eliminar defaults inseguros (`validate-env`, `validate-production-safety`)
- [ ] Fail-fast si faltan secrets (parcialmente hecho)
- [ ] Crear runbook rotación secretos

---

# 8. BACKUPS Y DISASTER RECOVERY

## Problema

No existe estrategia completa visible de:
- snapshots
- restore
- disaster recovery

---

## Tasks

- [x] Backups automáticos D1 (export programado → R2, cron 04:00 UTC)
- [x] Snapshot diario (Time Travel nativo CF + export SQL)
- [ ] Restore testing
- [x] Versionado backups (prefijo fecha en R2 + retención configurable)
- [x] Disaster recovery documentado (`CHECKLIST_DEPLOY_PRODUCCION.md` § 1)
- [ ] Simulación pérdida DB
- [ ] Backup R2 / política retención imágenes

---

# 9. UPLOAD SECURITY

## Problema

Hay validación en `logo-upload.ts` y límites de sesión; falta endurecimiento completo.

---

## Tasks

- [ ] MIME validation real
- [ ] Magic bytes validation (parcial en logos)
- [ ] Re-encode imágenes
- [ ] Strip metadata EXIF
- [ ] Antivirus scanning (opcional)
- [ ] File size quotas por tenant
- [ ] Upload sandboxing
- [ ] Rate limit uploads (parcial: logos 10/min)

---

# 10. MULTI-TENANT HARDENING

## Problema

Actualmente:
- shared DB
- isolation por `clinicId`

Funciona, pero necesita fortalecerse.

---

## Tasks

- [ ] Auditar TODAS las queries por tenant leakage
- [ ] Validar `clinicId` en TODAS las rutas
- [ ] Añadir tests automáticos tenant isolation
- [ ] Añadir tenant-aware caching
- [ ] Añadir tenant quotas
- [ ] Evaluar DB-per-tenant futuro

---

# PRIORIDAD MEDIA

---

# 11. RBAC AVANZADO

## Objetivo

Pasar de RBAC básico a:
- granular permissions
- ABAC parcial
- scope-based access

---

## Tasks

- [ ] Permisos por recurso
- [ ] Permisos por sucursal
- [ ] Permisos por doctor
- [ ] Permisos temporales
- [ ] Policy engine centralizado

---

# 12. COMPLIANCE MÉDICO

## Objetivo

Preparar cumplimiento:
- LFPDPPP
- GDPR
- HIPAA-ready architecture

---

## Tasks

- [ ] Consentimiento explícito (parcial en registro/settings)
- [ ] Exportación expediente
- [ ] Data retention policy (`user-retention.ts` — cron 8 meses)
- [ ] Secure deletion (`delete-user-cascade.ts`)
- [ ] Audit trails completos
- [ ] Encryption sensitive fields
- [ ] Access logging
- [ ] Privacy policy técnica

---

# 13. TESTING PROFESIONAL

## Problema

Faltan pruebas enterprise-grade automatizadas en CI.

---

## Tasks

### E2E
- [ ] Playwright
- [ ] Auth flows
- [ ] CSRF tests
- [ ] Multi-role tests

### Seguridad
- [ ] Automated XSS suite
- [ ] SQL injection suite
- [ ] SSRF testing
- [ ] CSP testing

### Performance
- [ ] k6 load testing
- [ ] D1 stress testing
- [ ] Queue load testing

---

# 14. CI/CD ENTERPRISE

## Tasks

- [ ] GitHub Actions
- [ ] Security scans
- [ ] Automated tests
- [ ] Deploy gates
- [ ] Rollback automático
- [ ] Separate staging/prod
- [ ] Secret scanning
- [ ] Dependency CVE scanning

---

# 15. MODULARIZAR DOMINIOS

## Problema

El repo crecerá demasiado horizontalmente.

---

## Objetivo

Separar bounded contexts:

- auth
- clinics
- patients
- sessions
- billing
- messaging
- notifications
- audit

---

## Tasks

- [ ] Crear arquitectura modular
- [ ] Separar services
- [ ] Separar repositories
- [ ] Separar domain logic
- [ ] Reducir acoplamiento frontend/backend

---

# PRIORIDAD FUTURA

---

# 16. BILLING / PLANES SaaS

## Tasks

- [ ] Subscription system
- [ ] Tenant plans
- [ ] Usage quotas
- [ ] Stripe integration
- [ ] Billing audit logs

---

# 17. AI FEATURES

## Tasks

- [ ] AI Gateway architecture (`AI_GATEWAY_*` en plantilla — no en uso)
- [ ] Rate limits IA
- [ ] Prompt injection protection
- [ ] AI audit logs
- [ ] Cost controls IA

---

# 18. EVENTUAL ENTERPRISE SCALE

## Tasks

- [ ] Evaluate PostgreSQL migration
- [ ] Queue scaling
- [ ] CDN optimization
- [ ] Multi-region strategy
- [ ] DB sharding strategy

---

# RECOMENDACIÓN DE ORDEN

## FASE 1 — CRÍTICO
1. Eliminar localStorage híbrido
2. Consolidar D1 como única fuente de verdad
3. Hardening CSP/XSS (+ dominios CAPTCHA)
4. Error handling centralizado
5. Rate limiting completo (reset-password, global, tenant)

## FASE 2 — PRODUCCIÓN REAL
6. Observabilidad
7. Queues async
8. Backups D1 + R2
9. Upload security
10. Secret rotation runbook
11. Completar `LISTA_DESPLIEGUE.md` fases 6–10

## FASE 3 — SaaS ESCALABLE
11. Multi-tenant hardening
12. Compliance
13. CI/CD
14. Testing

## FASE 4 — ENTERPRISE
15. Billing
16. AI
17. DB scaling
18. Infra avanzada

---

# INSTRUCCIONES PARA IA FULLSTACK

## Reglas obligatorias

- Nunca usar localStorage para datos sensibles
- Nunca confiar en frontend permissions
- Toda autorización debe validarse backend-side
- Toda query multi-tenant debe filtrar por `clinicId`
- Todo endpoint sensible debe tener rate limiting
- No usar `any` en TypeScript
- No usar SQL raw inseguro (usar Drizzle)
- No exponer `error.message` al cliente en producción
- No usar `unsafe-inline` / `unsafe-eval` en CSP producción para scripts
- Toda mutación sensible debe generar audit log
- Revisar `CHECKLIST_DEPLOY_PRODUCCION.md` §0 antes de activar APIs de pago

## Archivos de referencia rápida

| Tema | Archivo |
|------|---------|
| Rate limit acciones | `src/api/utils/action-rate-limit.ts` |
| Rate limit registro | `src/api/utils/registration-rate-limit.ts` |
| Rate limit login | `src/api/utils/rate-limit-d1.ts` |
| Email prod | `src/api/utils/email-service.ts` |
| CSP | `src/api/middleware/csp.ts` |
| Tenant | `src/api/utils/tenant-isolation.ts` |
| Deploy | `LISTA_DESPLIEGUE.md` |

---

# OBJETIVO FINAL

Convertir PodoAdmin de:

**"proyecto avanzado"**

a:

**"SaaS clínico enterprise-ready multi-tenant seguro y escalable"**.
