# Desplegar PodoAdmin hoy (guÃ­a corta)

Para la lista completa con casillas: **`LISTA_DESPLIEGUE.md`**.  
GuÃ­a paso a paso larga: **`docs/DEPLOY_PASO_A_PASO.md`**.  
**Muchas clínicas / usuarios:** **`docs/DEPLOY_MASIVO.md`**

---

## Antes de empezar (15 minutos)

1. **Abre la carpeta del proyecto en PowerShell** (en tu PC estÃ¡ en el Escritorio):
   ```powershell
   cd "C:\Users\mvs92\OneDrive\Escritorio\clinic\podoadmin-0949"
   ```
   En Windows, el Escritorio suele estar en `C:\Users\...\OneDrive\Escritorio\...` aunque tÃº no hayas â€œsubidoâ€ el proyecto a OneDrive a mano: es la carpeta del escritorio sincronizada.

   **Si** `npm run build` falla con â€œproveedor de archivos de nubeâ€ o no puede leer archivos: en el Explorador, clic derecho en la carpeta del proyecto â†’ **Mantener siempre en este dispositivo**, o copia el proyecto a `C:\proyectos\podoadmin-0949`:
   ```powershell
   xcopy "C:\Users\mvs92\OneDrive\Escritorio\clinic\podoadmin-0949" "C:\proyectos\podoadmin-0949" /E /I /H
   cd C:\proyectos\podoadmin-0949
   ```
2. Instala [Node.js LTS](https://nodejs.org) si no lo tienes.
3. Entra en [Cloudflare Dashboard](https://dash.cloudflare.com) â†’ activa **Workers Paid** (~5 USD/mes) y una **alerta de billing**.

---

## SesiÃ³n 1 â€” Recursos en Cloudflare (30â€“45 min)

| Paso | DÃ³nde | QuÃ© hacer |
|------|--------|-----------|
| 1 | Terminal | `npm install` |
| 2 | Terminal | `npm run setup:env` â†’ guarda `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `CSRF_SECRET` |
| 3 | Terminal | `npx wrangler login` |
| 4 | Cloudflare â†’ **D1** | Crear base `podoadmin-prod` â†’ copiar **Database ID** |
| 5 | Cloudflare â†’ **R2** | Crear bucket `podoadmin-prod` |
| 6 | PC | Editar `wrangler.toml` (usa `wrangler.production.example.toml` como guÃ­a): `name`, D1, R2, bloque `[vars]` |

Ejemplo mÃ­nimo en `wrangler.toml`:

```toml
name = "podoadmin-TU-NOMBRE-UNICO"

[[d1_databases]]
binding = "DB"
database_name = "podoadmin-prod"
database_id = "TU-DATABASE-ID"
migrations_dir = "src/api/migrations"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "podoadmin-prod"

[vars]
NODE_ENV = "production"
APP_BASE_URL = "https://podoadmin-TU-NOMBRE-UNICO.workers.dev"
ALLOWED_ORIGINS = "https://podoadmin-TU-NOMBRE-UNICO.workers.dev"
OFFICIAL_APP_DOMAIN = "https://podoadmin-TU-NOMBRE-UNICO.workers.dev"
```

---

## SesiÃ³n 2 â€” Secretos y base de datos (20 min)

```powershell
npx wrangler secret put JWT_SECRET
npx wrangler secret put REFRESH_TOKEN_SECRET
npx wrangler secret put CSRF_SECRET

npm run db:migrate:remote

node scripts/create-super-admin.cjs "tu@email.com" "TuContraseÃ±aSegura123!" "Tu Nombre"
npx wrangler d1 execute DB --remote --file=scripts/super-admin.sql
```

**No** ejecutes `db:seed:remote` en producciÃ³n.

---

## SesiÃ³n 3 â€” Publicar (10 min)

```powershell
npm run build
npm run deploy
```

Copia la URL que muestra Wrangler. Si es distinta a la de `[vars]`, actualiza las 3 URLs en `wrangler.toml` y vuelve a ejecutar `npm run deploy`.

**Prueba:** abre la URL â†’ login con el super admin â†’ crea o abre un paciente.

---

## Opcional (cuando quieras abrir registro pÃºblico)

1. [Turnstile](https://dash.cloudflare.com/) â†’ Site Key + Secret Key (gratis).
2. En `wrangler.toml` `[vars]`:
   ```toml
   CAPTCHA_PROVIDER = "turnstile"
   CAPTCHA_SITE_KEY = "0x..."
   ```
3. `npx wrangler secret put CAPTCHA_SECRET_KEY`
4. `npm run deploy`

---

## Opcional â€” Email (Resend)

1. Cuenta en https://resend.com
2. `npx wrangler secret put RESEND_API_KEY`
3. `RESEND_FROM_EMAIL` en `[vars]` (dominio verificado)
4. `npm run deploy`

---

## Asistente interactivo (Windows)

```powershell
powershell -ExecutionPolicy Bypass -File scripts\deploy-asistente.ps1
```

---

## Si algo falla

| SÃ­ntoma | SoluciÃ³n |
|---------|----------|
| Build no arranca | `npm install` de nuevo; si sale error de â€œnubeâ€, copia a `C:\proyectos\podoadmin-0949` |
| 403 en login | Revisa `ALLOWED_ORIGINS` = URL exacta de la app |
| Registro sin CAPTCHA | Configura Turnstile (tabla arriba) |
| Email no llega | Resend + dominio verificado |

Marca tu progreso en **`LISTA_DESPLIEGUE.md`** (campo Â«Ãšltimo paso completadoÂ»).
