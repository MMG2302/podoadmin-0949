# Plan de transformación PodoAdmin

## Alcance acordado

| Grupo | Decisión |
|-------|----------|
| **1** | Recetas → backend. Sin créditos. Suscripción mensual por acceso. Solo Google OAuth. Sin localStorage para datos de negocio. |
| **2** | Plantillas de sesión, evolución, protocolos/checklist, informes PDF, derivaciones, alertas clínicas, inventario, firma paciente. |
| **3** | Recordatorios solo WhatsApp si hay teléfono. Config: 5/2/1 días + horas (scroll). Lista espera, agenda multi-podólogo, check-in, métricas agenda. |
| **4** | Campañas WhatsApp. Sin encuestas, portal paciente ni SMS. |
| **5** | Sin créditos ni facturación CFDI. Mantener `podiatrist_limit`. |
| **6** | Cumplimiento completo (access log, export, retención, legal hold, DPA). |
| **7** | No IA ni dictado. |
| **8** | Laboratorio (adjuntos). Sin app offline/PWA (solo uso con conexión). |
| **9** | CI/CD y colas según necesidades de grupos anteriores. |

## Fases de implementación

### Fase A — Fundación (esta iteración)
- [x] Migración `0024_transformacion.sql`
- [x] Rutas: `/prescriptions`, `/subscriptions`, `/auth/google/*`, `/clinical/*`, `/compliance/*`, `/lab-attachments`, `/whatsapp-campaigns`
- [x] Eliminar uso de créditos en API y permisos
- [x] Middleware `requireActiveSubscription`
- [x] Cron recordatorios de cita (WhatsApp)
- [x] Frontend recetas vía API; preferencias UI solo en `ui-preferences.ts`

### Fase B — Clínica (grupo 2) ✅
- [x] Página `/clinical-tools` (plantillas, inventario, derivaciones)
- [x] Alertas clínicas y laboratorio en ficha paciente
- [x] Checklist en sesión, firma tablet, PDF evolución

### Fase C — Agenda y WhatsApp (grupos 3–4) ✅ (esta iteración)
- [x] Settings recordatorios (días 5/2/1 + horas)
- [x] Métricas agenda, check-in, lista espera visible
- [x] UI campañas `/whatsapp-campaigns`

### Fase D — Cumplimiento (6, 8, 9)
- Pantallas legal hold / export mejorado
- [x] Upload laboratorio → R2 (`POST /api/lab-attachments/upload`)
- [x] ~~PWA offline / sync móvil~~ **excluido** (riesgo de datos en dispositivo; solo web online)

### Fase E — Stripe (mensual / anual + tramos por podólogos) ✅
- [x] Migración `0025_stripe_and_clinical.sql`, `0026_billing_tiers.sql`
- [x] Checkout + portal + webhook (`/api/stripe/webhook`)
- [x] UI `/billing` con selector mensual/anual
- [x] Tarifa clínica: hasta N podólogos (`standard`) vs más de N (`expanded`, por defecto N=5)
- [x] Auto-sync Stripe al subir/bajar de tramo (alta/baja podólogo, disable/ban/delete) + botón manual en `/billing`

## Variables de entorno nuevas

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=   # ej. https://app.podoadmin.com/api/auth/google/callback
SUBSCRIPTION_GRACE_DAYS=3
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PODIATRIST_TIER_MAX=5
# Clínica (crear 4 precios recurrentes en Stripe: mensual/anual × standard/expanded)
STRIPE_PRICE_CLINIC_MONTHLY_STANDARD=price_...
STRIPE_PRICE_CLINIC_MONTHLY_EXPANDED=price_...
STRIPE_PRICE_CLINIC_ANNUAL_STANDARD=price_...
STRIPE_PRICE_CLINIC_ANNUAL_EXPANDED=price_...
# Podólogo independiente
STRIPE_PRICE_INDEPENDENT_MONTHLY=price_...
STRIPE_PRICE_INDEPENDENT_ANNUAL=price_...
# Legacy (opcional, equivale a clínica mensual standard o independiente mensual)
STRIPE_PRICE_ID_MONTHLY=price_...
APP_BASE_URL=https://app.tudominio.com
```

Webhook en Stripe Dashboard: `POST https://tudominio.com/api/stripe/webhook`  
Eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`

## Notas

- Tablas legacy `user_credits`, `clinic_credits` se conservan en D1 pero no se usan en código.
- `localStorage` permitido únicamente: idioma, tema, sidebar colapsado.
