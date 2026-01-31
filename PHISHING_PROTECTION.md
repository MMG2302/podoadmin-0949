# Protección contra phishing

Resumen de medidas ya implementadas y recomendaciones para blindar el sistema frente a phishing.

---

## ✅ Ya implementado

### 1. Login sin revelar si el email existe
- En `POST /api/auth/login`, si el usuario no existe o la contraseña es incorrecta, **siempre** se devuelve el mismo mensaje genérico: *"Email o contraseña incorrectos"*.
- Así un atacante no puede descubrir qué correos están registrados (enumeración de usuarios).

### 2. Autenticación de dos factores (2FA)
- TOTP (códigos de 6 dígitos) y códigos de respaldo.
- Aunque un atacante robe email y contraseña, no puede entrar sin el segundo factor.
- **Recomendación:** Animar a los usuarios (sobre todo admin/clínica) a activar 2FA en Ajustes.

### 3. Rate limiting y bloqueo temporal
- Tras varios intentos fallidos de login: retraso progresivo, CAPTCHA y bloqueo temporal (15 min tras 10 fallos).
- Dificulta ataques por fuerza bruta y automatizados.

### 4. Notificación por email en intentos fallidos
- Si hay varios intentos fallidos, se envía un email al usuario.
- El usuario puede detectar que alguien está probando su cuenta y cambiar la contraseña.

### 5. Cookies seguras
- Tokens en cookies **HttpOnly** (no accesibles desde JavaScript, reducen robo por XSS).
- **SameSite=Lax** para mitigar CSRF.
- **Secure** en producción (solo HTTPS).

### 6. CSRF
- Rutas que modifican estado requieren token CSRF (double-submit cookie).
- Un sitio falso no puede enviar peticiones válidas en nombre del usuario sin el token.

### 7. CORS estricto
- Solo orígenes permitidos (`ALLOWED_ORIGINS`). Un dominio falso no puede llamar a la API con credenciales.

### 8. Headers de seguridad (CSP middleware)
- **Content-Security-Policy:** limita de dónde se cargan scripts y recursos.
- **X-Frame-Options: DENY:** evita que la app se embeba en un iframe (clickjacking).
- **Referrer-Policy:** no se envía la URL completa a sitios externos.
- **Strict-Transport-Security (HSTS)** en producción: el navegador solo usa HTTPS, reduce ataques por HTTP.

### 9. Verificación de email
- Usuarios de registro público deben verificar el email antes de poder iniciar sesión.

---

## Recomendaciones adicionales

### Frontend: aviso de dominio oficial
- En la página de login (y opcionalmente en el layout), mostrar un aviso fijo: *"Solo accede desde [dominio oficial]. No introduzcas credenciales en otros sitios."*
- **API:** `GET /api/public/config` devuelve `{ officialDomain: "https://..." }`. Variable de entorno: `OFFICIAL_APP_DOMAIN` (o se usa el primer origen de `ALLOWED_ORIGINS`).
- El frontend puede llamar a este endpoint al cargar la página de login y mostrar el dominio; así el usuario comprueba que está en la URL correcta.

### Política de contraseñas
- Mínimo 6 caracteres (actual). Valorar subir a 8–10 y exigir mayúsculas, números o símbolos en producción.

### 2FA recomendado u obligatorio
- Para roles `super_admin`, `admin` o `clinic_admin`, valorar hacer 2FA obligatorio o mostrarlo como "Muy recomendado" hasta que lo activen.

### Alertas de inicio de sesión nuevo
- Opcional: enviar email cuando se inicia sesión desde una IP o dispositivo que no se había usado antes (requiere guardar IP/disposito por usuario).

### Lista de dominios oficiales
- Mantener documentada (y en env) la lista de URLs oficiales de la app (p. ej. `https://app.podoadmin.com`) y usarla en emails y avisos para que el usuario compruebe la barra de direcciones.

---

## Resumen rápido

| Medida                         | Estado   |
|--------------------------------|----------|
| Mensaje genérico en login     | ✅       |
| 2FA (TOTP + backup)           | ✅       |
| Rate limiting + CAPTCHA        | ✅       |
| Email en intentos fallidos     | ✅       |
| Cookies HttpOnly / Secure     | ✅       |
| CSRF                           | ✅       |
| CORS estricto                  | ✅       |
| HSTS (producción)              | ✅       |
| Aviso "solo dominio oficial"   | Recomendado (frontend) |
| 2FA obligatorio para admins   | Recomendado (política) |
