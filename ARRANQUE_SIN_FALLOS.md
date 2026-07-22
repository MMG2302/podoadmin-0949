# Arranque sin fallos (dev local + túnel para demo)

Runbook para levantar PodoAdmin localmente y exponerlo por túnel público (demo/pruebas en otro PC) sin caer en los problemas ya diagnosticados en esta sesión.

## TL;DR (comandos, en orden)

```bash
# 1. Compilar (siempre antes de servir; wrangler dev NO tiene hot reload)
npm run build

# 2. Servir el Worker real (NO usar `npm run dev` para demo con túnel — ver por qué abajo)
node node_modules/wrangler/bin/wrangler.js dev --port 8787 --local

# 3. En otra terminal: túnel público apuntando al puerto 8787 (NO al 5173)
"$USERPROFILE/AppData/Local/cloudflared/cloudflared.exe" tunnel --url http://localhost:8787
```

Verificar que quedó sano antes de compartir la URL:

```bash
curl -s -o /dev/null -w "HTTP=%{http_code}\n" http://localhost:8787/api/ping        # debe dar 200
curl -s -o /dev/null -w "HTTP=%{http_code}\n" -X POST http://localhost:8787/api/appointments/x/confirmation-link  # debe dar 403 (CSRF), NUNCA 500
```

## Por qué NO usar `npm run dev` (vite) + cloudflared para demo

`npm run dev` levanta Vite con `@cloudflare/vite-plugin`, que internamente proxea las peticiones `/api/*` hacia un Worker simulado (miniflare). Ese proxy **rompe con las peticiones POST que llegan a través de un túnel cloudflared**: los GET responden 200 normal, pero cualquier POST (enviar WhatsApp, borrar algo, guardar un formulario) devuelve `500 Internal Server Error` con el mensaje `fetch failed` en `ProxyClientBridge.dispatchFetch`.

Verificado en esta sesión: el mismo POST contra `localhost:5173` directo SÍ funciona (devuelve 403 CSRF, el comportamiento normal sin sesión). Contra el túnel apuntando a 5173, el mismo POST siempre da 500. Es un problema de la capa Vite→miniflare bajo túnel, no del código de la app.

**Regla**: si vas a exponer la app por túnel para que alguien más la pruebe, usa `wrangler dev` (Worker real, sin ese proxy), nunca `npm run dev`.

## Flujo correcto, paso a paso

### 1. Compilar
```bash
npm run build
```
Genera `dist/client` (frontend) y el worker. **Sin hot reload**: cualquier cambio de código (frontend o backend) requiere repetir este paso y que `wrangler dev` recoja el nuevo build (lo hace solo al recompilar `dist/`, no hace falta reiniciarlo salvo que cambies el schema/migraciones).

### 2. Servir con `wrangler dev`
```bash
node node_modules/wrangler/bin/wrangler.js dev --port 8787 --local
```
- Usa **el mismo D1 local** que ya tenías (`.wrangler/state/v3/d1`) — tus datos de demo (pacientes, citas, sesiones) siguen ahí, no hay que sembrar nada de nuevo.
- Carga los secretos de `.dev.vars` automáticamente (JWT, CSRF, etc.).
- Invocar el binario directo (`node node_modules/wrangler/bin/wrangler.js dev`) en vez de `npx wrangler dev` evita un proceso intermedio extra y facilita identificar/matar el proceso correcto si algo se cuelga.

Espera a ver:
```
[wrangler:info] Ready on http://127.0.0.1:8787
```

### 3. Túnel público
```bash
"$USERPROFILE/AppData/Local/cloudflared/cloudflared.exe" tunnel --url http://localhost:8787
```
Apunta siempre al puerto de `wrangler dev` (8787), **nunca** al de vite (5173). La URL pública aparece en el log como `https://algo-algo-algo-algo.trycloudflare.com`.

> Cada dominio de túnel nuevo es un origen distinto → pedirá login de nuevo (las cookies de sesión/CSRF son por-origen). Es normal, no un fallo.

## Si agregaste una migración nueva

Antes de levantar `wrangler dev`, aplícala al D1 local (si `wrangler dev` ya está corriendo, detenlo primero — retiene un lock sobre el D1 local):

```bash
# ver qué falta
node node_modules/wrangler/bin/wrangler.js d1 migrations list DB --local

# aplicar
node node_modules/wrangler/bin/wrangler.js d1 migrations apply DB --local
```

## Troubleshooting

### `wrangler dev` muere con "JavaScript heap out of memory"
Pasa tras muchos reinicios/recargas en una sesión larga de desarrollo. Sube el heap al relanzar:
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
node node_modules/wrangler/bin/wrangler.js dev --port 8787 --local
```

### Error `EPERM: operation not permitted ... .wrangler\registry\...`
Significa que quedaron **procesos `wrangler dev` huérfanos** de un reinicio anterior (el crash por memoria no siempre limpia el proceso hijo). Antes de relanzar:

```powershell
# identificar cuáles son realmente wrangler dev (no matar node.exe a ciegas)
Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Select-Object ProcessId, CommandLine
```
Y solo entonces `taskkill //F //PID <pid> //T` sobre los que digan `wrangler dev --port 8787 --local`. Confirmar que el puerto quedó libre:
```bash
netstat -ano | grep ":8787"   # debe salir vacío antes de relanzar
```

### El túnel responde pero la app pide login otra vez
Normal si cambiaste de URL de túnel (dominio nuevo = cookies nuevas). No es un error.

### Un endpoint POST específico da 500 "fetch failed"
Si esto aparece con `wrangler dev` (no con `npm run dev`), es un bug real de la app — no confundir con el problema de proxy de Vite descrito arriba. Revisar logs del propio `wrangler dev` (el error real del handler aparece ahí, no en el mensaje genérico del cliente).

## Checklist antes de compartir la URL para una demo

- [ ] `npm run build` corrió sin errores
- [ ] `wrangler dev` está en el output mostrando `Ready on http://127.0.0.1:8787` (no crasheado)
- [ ] `curl http://localhost:8787/api/ping` → 200
- [ ] El túnel apunta a **8787**, no a 5173
- [ ] `curl -X POST <túnel>/api/ping-o-endpoint-real>` → no da 500 "fetch failed"
- [ ] No quedaron procesos `wrangler dev` duplicados (`netstat -ano | grep 8787` muestra un solo PID)
