# GuÃ­a de Despliegue â€“ PodoAdmin

GuÃ­a paso a paso para personas no tÃ©cnicas. Incluye despliegue sin dominio, documentos que se pueden borrar y explicaciÃ³n del ciclo de cancelaciÃ³n de usuarios.

---

## 1. Despliegue paso a paso (sin dominio)

Cloudflare te da una URL gratuita al desplegar (ej: `https://tu-proyecto.workers.dev`). No necesitas comprar dominio para empezar.

### Fase 1: Preparar tu computadora

| Paso | QuÃ© hacer | CÃ³mo |
|------|-----------|------|
| 1 | Instalar Node.js | Ir a [nodejs.org](https://nodejs.org), descargar e instalar (versiÃ³n LTS) |
| 2 | Instalar Bun (opcional) | Ir a [bun.sh](https://bun.sh) y seguir las instrucciones. Si no quieres, puedes usar npm |
| 3 | Crear cuenta en Cloudflare | Ir a [dash.cloudflare.com](https://dash.cloudflare.com) y registrarte |

### Fase 2: Abrir el proyecto

| Paso | QuÃ© hacer |
|------|-----------|
| 4 | Abrir la terminal (PowerShell o CMD en Windows) |
| 5 | Ir a la carpeta del proyecto: `cd "ruta\donde\estÃ¡\podoadmin-0949"` |
| 6 | Instalar dependencias: `bun install` o `npm install` |

### Fase 3: Configurar Cloudflare

| Paso | QuÃ© hacer |
|------|-----------|
| 7 | Iniciar sesiÃ³n en Cloudflare: `npx wrangler login` (se abrirÃ¡ el navegador) |
| 8 | Crear base de datos D1: Dashboard â†’ Workers & Pages â†’ D1 â†’ Create database â†’ nombre: `podoadmin` |
| 9 | Crear bucket R2: Workers & Pages â†’ R2 â†’ Create bucket â†’ nombre: `podoadmin` |
| 10 | Copiar el **Database ID** de D1 (aparece en la lista de bases de datos) |

### Fase 4: Ajustar la configuraciÃ³n del proyecto

| Paso | QuÃ© hacer |
|------|-----------|
| 11 | Abrir `wrangler.toml` o `wrangler.json` con un editor de texto |
| 12 | Cambiar `name` a algo Ãºnico, por ejemplo: `podoadmin-tu-nombre` |
| 13 | En la secciÃ³n `d1_databases`, poner el `database_id` que copiaste en el paso 10 |
| 14 | En `r2_buckets`, poner el mismo nombre del bucket que creaste |

### Fase 5: Generar claves secretas

| Paso | QuÃ© hacer |
|------|-----------|
| 15 | Ejecutar: `node scripts/setup-env.js` (genera claves automÃ¡ticamente) |
| 16 | O generar manualmente con: `openssl rand -base64 32` (3 veces, para JWT, REFRESH y CSRF) |

### Fase 6: Configurar variables en Cloudflare

| Paso | QuÃ© hacer |
|------|-----------|
| 17 | Ejecutar: `npx wrangler secret put JWT_SECRET` â†’ pegar la clave y Enter |
| 18 | Repetir para: `REFRESH_TOKEN_SECRET`, `CSRF_SECRET`, `BETTER_AUTH_SECRET` |
| 19 | Configurar variables pÃºblicas: Dashboard â†’ tu Worker â†’ Settings â†’ Variables â†’ aÃ±adir: `APP_BASE_URL` = `https://TU-PROYECTO.workers.dev` (la URL que te darÃ¡ Cloudflare) |

### Fase 7: Base de datos y primer usuario

| Paso | QuÃ© hacer |
|------|-----------|
| 20 | Aplicar migraciones: `bun db:migrate:remote` o `npm run db:migrate:remote` |
| 21 | Crear super admin: `node scripts/create-super-admin.cjs "tu@email.com" "TuContraseÃ±aSegura" "Tu Nombre"` |
| 22 | Subir el super admin a la BD remota: `npx wrangler d1 execute DB --remote --file=scripts/super-admin.sql` |

### Fase 8: Desplegar

| Paso | QuÃ© hacer |
|------|-----------|
| 23 | Compilar: `bun run build` o `npm run build` |
| 24 | Desplegar: `bun run deploy` o `npm run deploy` |
| 25 | En la terminal aparecerÃ¡ la URL, por ejemplo: `https://podoadmin-tu-nombre.workers.dev` |

### Fase 9: Probar

| Paso | QuÃ© hacer |
|------|-----------|
| 26 | Abrir la URL en el navegador |
| 27 | Iniciar sesiÃ³n con el email y contraseÃ±a del super admin |

---

## 2. Arquitectura del despliegue

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    ARQUITECTURA DE DESPLIEGUE - PODADMIN                     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

  TU COMPUTADORA                    CLOUDFLARE (Internet)
  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€                   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
  â”‚ 1. CÃ³digo    â”‚
  â”‚    (repo)    â”‚
  â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜
         â”‚ bun install
         â”‚ bun run build
         â–¼
  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     wrangler deploy      â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
  â”‚ 2. Build     â”‚ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–º â”‚  CLOUDFLARE WORKERS          â”‚
  â”‚    (dist/)   â”‚                          â”‚  Tu app en la nube           â”‚
  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                          â”‚  URL: xxx.workers.dev        â”‚
         â”‚                                  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
         â”‚ db:migrate:remote                                â”‚
         â–¼                                                 â”‚ usa
  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                          â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
  â”‚ 3. Wrangler  â”‚ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚  D1 (Base de datos)         â”‚
  â”‚    CLI       â”‚   crea tablas            â”‚  Usuarios, pacientes, etc.   â”‚
  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                          â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
         â”‚                                                 â–²
         â”‚ secret put                                       â”‚ usa
         â–¼                                                 â”‚
  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                          â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
  â”‚ 4. Secrets   â”‚ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚  R2 (Almacenamiento)        â”‚
  â”‚    (claves)  â”‚   JWT, CSRF, etc.       â”‚  Logos, imÃ¡genes             â”‚
  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                          â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

  USUARIOS FINALES
  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  Navegador â†’ https://tu-proyecto.workers.dev â†’ Cloudflare sirve la app
```

---

## 3. Documentos que se pueden borrar antes de subir a producciÃ³n

### Arquitectura de documentos

```
DOCUMENTOS DEL REPOSITORIO
â”‚
â”œâ”€â”€ MANTENER (Ãºtiles para ti o el equipo)
â”‚   â”œâ”€â”€ README.md
â”‚   â”œâ”€â”€ PRODUCCION_CONFIG.md
â”‚   â”œâ”€â”€ CHECKLIST_DEPLOY_PRODUCCION.md
â”‚   â”œâ”€â”€ ENV_VARIABLES.md
â”‚   â”œâ”€â”€ GESTION_CUENTAS.md
â”‚   â””â”€â”€ docs/GUIA_DESPLIEGUE.md (esta guÃ­a)
â”‚
â”œâ”€â”€ BORRAR (solo para desarrollo interno)
â”‚   â”œâ”€â”€ CREDENCIALES_PRUEBA.md
â”‚   â”œâ”€â”€ TEST_CREDENTIALS.md
â”‚   â”œâ”€â”€ REVISION_PENDIENTE.md
â”‚   â”œâ”€â”€ REGISTRO_SUGERENCIAS.md
â”‚   â”œâ”€â”€ IMPLEMENTACION_COMPLETA.md
â”‚   â”œâ”€â”€ IMPLEMENTATION_COMPLETE.md
â”‚   â”œâ”€â”€ MIGRATION_GUIDE.md
â”‚   â”œâ”€â”€ ANALISIS_MIGRACION_LOCAL_A_DB.md
â”‚   â””â”€â”€ src/api/tests/xss-payloads.test.md
â”‚
â”œâ”€â”€ BORRAR (documentaciÃ³n tÃ©cnica muy detallada)
â”‚   â”œâ”€â”€ ARQUITECTURA_SAAS_SEGURIDAD.md
â”‚   â”œâ”€â”€ COMPLIANCE_CONFIANZA.md
â”‚   â”œâ”€â”€ CONFIGURACION_SEGURIDAD.md
â”‚   â”œâ”€â”€ DETECCION_PHISHING_MULTICAPA.md
â”‚   â”œâ”€â”€ DEFENSA_TEXTO_FOTOS.md
â”‚   â”œâ”€â”€ GUIA_PRACTICA_PRUEBAS.md
â”‚   â”œâ”€â”€ GUIA_PRUEBAS_REGISTRO.md
â”‚   â”œâ”€â”€ INPUT_SECURITY.md
â”‚   â”œâ”€â”€ PHISHING_PROTECTION.md
â”‚   â”œâ”€â”€ RENDERIZADO_SEGURO.md
â”‚   â”œâ”€â”€ RESUMEN_CONFIGURACION.md
â”‚   â”œâ”€â”€ SECURITY_IMPLEMENTATION.md
â”‚   â”œâ”€â”€ UPLOAD_ISOLATION.md
â”‚   â”œâ”€â”€ REGISTRO_IMPLEMENTADO.md
â”‚   â”œâ”€â”€ src/api/SECURITY_SUMMARY.md
â”‚   â”œâ”€â”€ src/api/SECURITY_CHECKLIST.md
â”‚   â”œâ”€â”€ src/api/RATE_LIMITING.md
â”‚   â”œâ”€â”€ src/api/COOKIES_IMPLEMENTATION.md
â”‚   â”œâ”€â”€ src/api/CSRF_IMPLEMENTATION.md
â”‚   â”œâ”€â”€ src/api/INPUT_SECURITY.md
â”‚   â”œâ”€â”€ src/api/README.md
â”‚   â””â”€â”€ docs/
â”‚       â”œâ”€â”€ ALIGERAR_SISTEMA.md
â”‚       â”œâ”€â”€ ESTIMACION_RESPALDO_PODOLOGO.md
â”‚       â”œâ”€â”€ LOGO_Y_CONSENTIMIENTO_SETTINGS.md
â”‚       â””â”€â”€ MIGRACION_R2_IMAGENES.md
â”‚
â””â”€â”€ OPCIONAL (manual de referencia)
    â””â”€â”€ manual/
        â”œâ”€â”€ payments.md
        â”œâ”€â”€ authentication.md
        â”œâ”€â”€ analytics.md
        â””â”€â”€ ai.md
```

### Lista resumida para borrar

| # | Archivo |
|---|---------|
| 1 | CREDENCIALES_PRUEBA.md |
| 2 | TEST_CREDENTIALS.md |
| 3 | REVISION_PENDIENTE.md |
| 4 | REGISTRO_SUGERENCIAS.md |
| 5 | IMPLEMENTACION_COMPLETA.md |
| 6 | IMPLEMENTATION_COMPLETE.md |
| 7 | MIGRATION_GUIDE.md |
| 8 | ANALISIS_MIGRACION_LOCAL_A_DB.md |
| 9 | src/api/tests/xss-payloads.test.md |
| 10 | ARQUITECTURA_SAAS_SEGURIDAD.md |
| 11 | COMPLIANCE_CONFIANZA.md |
| 12 | CONFIGURACION_SEGURIDAD.md |
| 13 | DETECCION_PHISHING_MULTICAPA.md |
| 14 | DEFENSA_TEXTO_FOTOS.md |
| 15 | GUIA_PRACTICA_PRUEBAS.md |
| 16 | GUIA_PRUEBAS_REGISTRO.md |
| 17 | INPUT_SECURITY.md |
| 18 | PHISHING_PROTECTION.md |
| 19 | RENDERIZADO_SEGURO.md |
| 20 | RESUMEN_CONFIGURACION.md |
| 21 | SECURITY_IMPLEMENTATION.md |
| 22 | UPLOAD_ISOLATION.md |
| 23 | REGISTRO_IMPLEMENTADO.md |
| 24 | src/api/SECURITY_SUMMARY.md |
| 25 | src/api/SECURITY_CHECKLIST.md |
| 26 | src/api/RATE_LIMITING.md |
| 27 | src/api/COOKIES_IMPLEMENTATION.md |
| 28 | src/api/CSRF_IMPLEMENTATION.md |
| 29 | src/api/README.md |
| 30 | docs/ALIGERAR_SISTEMA.md |
| 31 | docs/ESTIMACION_RESPALDO_PODOLOGO.md |
| 32 | docs/LOGO_Y_CONSENTIMIENTO_SETTINGS.md |
| 33 | docs/MIGRACION_R2_IMAGENES.md |
| 34 | manual/payments.md |
| 35 | manual/authentication.md |
| 36 | manual/analytics.md |
| 37 | manual/ai.md |

---

## 4. Ciclo de cancelaciÃ³n: deshabilitar usuario y manejo de datos

### Flujo implementado

Cuando deshabilitas a un usuario, se activa este ciclo automÃ¡tico:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    CICLO DE CANCELACIÃ“N DE USUARIO                           â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

  T=0                    T=30 dÃ­as              T=240 dÃ­as (8 meses)
  â”‚                      â”‚                      â”‚
  â”‚  Deshabilitar        â”‚  Bloqueo             â”‚  Borrado permanente
  â”‚  cuenta              â”‚  automÃ¡tico          â”‚  (cron diario)
  â–¼                      â–¼                      â–¼
  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”      â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”      â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
  â”‚ PERÃODO DE   â”‚      â”‚  BLOQUEADO   â”‚      â”‚  ELIMINADO   â”‚
  â”‚ GRACIA       â”‚ â”€â”€â”€â–º â”‚  (no puede   â”‚ â”€â”€â”€â–º â”‚  (cuenta y   â”‚
  â”‚ (1 mes)      â”‚      â”‚   acceder)   â”‚      â”‚   datos      â”‚
  â”‚              â”‚      â”‚  (7 meses)   â”‚      â”‚   borrados)  â”‚
  â”‚ âœ“ Puede      â”‚      â”‚              â”‚      â”‚              â”‚
  â”‚   acceder    â”‚      â”‚ âœ— No puede   â”‚      â”‚ âœ— Irreversibleâ”‚
  â”‚ âœ“ Exportar   â”‚      â”‚   acceder    â”‚      â”‚              â”‚
  â”‚   datos      â”‚      â”‚              â”‚      â”‚              â”‚
  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜      â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜      â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Resumen por fase

| Fase | DuraciÃ³n | Â¿Puede acceder? | Â¿QuÃ© pasa con los datos? |
|------|----------|-----------------|--------------------------|
| **PerÃ­odo de gracia** | 0â€“30 dÃ­as | SÃ­ | Los datos siguen en la base de datos. Puede exportarlos. |
| **Bloqueado** | 30â€“240 dÃ­as | No | Los datos siguen guardados pero no puede entrar. |
| **Borrado permanente** | 240+ dÃ­as | â€” | Cuenta y datos asociados se borran (cron diario a las 6:00 UTC). |

### QuÃ© se borra al llegar a borrado permanente

- Usuario
- Pacientes creados por el usuario
- Sesiones clÃ­nicas
- Citas
- CrÃ©ditos y transacciones
- Notificaciones
- Logs de auditorÃ­a relacionados
- Tokens (2FA, reset, verificaciÃ³n)
- Datos profesionales (logos, credenciales)
- Conversaciones de soporte

### CÃ³mo cancelar el ciclo

Si **habilitas** al usuario antes de los 8 meses, el ciclo se cancela y los datos se conservan.

### DÃ³nde se gestiona

- **Usuarios** â†’ menÃº (â‹®) â†’ "Deshabilitar cuenta" / "Habilitar cuenta"
- Solo Super Admin o Clinic Admin (para recepcionistas de su clÃ­nica)

---

## 5. Requisitos de hosting

| Requisito | Detalle |
|-----------|---------|
| **Plataforma** | Cloudflare Workers |
| **Base de datos** | Cloudflare D1 |
| **Almacenamiento** | Cloudflare R2 |
| **Dominio** | Opcional. Sin dominio: `https://tu-proyecto.workers.dev` |

---

## 6. Referencias

- **PRODUCCION_CONFIG.md** â€“ Variables y configuraciÃ³n de producciÃ³n
- **CHECKLIST_DEPLOY_PRODUCCION.md** â€“ Checklist antes del primer deploy
- **GESTION_CUENTAS.md** â€“ Detalle de deshabilitar, bloquear, banear y eliminar
