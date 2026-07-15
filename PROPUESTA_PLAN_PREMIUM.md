# Propuesta: Tier Premium para PodoAdmin

> Estado: **propuesta** (no implementado). Documento de discusión para decidir qué funcionalidades pasan a ser de pago avanzado y cómo estructurarlo técnica y comercialmente.

## Contexto

Hoy el acceso es **binario**: pagas la suscripción (o estás en trial) y obtienes **todo**. No existe un tier premium ni entitlements por feature.

| Plan actual | Precio | Incluye |
|-------------|--------|---------|
| Podólogo independiente (`independent_monthly`) | $25/mes | Todo el producto |
| Clínica (`clinic_monthly`) | $100/mes | Todo el producto (hasta 8 podólogos) |

**Problema:** las funcionalidades de mayor valor comercial (campañas WhatsApp, analíticas de negocio) se entregan al mismo precio que las básicas de operación. Se está regalando el diferencial y no hay palanca de upsell.

## Objetivo

Separar lo **operativo diario** (core, debe estar siempre disponible para no frenar adopción) de lo **avanzado / de crecimiento** (analítica de negocio y marketing), y monetizar esto último como Premium.

## Principio de diseño

No mezclar **rol** con **plan**:

- **Rol** = *quién* puede ver una funcionalidad (podólogo vs recepción vs admin).
- **Entitlement/Plan** = *si el plan contratado incluye* esa funcionalidad.

Ejemplo: una recepcionista con plan Premium puede usar WhatsApp según su rol; una clínica sin Premium ve el checkout operativo pero las pestañas de analítica muestran un upsell.

## Qué va en cada plan

### Plan Base (se mantiene $25 / $100)
Todo lo necesario para trabajar el día a día:

- Agenda y calendario operativo
- Pacientes (ficha, antecedentes, demografía)
- Sesiones / historia clínica podológica + plantillas
- **Checkout operativo** (marcar pagado, handoffs)
- **WhatsApp Web básico** (mensajes de contacto)
- Configuración (logo, impresión, paleta, layout)

### Plan Premium (add-on o plan superior)
Crecimiento y control del negocio:

| Feature | Entitlement | Justificación |
|---------|-------------|---------------|
| Campañas WhatsApp | `whatsapp_campaigns` | Alto valor comercial, coste variable (API/Meta), uso intensivo. |
| Analíticas de cobro: **Ventas / Cobros / Rentabilidad** | `checkout_analytics` | Inteligencia de negocio, no operación diaria. |
| Métricas avanzadas de **Agenda** (ocupación, cierres diarios, dashboards) | `agenda_analytics` | Análisis y proyección, no el calendario operativo. |

### Qué NO se bloquea nunca
- Checkout operativo (frena cobro diario si se bloquea).
- WhatsApp Web básico (canal de contacto esencial).
- Agenda / calendario del día (core del producto).

## Modelo técnico propuesto

### 1. Entitlements
Añadir capa de entitlements por suscripción/clínica:

```ts
type Entitlements = {
  whatsapp_campaigns: boolean;
  checkout_analytics: boolean;
  agenda_analytics: boolean;
};
```

- Persistir en tabla `subscriptions` (columna JSON) o nueva tabla `plan_entitlements`.
- Mapear `planId` → entitlements en `src/api/utils/billing-pricing.ts`.

### 2. Stripe
- Nuevo producto/precio: add-on Premium o plan superior (`clinic_premium_monthly`, `independent_premium_monthly`).
- Metadata en checkout/webhook (`upsertSubscriptionFromStripe`) para persistir entitlements.
- UI de upgrade en `billing-settings-section.tsx`.

### 3. Middleware API
Nuevo `requireFeature(entitlement)` aplicado a:

- **Campañas WhatsApp:** rutas `/whatsapp-campaigns*`
- **Analíticas cobro:** `/checkout-handoffs/analytics*`, `analytics-preferences`
- **Agenda avanzada:** `/clinical-dashboard/appointment-metrics`, `/checkout-handoffs/daily-closes*`

(WhatsApp Web y checkout operativo se mantienen solo bajo `requireActiveSubscription` + rol.)

### 4. Frontend
- Exponer entitlements en `/subscriptions/me` y en `auth-context`.
- Ocultar/upsell pestañas en `checkout-page.tsx` / `CheckoutViewTabs` sin `checkout_analytics` / `agenda_analytics`.
- Marcar/gate el ítem "Campañas WhatsApp" en `use-sidebar-nav-items.tsx`.
- Pantalla/banner de upsell (reutilizar patrón del 402 de `requireActiveSubscription`).

### 5. Documentación
Actualizar `PLAN_DEPLOY_SOLIDO.md`, `billing-pricing.ts` y `docs/ESTIMACION-COSTOS-Y-UTILIDAD-BRUTA.md` con el nuevo tier y márgenes.

## MVP sugerido

1. Entitlements en DB (columna JSON en `subscriptions`).
2. `requireFeature()` en 6–8 endpoints.
3. Gating UI: pestañas de checkout analytics + nav de campañas WhatsApp.
4. Un precio Stripe add-on Premium.
5. Banner de upsell.

No es necesario adoptar Autumn; el stack Stripe actual ya soporta la base.

## Archivos clave (referencia)

| Qué | Dónde |
|-----|-------|
| Precios / planKey | `src/api/utils/billing-pricing.ts` |
| Estado suscripción / Stripe sync | `src/api/utils/subscription-service.ts` |
| Rutas suscripción | `src/api/routes/subscriptions.ts` |
| Control de acceso | `src/api/utils/access-control.ts` |
| Middleware suscripción | `src/api/middleware/subscription.ts` |
| Permisos rol (front) | `src/web/hooks/use-permissions.ts` |
| Pestañas checkout | `src/web/pages/checkout-page.tsx` |
| Nav sidebar | `src/web/hooks/use-sidebar-nav-items.tsx` |
