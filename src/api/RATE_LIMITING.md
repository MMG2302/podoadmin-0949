# Sistema de Rate Limiting

## Resumen

Rate limiting persistente en D1 (Cloudflare) para proteger autenticación, la API completa y acciones costosas. Capas:

1. **Global por IP** — toda la API + ráfaga 10 s (`rate-limit-middleware.ts`)
2. **Por tenant (clinicId)** — tráfico agregado por clínica (`rate-limit-middleware.ts`)
3. **Login progresivo** por `email:IP` + tope IP (`rate-limit-d1.ts`)
4. **Acciones autenticadas** por `userId` (`action-rate-limit.ts`)
5. **Registro público** por IP (`registration-rate-limit.ts`)

Middleware montado en `src/api/index.ts` (después de `authMiddleware`).

---

## Matriz de cobertura

| Endpoint / acción | Por IP | Por tenant | Por usuario/email | Archivo |
|-------------------|--------|------------|-------------------|---------|
| **Toda la API** | Sí (global + ráfaga) | Sí (`clinicId`) | — | `rate-limit-middleware.ts` |
| `POST /auth/login` | Sí (50 fallos/h + progresivo) | No | Sí (`email:IP`) | `rate-limit-d1.ts`, `auth.ts` |
| `POST /auth/register` | Sí (ventanas progresivas) | No | No | `registration-rate-limit.ts` |
| `POST /auth/forgot-password` | Sí (5/h) | No | No | `action-rate-limit.ts` |
| `POST /auth/reset-password` | Sí (10/h) | No | No | `action-rate-limit.ts` |
| Pacientes, citas, etc. | Global | Sí (writes) | — | middleware |
| Mensajes | Global | Sí | Sí (20/min) | `action-rate-limit.ts` |
| Logos | Global | Sí | Sí (10/min) | `action-rate-limit.ts` |
| Sesiones clínicas | Global | Sí | Sí (30/min) | `action-rate-limit.ts` |
| Notificaciones | Global | Sí | Sí (30/min) | `action-rate-limit.ts` |
| Audit client | Global | Sí | Sí (20/min) | `action-rate-limit.ts` |

---

## Defaults masivo (~100 clínicas × 25 usuarios)

| Variable | Default |
|----------|---------|
| `RATE_LIMIT_ANON_READ_PER_MIN` | 180 |
| `RATE_LIMIT_ANON_WRITE_PER_MIN` | 90 |
| `RATE_LIMIT_AUTH_READ_PER_MIN` | 600 |
| `RATE_LIMIT_AUTH_WRITE_PER_MIN` | 300 |
| `RATE_LIMIT_BURST_PER_10S` | 80 |
| `RATE_LIMIT_TENANT_READ_PER_MIN` | 2000 |
| `RATE_LIMIT_TENANT_WRITE_PER_MIN` | 800 |

Plan completo: `docs/DEPLOY_MASIVO.md`

---

## Global API — por IP (middleware)

Aplicado a **todas** las rutas excepto `/api/ping` y `/api/public/config`.

| Tier | Límite default | Variable env |
|------|----------------|--------------|
| Lectura anónima (GET sin token) | 120/min | `RATE_LIMIT_ANON_READ_PER_MIN` |
| Escritura anónima (POST login, register…) | 60/min | `RATE_LIMIT_ANON_WRITE_PER_MIN` |
| Lectura autenticada | 400/min | `RATE_LIMIT_AUTH_READ_PER_MIN` |
| Escritura autenticada | 200/min | `RATE_LIMIT_AUTH_WRITE_PER_MIN` |
| Ráfaga anti-DDoS | 50 / 10 s | `RATE_LIMIT_BURST_PER_10S` |

Identificadores D1: `act:global_*:{ip}`, `act:global_burst:{ip}`

Respuesta 429: `{ "error": "rate_limit", "scope": "ip", "retryAfter": N }`

---

## Tenant — por clínica (middleware)

Solo usuarios autenticados. Clave: `clinic:{clinicId}` o `user:{userId}` (super_admin sin clínica).

| Tier | Límite default | Variable env |
|------|----------------|--------------|
| Lecturas (GET) | 1200/min | `RATE_LIMIT_TENANT_READ_PER_MIN` |
| Escrituras (POST/PUT/PATCH/DELETE) | 400/min | `RATE_LIMIT_TENANT_WRITE_PER_MIN` |

Identificadores D1: `act:tenant_read:{key}`, `act:tenant_write:{key}`

Respuesta 429: `{ "error": "rate_limit", "scope": "tenant", "retryAfter": N }`

---

## Login — doble capa

### Capa 1: Por IP (anti fuerza bruta distribuida)

- **Identificador D1:** `ip:login:{ip}`
- **Límite:** 50 intentos fallidos por hora (cualquier email)
- **Whitelist:** `IP_WHITELIST` omite ambas capas

### Capa 2: Progresivo por cuenta (`email:IP`)

| Intentos fallidos | Efecto |
|-------------------|--------|
| 3 | Retardo 5 s |
| 5 | Retardo 30 s |
| 10 | Bloqueo 15 min |

- **Ventana de reset:** 1 hora sin actividad
- **CAPTCHA:** a partir de 3 intentos (si está configurado)
- **Identificador:** `{email}:{ip}` (IPv6 soportado en parse)

### Fail-closed en producción

Si D1 no responde al **verificar** límites de login, se devuelve 429 (60 s). Las acciones autenticadas y el registro ya tenían este comportamiento.

---

## Registro público — por IP

Tabla dedicada `registration_rate_limit`:

| Nivel | Límite |
|-------|--------|
| 10 min | 10 registros exitosos |
| 30 min | 5 registros exitosos |
| 1 h | 3 registros exitosos |

- **5 intentos fallidos reales** → bloqueo 24 h
- Errores de validación del usuario **no** cuentan como fallo

---

## Acciones autenticadas — por userId

Prefijo en D1: `act:{action}:{userId}`

| Acción | Límite |
|--------|--------|
| `msg` | 20/min |
| `logo` | 10/min |
| `session` | 30/min |
| `notification_create` | 30/min |
| `client_audit` | 20/min |
| `forgot_password` | 5/h (por IP) |
| `reset_password` | 10/h (por IP) |

---

## Tablas D1

- `rate_limit_attempts` — login (`email:ip`, `ip:login:*`), acciones (`act:*`)
- `registration_rate_limit` — registro por IP

---

## Whitelist de IPs

Variable de entorno `IP_WHITELIST` (IPs o rangos CIDR separados por coma). Omite **todos** los rate limits (global, tenant, login).

**Producción:** no usar rangos amplios; bypass total del límite.

---

## Respuestas HTTP 429

### Login bloqueado por IP

```json
{
  "error": "Demasiados intentos",
  "message": "Demasiados intentos fallidos desde esta red...",
  "retryAfter": 3600,
  "isIPBlocked": true
}
```

### Login bloqueado por cuenta (15 min)

```json
{
  "error": "Cuenta temporalmente bloqueada",
  "message": "...",
  "retryAfter": 900,
  "blockedUntil": 1234567890000,
  "attemptCount": 10,
  "isBlocked": true
}
```

---

## Archivos

| Archivo | Rol |
|---------|-----|
| `src/api/middleware/rate-limit-middleware.ts` | Global IP + tenant |
| `src/api/utils/rate-limit-d1.ts` | Login progresivo + tope IP |
| `src/api/utils/action-rate-limit.ts` | Acciones y forgot/reset |
| `src/api/utils/registration-rate-limit.ts` | Registro público |
| `src/api/utils/ip-tracking.ts` | IP del cliente, identificadores |
| `src/api/routes/auth.ts` | Integración login/registro |

---

## Testing manual

1. **IP:** 50+ logins fallidos con emails distintos desde la misma IP → 429 `isIPBlocked`
2. **Cuenta:** 3 fallos mismo email → delay 5 s; 10 fallos → bloqueo 15 min
3. **Login exitoso:** limpia contador `email:IP` (no resetea contador IP agregado)
4. **Registro:** superar límites por IP → 429 con `retryAfter`
