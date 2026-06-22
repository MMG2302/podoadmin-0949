# Lista de despliegue â€” PodoAdmin

**Documento principal** para ir marcando pasos y continuar en otras sesiones.  
**Empezar hoy (resumen):** `docs/DEPLOY_AHORA.md` Â· GuÃ­a detallada: `docs/DEPLOY_PASO_A_PASO.md` Â· Script Windows: `scripts/deploy-asistente.ps1`

---

## Estado del proyecto (rellenar tÃº)

| Campo | Valor |
|-------|--------|
| Fecha inicio | |
| URL producciÃ³n | `https://________________.workers.dev` o dominio |
| Nombre Worker (`wrangler.toml` â†’ `name`) | |
| D1 `database_id` | |
| D1 `database_name` | |
| R2 `bucket_name` | |
| Email super admin | |
| Ãšltimo paso completado | Fase ___ |

**Notas / bloqueos:**

```
(escribe aquÃ­ quÃ© fallÃ³ o quÃ© falta)
```

---

## Fase 0 â€” PreparaciÃ³n (hacer una sola vez)

- [ ] Carpeta del proyecto accesible (puede estar en el **Escritorio**; solo copiar a `C:\proyectos\podoadmin-0949` si el build falla por sincronizaciÃ³n en la nube)
- [ ] Node.js LTS instalado â†’ https://nodejs.org
- [ ] Cuenta Cloudflare â†’ https://dash.cloudflare.com
- [ ] Workers Paid activado (~5 USD/mes) + alerta de billing en Cloudflare
- [ ] `npm install` en la carpeta del proyecto
- [ ] `npm run setup:env` â†’ guardar copia de `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `CSRF_SECRET` (archivo `.dev.vars`)

---

## Fase 1 â€” Cloudflare: recursos en la nube

Dashboard: https://dash.cloudflare.com

- [ ] **D1** â†’ Create database (ej. `podoadmin-prod`) â†’ copiar **Database ID**
- [ ] **R2** â†’ Create bucket (ej. `podoadmin-prod`)
- [ ] Editar `wrangler.toml`:
  - [ ] `name` = nombre Ãºnico del worker
  - [ ] `database_name` y `database_id` de D1
  - [ ] `bucket_name` de R2
  - [ ] Bloque `[vars]` (ver `wrangler.production.example.toml`)
- [ ] En PC: `npx wrangler login`

---

## Fase 2 â€” Secretos y variables

### Secretos (terminal, pegar valor cuando pida)

- [ ] `npx wrangler secret put JWT_SECRET`
- [ ] `npx wrangler secret put REFRESH_TOKEN_SECRET`
- [ ] `npx wrangler secret put CSRF_SECRET`

### Variables en `wrangler.toml` [vars] (ajustar URL real)

- [ ] `NODE_ENV = "production"`
- [ ] `APP_BASE_URL` = URL pÃºblica de la app
- [ ] `ALLOWED_ORIGINS` = misma URL (o varias separadas por coma)
- [ ] `OFFICIAL_APP_DOMAIN` = misma URL (anti-phishing en login)

---

## Fase 3 â€” Base de datos y primer usuario

- [ ] `npm run db:migrate:remote`
- [ ] Crear super admin:
  ```powershell
  node scripts/create-super-admin.cjs "tu@email.com" "TuContraseÃ±aSegura123!" "Tu Nombre"
  npx wrangler d1 execute DB --remote --file=scripts/super-admin.sql
  ```
- [ ] **No** ejecutar `db:seed:remote` ni datos de prueba en producciÃ³n

---

## Fase 4 â€” Build y deploy

- [ ] `npm run build` (sin errores)
- [ ] `npm run deploy` â†’ copiar URL que muestra la terminal
- [ ] Si la URL cambiÃ³: actualizar `APP_BASE_URL`, `ALLOWED_ORIGINS`, `OFFICIAL_APP_DOMAIN` en `wrangler.toml`
- [ ] `npm run deploy` otra vez (tras corregir URLs)

---

## Fase 5 â€” Pruebas mÃ­nimas (smoke test)

- [ ] Abrir URL en navegador â†’ carga login
- [ ] Login con super admin
- [ ] Dashboard carga sin error
- [ ] Crear o ver un paciente / cita (flujo bÃ¡sico)
- [ ] Revisar **Workers** â†’ Logs (sin errores graves)

---

## Fase 6 â€” LÃ­mites de gasto en APIs (recomendado antes de abrir a muchos usuarios)

Detalle tÃ©cnico: `CHECKLIST_DEPLOY_PRODUCCION.md` Â§ 0.

- [ ] Alertas de gasto Cloudflare configuradas
- [ ] Decidir proveedor de **email** (Resend recomendado)
- [ ] (Opcional) **No** configurar `GOOGLE_SAFE_BROWSING_API_KEY` si no lo necesitas
- [ ] (Opcional) **No** configurar `AI_GATEWAY_*` (no se usa en la app actual)

| Servicio | Hecho | Notas |
|----------|-------|-------|
| Resend / SendGrid | [ ] | |
| Turnstile CAPTCHA | [ ] | |
| Safe Browsing | [ ] | Omitir si no aplica |

---

## Fase 7 â€” Email transaccional (Resend)

- [ ] Cuenta en https://resend.com
- [ ] `npx wrangler secret put RESEND_API_KEY`
- [ ] Variable `RESEND_FROM_EMAIL` (email verificado en Resend)
- [ ] DNS del dominio de envÃ­o: SPF, DKIM, DMARC (en Resend te indican los registros)
- [ ] Probar: solicitud reset password / registro (si aplica)

---

## Fase 8 â€” CAPTCHA + registro pÃºblico (opcional)

Solo si usarÃ¡s `/register`.

- [ ] Cloudflare **Turnstile** â†’ Site Key + Secret Key
- [ ] Variables: `CAPTCHA_PROVIDER=turnstile`, `CAPTCHA_SITE_KEY` en `[vars]`
- [ ] `npx wrangler secret put CAPTCHA_SECRET_KEY`
- [ ] `npm run deploy`
- [ ] Probar registro en `/register` y verificaciÃ³n en `/verify-email`

---

## Fase 9 â€” Dominio propio (opcional)

- [ ] Dominio en Cloudflare (DNS)
- [ ] Worker â†’ Settings â†’ Domains â†’ Custom domain (ej. `app.tudominio.com`)
- [ ] Actualizar las 3 URLs en `wrangler.toml` [vars]
- [ ] `npm run deploy`
- [ ] Probar login y aviso de dominio oficial en pantalla de login

---

## Fase 10 â€” Seguridad y cierre pre-producciÃ³n

Referencia: `CHECKLIST_DEPLOY_PRODUCCION.md` Â§ 1â€“7.

- [ ] Secretos de producciÃ³n **no** son los de desarrollo
- [ ] `IP_WHITELIST` vacÃ­a o muy restrictiva en producciÃ³n
- [ ] CORS: solo dominios en `ALLOWED_ORIGINS`
- [ ] Rate limit login probado (varios intentos fallidos)
- [ ] Documentar costos reales en `docs/ESTIMACION-COSTOS-Y-UTILIDAD-BRUTA.md` Â§ 1.2

---

## Fase 11 — Apertura masiva (muchas clínicas / usuarios)

Guía completa: **`docs/DEPLOY_MASIVO.md`**

- [ ] Copiar tier `standard` de rate limits a `wrangler.toml` (ver `wrangler.production.example.toml`)
- [ ] CAPTCHA Turnstile activo en producción
- [ ] Resend con tope mensual + alerta 80 %
- [ ] Sentry configurado
- [ ] Pruebas manuales de 429 (IP y tenant) en staging
- [ ] Piloto 1–5 clínicas → monitorizar 2 semanas
- [ ] Si >50 clínicas: revisar tier `scale` en `DEPLOY_MASIVO.md` § 4
- [ ] Backup D1: Time Travel + cron R2 + `npm run db:backup:remote` (ver `CHECKLIST_DEPLOY_PRODUCCION.md` § 1)

---

## Comandos rÃ¡pidos (copiar)

```powershell
cd "C:\proyectos\podoadmin-0949"

npm install
npm run setup:env
npx wrangler login

npm run db:migrate:remote
node scripts/create-super-admin.cjs "EMAIL" "PASSWORD" "NOMBRE"
npx wrangler d1 execute DB --remote --file=scripts/super-admin.sql

npm run build
npm run deploy
```

Asistente interactivo:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\deploy-asistente.ps1
```

---

## PrÃ³ximas sesiones (continuar aquÃ­)

Marca la **siguiente fase** que toque y borra la nota cuando termines.

| Prioridad | Fase | DescripciÃ³n |
|-----------|------|-------------|
| ðŸ”´ Alta | 0â€“5 | Primer deploy y login funcionando |
| ðŸŸ  Media | 6â€“7 | Gastos controlados + emails |
| ðŸŸ¡ Si aplica | 8 | Registro pÃºblico |
| ðŸŸ¢ DespuÃ©s | 9â€“10 | Dominio propio + checklist final |

**Siguiente paso acordado:**

- [ ] _________________________________________________

---

## Repomix (empaquetar cÃ³digo para IA)

Herramienta opcional: genera un solo archivo con todo el repo para pegarlo en ChatGPT/Cursor.

| Comando | QuÃ© hace |
|---------|----------|
| `npm run repomix` | Empaqueta **esta carpeta local** â†’ `repomix-output.xml` |
| `npm run repomix:remote` | Clona y empaqueta **GitHub** `MMG2302/podoadmin-0949` â†’ `repomix-remote-output.xml` |

Equivalente manual:

```powershell
npx repomix --remote MMG2302/podoadmin-0949
npx repomix --remote https://github.com/MMG2302/podoadmin-0949.git
npx repomix . -o repomix-output.xml
```

Los archivos generados estÃ¡n en `.gitignore` (son muy grandes).

---

## Documentos relacionados

| Archivo | Contenido |
|---------|-----------|
| **`docs/ROADMAP_TECNICO_AI.md`** | **Pendientes crÃ­ticos + fases 1â€“4 para IA/desarrollo** |
| `docs/DEPLOY_PASO_A_PASO.md` | ExplicaciÃ³n paso a paso (no programadores) |
| `CHECKLIST_DEPLOY_PRODUCCION.md` | Checklist tÃ©cnico (APIs, D1, seguridad) |
| `PRODUCCION_CONFIG.md` | Variables y secrets |
| `ENV_VARIABLES.md` | Lista completa de variables |
| `wrangler.production.example.toml` | Ejemplo de `wrangler.toml` producciÃ³n |
| `docs/GUIA_DESPLIEGUE.md` | GuÃ­a extendida + arquitectura |

---

*Ãšltima actualizaciÃ³n del cÃ³digo: registro pÃºblico, lÃ­mites de gasto en APIs, pÃ¡gina `/register`.*
