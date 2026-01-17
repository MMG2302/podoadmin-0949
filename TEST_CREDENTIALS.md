# 🔐 PodoAdmin - Credenciales de Prueba

## 📋 Resumen del Seed Data

✅ **3 Clínicas** con 3 podiatras cada una
✅ **4 Médicos independientes** sin clínica
✅ **100+ Pacientes ficticios** (8-10 por podatra)
✅ **200+ Sesiones clínicas** (15-20 por podatra)
✅ **Logos únicos por clínica** (compartidos entre podiatras de la misma clínica)

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

## 🏥 CLÍNICA 1: "Clínica Podológica Premium"
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

## 🏥 CLÍNICA 2: "Centro Médico Podológico"
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

---

## 🏥 CLÍNICA 3: "Podología Integral Plus"
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

## 👨‍⚕️ MÉDICOS INDEPENDIENTES (Sin Clínica)

### Médico Independiente 1
- **Email:** pablo.hernandez@gmail.com
- **Password:** doctor123
- **Nombre:** Dr. Pablo Hernández
- **Rol:** Podiatrist
- **Clínica:** Ninguna (Independiente)
- **Datos:** ~9 pacientes, ~17 sesiones

### Médico Independiente 2
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

## 🚀 Cómo Validar Todo el Sistema

```bash
# 1. Abre la aplicación
cd /home/user/podoadmin
npm run dev

# 2. Accede a http://localhost:5173 (o el puerto configurado)

# 3. Prueba cada credencial según las pruebas de validación
```

¡Todo el sistema está listo para pruebas! 🎉
