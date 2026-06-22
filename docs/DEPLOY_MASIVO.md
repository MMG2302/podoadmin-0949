# Plan de despliegue masivo — PodoAdmin

Guía para abrir la plataforma a **muchas clínicas y usuarios concurrentes** (objetivo de referencia: **100 clínicas × ~25 usuarios** ≈ 2 500 cuentas, ~500 activos en hora punta).

**Documentos relacionados:**
- Despliegue inicial: `docs/DEPLOY_AHORA.md`, `LISTA_DESPLIEGUE.md`
- Checklist producción: `CHECKLIST_DEPLOY_PRODUCCION.md`
- Rate limiting: `src/api/RATE_LIMITING.md`
- Variables: `ENV_VARIABLES.md`, `wrangler.production.example.toml`

---

## 1. Modelo de capacidad

### Supuestos de tráfico (hora punta)

| Métrica | Valor conservador | Valor pico |
|---------|-------------------|------------|
| Clínicas activas | 100 | 100 |
| Usuarios por clínica (cuentas) | 25 | 40 |
| Usuarios conectados a la vez (plataforma) | 500 | 800 |
| Req/min por usuario activo (lectura) | 8 | 15 |
| Req/min por clínica (escritura) | 40 | 120 |
| IPs distintas (NAT clínica ≈ 1 IP/clínica) | ~100 | ~100 |

### Cálculo rápido

- **Lecturas tenant:** 100 clínicas × 25 usuarios × 10 req/min ≈ **2 500 req/min** repartidos → cada clínica ~25 req/min de media; pico clínica grande ~**400–800 req/min** → límite tenant **2000/min** (default).
- **Lecturas por IP (NAT):** 25 usuarios × 15 req/min ≈ **375 req/min** → límite auth read **600/min** (default).
- **Escrituras tenant:** pico ~**120/min** por clínica muy activa → límite **800/min** (default).

Si superas estos picos en producción, sube las variables `RATE_LIMIT_*` en `wrangler.toml` (ver § 4).

---

## 2. Arquitectura de protección (ya implementada)

```
                    ┌─────────────────────────────────────┐
  Request ─────────►│ Global IP + ráfaga (middleware)     │
                    └─────────────────┬───────────────────┘
                                      ▼
                    ┌─────────────────────────────────────┐
                    │ Tenant clinicId (middleware)        │
                    └─────────────────┬───────────────────┘
                                      ▼
                    ┌─────────────────────────────────────┐
                    │ Límites específicos (login, registro,│
                    │ mensajes, sesiones, etc.)           │
                    └─────────────────────────────────────┘
```

| Capa | Protege contra | Default masivo |
|------|----------------|----------------|
| Ráfaga IP | DDoS, bots | 80 req / 10 s |
| Global IP lectura auth | NAT clínica | 600/min |
| Global IP escritura auth | abuso API | 300/min |
| Tenant lectura | una clínica monopoliza D1 | 2000/min |
| Tenant escritura | spam de altas/edición | 800/min |
| Login email:IP | fuerza bruta cuenta | progresivo |
| Login IP agregado | fuerza bruta distribuida | 50 fallos/h |

**Cron diario (04:00 UTC):** export D1 → R2 (`d1-backup.ts`, requiere `D1_BACKUP_ENABLED=1`).  
**Cron diario (06:00 UTC):** retención usuarios + limpieza filas antiguas de `rate_limit_attempts`.

---

## 3. Fases de rollout recomendadas

### Fase A — Piloto (1–5 clínicas)

- [ ] Completar `LISTA_DESPLIEGUE.md` fases 0–5
- [ ] Defaults de rate limit **sin cambiar** (ya orientados a masivo)
- [ ] Turnstile CAPTCHA en registro y login (3+ fallos)
- [ ] Resend + SPF/DKIM/DMARC
- [ ] Sentry activo (`SENTRY_DSN`)
- [ ] Probar 429: login masivo, muchas pestañas en una clínica

### Fase B — Crecimiento (5–50 clínicas)

- [ ] Alertas billing Cloudflare + email (80 % cuota)
- [ ] Revisar logs Sentry: errores 429 con `scope: tenant` o `scope: ip`
- [ ] Si clínicas grandes (>30 usuarios): subir `RATE_LIMIT_TENANT_READ_PER_MIN=3000`
- [ ] **No** ampliar `IP_WHITELIST` salvo IPs de monitorización propias
- [ ] Monitorizar latencia D1 en dashboard Cloudflare

### Fase C — Masivo (50–200+ clínicas)

- [ ] Valores § 4 en `wrangler.toml` (tier **scale**)
- [ ] Dominio propio + Workers Paid confirmado
- [ ] Plan de soporte: runbook si 429 masivo (ajustar env, no desactivar límites)
- [ ] Backup D1 confirmado (ver `CHECKLIST_DEPLOY_PRODUCCION.md` § 1):
  - [ ] Time Travel activo (`wrangler d1 info DB --remote`)
  - [ ] `D1_BACKUP_ENABLED=1` + secret `D1_BACKUP_API_TOKEN` + vars de cuenta/DB
  - [ ] Probar manual: `npm run db:backup:remote`
  - [ ] Tras 24 h: comprobar log `cron_d1_backup_done` y archivo en R2
- [ ] Revisión mensual de filas D1 (`rate_limit_attempts`, audit logs)

---

## 4. Variables por tier de escala

Copiar el bloque adecuado en `[vars]` de `wrangler.toml`. Los defaults del código ya coinciden con **standard**.

### Tier `standard` (100 clínicas, ~25 usuarios) — **defaults actuales**

```toml
RATE_LIMIT_ANON_READ_PER_MIN = "180"
RATE_LIMIT_ANON_WRITE_PER_MIN = "90"
RATE_LIMIT_AUTH_READ_PER_MIN = "600"
RATE_LIMIT_AUTH_WRITE_PER_MIN = "300"
RATE_LIMIT_BURST_PER_10S = "80"
RATE_LIMIT_TENANT_READ_PER_MIN = "2000"
RATE_LIMIT_TENANT_WRITE_PER_MIN = "800"
```

### Tier `scale` (200+ clínicas o clínicas >40 usuarios)

```toml
RATE_LIMIT_ANON_READ_PER_MIN = "240"
RATE_LIMIT_ANON_WRITE_PER_MIN = "120"
RATE_LIMIT_AUTH_READ_PER_MIN = "900"
RATE_LIMIT_AUTH_WRITE_PER_MIN = "450"
RATE_LIMIT_BURST_PER_10S = "100"
RATE_LIMIT_TENANT_READ_PER_MIN = "3500"
RATE_LIMIT_TENANT_WRITE_PER_MIN = "1200"
```

### Tier `pilot` (pruebas, límites más estrictos)

```toml
RATE_LIMIT_AUTH_READ_PER_MIN = "300"
RATE_LIMIT_TENANT_READ_PER_MIN = "800"
RATE_LIMIT_TENANT_WRITE_PER_MIN = "300"
```

Tras cambiar `[vars]`: `npm run deploy` (no requiere migración).

---

## 5. Checklist pre-apertura masiva

### Infraestructura Cloudflare

- [ ] Workers **Paid** (~5 USD/mes mínimo)
- [ ] D1 producción dedicada (no sandbox local)
- [ ] R2 producción para logos/adjuntos
- [ ] Alertas de gasto activas
- [ ] `NODE_ENV=production`, secrets JWT/CSRF/refresh distintos
- [ ] `ALLOWED_ORIGINS` = dominio real (no `*`)

### Seguridad y abuso

- [ ] CAPTCHA Turnstile en producción (keys de prod, no test)
- [ ] Registro público con verificación email
- [ ] `IP_WHITELIST` vacía o mínima
- [ ] Safe Browsing: solo si lo necesitas (coste Google Cloud)
- [ ] Probar login 10+ fallos → bloqueo + email solo en 3, 5, 10

### Email (obligatorio a escala)

- [ ] `RESEND_API_KEY` + dominio verificado
- [ ] Tope mensual en dashboard Resend + alerta 80 %
- [ ] Emails de login fallido no spamean (máx. 3, 5, 10)

### Observabilidad

- [ ] `SENTRY_DSN` en Worker y build frontend
- [ ] Revisar alertas 500 y picos 429 la primera semana
- [ ] Correlation ID (`X-Request-Id`) en logs de error

### Pruebas de carga manuales (staging)

| Prueba | Resultado esperado |
|--------|-------------------|
| 100 GET/min mismo usuario autenticado | 200 OK |
| 700 GET/min misma clínica (varios tokens) | 200 OK hasta ~2000/min tenant |
| 50 POST/min creación sesiones mismo user | 429 tras 30/min (límite acción) |
| 60 login fallidos/h misma IP | 429 `isIPBlocked` |
| Registro 11× en 10 min misma IP | 429 registro |

---

## 6. Costes orientativos (100 clínicas activas)

| Componente | Orden de magnitud |
|------------|-------------------|
| Cloudflare Workers Paid | ~5 USD/mes base |
| D1 (lecturas/escrituras) | Bajo con rate limits; monitorizar |
| R2 (logos) | Depende almacenamiento; ~centavos–pocos USD |
| Resend email | Plan según volumen reset/verificación |
| Turnstile | Gratis en uso normal |
| Sentry | Plan free / team según eventos |

Detalle: `docs/ESTIMACION-COSTOS-Y-UTILIDAD-BRUTA.md`

---

## 7. Qué hacer si hay 429 en producción

1. **Identificar `scope`** en la respuesta JSON: `ip` vs `tenant`.
2. **`scope: tenant`** → clínica legítima muy activa → subir `RATE_LIMIT_TENANT_*` un 50 % y redeploy.
3. **`scope: ip`** → NAT compartido o bot → si es legítimo, subir `RATE_LIMIT_AUTH_*`; si es abuso, mantener límite.
4. **Login `isIPBlocked`** → oficina con muchos fallos → esperar 1 h o revisar CAPTCHA; no whitelistear rangos amplios.
5. Revisar Sentry/logs con `requestId` del cliente.

---

## 8. Orden de ejecución (resumen)

```text
1. LISTA_DESPLIEGUE fases 0–5 (infra + secrets + migrate + super_admin)
2. Fase 6–9 (email, CAPTCHA, dominio)
3. Copiar tier standard de § 4 a wrangler.toml [vars]
4. npm run deploy
5. Pruebas § 5 en staging
6. Piloto 1–5 clínicas (Fase A)
7. Monitorizar 2 semanas → Fase B/C según crecimiento
```

---

## 9. Referencia rápida de archivos

| Archivo | Rol |
|---------|-----|
| `src/api/middleware/rate-limit-middleware.ts` | Global + tenant |
| `src/api/utils/action-rate-limit.ts` | Límites y env parsing |
| `src/api/utils/rate-limit-d1.ts` | Login |
| `wrangler.production.example.toml` | Plantilla prod + rate limits |
| `src/worker.ts` | Cron limpieza rate limit + backup D1 |
| `src/api/utils/d1-backup.ts` | Export API → R2 |
