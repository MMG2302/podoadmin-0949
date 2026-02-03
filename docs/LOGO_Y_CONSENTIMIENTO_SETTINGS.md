# Logo y Consentimiento en Settings

Resumen de cómo funciona la parte de **Logo** en Ajustes (clinic_manager, podólogos de clínica, podólogos independientes) y cómo se aplicará un patrón similar para **Consentimiento informado**.

---

## 1. Logo en Settings

### 1.1 Quién ve qué

| Rol | Variable | Logo que ve/edita | API |
|-----|----------|-------------------|-----|
| **Clinic Admin** (clinic_manager) | `canUploadLogo` | Logo **de la clínica** (editable) | GET/PUT/DELETE `/clinics/:clinicId/logo` |
| **Podólogo con clínica** | `isPodiatristWithClinic` | Logo **de la clínica** (solo lectura) | GET `/clinics/:clinicId/logo` |
| **Podólogo independiente** | `isPodiatristIndependent` | Logo **profesional propio** (editable) | GET/PUT/DELETE `/professionals/logo/:userId` |

- **Super Admin / Admin**: no tienen logo de clínica; el texto indica que los logos los gestionan los administradores de cada clínica.
- **Recepcionista**: no tiene sección de logo.

### 1.2 Flujo por rol

**Clinic Admin (`canUploadLogo`)**
- Sección: *"Logo de la clínica"*.
- Carga desde: `GET /clinics/:clinicId/logo`.
- Puede: subir imagen (PNG/JPG/WebP, máx. 2MB), vista previa, **Guardar logo**, **Eliminar logo**.
- El logo se usa en PDFs de todos los podólogos de esa clínica.

**Podólogo con clínica (`isPodiatristWithClinic`)**
- Misma sección: *"Logo de la clínica"*.
- Carga desde: `GET /clinics/:clinicId/logo`.
- Solo lectura: mensaje *"Logo compartido de la clínica"*, imagen actual, *"Solo lectura"*.
- No puede subir ni eliminar.

**Podólogo independiente (`isPodiatristIndependent`)**
- Sección: *"Logo Profesional"* (bloque aparte).
- Carga desde: `GET /professionals/logo/:userId`.
- Puede: subir, vista previa, **Guardar logo**, **Eliminar logo**.
- Ese logo se usa en sus propios PDFs.

### 1.3 Resolución de logo para un usuario (PDFs, etc.)

Función `getLogoForUser(userId, clinicId)` en `settings-page.tsx`:
1. Si tiene `clinicId` → `GET /clinics/:clinicId/logo` y devuelve ese logo.
2. Si no (independiente) → `GET /professionals/logo/:userId` y devuelve ese logo.

---

## 2. Consentimiento informado (consent_text) hoy

### 2.1 Dónde está guardado

- **Clínicas**: tabla `clinics`, columnas `consent_text` y `consent_text_version`.
- **Profesionales (podólogo independiente)**: tabla `professional_info`, columnas `consent_text` y `consent_text_version`.

La API ya:
- **Clínica**: `PATCH /clinics/:clinicId` acepta `consentText`; si cambia el texto, sube `consentTextVersion` y a los pacientes de la clínica que tenían una versión anterior se les resetea el consentimiento (y se borra DNI).
- **Profesional**: `PUT /professionals/info/:userId` acepta `consentText`; misma lógica de versión y reset para pacientes del podólogo independiente.
- **Lectura contextual**: `GET /consent-document` (opcional `?podiatristId=xxx` para recepcionistas) devuelve el texto que aplica al podólogo actual (clínica si tiene clínica, si no `professional_info`).

### 2.2 Cómo se muestra en Settings hoy

**Clinic Admin**
- En *"Información de la Clínica"*: textarea *"Términos y condiciones / Consentimiento informado"* (`clinicInfoForm.consentText`).
- Se guarda con el botón *"Guardar información"* (PATCH clínica con `consentText`).

**Podólogo con clínica**
- En *"Información de la Clínica"* (solo lectura) se muestran datos de la clínica; antes se mostraba un enlace `consentDocumentUrl` si existía (campo legacy). Lo coherente con el modelo actual es mostrar que el consentimiento lo gestiona la clínica y, si se quiere, un texto resumido o “Ver texto” cuando haya `consentText` en la clínica.

**Podólogo independiente**
- En *"Información del Consultorio"*: textarea *"Términos y condiciones / Consentimiento informado"* (`professionalInfoForm.consentText`).
- Se guarda con el resto de datos del consultorio (PUT `/professionals/info/:userId`).

### 2.3 Bug corregido

- Antes: `handleSaveClinicInfo` enviaba `consentDocumentUrl` en el PATCH a `/clinics/:clinicId`.
- La API solo acepta `consentText` (y opcionalmente otros campos permitidos).
- Corregido: se envía `consentText` (y ya no `consentDocumentUrl`).

---

## 3. Aplicar “función similar” al consentimiento (recomendación)

Objetivo: que el **consentimiento informado** tenga en Settings un bloque dedicado con la **misma lógica de visibilidad y permisos que el Logo**.

### 3.1 Bloque dedicado “Consentimiento informado”

Misma regla que Logo:

| Rol | Qué ver | Acción |
|-----|---------|--------|
| **Clinic Admin** | Texto de consentimiento de la clínica | Editar y guardar (PATCH clínica con `consentText`) |
| **Podólogo con clínica** | Texto de consentimiento de la clínica | Solo lectura (mensaje tipo “Gestionado por la clínica”) |
| **Podólogo independiente** | Su propio texto de consentimiento | Editar y guardar (PUT `/professionals/info/:userId` con `consentText`) |

Implementación sugerida:
1. **Nueva sección en Settings** (igual que “Logo de la clínica” / “Logo Profesional”):
   - Título: *"Consentimiento informado"* (o *"Términos y condiciones / Consentimiento informado"*).
   - Descripción breve: que este texto lo verá el paciente al crear la ficha y que, si se cambia, los pacientes con versión antigua deberán volver a aceptar.
2. **Clinic Admin**: misma fuente que ahora (`clinicInfoForm.consentText`), pero en este bloque: textarea + botón *"Guardar consentimiento"* que haga PATCH solo con `consentText` (o reutilizar guardado de “Información de la Clínica” si se prefiere un solo guardado).
3. **Podólogo con clínica**: solo lectura del texto de la clínica (cargado con los datos de la clínica) y mensaje de que solo el administrador puede modificarlo.
4. **Podólogo independiente**: misma fuente que ahora (`professionalInfoForm.consentText`) en este bloque: textarea + botón *"Guardar consentimiento"* (o guardar con el resto del consultorio).

Opcional: mostrar **versión actual** (`consentTextVersion`) en la UI para que se vea cuándo se ha actualizado el texto.

### 3.2 Dónde se usa el consentimiento

- **Creación/edición de paciente**: el frontend obtiene el texto con `GET /consent-document` (y `?podiatristId=xxx` si es recepcionista) y lo muestra al paciente; el consentimiento otorgado se guarda en `patient.consent` (incluyendo `consentedToVersion`).
- **Backend**: al actualizar `consent_text` en clínica o profesional, ya se incrementa la versión y se resetea el consentimiento (y DNI) de los pacientes afectados.

Con el bloque dedicado, la “función” del consentimiento en Settings queda alineada con la del Logo: mismo criterio por rol (clinic_manager edita clínica, podólogos de clínica solo lectura, independientes editan el suyo) y misma claridad para el usuario.
