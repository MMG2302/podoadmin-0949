# Plataforma PodoAdmin — visión por niveles del sistema

Documento maestro que responde, capa por capa, cómo escalar, modularizar, reducir costos y operar sin caídas.

Relacionado: `docs/CONCURRENCIA_CARGA_ALTA.md`, `docs/SCALE_INDEPENDIENTES.md`.

---

## Nivel 0 — Negocio: ¿la gente pagará por esto?

| Segmento | Dolor | Propuesta de valor | Precio actual |
|----------|-------|-------------------|---------------|
| Podólogo independiente | Excel, papel, WhatsApp manual | Historia clínica, citas, folios, impresión, WhatsApp | **$25 USD/mes** |
| Clínica (hasta 8 podólogos) | Multi-usuario, recepción, marca | Mismo + roles, clínica, billing centralizado | **$100 USD/mes** |
| Recepcionista | Coordinación sin sistema | Acceso limitado al podólogo asignado | Incluido en plan del pagador |

**Por qué puede funcionar:** software vertical de nicho (podología LATAM), cumplimiento NOM-004 / retención clínica, menos fricción que un EMR hospitalario genérico.

**Riesgos:** competencia con Notion/Excel gratis, adopción lenta, churn si el trial IP se abusa.

**Métricas a vigilar:** conversión trial → pago, DAU/MAU, sesiones clínicas/mes por usuario, churn mensual.

---

## Nivel 1 — Infraestructura: cientos de peticiones sin caída

```
                    ┌─────────────────────────────────────┐
  Cientos de req ──►│ Cloudflare Edge (distribuye carga)  │
                    └──────────────┬──────────────────────┘
                                   ▼
                    ┌─────────────────────────────────────┐
                    │ Workers (N isolates en paralelo)    │
                    │  • Rate limit → KV                  │
                    │  • Auth + validación                │
                    │  • Encolar trabajo pesado → Queue   │
                    └──────┬──────────────┬───────────────┘
                           ▼              ▼
                    ┌──────────┐   ┌──────────────┐
                    │ D1       │   │ Queue async  │
                    │ (datos)  │   │ email/WA     │
                    └──────────┘   └──────────────┘
```

| Pregunta | Respuesta |
|----------|-----------|
| ¿Se cae el servidor? | No hay servidor único; Worker escala. El riesgo es **latencia** o **429**, no caída total |
| ¿Colas evitan saturación? | **Sí** para trabajo lento (WhatsApp, email). El HTTP responde rápido; la cola procesa en background |
| ¿Qué pasa si la cola falla? | Reintentos automáticos (`max_retries`); mensaje a dead-letter si persiste |

**Implementado:** binding `NOTIFICATIONS_QUEUE`, cron encola recordatorios WhatsApp, consumer procesa por lotes.

---

## Nivel 2 — Módulos para mantenimiento (entrega, CRM, diseño, usuarios, tienda)

Hoy el código es **plano** (`api/routes` + `web/pages`). Para mantenimiento por equipos, estos son los **bounded contexts** recomendados:

| Módulo | Qué incluye | Rutas API | UI |
|--------|-------------|-----------|-----|
| **Entrega** | Notificaciones, email, WhatsApp, colas, crons | `whatsapp.ts`, `notifications.ts`, `queues/` | `whatsapp-*`, campañas |
| **CRM** | Pacientes, citas, calendario, listas registro | `patients.ts`, `appointments.ts`, `registration-lists.ts` | `patients-page`, `calendar-page` |
| **Diseño** | Layout clínico, marca de agua, logos | `clinical-features.ts`, `clinics.ts`, `professionals.ts` | `clinical-layout-designer`, settings |
| **Usuarios y roles** | Auth, 2FA, recepcionistas, permisos | `auth.ts`, `users.ts`, `receptionists.ts`, `middleware/` | `users-page`, `login` |
| **Tienda** | Inventario clínico (no e-commerce) | `clinical-features.ts` (inventory) | `clinical-tools-page` |
| **Billing** | Stripe, suscripciones, trial | `subscriptions.ts`, `stripe-webhook.ts` | `billing-page` |
| **Compliance** | Retención, legal hold, export | `compliance.ts`, crons purge | compliance settings |

Ver mapa detallado: `docs/MODULOS_MANTENIMIENTO.md`.

**Estrategia de refactor (sin big-bang):** extraer carpetas `src/api/modules/{crm,billing,...}` cuando un módulo supere ~5 rutas o tenga equipo dedicado.

---

## Nivel 3 — Costo: qué hacer en el navegador vs backend

Principio: **el backend solo autoriza, persiste y audita**. Todo lo demás que sea seguro va al cliente.

| Tarea | Dónde | Por qué |
|-------|-------|---------|
| Comprimir imagen → **WebP** | **Navegador** (`image-compress.ts`) | Ahorra CPU Worker y espacio D1 |
| Redimensionar fotos sesión/logo | **Navegador** | Canvas es gratis para ti |
| Generar PDF / imprimir historia | **Navegador** (`window.print`) | Sin servidor PDF |
| Diagramas SVG pies | **Navegador** | Solo render |
| Validación UX formularios | **Navegador** + Zod en API | Doble capa |
| CAPTCHA | Widget cliente; **verify en API** | Seguridad en servidor |
| JWT, permisos, tenant isolation | **API obligatorio** | No confiar en cliente |
| Magic bytes / polyglot scan imágenes | **API obligatorio** | El cliente puede mentir |
| Rate limit, CSRF, blacklist tokens | **API obligatorio** | — |
| Stripe webhooks | **API** | Secreto server-side |

**Regla de oro:** si el usuario puede falsificar el resultado y eso cuesta dinero o rompe seguridad → backend.

---

## Nivel 4 — Caching (no recalcular cientos de veces)

| Dato | Caché | TTL | Ubicación |
|------|-------|-----|-----------|
| Rate limit middleware | KV | ventana 10s–60s | `kv-rate-limit.ts` |
| Acceso/suscripción (`resolveSystemAccess`) | Memoria + **KV** | 60s | `access-cache.ts` |
| Podólogos asignados (recepcionista) | Memoria | 30s | `tenant-isolation.ts` |
| Config pública (captcha, stripe key) | **HTTP Cache-Control** | 5 min | `/api/public/config` |
| Assets estáticos Vite | CDN Cloudflare | largo | `dist/client` |

**Invalidación:** al cambiar suscripción (webhook Stripe) → `invalidateSystemAccessCache`.

**Pendiente Fase 3:** CDN cache para logos en R2 cuando migren de D1.

---

## Nivel 5 — WebP

| Flujo | WebP |
|-------|------|
| Fotos sesión clínica | ✅ `compressImageForSession` |
| Logo clínica / profesional | ✅ `compressImageForLogo` (nuevo) |
| Marca de agua workspace | ✅ mismo helper |
| Adjuntos laboratorio | Acepta WebP; sin re-encode obligatorio |
| API validación | Acepta JPEG/PNG/WebP; magic bytes |

El Worker **no** usa `sharp` (no disponible en runtime). Toda conversión WebP es **en el navegador**.

---

## Nivel 6 — Limpieza automática

| Recurso | Cuándo se borra | Mecanismo |
|---------|-----------------|-----------|
| Usuarios deshabilitados | 240 días tras `disabledAt` | Cron 6:00 UTC |
| Expediente clínico | `retainUntil` vencido (5 años código) | Cron 5:00 UTC |
| Audit log | 2 años | Cron purge |
| Notificaciones | 90 días | Cron purge |
| Rate limit D1 | >1 h | Cron 6:00 UTC |
| Token blacklist JWT | expirados | Cron 6:00 UTC |
| Tokens email verificación | expirados/usados | Cron 6:00 UTC |
| Tokens reset password | expirados/usados | Cron 6:00 UTC |
| Backups D1 en R2 | 30 días (configurable) | Cron 4:00 UTC |

**Nota legal:** UI menciona 20 años clínico; código cron usa 5 años (`RETENTION_POLICY`). Alinear con abogado antes de producción.

**Pendiente:** purge objetos R2 huérfanos al borrar paciente.

---

## Nivel 7 — Roadmap ejecutable

| Prioridad | Item | Estado |
|-----------|------|--------|
| P0 | Colas notificaciones | ✅ Implementado |
| P0 | Rate limit KV | ✅ |
| P1 | Caché acceso KV | ✅ |
| P1 | WebP logos/marca agua | ✅ |
| P1 | Limpieza tokens operativos | ✅ |
| P2 | Imágenes sesión/logos → R2 | ✅ |
| P2 | Purge R2 huérfanos al borrar paciente | ✅ |
| P2 | Dashboard lazy (`/clinical-dashboard/overview`) | ✅ |
| P2 | Script bindings producción KV/Queues | ✅ `scripts/setup-cloudflare-production-bindings.cjs` |
| P3 | Modularizar carpetas `modules/` | Documentado |
| P3 | Durable Objects contadores exactos | Opcional |

---

## Verificación

```bash
bun run db:migrate
bun run test
bun dev
```

Probar cola local: los recordatorios WhatsApp del cron horario se encolan; el consumer los procesa en el mismo Worker.
