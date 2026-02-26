# Túnel temporal para pruebas (Cloudflare Tunnel)

Para exponer tu entorno local (móvil, webhooks, otra persona) sin desplegar. Usa **Cloudflare Tunnel**: no pide contraseña y suele cargar bien.

## Uso

1. **Arranca el servidor de desarrollo** (en una terminal):
   ```bash
   bun dev
   ```
2. **En otra terminal, arranca el túnel**:
   ```bash
   bun run tunnel
   ```
3. En la salida verás una URL tipo `https://xxxx.trycloudflare.com`. Ábrela en el navegador; no pide contraseña.

La primera vez que ejecutes `bun run tunnel`, se descargará el paquete y el binario de cloudflared y puede tardar un poco.

## Cambiar el puerto

El puerto por defecto es **5173** (Vite). Si usas otro en `vite.config.ts`, edita el script en `package.json`:

```json
"tunnel": "npx --yes cloudflared tunnel --url http://localhost:TU_PUERTO"
```

## Notas

- **Solo para pruebas**: no uses el túnel para tráfico real ni datos sensibles.
- **CORS**: si tu API valida el origen, puede que tengas que permitir temporalmente el dominio `*.trycloudflare.com` en dev.
- **HTTPS**: la URL del túnel es HTTPS; tu app local sigue en HTTP.
