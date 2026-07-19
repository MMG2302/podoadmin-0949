# 🔐 PodoAdmin - Credenciales de Prueba

## 📋 Resumen del Seed Data

✅ **3 Clínicas** con 3-6 podiatras cada una
✅ **4 Médicos independientes** sin clínica
✅ **100+ Pacientes ficticios** (8-10 por podatra)
✅ **200+ Sesiones clínicas** (15-20 por podatra)
✅ **Logos únicos por clínica** (compartidos entre podiatras de la misma clínica)

## 🪪 Plan por cuenta (Base / Premium)

Cada clínica o podólogo independiente tiene un plan fijo en el seed, para poder probar el gating de ambos tiers sin tocar Stripe. El plan se hereda por todos los usuarios de esa cuenta (clinic_admin, podólogos y recepcionistas asignadas).

| Cuenta | Plan | Uso |
|--------|------|-----|
| Clínica Podológica Premium (`clinic_001`) | **Premium** | Ver Ventas/Cobros/Rentabilidad/Agenda, Herramientas clínicas y Campañas WhatsApp desbloqueadas |
| Centro Médico (`clinic_002`) | **Base** | Ver candados + banner de upsell en esas mismas secciones |
| Integral Plus (`clinic_003`) | **Premium** | Segundo ejemplo Premium (con facturación anual) |
| Pablo Hernández (independiente, `pablo.hernandez@gmail.com`) | **Base** | Independiente sin analíticas/herramientas/campañas |
| Lucía, Andrés, Beatriz (independientes) | **Premium** | Trial de desarrollo (`ACCESS_ALLOW_TRIAL=1`) siempre entra como Premium |

Para forzar un plan distinto durante pruebas, usa el menú de cuenta (⋮) del super_admin en Usuarios ("Plan (Base/Premium)"), o el endpoint `POST /subscriptions/set-tier`.

---

## 👤 Super Admin
- **Email:** admin@podoadmin.com
- **Password:** admin123
- **Rol:** Super Admin (acceso total)
- **Acceso:** Gestión de usuarios, créditos, mensajes, configuración global

---

## 💼 Administrador Técnico
- **Email:** support@podoadmin.com
- **Password:** support123
- **Rol:** Admin (Soporte)
- **Acceso:** Ajustes de créditos limitados (10% mensual)

---

## 🏥 CLÍNICA 1: "Clínica Podológica Premium" — Plan **PREMIUM**
### Administrador de Clínica
- **Email:** maria.fernandez@premium.com
- **Password:** manager123
- **Rol:** Clinic Admin
- **Clínica:** clinic_001
- **Acceso:** 
  - Gestión de todos los podiatras de la clínica
  - Reasignación de pacientes entre podiatras
  - Carga/edición de logo de clínica
  - Vista de todos los pacientes de la clínica

### Podatra 1
- **Email:** doctor1@premium.com
- **Password:** doctor123
- **Rol:** Podiatrist
- **Clínica:** clinic_001 (Clínica Podológica Premium)
- **Acceso:** Gestión de pacientes y sesiones de su clínica
- **Datos:** ~9 pacientes, ~17 sesiones

### Podatra 2
- **Email:** doctor2@premium.com
- **Password:** doctor123
- **Rol:** Podiatrist
- **Clínica:** clinic_001 (Clínica Podológica Premium)
- **Acceso:** Gestión de pacientes y sesiones de su clínica
- **Datos:** ~9 pacientes, ~17 sesiones

### Podatra 3
- **Email:** doctor3@premium.com
- **Password:** doctor123
- **Rol:** Podiatrist
- **Clínica:** clinic_001 (Clínica Podológica Premium)
- **Acceso:** Gestión de pacientes y sesiones de su clínica
- **Datos:** ~9 pacientes, ~17 sesiones

---

## 🏥 CLÍNICA 2: "Centro Médico Podológico" — Plan **BASE**
### Administrador de Clínica
- **Email:** juan.garcia@centromedico.com
- **Password:** manager123
- **Rol:** Clinic Admin
- **Clínica:** clinic_002
- **Acceso:** Gestión de podiatras, reasignación, logo de clínica

### Podatra 1
- **Email:** doctor1@centromedico.com
- **Password:** doctor123
- **Rol:** Podiatrist
- **Clínica:** clinic_002 (Centro Médico Podológico)
- **Datos:** ~9 pacientes, ~17 sesiones

### Podatra 2
- **Email:** doctor2@centromedico.com
- **Password:** doctor123
- **Rol:** Podiatrist
- **Clínica:** clinic_002 (Centro Médico Podológico)
- **Datos:** ~9 pacientes, ~17 sesiones

### Podatra 3
- **Email:** doctor3@centromedico.com
- **Password:** doctor123
- **Rol:** Podiatrist
- **Clínica:** clinic_002 (Centro Médico Podológico)
- **Datos:** ~9 pacientes, ~17 sesiones

*(También existen doctor4/5/6@centromedico.com con la misma contraseña, del seed expandido)*

---

## 🏥 CLÍNICA 3: "Podología Integral Plus" — Plan **PREMIUM**
### Administrador de Clínica
- **Email:** sofia.rodriguez@integralplus.com
- **Password:** manager123
- **Rol:** Clinic Admin
- **Clínica:** clinic_003
- **Acceso:** Gestión de podiatras, reasignación, logo de clínica

### Podatra 1
- **Email:** doctor1@integralplus.com
- **Password:** doctor123
- **Rol:** Podiatrist
- **Clínica:** clinic_003 (Podología Integral Plus)
- **Datos:** ~9 pacientes, ~17 sesiones

### Podatra 2
- **Email:** doctor2@integralplus.com
- **Password:** doctor123
- **Rol:** Podiatrist
- **Clínica:** clinic_003 (Podología Integral Plus)
- **Datos:** ~9 pacientes, ~17 sesiones

### Podatra 3
- **Email:** doctor3@integralplus.com
- **Password:** doctor123
- **Rol:** Podiatrist
- **Clínica:** clinic_003 (Podología Integral Plus)
- **Datos:** ~9 pacientes, ~17 sesiones

---

## 🛎️ RECEPCIONISTA (Clínica 1)
- **Email:** recepcion@premium.com
- **Password:** podo123
- **Rol:** Receptionist
- **Clínica:** clinic_001 (Clínica Podológica Premium)
- **Podólogos asignados:** doctor1, doctor2 y doctor3 de clinic_001
- **Acceso:** Calendario, pacientes y mensajes, sin datos clínicos sensibles. Hereda el plan (Base/Premium) de la clínica.
- **Seed:** `scripts/seed-hector-receptionist.sql` (incluido en `npm run db:seed:local`)

---

## 👨‍⚕️ MÉDICOS INDEPENDIENTES (Sin Clínica)

### Médico Independiente 1 — Plan **BASE**
- **Email:** pablo.hernandez@gmail.com
- **Password:** doctor123
- **Nombre:** Dr. Pablo Hernández
- **Rol:** Podiatrist
- **Clínica:** Ninguna (Independiente)
- **Datos:** ~9 pacientes, ~17 sesiones

### Médico Independiente 2 — Plan **PREMIUM**
- **Email:** lucia.santos@outlook.com
- **Password:** doctor123
- **Nombre:** Dra. Lucía Santos
- **Rol:** Podiatrist
- **Clínica:** Ninguna (Independiente)
- **Datos:** ~9 pacientes, ~17 sesiones

### Médico Independiente 3
- **Email:** andres.molina@yahoo.es
- **Password:** doctor123
- **Nombre:** Dr. Andrés Molina
- **Rol:** Podiatrist
- **Clínica:** Ninguna (Independiente)
- **Datos:** ~9 pacientes, ~17 sesiones

### Médico Independiente 4
- **Email:** beatriz.ortiz@hotmail.com
- **Password:** doctor123
- **Nombre:** Dra. Beatriz Ortiz
- **Rol:** Podiatrist
- **Clínica:** Ninguna (Independiente)
- **Datos:** ~9 pacientes, ~17 sesiones

---

## 🧪 PRUEBAS DE VALIDACIÓN

### ✅ Prueba 1: Logo compartido en clínica
1. Inicia sesión como `doctor1@premium.com`
2. Ve a un paciente y crea una sesión (o abre una existente)
3. Imprime PDF
4. Verifica el logo de "Clínica Podológica Premium"
5. Cierra sesión y entra como `doctor2@premium.com`
6. Abre cualquier sesión y imprime PDF
7. **Resultado esperado:** El mismo logo debe aparecer (logo compartido)

### ✅ Prueba 2: Logos diferentes por clínica
1. Inicia sesión como `doctor1@premium.com` e imprime PDF
2. Verifica logo: "Clínica Podológica Premium" (azul)
3. Cierra sesión y entra como `doctor1@centromedico.com`
4. Imprime PDF
5. **Resultado esperado:** Logo diferente "Centro Médico Podológico" (verde)

### ✅ Prueba 3: Médicos independientes
1. Inicia sesión como `pablo.hernandez@gmail.com`
2. Ve a Settings
3. Verifica que dice "You are an independent professional"
4. No puede cargar logo de clínica (sin clinicId)
5. Imprime PDF de paciente
6. **Resultado esperado:** Sin logo (o logo personal si ha cargado uno)

### ✅ Prueba 4: Reasignación y notificaciones
1. Inicia sesión como `maria.fernandez@premium.com` (admin clínica)
2. Ve a Clínica Management → Pacientes
3. Reasigna un paciente de doctor1 a doctor2
4. Verifica que ambos doctores reciben notificación
5. El admin también recibe notificación
6. **Resultado esperado:** 3 notificaciones (manager, doctor anterior, doctor nuevo)

### ✅ Prueba 5: Mensaje de Super Admin
1. Inicia sesión como `admin@podoadmin.com`
2. Ve a Mensajes
3. Envía un mensaje a todos los usuarios
4. Verifica en notificaciones de otros usuarios que aparece el mensaje
5. **Resultado esperado:** Todos reciben el mensaje en su campana de notificaciones

---

## 📊 Estadísticas del Seed Data

- **Total de Usuarios:** 17 (1 super admin + 1 admin + 3 clinic admins + 12 podiatras)
- **Clínicas:** 3 (9 podiatras en clínicas, 4 independientes)
- **Pacientes Totales:** ~117 pacientes (8-10 por podatra)
- **Sesiones Totales:** ~234 sesiones (15-20 por podatra)
- **Estados de Sesión:** 70% pasadas (85% completadas), 10% hoy, 20% futuras
- **Logos por Clínica:** 3 logos SVG únicos (azul, verde, rojo)

---

## 🛡️ Turnstile CAPTCHA (desarrollo local)

En `.dev.vars` con `CAPTCHA_FORCE_IN_DEV=1` y claves de prueba de Cloudflare:

| Variable | Valor de prueba (siempre pasa) |
|----------|-------------------------------|
| `CAPTCHA_PROVIDER` | `turnstile` |
| `CAPTCHA_SITE_KEY` | `1x00000000000000000000AA` |
| `CAPTCHA_SECRET_KEY` | `1x0000000000000000000000000000000AA` |

Documentación: [Turnstile testing](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)

No requiere Docker ni segundo deploy. Funciona también vía túnel `*.trycloudflare.com` si el dominio del túnel está permitido en el widget de Turnstile (o usas claves de prueba).

---

## 🚀 Cómo Validar Todo el Sistema

```bash
# 1. Abre la aplicación
cd /home/user/podoadmin
npm run dev

# 2. Accede a http://localhost:5173 (o el puerto configurado)

# 3. Prueba cada credencial según las pruebas de validación
```

¡Todo el sistema está listo para pruebas! 🎉
