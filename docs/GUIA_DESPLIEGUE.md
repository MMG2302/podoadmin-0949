# Guía de Despliegue – PodoAdmin

Guía paso a paso para personas no técnicas. Incluye despliegue sin dominio, documentos que se pueden borrar y explicación del ciclo de cancelación de usuarios.

---

## 1. Despliegue paso a paso (sin dominio)

Cloudflare te da una URL gratuita al desplegar (ej: `https://tu-proyecto.workers.dev`). No necesitas comprar dominio para empezar.

### Fase 1: Preparar tu computadora

| Paso | Qué hacer | Cómo |
|------|-----------|------|
| 1 | Instalar Node.js | Ir a [nodejs.org](https://nodejs.org), descargar e instalar (versión LTS) |
| 2 | Instalar Bun (opcional) | Ir a [bun.sh](https://bun.sh) y seguir las instrucciones. Si no quieres, puedes usar npm |
| 3 | Crear cuenta en Cloudflare | Ir a [dash.cloudflare.com](https://dash.cloudflare.com) y registrarte |

### Fase 2: Abrir el proyecto

| Paso | Qué hacer |
|------|-----------|
| 4 | Abrir la terminal (PowerShell o CMD en Windows) |
| 5 | Ir a la carpeta del proyecto: `cd "ruta\donde\está\podoadmin-0949"` |
| 6 | Instalar dependencias: `bun install` o `npm install` |

### Fase 3: Configurar Cloudflare

| Paso | Qué hacer |
|------|-----------|
| 7 | Iniciar sesión en Cloudflare: `npx wrangler login` (se abrirá el navegador) |
| 8 | Crear base de datos D1: Dashboard → Workers & Pages → D1 → Create database → nombre: `podoadmin` |
| 9 | Crear bucket R2: Workers & Pages → R2 → Create bucket → nombre: `podoadmin` |
| 10 | Copiar el **Database ID** de D1 (aparece en la lista de bases de datos) |

### Fase 4: Ajustar la configuración del proyecto

| Paso | Qué hacer |
|------|-----------|
| 11 | Abrir `wrangler.toml` o `wrangler.json` con un editor de texto |
| 12 | Cambiar `name` a algo único, por ejemplo: `podoadmin-tu-nombre` |
| 13 | En la sección `d1_databases`, poner el `database_id` que copiaste en el paso 10 |
| 14 | En `r2_buckets`, poner el mismo nombre del bucket que creaste |

### Fase 5: Generar claves secretas

| Paso | Qué hacer |
|------|-----------|
| 15 | Ejecutar: `node scripts/setup-env.js` (genera claves automáticamente) |
| 16 | O generar manualmente con: `openssl rand -base64 32` (3 veces, para JWT, REFRESH y CSRF) |

### Fase 6: Configurar variables en Cloudflare

| Paso | Qué hacer |
|------|-----------|
| 17 | Ejecutar: `npx wrangler secret put JWT_SECRET` → pegar la clave y Enter |
| 18 | Repetir para: `REFRESH_TOKEN_SECRET`, `CSRF_SECRET`, `BETTER_AUTH_SECRET` |
| 19 | Configurar variables públicas: Dashboard → tu Worker → Settings → Variables → añadir: `VITE_BASE_URL` = `https://TU-PROYECTO.workers.dev` (la URL que te dará Cloudflare) |

### Fase 7: Base de datos y primer usuario

| Paso | Qué hacer |
|------|-----------|
| 20 | Aplicar migraciones: `bun db:migrate:remote` o `npm run db:migrate:remote` |
| 21 | Crear super admin: `node scripts/create-super-admin.cjs "tu@email.com" "TuContraseñaSegura" "Tu Nombre"` |
| 22 | Subir el super admin a la BD remota: `npx wrangler d1 execute DB --remote --file=scripts/super-admin.sql` |

### Fase 8: Desplegar

| Paso | Qué hacer |
|------|-----------|
| 23 | Compilar: `bun run build` o `npm run build` |
| 24 | Desplegar: `bun run deploy` o `npm run deploy` |
| 25 | En la terminal aparecerá la URL, por ejemplo: `https://podoadmin-tu-nombre.workers.dev` |

### Fase 9: Probar

| Paso | Qué hacer |
|------|-----------|
| 26 | Abrir la URL en el navegador |
| 27 | Iniciar sesión con el email y contraseña del super admin |

---

## 2. Arquitectura del despliegue

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA DE DESPLIEGUE - PODADMIN                     │
└─────────────────────────────────────────────────────────────────────────────┘

  TU COMPUTADORA                    CLOUDFLARE (Internet)
  ───────────────                   ────────────────────

  ┌──────────────┐
  │ 1. Código    │
  │    (repo)    │
  └──────┬───────┘
         │ bun install
         │ bun run build
         ▼
  ┌──────────────┐     wrangler deploy      ┌─────────────────────────────┐
  │ 2. Build     │ ──────────────────────► │  CLOUDFLARE WORKERS          │
  │    (dist/)   │                          │  Tu app en la nube           │
  └──────────────┘                          │  URL: xxx.workers.dev        │
         │                                  └──────────────┬───────────────┘
         │ db:migrate:remote                                │
         ▼                                                 │ usa
  ┌──────────────┐                          ┌──────────────┴───────────────┐
  │ 3. Wrangler  │ ───────────────────────►│  D1 (Base de datos)         │
  │    CLI       │   crea tablas            │  Usuarios, pacientes, etc.   │
  └──────────────┘                          └─────────────────────────────┘
         │                                                 ▲
         │ secret put                                       │ usa
         ▼                                                 │
  ┌──────────────┐                          ┌──────────────┴───────────────┐
  │ 4. Secrets   │ ───────────────────────►│  R2 (Almacenamiento)        │
  │    (claves)  │   JWT, CSRF, etc.       │  Logos, imágenes             │
  └──────────────┘                          └─────────────────────────────┘

  USUARIOS FINALES
  ────────────────
  Navegador → https://tu-proyecto.workers.dev → Cloudflare sirve la app
```

---

## 3. Documentos que se pueden borrar antes de subir a producción

### Arquitectura de documentos

```
DOCUMENTOS DEL REPOSITORIO
│
├── MANTENER (útiles para ti o el equipo)
│   ├── README.md
│   ├── PRODUCCION_CONFIG.md
│   ├── CHECKLIST_DEPLOY_PRODUCCION.md
│   ├── ENV_VARIABLES.md
│   ├── GESTION_CUENTAS.md
│   └── docs/GUIA_DESPLIEGUE.md (esta guía)
│
├── BORRAR (solo para desarrollo interno)
│   ├── CREDENCIALES_PRUEBA.md
│   ├── TEST_CREDENTIALS.md
│   ├── REVISION_PENDIENTE.md
│   ├── REGISTRO_SUGERENCIAS.md
│   ├── IMPLEMENTACION_COMPLETA.md
│   ├── IMPLEMENTATION_COMPLETE.md
│   ├── MIGRATION_GUIDE.md
│   ├── ANALISIS_MIGRACION_LOCAL_A_DB.md
│   └── src/api/tests/xss-payloads.test.md
│
├── BORRAR (documentación técnica muy detallada)
│   ├── ARQUITECTURA_SAAS_SEGURIDAD.md
│   ├── COMPLIANCE_CONFIANZA.md
│   ├── CONFIGURACION_SEGURIDAD.md
│   ├── DETECCION_PHISHING_MULTICAPA.md
│   ├── DEFENSA_TEXTO_FOTOS.md
│   ├── GUIA_PRACTICA_PRUEBAS.md
│   ├── GUIA_PRUEBAS_REGISTRO.md
│   ├── INPUT_SECURITY.md
│   ├── PHISHING_PROTECTION.md
│   ├── RENDERIZADO_SEGURO.md
│   ├── RESUMEN_CONFIGURACION.md
│   ├── SECURITY_IMPLEMENTATION.md
│   ├── UPLOAD_ISOLATION.md
│   ├── REGISTRO_IMPLEMENTADO.md
│   ├── src/api/SECURITY_SUMMARY.md
│   ├── src/api/SECURITY_CHECKLIST.md
│   ├── src/api/RATE_LIMITING.md
│   ├── src/api/COOKIES_IMPLEMENTATION.md
│   ├── src/api/CSRF_IMPLEMENTATION.md
│   ├── src/api/INPUT_SECURITY.md
│   ├── src/api/README.md
│   └── docs/
│       ├── ALIGERAR_SISTEMA.md
│       ├── ESTIMACION_RESPALDO_PODOLOGO.md
│       ├── LOGO_Y_CONSENTIMIENTO_SETTINGS.md
│       └── MIGRACION_R2_IMAGENES.md
│
└── OPCIONAL (manual de referencia)
    └── manual/
        ├── payments.md
        ├── authentication.md
        ├── analytics.md
        └── ai.md
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

## 4. Ciclo de cancelación: deshabilitar usuario y manejo de datos

### Flujo implementado

Cuando deshabilitas a un usuario, se activa este ciclo automático:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CICLO DE CANCELACIÓN DE USUARIO                           │
└─────────────────────────────────────────────────────────────────────────────┘

  T=0                    T=30 días              T=240 días (8 meses)
  │                      │                      │
  │  Deshabilitar        │  Bloqueo             │  Borrado permanente
  │  cuenta              │  automático          │  (cron diario)
  ▼                      ▼                      ▼
  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
  │ PERÍODO DE   │      │  BLOQUEADO   │      │  ELIMINADO   │
  │ GRACIA       │ ───► │  (no puede   │ ───► │  (cuenta y   │
  │ (1 mes)      │      │   acceder)   │      │   datos      │
  │              │      │  (7 meses)   │      │   borrados)  │
  │ ✓ Puede      │      │              │      │              │
  │   acceder    │      │ ✗ No puede   │      │ ✗ Irreversible│
  │ ✓ Exportar   │      │   acceder    │      │              │
  │   datos      │      │              │      │              │
  └──────────────┘      └──────────────┘      └──────────────┘
```

### Resumen por fase

| Fase | Duración | ¿Puede acceder? | ¿Qué pasa con los datos? |
|------|----------|-----------------|--------------------------|
| **Período de gracia** | 0–30 días | Sí | Los datos siguen en la base de datos. Puede exportarlos. |
| **Bloqueado** | 30–240 días | No | Los datos siguen guardados pero no puede entrar. |
| **Borrado permanente** | 240+ días | — | Cuenta y datos asociados se borran (cron diario a las 6:00 UTC). |

### Qué se borra al llegar a borrado permanente

- Usuario
- Pacientes creados por el usuario
- Sesiones clínicas
- Citas
- Créditos y transacciones
- Notificaciones
- Logs de auditoría relacionados
- Tokens (2FA, reset, verificación)
- Datos profesionales (logos, credenciales)
- Conversaciones de soporte

### Cómo cancelar el ciclo

Si **habilitas** al usuario antes de los 8 meses, el ciclo se cancela y los datos se conservan.

### Dónde se gestiona

- **Usuarios** → menú (⋮) → "Deshabilitar cuenta" / "Habilitar cuenta"
- Solo Super Admin o Clinic Admin (para recepcionistas de su clínica)

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

- **PRODUCCION_CONFIG.md** – Variables y configuración de producción
- **CHECKLIST_DEPLOY_PRODUCCION.md** – Checklist antes del primer deploy
- **GESTION_CUENTAS.md** – Detalle de deshabilitar, bloquear, banear y eliminar
