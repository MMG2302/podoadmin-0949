# Reinicio local con datos mock

## Comando rápido

```bash
npm run db:reset:local
npm run dev
```

Abre http://localhost:5173 e inicia sesión con las cuentas de abajo.

## Qué hace `db:reset:local`

1. Borra `.wrangler/state/v3/d1` (base SQLite local).
2. Aplica todas las migraciones (`db:migrate`).
3. Carga seeds: usuarios, clínicas, 3 podólogos extra en Centro Médico (6 total), suscripciones de prueba, **3 pacientes demo y 2 sesiones** con exploración podológica.

> **Importante:** el reset **borra** pacientes, sesiones y diseños clínicos guardados en la UI. Solo persisten los mocks del seed. Configuración de WhatsApp en plantillas va en `localStorage` del navegador.

## Cuentas de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Super admin | `admin@podoadmin.com` | `admin123` |
| Admin plataforma | `support@podoadmin.com` | `support123` |
| Admin clínica (Premium, 3 podólogos) | `maria.fernandez@premium.com` | `manager123` |
| Admin clínica (Centro Médico, **6 podólogos**) | `juan.garcia@centromedico.com` | `manager123` |
| Admin clínica (Integral Plus) | `sofia.rodriguez@integralplus.com` | `manager123` |
| Podólogo en clínica | `doctor1@premium.com` | `doctor123` |
| Podólogo independiente | `pablo.hernandez@gmail.com` | `doctor123` |

## Escenarios de facturación mock

| Clínica / usuario | Podólogos activos | Suscripción seed | Para probar |
|-------------------|-------------------|------------------|-------------|
| `clinic_001` Premium | 3 | Trial standard | Facturación, tramo ≤5 |
| `clinic_002` Centro Médico | **6** | Active **expanded** + IDs Stripe mock | Tramo >5, sync tier |
| `clinic_003` Integral Plus | 3 | Active **expanded** en DB (desfase) | Botón bajar a standard |
| `user_podiatrist_010` | — | Trial independiente | Checkout podólogo solo |

### Probar subida/bajada de tramo

1. Login como `juan.garcia@centromedico.com` → **Facturación**.
2. Deshabilitar podólogos (super_admin) hasta quedar ≤5 → debería ofrecer bajar tarifa (auto + manual).
3. Alta de podólogo 6.º → subida automática (si Stripe configurado) o sync manual.

### Stripe en local (opcional)

Sin claves Stripe, la UI de facturación funciona; checkout real requiere `.dev.vars`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PODIATRIST_TIER_MAX=5
STRIPE_PRICE_CLINIC_MONTHLY_STANDARD=price_...
STRIPE_PRICE_CLINIC_MONTHLY_EXPANDED=price_...
STRIPE_PRICE_CLINIC_ANNUAL_STANDARD=price_...
STRIPE_PRICE_CLINIC_ANNUAL_EXPANDED=price_...
STRIPE_PRICE_INDEPENDENT_MONTHLY=price_...
STRIPE_PRICE_INDEPENDENT_ANNUAL=price_...
APP_BASE_URL=http://localhost:5173
```

```bash
stripe listen --forward-to localhost:8787/api/stripe/webhook
```

## Regenerar contraseñas del seed SQL

```bash
node scripts/seed-mock-users.cjs
npm run db:reset:local
```
