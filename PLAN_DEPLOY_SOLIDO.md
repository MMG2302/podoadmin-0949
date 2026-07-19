# Plan de deploy sólido — PodoAdmin

**Documento de referencia constante** para llevar PodoAdmin a producción (Cloudflare Workers + D1 + R2).

Última revisión: junio 2026.

---

## Índice rápido

1. [Estado actual del proyecto](#1-estado-actual-del-proyecto)
2. [Checklist ejecutable (copiar y marcar)](#2-checklist-ejecutable)
3. [Fase 0 — Preparación local](#3-fase-0--preparación-local)
4. [Fase 1 — Infraestructura Cloudflare](#4-fase-1--infraestructura-cloudflare)
5. [Fase 2 — Secretos y servicios](#5-fase-2--secretos-y-servicios)
6. [Fase 3 — BD, deploy y smoke tests](#6-fase-3--bd-deploy-y-smoke-tests)
7. [Fase 4 — Endurecimiento (código + operación)](#7-fase-4--endurecimiento)
8. [Comandos de referencia](#8-comandos-de-referencia)
9. [Errores habituales](#9-errores-habituales)
10. [Qué NO hacer en producción](#10-qué-no-hacer-en-producción)
11. [Operación continua](#11-operación-continua)
12. [Documentos relacionados](#12-documentos-relacionados)

---

## 1. Estado actual del proyecto

| Área | Estado | Notas |
|------|--------|-------|
| Arquitectura | ✅ Lista | Worker único: SPA (`dist/client`) + API (`/api/*`), D1, R2, crons |
| Build (`npm run build`) | ✅ Pasa | Bundle JS ~1.2 MB (aviso de rendimiento, no bloquea) |
| `wrangler.json` production | ❌ Pendiente | Placeholders: `podoadmin-pendiente`, `PENDIENTE-DATABASE-ID`, `PENDIENTE-KV-NAMESPACE-ID` |
| Secretos en Cloudflare | ❌ Pendiente | JWT, REFRESH, CSRF obligatorios |
| **Email (Resend)** | ⚠️ Parcial | `RESEND_API_KEY` en `.dev.vars` (local ✅). Producción: `wrangler secret put` + `RESEND_FROM_EMAIL` pendiente |
| **Stripe (facturación)** | ❌ Pendiente | Claves, precios y webhook — **requerido para cobrar suscripciones** |
| **CAPTCHA (Turnstile)** | ⚠️ Parcial | Widget listo; pendiente site/secret key en production |
| Tests (`npm test`) | ✅ 45/45 | `vitest.config.ts` restaurado |
| Scripts `deploy:production` | ✅ Listo | Incluye `--env production` en `package.json` |
| CI/CD | ⚠️ Parcial | `.github/workflows/ci.yml` (solo `bun run check`, sin tests) |
| Deuda `localStorage` | ✅ Cerrada | Tipos en `src/web/types/`; `storage.ts` eliminado |
| Documentación | ✅ Buena | Varios MD; **este es el índice maestro operativo** |

**Veredicto:** el código es desplegable; el cuello de botella es **configuración Cloudflare**, no arquitectura.

---

## 2. Checklist ejecutable

Marca en orden. No saltar al deploy sin completar Fase 1 y 2.

### Fase 0 — Local
- [ ] Carpeta de trabajo sin problemas de OneDrive (ver [§3](#3-fase-0--preparación-local))
- [ ] `npx wrangler login`
- [ ] `npm install`
- [ ] `npm run setup:env` → `.dev.vars` con JWT, REFRESH, CSRF (≥32 chars, distintos)
- [ ] `npm run build` OK
- [ ] `npm run deploy:prep` sin errores
- [ ] `npm run deploy:prep:full` OK (build + dry-run)

### Fase 1 — Cloudflare
- [ ] D1 creada: `podoadmin-prod` + `database_id` anotado
- [ ] R2 creado: bucket `podoadmin-prod`
- [ ] KV creado: namespace rate limit + `id` en `RATE_LIMIT_KV`
- [ ] `wrangler.json` → `env.production` completado (sin placeholders)
- [ ] Dominio configurado (Custom Domain) o URL `*.workers.dev` decidida

### Fase 2 — Secretos y servicios
- [ ] `JWT_SECRET` → `wrangler secret put --env production`
- [ ] `REFRESH_TOKEN_SECRET` → secret production
- [ ] `CSRF_SECRET` → secret production
- [ ] **Stripe** — cuenta, precios, secretos y webhook (ver [§5.2](#52-stripe-facturación--dato-inicial-pendiente))
- [x] **Resend (local)** — `RESEND_API_KEY` en `.dev.vars` (jun 2026)
- [ ] **Resend (producción)** — `wrangler secret put RESEND_API_KEY --env production` + `RESEND_FROM_EMAIL` verificado
- [ ] **Turnstile** — site key + secret en production (ver [§5.4](#54-captcha-registro-público))
- [ ] (Opcional) Sentry, Safe Browsing, SUPPORT_EMAIL

### Fase 3 — Deploy
- [ ] `npm run db:migrate:remote:production`
- [ ] Super admin creado (script + SQL remoto)
- [ ] `npm run deploy:production` (build + deploy con `--env production`)
- [ ] Smoke tests (ver [§6.4](#64-smoke-tests-post-deploy))

### Fase 4 — Endurecimiento
- [x] Limpieza legacy `storage.ts` (tipos en `src/web/types/`)
- [ ] (Opcional) Quitar copia `podoadmin_user` de localStorage
- [ ] Entorno staging (recomendado)
- [ ] CI/CD en GitHub Actions (recomendado)
- [ ] Backup D1 antes de migraciones grandes

---

## 3. Fase 0 — Preparación local

**Tiempo estimado:** 30 minutos.

### 3.1 Carpeta del proyecto

Preferir **`C:\proyectos\podoadmin-0949`** si OneDrive da errores de build (“proveedor de archivos de nube”):

```powershell
# Copia única si hace falta:
xcopy "C:\Users\mvs92\OneDrive\Escritorio\clinic\podoadmin-0949" "C:\proyectos\podoadmin-0949" /E /I /H
cd C:\proyectos\podoadmin-0949
```

Alternativa: clic derecho en la carpeta → **Mantener siempre en este dispositivo**.

### 3.2 Autenticación y dependencias

```bash
npm install
npx wrangler login
npx wrangler whoami
```

### 3.3 Variables locales de desarrollo

```bash
npm run setup:env
```

Genera `.dev.vars` con secretos locales. **No commitear** este archivo.

**Estado (jun 2026):** `RESEND_API_KEY` configurada en `.dev.vars` para desarrollo local. Pendiente `RESEND_FROM_EMAIL` (dominio verificado en Resend) y secret en Cloudflare para producción (ver [§5.3](#53-email-transaccional)).

Requisitos (validados por `scripts/prepare-deploy.cjs`):

| Variable | Regla |
|----------|-------|
| `JWT_SECRET` | ≥ 32 caracteres |
| `REFRESH_TOKEN_SECRET` | ≥ 32, **distinto** de JWT |
| `CSRF_SECRET` | ≥ 32 caracteres |

Generar valores seguros:

```bash
openssl rand -base64 32
```

### 3.4 Verificación pre-deploy

```bash
npm run build
npm run deploy:prep          # solo comprobaciones
npm run deploy:prep:full     # build producción + dry-run
```

Si `deploy:prep` lista errores con ✗, corregir antes de seguir.

---

## 4. Fase 1 — Infraestructura Cloudflare

**Tiempo estimado:** 1–2 horas.

### 4.1 Crear D1 y R2

```bash
npx wrangler d1 create podoadmin-prod
# Guardar el database_id que imprime el comando

npx wrangler r2 bucket create podoadmin-prod

npx wrangler kv namespace create "podoadmin-rate-limit-prod"
# Guardar el id para RATE_LIMIT_KV en env.production
```

En el dashboard: Workers habilitado, plan adecuado (Workers Paid si aplica volumen).

### 4.2 Configurar `wrangler.json` → `env.production`

Archivo: `wrangler.json` (el deploy de Vite usa este archivo).

Sustituir **todos** los placeholders:

```json
"production": {
  "name": "podoadmin",
  "vars": {
    "NODE_ENV": "production",
    "APP_BASE_URL": "https://app.tudominio.com",
    "ALLOWED_ORIGINS": "https://app.tudominio.com",
    "OFFICIAL_APP_DOMAIN": "https://app.tudominio.com"
  },
  "d1_databases": [{
    "binding": "DB",
    "database_name": "podoadmin-prod",
    "database_id": "<ID-REAL-DE-CLOUDFLARE>",
    "migrations_dir": "src/api/migrations"
  }],
  "r2_buckets": [{
    "bucket_name": "podoadmin-prod",
    "binding": "BUCKET"
  }],
  "kv_namespaces": [{
    "binding": "RATE_LIMIT_KV",
    "id": "<ID-REAL-KV-NAMESPACE>"
  }]
}
```

**Variables de URL en producción:**

| Variable | Uso |
|----------|-----|
| `APP_BASE_URL` | Enlaces en emails (reset password, verificación) — **principal en backend** |
| `ALLOWED_ORIGINS` | CORS con credenciales; debe coincidir con el origen del front |
| `OFFICIAL_APP_DOMAIN` | Aviso anti-phishing en login |

Las tres deben apuntar al **mismo dominio público** (sin barra final inconsistente).

Si aún no hay dominio propio, usa temporalmente `https://<nombre-worker>.<cuenta>.workers.dev` y actualiza después.

### 4.3 Dominio y HTTPS

1. Añadir dominio en Cloudflare (DNS).
2. Workers → tu Worker → **Custom Domains** → p. ej. `app.tudominio.com`.
3. Verificar que la app carga por `https://`.

### 4.4 Entorno staging (recomendado)

Duplicar bloque `production` como `staging` con:

- D1/R2 propios (`podoadmin-staging`)
- Dominio `staging.tudominio.com`
- Secrets separados

Probar el flujo completo en staging 1–2 días antes del go-live.

---

## 5. Fase 2 — Secretos y servicios

**Tiempo estimado:** 1–2 horas.

### 5.1 Secretos obligatorios (Worker no arranca sin ellos)

```bash
openssl rand -base64 32   # ejecutar 3 veces → 3 valores distintos

npx wrangler secret put JWT_SECRET --env production
npx wrangler secret put REFRESH_TOKEN_SECRET --env production
npx wrangler secret put CSRF_SECRET --env production
```

Validación en código: `src/api/utils/validate-env.ts` y `validate-production-safety.ts`.

### 5.2 Stripe (facturación) — dato inicial pendiente

**Obligatorio** si en producción los podólogos/clínicas pagan por suscripción (acceso vía `stripe_paid`). Sin esto, `stripeEnabled` queda en `false` y checkout/portal devuelven 503.

#### Cuenta y productos en Stripe Dashboard

1. Crear cuenta Stripe (modo **test** primero, luego **live**).
2. Crear **2 precios recurrentes mensuales** (alineados con `billing-pricing.ts`):
   - **Clínica** — $100 USD/mes (hasta 8 podólogos por defecto)
   - **Podólogo independiente** — $25 USD/mes
3. Anotar cada `price_...` (ID de precio).

#### Variables en Cloudflare (production)

| Variable | Tipo | Obligatorio | Uso |
|----------|------|-------------|-----|
| `STRIPE_SECRET_KEY` | **secret** | Sí | API backend (`sk_live_...` o `sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | **secret** | Sí | Firma de `POST /api/stripe/webhook` (`whsec_...`) |
| `STRIPE_PUBLISHABLE_KEY` | var | Sí (front) | Checkout / billing (`pk_live_...`) |
| `STRIPE_PRICE_CLINIC_MONTHLY_STANDARD` | var | Sí* | Precio clínica mensual (plan Base, $100) |
| `STRIPE_PRICE_INDEPENDENT_MONTHLY` | var | Sí* | Precio independiente mensual (plan Base, $25) |
| `STRIPE_PRICE_CLINIC_PREMIUM_MONTHLY` | var | Sí* | Precio clínica Premium mensual ($160: analíticas, herramientas clínicas, campañas) |
| `STRIPE_PRICE_INDEPENDENT_PREMIUM_MONTHLY` | var | Sí* | Precio independiente Premium mensual ($40) |
| `CLINIC_PODIATRIST_LIMIT` | var | No | Default `8` (podólogos incluidos en plan clínica) |

\* En producción conviene configurar **los cuatro** precios (Base y Premium por tipo de cuenta). Sin los precios Premium, el checkout/upgrade Premium responde `price_not_configured`.

```bash
npx wrangler secret put STRIPE_SECRET_KEY --env production
npx wrangler secret put STRIPE_WEBHOOK_SECRET --env production
# Vars en wrangler.json → env.production.vars:
# STRIPE_PUBLISHABLE_KEY, STRIPE_PRICE_CLINIC_MONTHLY_STANDARD, STRIPE_PRICE_INDEPENDENT_MONTHLY,
# STRIPE_PRICE_CLINIC_PREMIUM_MONTHLY, STRIPE_PRICE_INDEPENDENT_PREMIUM_MONTHLY
```

Referencia local: `.env.example` y `docs/DEV_MOCK_RESET.md`.

#### Webhook en Stripe

Stripe → **Developers → Webhooks → Add endpoint**:

| Campo | Valor |
|-------|--------|
| URL | `https://app.tudominio.com/api/stripe/webhook` |
| Eventos | `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` |

Copiar el **Signing secret** → `STRIPE_WEBHOOK_SECRET`.

#### Verificación

```bash
curl -s https://app.tudominio.com/api/public/config
# stripeEnabled: true  ·  stripePublishableKey presente
```

En la app: **Facturación** → «Suscribirse» debe abrir Stripe Checkout (no `stripe_not_configured`).

### 5.3 Email transaccional

**Obligatorio** si hay registro público, verificación de email o reset de contraseña.

| Estado | Detalle |
|--------|---------|
| Local | ✅ `RESEND_API_KEY` en `.dev.vars` (jun 2026) |
| Producción | ❌ `wrangler secret put RESEND_API_KEY --env production` |
| Pendiente | `RESEND_FROM_EMAIL` — remitente verificado en Resend |

| Proveedor | Secret / var |
|-----------|----------------|
| **Resend** (recomendado) | `RESEND_API_KEY` (secret), `RESEND_FROM_EMAIL` (var) |
| SendGrid | `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL` |
| AWS SES | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_SES_FROM_EMAIL` |

DNS del dominio de envío (reduce spam/phishing):

- **SPF** — TXT autorizando servidores de envío
- **DKIM** — firma; el proveedor da registros TXT
- **DMARC** — política de rechazo/cuarentena

### 5.4 CAPTCHA (registro público)

Proveedor del proyecto: **[Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)** (hosted en Cloudflare, sin VPS ni Docker).

1. En [Cloudflare Dashboard](https://dash.cloudflare.com/) → Turnstile → crear widget.
2. Añadir dominios: producción (`app.tudominio.com`) y, si pruebas en local, `localhost`.
3. Configurar en Cloudflare (production):

| Variable | Tipo | Uso |
|----------|------|-----|
| `CAPTCHA_PROVIDER` | var | `turnstile` (por defecto si se omite) |
| `CAPTCHA_SITE_KEY` | var | Site key pública del widget |
| `CAPTCHA_SECRET_KEY` | secret | Secret key para `siteverify` |

```bash
npx wrangler secret put CAPTCHA_SECRET_KEY --env production
# Vars en wrangler.json → env.production.vars:
# CAPTCHA_PROVIDER=turnstile, CAPTCHA_SITE_KEY=0x...
```

**Desarrollo local:** CAPTCHA desactivado por defecto. Para probar: `CAPTCHA_FORCE_IN_DEV=1` en `.dev.vars` + claves de prueba de Turnstile (ver `.dev.vars.example` y [testing keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)).

También se soportan hCaptcha y reCAPTCHA vía `CAPTCHA_PROVIDER`, pero **Turnstile es el camino previsto** (mismo ecosistema Cloudflare que el Worker).

### 5.5 Opcionales recomendables

| Variable | Uso |
|----------|-----|
| `SENTRY_DSN` | Errores en Worker |
| `VITE_SENTRY_DSN` | Errores en frontend |
| `GOOGLE_SAFE_BROWSING_API_KEY` | Reputación de URLs en mensajes |
| `SUPPORT_EMAIL` | Enlace de contacto en login |
| `ADMIN_EMAIL` | Config pública / alertas |

Detalle exhaustivo: `ENV_VARIABLES.md` y `PRODUCCION_CONFIG.md`.

---

## 6. Fase 3 — BD, deploy y smoke tests

**Tiempo estimado:** ~1 hora.

### 6.1 Migraciones remotas

```bash
npm run db:migrate:remote:production
```

Equivalente:

```bash
npx wrangler d1 migrations apply DB --remote --env production
```

### 6.2 Super administrador (solo primera vez)

```bash
node scripts/create-super-admin.cjs "admin@tudominio.com" "ContraseñaSegura123!" "Admin Principal"

npx wrangler d1 execute DB --remote --env production --file=scripts/super-admin.sql
```

Verificar login como `super_admin` en la URL de producción.

### 6.3 Deploy a producción

```bash
npm run deploy:production
```

Equivale a `build:production` + `wrangler deploy --env production`.

Dry-run previo:

```bash
npm run deploy:production:dry-run
```

**No usar** `npm run deploy` ni `wrangler deploy` sin `--env production`: despliega el entorno por defecto (`sandbox-website-template`).

### 6.4 Smoke tests post-deploy

| # | Prueba | Cómo verificar |
|---|--------|----------------|
| 1 | Salud API | `GET https://app.tudominio.com/api/ping` → respuesta JSON con timestamp |
| 2 | Login / logout | Super admin creado en §6.2 |
| 3 | Anti-phishing | Pantalla login muestra dominio oficial |
| 4 | Registro + Turnstile | Registro público completa el widget (si está habilitado) |
| 5 | Dashboard | Carga sin errores en consola |
| 6 | CRUD clínico | Crear/editar paciente, sesión, cita (según rol) |
| 7 | Archivos R2 | Subir imagen o adjunto en sesión/paciente |
| 8 | **Stripe / billing** | `GET /api/public/config` → `stripeEnabled: true`; checkout y portal en `/billing` |
| 9 | Email | Reset password o verificación (si email configurado) |
| 10 | CORS | Sin errores de origen en consola del navegador |
| 11 | Rate limit | Varios intentos de login fallidos → bloqueo razonable |
| 12 | Logs | Error de API incluye `requestId` (JSON o cabecera `X-Request-Id`) |

---

## 7. Fase 4 — Endurecimiento

Para que el deploy sea **sólido**, no solo “que arranque”.

### 7.1 Correcciones técnicas pendientes en el repo

| Prioridad | Tarea | Motivo |
|-----------|-------|--------|
| **Baja** | Quitar copia `podoadmin_user` de localStorage | Redundante con cookies de sesión |
| **Media** | Code-splitting del bundle (~1.2 MB) | Tiempo de carga inicial |
| **Media** | Ampliar CI: `npm test` + dry-run `--env production` | Regresiones y deploy al sandbox |
| **Baja** | Unificar páginas auth públicas con `authPage` | Consistencia UI / modo oscuro |

### 7.2 Deuda localStorage (resumen)

Archivo completo: `REVISION_PENDIENTE.md`.

**Migración funcional:** ✅ completa. **`storage.ts` eliminado;** tipos en `src/web/types/`.

**Opcional:** quitar copia `podoadmin_user` de localStorage en `auth-context`.

### 7.3 CI/CD sugerido (GitHub Actions)

Pipeline mínimo en cada PR:

```yaml
# .github/workflows/ci.yml (borrador)
- npm ci
- npm run lint
- npm test
- npm run build:production
- npx wrangler deploy --dry-run --env production
```

Deploy real solo en merge a `main`, con secrets en GitHub (`CLOUDFLARE_API_TOKEN`, etc.).

### 7.4 Tiempos estimados

| Escenario | Tiempo |
|-----------|--------|
| MVP en Workers (sin dominio propio, sin email) | 2–4 h |
| Producción seria (dominio, email, Turnstile, staging) | 1–2 días |
| Producción + endurecimiento (tests, CI, deuda código) | 3–5 días |

---

## 8. Comandos de referencia

### Desarrollo

```bash
npm run dev              # http://localhost:5173
npm run build
npm run lint
npm run setup:env
```

### Base de datos

```bash
npm run db:migrate                           # local
npm run db:migrate:remote                    # remoto (entorno default)
npm run db:migrate:remote:production         # remoto production
npm run db:backup:remote                     # backup D1
npm run db:seed:local                        # solo local — NUNCA en prod
```

### Deploy y comprobaciones

```bash
npm run deploy:prep
npm run deploy:prep:full
npm run deploy:production                    # build + deploy --env production
npm run deploy:production:dry-run
npm run check                                # typecheck + build + dry-run default
```

### Secretos (producción)

```bash
npx wrangler secret put JWT_SECRET --env production
npx wrangler secret put REFRESH_TOKEN_SECRET --env production
npx wrangler secret put CSRF_SECRET --env production
npx wrangler secret put STRIPE_SECRET_KEY --env production
npx wrangler secret put STRIPE_WEBHOOK_SECRET --env production
npx wrangler secret put CAPTCHA_SECRET_KEY --env production   # si registro público con Turnstile
```

### Alertas

```bash
npm run alerts:check
npm run alerts:check:remote
```

---

## 9. Errores habituales

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| Worker no arranca | Faltan o son cortos JWT / REFRESH / CSRF | `wrangler secret put` con ≥32 chars |
| CORS / cookies | Origen no está en `ALLOWED_ORIGINS` | Añadir URL exacta del front |
| Login raro en prod | `APP_BASE_URL` / `OFFICIAL_APP_DOMAIN` incorrectos | Alinear con URL real |
| Deploy va al sandbox | Falta `--env production` | Usar `wrangler deploy --env production` |
| 404 en ruta API nueva | Segmento no en lista blanca | `src/api/middleware/block-sensitive-paths.ts` |
| Migraciones fallan | Schema desactualizado | `db:migrate:remote:production` tras cada release con cambios D1 |
| Build falla en OneDrive | Sync de archivos | Usar `C:\proyectos\podoadmin-0949` |
| Checkout / suscripción no funciona | Stripe sin configurar o `price_` incorrecto | §5.2: secretos + precios + webhook |
| Emails no llegan | SPF/DKIM/DMARC o API key | Revisar proveedor + DNS |
| Registro falla en prod | Turnstile sin keys o dominio no autorizado en el widget | Ver §5.4; probar widget en login/registro |
| Rate limit global no aplica | KV `RATE_LIMIT_KV` con placeholder | Crear namespace y actualizar `wrangler.json` |

---

## 10. Qué NO hacer en producción

- ❌ Commitear `.dev.vars`, secretos o `TEST_CREDENTIALS.md`
- ❌ Ejecutar `npm run db:seed:remote` ni seeds mock en D1 remota
- ❌ Usar credenciales de prueba (`TEST_CREDENTIALS.md`) en prod
- ❌ Dejar `PENDIENTE-DATABASE-ID` o `podoadmin-pendiente` en `wrangler.json`
- ❌ Reutilizar secrets de desarrollo en production
- ❌ `wrangler deploy` sin `--env production` cuando el objetivo es prod
- ❌ Desplegar sin migraciones aplicadas en la D1 remota
- ❌ Usar claves Stripe **test** (`sk_test_` / `pk_test_`) en production con clientes reales

---

## 11. Operación continua

| Tarea | Cuándo |
|-------|--------|
| Backup D1 | Antes de migraciones grandes: `npm run db:backup:remote` |
| Migraciones | Tras cada release con cambios en `src/api/migrations` |
| Revisar logs | Cloudflare → Workers → Logs; correlacionar con `requestId` |
| Rotación secrets | Cada 6–12 meses o tras incidente |
| Health check externo | Monitor en `GET /api/ping` |
| Crons | Configurados en `wrangler.json` (mantenimiento horario) |

### Arquitectura de deploy (recordatorio)

```
┌─────────────┐     wrangler deploy      ┌─────────────────────────────┐
│ npm run     │  ──────────────────────► │ Cloudflare Worker           │
│ build:prod  │                            │  /api/*  → Hono API         │
└─────────────┘                            │  /*      → SPA (dist/client)│
                                           │  D1 (DB)  ·  R2 (BUCKET)    │
                                           └─────────────────────────────┘
```

Un deploy **no borra** la D1 remota: datos y migraciones son responsabilidad operativa.

### Nuevas rutas API

Si añades `/api/mi-modulo/...`, registrar el primer segmento en:

`src/api/middleware/block-sensitive-paths.ts` → `ALLOWED_API_FIRST_SEGMENTS`

---

## 12. Documentos relacionados

| Archivo | Cuándo usarlo |
|---------|----------------|
| **`PLAN_DEPLOY_SOLIDO.md`** (este) | Referencia constante y checklist completo |
| `CHECKLIST_DEPLOY_PRODUCCION.md` | Lista de casillas pre-deploy |
| `DESPLIEGUE_PRODUCCION.md` | Guía técnica (ping, requestId, R2, rutas) |
| `PRODUCCION_CONFIG.md` | Tablas de variables y orden de configuración |
| `ENV_VARIABLES.md` | Referencia exhaustiva de entorno |
| `docs/DEPLOY_AHORA.md` | Guía corta “desplegar hoy” |
| `docs/DEPLOY_PASO_A_PASO.md` | Paso a paso largo |
| `LISTA_DESPLIEGUE.md` | Lista alternativa con casillas |
| `REVISION_PENDIENTE.md` | Deuda localStorage / API |
| `TEST_CREDENTIALS.md` | Solo desarrollo local — no prod |

### Script de auditoría automática

```bash
npm run deploy:prep
npm run deploy:prep:full
```

Implementación: `scripts/prepare-deploy.cjs`

---

## Orden recomendado (resumen de una línea)

**Local OK → D1+R2+KV → wrangler.json → secrets (JWT + Stripe + Turnstile) → migrate → super admin → `npm run deploy:production` → smoke tests → endurecimiento (CI, deuda código).**
