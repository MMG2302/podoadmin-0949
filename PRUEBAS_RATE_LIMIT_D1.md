# Cómo probar el rate limiting de login (D1)

El rate limiting de login usa la tabla `rate_limit_attempts` en D1. Aquí tienes cómo verificarlo en local.

---

## 1. Preparar el entorno

### Aplicar migraciones a D1 local

```bash
bun db:migrate
```

Esto ejecuta `wrangler d1 migrations apply DB --local` y crea/actualiza `rate_limit_attempts`.

### (Opcional) IP whitelist

Si tienes `IP_WHITELIST` en `.env` (ej. `127.0.0.1`), el rate limiting **no se aplica** a esas IPs. Para probar el límite, comenta o elimina esa variable temporalmente.

---

## 2. Arrancar el servidor de desarrollo

```bash
bun dev
```

Se levanta Vite con el plugin de Cloudflare; la API va en el mismo origen (ej. `http://localhost:5173`).

---

## 3. Probar desde el navegador

1. Abre `http://localhost:5173` (o el puerto que use Vite).
2. Ve a **Login**.
3. Usa un email cualquiera y una **contraseña incorrecta** (ej. `test@test.com` / `wrong`).
4. Pulsa **Iniciar sesión** varias veces seguidas.

**Comportamiento esperado:**

| Intentos fallidos | Efecto |
|-------------------|--------|
| 1–2               | 401 "Credenciales inválidas", sin espera |
| 3                 | 401 + `retryAfter: 5` (espera 5 s antes del siguiente intento) |
| 4                 | Igual, 5 s |
| 5                 | 401 + `retryAfter: 30` (30 s) |
| 6–9               | Igual, 30 s |
| 10+               | 429 "Cuenta temporalmente bloqueada" + bloqueo ~15 min |

Desde el 3.er intento puede aparecer `requiresCaptcha: true` si tienes CAPTCHA configurado; en ese caso tendrás que resolverlo para seguir sumando intentos.

---

## 4. Probar con curl (rápido para varios intentos)

Obtén antes un **token CSRF** (login no lo exige, pero otros middlewares sí). Si solo llamas a login, suele bastar con:

```bash
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@test.com\",\"password\":\"wrong\"}"
```

Deberías recibir `401` y un JSON con `attemptCount`, `retryAfter`, etc.

Repite el mismo `curl` varias veces (3, 5, 10) y comprueba que:

- Sube `attemptCount`.
- Aparece `retryAfter` cuando toca.
- Con 10 fallos llegas a `429` y mensaje de cuenta bloqueada.

---

## 5. Comprobar que los datos están en D1

Con el dev server en marcha (u otro proceso que use D1 local), en otra terminal:

```bash
wrangler d1 execute DB --local --command "SELECT * FROM rate_limit_attempts"
```

Deberías ver filas con `identifier` (ej. `test@test.com:127.0.0.1` o `...:unknown`), `count`, `first_attempt`, `last_attempt`, `blocked_until`, etc.

Tras un **login correcto**, se borra la fila de ese `identifier`:

```bash
wrangler d1 execute DB --local --command "SELECT * FROM rate_limit_attempts"
```

La fila del email que usaste para el login exitoso ya no debería aparecer.

---

## 6. Resumen rápido

| Paso | Comando / acción |
|------|-------------------|
| Migraciones | `bun db:migrate` |
| Dev | `bun dev` |
| Probar límite | Login con contraseña incorrecta varias veces (navegador o curl) |
| Ver D1 | `wrangler d1 execute DB --local --command "SELECT * FROM rate_limit_attempts"` |

Si al repetir intentos fallidos aumenta `attemptCount`, aparece `retryAfter` y luego 429, y en D1 ves y dejas de ver filas según fallos/login correcto, el rate limiting con D1 está funcionando.
