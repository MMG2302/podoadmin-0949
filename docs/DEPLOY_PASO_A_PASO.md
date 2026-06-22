# Desplegar PodoAdmin â€” guÃ­a para quien no programa

**Marca tu progreso en:** [`LISTA_DESPLIEGUE.md`](../LISTA_DESPLIEGUE.md) (documento principal para continuar en otras sesiones).

**Tiempo estimado:** 2â€“4 horas la primera vez (con esta guÃ­a).  
**Coste aproximado:** ~5 USD/mes en Cloudflare (Workers Paid) + dominio opcional + email (Resend tiene plan gratis limitado).

> **Importante:** Nadie puede desplegar *por ti* sin acceso a **tu** cuenta de Cloudflare. Esta guÃ­a te dice exactamente quÃ© hacer en tu PC y en la web de Cloudflare.

---

## QuÃ© vas a conseguir al terminar

- Una URL pÃºblica, por ejemplo: `https://podoadmin-tuempresa.workers.dev` (gratis, sin comprar dominio).
- O tu dominio propio: `https://app.tudominio.com` (si ya tienes dominio en Cloudflare).
- Login con un **super administrador** que tÃº creas.
- Base de datos y archivos (fotos) en la nube de Cloudflare.

---

## Antes de empezar â€” checklist de cuentas

| # | Necesitas | DÃ³nde registrarte |
|---|-----------|-------------------|
| 1 | Cuenta Cloudflare (gratis; Workers Paid ~5 USD/mes) | https://dash.cloudflare.com |
| 2 | Node.js instalado en tu PC | https://nodejs.org (botÃ³n LTS) |
| 3 | (Recomendado) Email transaccional | https://resend.com (para verificaciÃ³n de registro y avisos) |
| 4 | (Si habrÃ¡ registro pÃºblico) CAPTCHA Turnstile | Mismo dashboard Cloudflare â†’ **Turnstile** |
| 5 | Tarjeta o PayPal | Para activar Workers Paid en Cloudflare |

**UbicaciÃ³n del proyecto:** Puede estar en el **Escritorio** sin problema. En muchos PCs Windows la ruta del Escritorio es `C:\Users\...\OneDrive\Escritorio\...` aunque tÃº no hayas â€œsubidoâ€ el proyecto a OneDrive manualmente. **Solo** copia a `C:\proyectos\podoadmin-0949` si al hacer `npm run build` aparece un error del proveedor de archivos en la nube o archivos bloqueados.

---

## PARTE A â€” En tu computadora (PowerShell)

Abre **PowerShell** (clic derecho en Inicio â†’ Windows PowerShell).

### A1. Ir a la carpeta del proyecto

```powershell
cd "C:\proyectos\podoadmin-0949"
```

*(Ajusta la ruta si dejaste el proyecto en otro sitio.)*

### A2. Instalar dependencias

```powershell
npm install
```

Espera a que termine sin errores.

### A3. Generar claves secretas (JWT, CSRFâ€¦)

```powershell
npm run setup:env
```

Se crea `.dev.vars` con claves aleatorias (secretos solo en el host). **No lo subas a internet ni lo compartas.**

Abre `.dev.vars` con el Bloc de notas y **copia** estas tres lÃ­neas en un documento Word temporal (las usarÃ¡s en Cloudflare):

- `JWT_SECRET=...`
- `REFRESH_TOKEN_SECRET=...`
- `CSRF_SECRET=...`

### A4. Conectar tu PC con Cloudflare

```powershell
npx wrangler login
```

Se abre el navegador â†’ inicia sesiÃ³n en Cloudflare â†’ autoriza.

### A5. Crear base de datos y almacenamiento (en la web)

1. Entra en https://dash.cloudflare.com  
2. MenÃº **Storage & databases** â†’ **D1** â†’ **Create database**  
   - Nombre sugerido: `podoadmin-prod`  
   - Copia el **Database ID** (UUID largo).  
3. MenÃº **R2** â†’ **Create bucket**  
   - Nombre sugerido: `podoadmin-prod` (mismo nombre estÃ¡ bien).

### A6. Editar `wrangler.toml` (Bloc de notas)

Abre el archivo `wrangler.toml` en la raÃ­z del proyecto y cambia:

| Campo | QuÃ© poner |
|-------|-----------|
| `name` | Un nombre Ãºnico, ej. `podoadmin-mi-clinica` (serÃ¡ parte de la URL `*.workers.dev`) |
| `database_name` | `podoadmin-prod` (el nombre de tu D1) |
| `database_id` | El UUID que copiaste en A5 |
| `bucket_name` (R2) | `podoadmin-prod` |

AÃ±ade **al final del archivo** (sustituye la URL cuando la sepas en el paso A10):

```toml
[vars]
NODE_ENV = "production"
APP_BASE_URL = "https://podoadmin-mi-clinica.workers.dev"
ALLOWED_ORIGINS = "https://podoadmin-mi-clinica.workers.dev"
OFFICIAL_APP_DOMAIN = "https://podoadmin-mi-clinica.workers.dev"
```

*(Si mÃ¡s adelante usas dominio propio, cambia las tres URLs por `https://app.tudominio.com`.)*

Guarda el archivo.

### A7. Subir secretos a Cloudflare

Ejecuta **una vez por cada secreto**. Cuando pida valor, pega la lÃ­nea completa desde `.dev.vars` (solo la parte despuÃ©s del `=` o la lÃ­nea entera segÃºn pida wrangler):

```powershell
npx wrangler secret put JWT_SECRET
npx wrangler secret put REFRESH_TOKEN_SECRET
npx wrangler secret put CSRF_SECRET
```

**Opcional pero recomendado** (email + registro):

```powershell
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put CAPTCHA_SECRET_KEY
```

Variables pÃºblicas de CAPTCHA y email (no son secretas) puedes aÃ±adirlas en el dashboard: Worker â†’ **Settings** â†’ **Variables**:

| Variable | Ejemplo |
|----------|---------|
| `RESEND_FROM_EMAIL` | `noreply@tudominio.com` |
| `CAPTCHA_PROVIDER` | `turnstile` |
| `CAPTCHA_SITE_KEY` | (de Turnstile, clave del sitio) |

### A8. Crear tablas en la base de datos remota

```powershell
npm run db:migrate:remote
```

Si falla, verifica que `database_id` en `wrangler.toml` sea el correcto.

### A9. Crear tu usuario administrador

Sustituye email, contraseÃ±a y nombre (la contraseÃ±a entre comillas si tiene sÃ­mbolos):

```powershell
node scripts/create-super-admin.cjs "tu@email.com" "TuContraseÃ±aSegura123!" "Tu Nombre"
npx wrangler d1 execute DB --remote --file=scripts/super-admin.sql
```

**Guarda ese email y contraseÃ±a** en un gestor de contraseÃ±as.

### A10. Compilar y desplegar

```powershell
npm run build
npm run deploy
```

Al terminar verÃ¡s una URL como:

`https://podoadmin-mi-clinica.workers.dev`

**Vuelve a `wrangler.toml`** y confirma que `APP_BASE_URL`, `ALLOWED_ORIGINS` y `OFFICIAL_APP_DOMAIN` usan **esa misma URL**. Luego despliega otra vez:

```powershell
npm run deploy
```

### A11. Probar

1. Abre la URL en el navegador.  
2. Debe cargar la pantalla de login.  
3. Entra con el email y contraseÃ±a del paso A9.  
4. Prueba crear un paciente o ver el panel.

---

## PARTE B â€” En Cloudflare (panel web)

### B1. Activar Workers Paid

1. Dashboard â†’ **Workers & Pages** â†’ tu worker `podoadmin-...`  
2. Si pide plan, elige **Workers Paid** (~5 USD/mes).  
3. **Billing** â†’ activa **alertas de gasto** (email cuando pase de X USD).

### B2. Turnstile (CAPTCHA para registro)

1. **Turnstile** â†’ Create site  
2. Dominio: tu URL `*.workers.dev` o tu dominio  
3. Copia **Site Key** â†’ variable `CAPTCHA_SITE_KEY`  
4. **Secret Key** â†’ `npx wrangler secret put CAPTCHA_SECRET_KEY`  
5. Variable `CAPTCHA_PROVIDER` = `turnstile`

### B3. Resend (emails)

1. Crea cuenta en https://resend.com  
2. API Keys â†’ crea key â†’ `wrangler secret put RESEND_API_KEY`  
3. Verifica un dominio o usa el de prueba de Resend para empezar  
4. Variable `RESEND_FROM_EMAIL` = remitente verificado  

Sin email: el login funciona; registro pÃºblico y â€œolvidÃ© contraseÃ±aâ€ no enviarÃ¡n correos reales.

### B4. Dominio propio (opcional, despuÃ©s)

1. Compra o trae el dominio a Cloudflare (DNS).  
2. Workers â†’ tu proyecto â†’ **Settings** â†’ **Domains & Routes** â†’ **Add Custom Domain**  
3. Ejemplo: `app.tudominio.com`  
4. Actualiza en `wrangler.toml` las tres URLs y vuelve a `npm run deploy`.

---

## PARTE C â€” QuÃ© configurar segÃºn lo que necesites

| Necesidad | Â¿Obligatorio? | QuÃ© hacer |
|-----------|---------------|-----------|
| Solo uso interno (admin crea usuarios) | MÃ­nimo | Parte A hasta A11 + super_admin |
| Registro pÃºblico en `/register` | Extra | Turnstile + Resend |
| Dominio profesional | Opcional | Parte B4 |
| Google Safe Browsing en mensajes | Opcional | No configurar si no sabes; ahorra complejidad |

---

## Errores frecuentes

| Mensaje / sÃ­ntoma | SoluciÃ³n |
|-------------------|----------|
| `El proveedor de archivos de nube no se estÃ¡ ejecutando` | Pausa OneDrive o mueve el proyecto fuera de OneDrive |
| `wrangler login` no abre navegador | Ejecuta PowerShell como usuario normal, no en red corporativa bloqueada |
| Login â€œcredenciales invÃ¡lidasâ€ tras deploy | Repite A9 (create-super-admin + d1 execute --remote) |
| PÃ¡gina en blanco tras deploy | Revisa que `npm run build` terminÃ³ bien; mira **Workers** â†’ **Logs** |
| No llegan emails | Configura Resend + `RESEND_FROM_EMAIL`; revisa spam |
| Registro pide CAPTCHA y no hay widget | Configura Turnstile (B2) y redeploy |

---

## Orden resumido (imprimir)

1. Instalar Node â†’ `npm install` â†’ `npm run setup:env`  
2. `npx wrangler login`  
3. Crear D1 + R2 en dashboard  
4. Editar `wrangler.toml` (name, database_id, vars)  
5. `wrangler secret put` (JWT, REFRESH, CSRF)  
6. `npm run db:migrate:remote`  
7. `create-super-admin` + `d1 execute --remote`  
8. `npm run build` â†’ `npm run deploy`  
9. Probar login en la URL  
10. (Opcional) Resend + Turnstile + dominio  

---

## Si necesitas ayuda externa

Contrata **1â€“2 horas** con alguien que sepa Cloudflare Workers y entrÃ©gale:

- Esta guÃ­a  
- Acceso temporal a tu cuenta Cloudflare (o que te guÃ­e por videollamada)  
- El archivo `.dev.vars` **solo por canal seguro** (nunca por WhatsApp pÃºblico)

Documentos tÃ©cnicos adicionales: `CHECKLIST_DEPLOY_PRODUCCION.md`, `PRODUCCION_CONFIG.md`, `ENV_VARIABLES.md`.

---

## Script de ayuda en Windows

En PowerShell, desde la carpeta del proyecto:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\deploy-asistente.ps1
```

El script comprueba Node, instala dependencias y te recuerda los pasos que debes hacer tÃº en el navegador.

---

**Cuando termines un bloque de pasos, actualiza las casillas en [`LISTA_DESPLIEGUE.md`](../LISTA_DESPLIEGUE.md).**
