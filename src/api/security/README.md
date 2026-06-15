# Seguridad de API (auth + autorización)

## Capas

1. **`authMiddleware`** (global en `index.ts`): adjunta `user` desde JWT/cookie. No bloquea.
2. **`requireAuth`**: obligatorio en routers de datos sensibles.
3. **`requireRole` / `requirePermission`**: autorización por rol o permiso.
4. **Políticas en `src/api/security/`**: reglas reutilizables para endpoints expuestos al cliente.

## Notificaciones

- **Creación interna**: `createNotification` / `createNotifications` en `utils/notifications-service.ts` (solo desde rutas ya autorizadas).
- **POST `/api/notifications`**: política en `notification-policy.ts`:
  - Tipos permitidos: `system`, `appointment`, `reassignment`.
  - `admin_message` y `credit` solo desde el servidor.
  - Validación de destinatario por rol (clínica, podólogos asignados, etc.).
  - Rate limit: 30/min por usuario.
- **Citas y reasignaciones**: notificaciones generadas en `appointments.ts` y `patients.ts` al completar la operación.

## Auditoría desde el cliente

- **POST `/api/audit-logs`**: lista blanca en `client-audit-policy.ts` (actualmente `PRINT_VIOLATION_FORM`).
- El `userId` del evento siempre es el del JWT; no se acepta `clinicId` arbitrario del body.
- Rate limit: 20/min por usuario.

## Desarrollo

- Rutas `/api/test/*` y `/api/auth/clear-ip-block`: `requireNonProductionDev` + `requireAuth` + `super_admin` (test).
- Opcional: `DEV_API_SECRET` + header `X-Dev-Secret` en entornos no productivos.

## Tests

```bash
npm test
```

- `notification-policy.test.ts` — política de destinatarios y tipos.
- `client-audit-policy.test.ts` — lista blanca y sanitización de auditoría cliente.
