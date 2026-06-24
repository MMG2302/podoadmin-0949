# Mapa de módulos — mantenimiento por dominio

Referencia para dividir trabajo entre equipos sin reescribir el monolito de golpe.

## Entrega (notifications & async)

| Responsabilidad | Archivos |
|-----------------|----------|
| Cola async | `src/api/queues/` |
| Cron recordatorios | `src/api/utils/appointment-reminders-cron.ts` |
| WhatsApp API | `src/api/utils/whatsapp-meta-api.ts` |
| Email | `src/api/utils/email-service.ts` |
| Worker crons | `src/worker.ts` |

**Contrato:** ningún envío masivo síncrono en request HTTP; usar `enqueueNotification()`.

---

## CRM (pacientes y agenda)

| Responsabilidad | Archivos |
|-----------------|----------|
| Pacientes | `src/api/routes/patients.ts`, `src/web/pages/patients-page.tsx` |
| Citas | `src/api/routes/appointments.ts`, `src/web/pages/calendar-page.tsx` |
| Sesiones clínicas | `src/api/routes/sessions.ts`, `src/web/pages/sessions-page.tsx` |
| Scope multi-tenant | `src/api/utils/clinical-list-scope.ts`, `tenant-isolation.ts` |
| Listas registro | `src/api/routes/registration-lists.ts` |

---

## Diseño (marca y layout)

| Responsabilidad | Archivos |
|-----------------|----------|
| Layout clínico | `src/api/utils/clinical-layout.ts`, `clinical-layout-designer.tsx` |
| Marca de agua | `src/api/utils/workspace-watermark.ts`, `workspace-watermark-settings-section.tsx` |
| Logos | `src/api/utils/logo-upload.ts`, `clinics.ts`, `professionals.ts` |
| Compresión WebP cliente | `src/web/lib/image-compress.ts` |

---

## Usuarios y roles

| Responsabilidad | Archivos |
|-----------------|----------|
| Auth / JWT | `src/api/routes/auth.ts`, `middleware/auth.ts` |
| 2FA | `src/api/routes/two-factor-auth.ts` |
| Usuarios admin | `src/api/routes/users.ts`, `src/web/pages/users-page.tsx` |
| Recepcionistas | `src/api/routes/receptionists.ts` |
| Permisos | `src/api/utils/access-control.ts` |

---

## Tienda (inventario clínico)

No es e-commerce. Es stock de insumos del consultorio.

| Responsabilidad | Archivos |
|-----------------|----------|
| API inventario | `src/api/routes/clinical-features.ts` (inventory) |
| UI | `src/web/pages/clinical-tools-page.tsx` |
| Schema | `inventory_items` en `schema.ts` |

---

## Billing

| Responsabilidad | Archivos |
|-----------------|----------|
| Precios | `src/api/utils/billing-pricing.ts` |
| Stripe | `src/api/utils/stripe-client.ts`, `stripe-webhook.ts` |
| Suscripciones | `src/api/routes/subscriptions.ts` |
| UI | `src/web/pages/billing-page.tsx` |

---

## Cómo extraer un módulo (futuro)

1. Crear `src/api/modules/crm/index.ts` que re-exporte rutas.
2. Montar en `api/index.ts`: `app.route('/patients', crmPatientsRoutes)`.
3. Mover tests junto al módulo: `modules/crm/*.test.ts`.
4. No compartir estado global entre módulos; usar `database` y utils compartidos.
