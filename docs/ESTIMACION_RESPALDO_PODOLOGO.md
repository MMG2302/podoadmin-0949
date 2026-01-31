# Estimación de tamaño de respaldo por podólogo

Escenario: **1 podólogo con 1.000 pacientes**. ¿Cuánto pesa “el respaldo” de ese podólogo (datos que le pertenecen o que ha generado)?

---

## Qué entra en el respaldo del podólogo

- **Pacientes** creados por él (o asignados a su clínica): tabla `patients`
- **Sesiones clínicas** de esos pacientes: tabla `clinical_sessions` (incluye `notes` en JSON: texto + **imágenes en data URI**)
- **Citas** asociadas a esos pacientes: tabla `appointments`
- **Perfil del podólogo**: `created_users`, `professional_info`, `professional_logos` (1 logo)
- Opcional: sus filas en `audit_log`, `credit_transactions`, `notifications` (peso pequeño frente al resto)

---

## Tamaños aproximados por tabla (1.000 pacientes)

| Dato | Registros típicos | Tamaño por registro | Total aproximado |
|------|-------------------|---------------------|------------------|
| **Pacientes** | 1.000 | ~2–4 KB (datos personales + `medical_history`/`consent` en JSON) | **2–4 MB** |
| **Citas** | 2.000–5.000 (2–5 por paciente) | ~0,3–0,5 KB | **0,5–2 MB** |
| **Logo profesional** | 1 | hasta 2 MB (binario) → ~2,7 MB en base64 | **0–2,7 MB** |
| **Sesiones clínicas** | variable | **Depende mucho de las imágenes** | ver abajo |

El peso real lo marcan las **sesiones clínicas**, porque en `notes` se guarda un JSON que puede incluir **hasta 10 imágenes por sesión**, cada una hasta **2 MB** (en base64 ~2,7 MB).

---

## Sesiones clínicas: el factor crítico

- **Límites en código:** máx. 10 imágenes por sesión, máx. 2 MB por imagen (binario) → en base64 ~2,7 MB por imagen.
- **Por sesión (solo texto):** ~1–3 KB (anamnesis, exploración, diagnóstico, plan, etc.).
- **Por sesión con imágenes:** texto + N × (tamaño de imagen en base64). Ejemplo: 2 imágenes de 500 KB cada una → ~1,35 MB solo en imágenes.

Supongamos **10 sesiones por paciente** (10.000 sesiones en total):

| Uso de imágenes | Tamaño por sesión (aprox.) | 10.000 sesiones |
|-----------------|----------------------------|------------------|
| Sin imágenes | ~2 KB | **~20 MB** |
| Poco (0,2 imágenes/sesión × 400 KB) | ~110 KB | **~1,1 GB** |
| Moderado (1,5 imágenes/sesión × 400 KB) | ~800 KB | **~8 GB** |
| Alto (3 imágenes/sesión × 1 MB) | ~4 MB | **~40 GB** |

---

## Resumen: ¿cuánto pesa el respaldo?

Para **1 podólogo con 1.000 pacientes** y **10.000 sesiones** (10 por paciente):

| Escenario | Contenido típico | **Tamaño total aprox.** |
|-----------|-------------------|-------------------------|
| Sin fotos en sesiones | Solo texto en sesiones | **~30–50 MB** |
| Poco uso de fotos | Alguna foto en pocas sesiones | **~1–2 GB** |
| Uso moderado | 1–2 fotos por sesión, tamaño medio | **~8–12 GB** |
| Uso intenso | Varias fotos por sesión, cerca del límite | **~40–50 GB** |

En la práctica, lo que hace crecer el respaldo es **el número de sesiones y cuántas imágenes (y de qué tamaño) se guardan en cada una**. Los 1.000 pacientes en sí son solo unos pocos MB.

---

## Notas técnicas

- Las imágenes van dentro del campo `notes` de `clinical_sessions` como **data URI** (base64), no como archivos aparte. Por eso la base de datos crece tanto si se suben muchas fotos.
- Para reducir el tamaño del respaldo o mejorar rendimiento, a futuro se podría guardar las imágenes en almacenamiento externo (p. ej. R2/S3) y en la BD solo la URL; ver `DEFENSA_TEXTO_FOTOS.md` (servir desde CDN/storage).
