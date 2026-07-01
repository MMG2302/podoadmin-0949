# Revisión pendiente del proyecto (localStorage → API/DB)

Estado del repositorio tras la migración a API/DB. **Última revisión: junio 2026.**

La migración funcional y la limpieza de `storage.ts` **están completas**.

---

## 1. Migrado y en uso API ✅

| Área | Estado | Notas |
|------|--------|--------|
| **Settings (clínica/profesional)** | ✅ API | Clínica y profesional vía API; logos en R2 |
| **Notificaciones** | ✅ API | List/create/read/read-all/delete |
| **Mensajes (sent)** | ✅ API | `/api/messages` |
| **Usuarios (listado/CRUD)** | ✅ API | `users-page`; auth-context con `/users/visible` |
| **Pacientes** | ✅ API | `useClinicalListPage`; recepcionistas por API |
| **Sesiones** | ✅ API | `sessions-page`, `calendar-page` |
| **Appointments** | ✅ API | `calendar-page` |
| **Audit log** | ✅ API | Lectura y escritura (`audit-client.ts`) |
| **Prescripciones** | ✅ API | `/prescriptions` |
| **Auth backend** | ✅ DB | Sin dependencia de storage |
| **Clínica** | ✅ API | Pacientes, sesiones, usuarios, licencias |
| **Tipos frontend** | ✅ `src/web/types/` | Sin `storage.ts` legacy |

---

## 2. Pendiente opcional (no bloquea deploy)

### 2.1 `podoadmin_user` en localStorage

`auth-context.tsx` y `google-callback.tsx` guardan copia del usuario en localStorage. La sesión real está en cookies HttpOnly.

**Acción:** Valorar quitar la copia y depender solo de `/auth/verify`.

### 2.2 `seed-data.ts`

Script de seed en localStorage para desarrollo manual. **No se importa en la app.** Para datos de prueba usar `npm run db:seed:local`.

---

## 3. localStorage aceptable (mantener)

| Uso | Dónde | Nota |
|-----|--------|------|
| **Idioma** | `language-context.tsx` | Preferencia UI |
| **Tema / sidebar** | `ui-preferences.ts` | Preferencia UI |
| **Plantilla WhatsApp Web** | `whatsapp-web-link.ts` | Por usuario |
| **Copia usuario (sesión)** | `auth-context` | Redundante; ver §2.1 |
| **Seed datos dev** | `seed-data.ts` | Solo invocación manual |

---

## 4. Tipos compartidos (`src/web/types/`)

| Archivo | Contenido |
|---------|-----------|
| `clinical.ts` | Patient, ClinicalSession, AppointmentReason |
| `audit-log.ts` | AuditLog |
| `notification.ts` | Notification, NotificationType |
| `message.ts` | SentMessage |
| `clinic.ts` | Clinic, ClinicCredits |
| `professional.ts` | ProfessionalInfo |
| `credits.ts` | UserCredits, CreditTransaction |
| `prescription.ts` | Prescription |

---

## Veredicto

**Listo para producción.** Deuda localStorage → API/DB cerrada. Solo queda la limpieza opcional de `podoadmin_user` en localStorage.
