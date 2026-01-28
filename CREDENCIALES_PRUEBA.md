# 🔐 Credenciales de Prueba - PodoAdmin

## ⚠️ IMPORTANTE: Para Probar Rate Limiting

Para ver los límites progresivos funcionando, usa estas credenciales **INCORRECTAS** varias veces:

1. **Primer intento**: Email: `test@test.com`, Password: `wrong`
2. **Segundo intento**: Mismo email, password incorrecta
3. **Tercer intento**: Mismo email, password incorrecta → **Retardo de 5 segundos**
4. **Cuarto intento**: Mismo email, password incorrecta
5. **Quinto intento**: Mismo email, password incorrecta → **Retardo de 30 segundos**
6. **Sexto a décimo intento**: Mismo email, password incorrecta
7. **Décimo intento**: → **Bloqueo de 15 minutos**

---

## ✅ Credenciales Válidas para Login

### 👑 Super Admin
- **Email:** `admin@podoadmin.com`
- **Password:** `admin123`
- **Rol:** Super Admin
- **Acceso:** Total al sistema

### 💼 Admin de Soporte
- **Email:** `support@podoadmin.com`
- **Password:** `support123`
- **Rol:** Admin
- **Acceso:** Soporte técnico

---

## 🏥 CLÍNICA 1: "Clínica Podológica Premium"

### Administrador de Clínica
- **Email:** `maria.fernandez@premium.com`
- **Password:** `manager123`
- **Rol:** Clinic Admin
- **Clínica:** clinic_001

### Podiatras
- **Email:** `doctor1@premium.com` | **Password:** `doctor123`
- **Email:** `doctor2@premium.com` | **Password:** `doctor123`
- **Email:** `doctor3@premium.com` | **Password:** `doctor123`

---

## 🏥 CLÍNICA 2: "Centro Médico Podológico"

### Administrador de Clínica
- **Email:** `juan.garcia@centromedico.com`
- **Password:** `manager123`
- **Rol:** Clinic Admin
- **Clínica:** clinic_002

### Podiatras
- **Email:** `doctor1@centromedico.com` | **Password:** `doctor123`
- **Email:** `doctor2@centromedico.com` | **Password:** `doctor123`
- **Email:** `doctor3@centromedico.com` | **Password:** `doctor123`

---

## 🏥 CLÍNICA 3: "Podología Integral Plus"

### Administrador de Clínica
- **Email:** `sofia.rodriguez@integralplus.com`
- **Password:** `manager123`
- **Rol:** Clinic Admin
- **Clínica:** clinic_003

### Podiatras
- **Email:** `doctor1@integralplus.com` | **Password:** `doctor123`
- **Email:** `doctor2@integralplus.com` | **Password:** `doctor123`
- **Email:** `doctor3@integralplus.com` | **Password:** `doctor123`

---

## 👨‍⚕️ MÉDICOS INDEPENDIENTES (Sin Clínica)

- **Email:** `pablo.hernandez@gmail.com` | **Password:** `doctor123`
- **Email:** `lucia.santos@outlook.com` | **Password:** `doctor123`
- **Email:** `andres.molina@yahoo.es` | **Password:** `doctor123`
- **Email:** `beatriz.ortiz@hotmail.com` | **Password:** `doctor123`

---

## 🧪 Cómo Probar Rate Limiting

### Paso 1: Probar Límites Progresivos

1. Abre la aplicación en `http://localhost:5173`
2. Intenta login con credenciales **INCORRECTAS**:
   - Email: `test@test.com`
   - Password: `wrong1` (primera vez)
3. Verás: "Email o contraseña incorrectos"
4. Intenta de nuevo con el mismo email pero password diferente: `wrong2`
5. Intenta una tercera vez: `wrong3`
6. **Resultado esperado**: Después del 3er intento, verás un mensaje de retardo de 5 segundos
7. Espera 5 segundos y vuelve a intentar
8. Después del 5to intento, verás retardo de 30 segundos
9. Después del 10mo intento, verás bloqueo de 15 minutos

### Paso 2: Verificar Login Exitoso

1. Usa credenciales válidas:
   - Email: `admin@podoadmin.com`
   - Password: `admin123`
2. Deberías poder iniciar sesión sin problemas

### Paso 3: Verificar que se Limpia el Rate Limit

1. Después de un login exitoso, los intentos fallidos se limpian
2. Puedes volver a probar con credenciales incorrectas desde cero

---

## 🔍 Solución de Problemas

### Error: "Error interno del servidor"

Si ves este error, verifica:

1. **Variables de entorno configuradas:**
   ```bash
   bun run setup:env
   ```

2. **Servidor corriendo:**
   ```bash
   bun run dev
   ```

3. **Consola del navegador:** Revisa errores en la consola (F12)

4. **Consola del servidor:** Revisa errores en la terminal donde corre el servidor

### Rate Limiting No Funciona

1. Verifica que no estés usando una IP en la whitelist
2. Verifica que el rate limiting esté habilitado (no comentado)
3. Revisa la consola del servidor para ver errores

### Login No Funciona

1. Verifica que las credenciales sean exactas (case-sensitive para email)
2. Verifica que el usuario no esté bloqueado/baneado
3. Revisa la consola del servidor para ver errores específicos

---

## 🗄️ Usuarios mock cuando todo usa DB

Si la app está **migrada a base de datos (D1)** y el login busca primero en DB (`getUserByEmailFromDB`), los usuarios mock (estas credenciales) **deben estar en la DB** para poder iniciar sesión.

### Cómo dejar los usuarios mock en la DB

1. **Generar el SQL de seed** (si aún no existe o cambiaste la lista de mock):
   ```bash
   npm run db:seed-mock-users
   ```
   Eso crea/actualiza `src/api/migrations/0006_seed_mock_users.sql` con los mismos usuarios y contraseñas hasheadas.

2. **Aplicar el seed a tu base D1** (tras las migraciones de schema):
   ```bash
   wrangler d1 execute <NOMBRE_DE_TU_DB> --remote --file=src/api/migrations/0006_seed_mock_users.sql
   ```
   Usa `--local` en lugar de `--remote` si estás en entorno local.

Con eso, **admin@podoadmin.com** / **admin123** y el resto de credenciales de esta guía siguen funcionando aunque todo el auth use DB.

---

## 📝 Notas

- Todos los passwords son en minúsculas
- Los emails son case-insensitive (se normalizan a minúsculas)
- El rate limiting se resetea después de 1 hora sin intentos
- El rate limiting se limpia automáticamente en login exitoso
- Los intentos se rastrean por email + IP para mayor seguridad
