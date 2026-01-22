# 🔐 Gestión de Cuentas de Usuario - Super Admin

## 📍 Ubicación

La gestión de cuentas está disponible en la página de **Usuarios** (`/users`) para el Super Admin.

## 🎯 Funcionalidades Disponibles

### 1. Deshabilitar/Habilitar Cuentas

**¿Qué hace?**
- **Deshabilitar**: Impide que el usuario inicie sesión. La cuenta permanece en el sistema pero no puede acceder.
- **Habilitar**: Restaura el acceso del usuario a la plataforma.

**Cuándo usar:**
- Deshabilitar: Cuando necesitas suspender temporalmente el acceso de un usuario sin eliminar su cuenta
- Habilitar: Para restaurar el acceso después de una suspensión temporal

**Cómo usar:**
1. Ve a la página de Usuarios
2. Encuentra el usuario que deseas gestionar
3. Haz clic en el menú de tres puntos (⋮) junto al usuario
4. Selecciona "⚠️ Deshabilitar cuenta" o "✅ Habilitar cuenta"

### 2. Bloquear/Desbloquear Cuentas

**¿Qué hace?**
- **Bloquear**: Bloqueo temporal de la cuenta (similar a deshabilitar pero con diferente semántica)
- **Desbloquear**: Restaura el acceso

**Cuándo usar:**
- Para bloqueos temporales por seguridad o investigación

### 3. Banear/Desbanear Cuentas

**¿Qué hace?**
- **Banear**: Bloqueo permanente de la cuenta. El usuario no puede iniciar sesión.
- **Desbanear**: Revierte un baneo permanente

**Cuándo usar:**
- Para violaciones graves de términos de servicio
- Acción permanente (requiere confirmación doble)

### 4. Eliminar Cuentas

**¿Qué hace?**
- Elimina permanentemente la cuenta y todos sus datos asociados
- **IRREVERSIBLE** - Requiere doble confirmación

**Cuándo usar:**
- Solo cuando es absolutamente necesario eliminar todos los datos del usuario
- **ADVERTENCIA**: Esta acción no se puede deshacer

## 🎨 Indicadores Visuales

### Estados de Cuenta

En la tabla de usuarios, verás badges de estado:

- **✅ Activo**: Cuenta habilitada y funcionando normalmente
- **⚠️ Deshabilitado**: Cuenta deshabilitada, no puede iniciar sesión
- **🔒 Bloqueado**: Cuenta bloqueada temporalmente
- **🚫 Baneado**: Cuenta baneada permanentemente

### Botones de Acción

Los botones están organizados por prioridad:

1. **Gestión de Estado** (más común):
   - ⚠️ Deshabilitar cuenta / ✅ Habilitar cuenta
   - 🔒 Bloquear cuenta / Desbloquear cuenta

2. **Acciones Permanentes** (menos comunes):
   - 🚫 Banear cuenta / Desbanear cuenta
   - 🗑️ Eliminar cuenta

## 📋 Restricciones

### Solo para Usuarios Creados

- Las acciones de gestión solo están disponibles para usuarios **creados** por el Super Admin
- Los usuarios mock (predefinidos) no pueden ser gestionados desde la UI
- Esto se debe a que los usuarios mock están hardcodeados en el sistema

### Permisos Requeridos

- Solo el **Super Admin** puede gestionar cuentas
- Los demás roles (Admin, Clinic Admin, Podiatrist) no tienen acceso a estas funciones

## 🔄 Sincronización con el Servidor

Todas las acciones se sincronizan con el servidor:

1. **Habilitar/Deshabilitar**: 
   - Endpoint: `POST /api/users/:userId/enable` o `/disable`
   - Se valida en el servidor en cada login

2. **Bloquear/Desbloquear**:
   - Endpoint: `POST /api/users/:userId/block` o `/unblock`
   - Se valida en el servidor en cada login

3. **Banear/Desbanear**:
   - Endpoint: `POST /api/users/:userId/ban` o `/unban`
   - Se valida en el servidor en cada login

## 📝 Log de Auditoría

Todas las acciones se registran en el log de auditoría:

- **DISABLE_USER**: Cuando se deshabilita una cuenta
- **ENABLE_USER**: Cuando se habilita una cuenta
- **BLOCK_USER**: Cuando se bloquea una cuenta
- **UNBLOCK_USER**: Cuando se desbloquea una cuenta
- **BAN_USER**: Cuando se banea una cuenta
- **UNBAN_USER**: Cuando se desbanea una cuenta
- **DELETE_USER**: Cuando se elimina una cuenta

## ⚠️ Importante

1. **Deshabilitar vs Bloquear vs Banear**:
   - **Deshabilitar**: Suspensión temporal, fácil de revertir
   - **Bloquear**: Bloqueo temporal por seguridad
   - **Banear**: Bloqueo permanente, requiere acción explícita para revertir

2. **Efecto Inmediato**:
   - Si un usuario está activo en el sistema cuando se deshabilita, puede seguir usando la sesión actual
   - El bloqueo se aplica en el siguiente intento de login o refresh de token

3. **Backup de Datos**:
   - Antes de eliminar una cuenta, asegúrate de tener backup de los datos importantes
   - Considera deshabilitar en lugar de eliminar si los datos pueden ser necesarios

## 🚀 Uso Rápido

### Deshabilitar una cuenta:
1. Usuarios → Buscar usuario → Menú (⋮) → ⚠️ Deshabilitar cuenta

### Habilitar una cuenta:
1. Usuarios → Buscar usuario → Menú (⋮) → ✅ Habilitar cuenta

### Ver estado de todas las cuentas:
1. Usuarios → Columna "Estado" muestra el estado actual de cada usuario

## 📞 Soporte

Si necesitas ayuda con la gestión de cuentas:
- Revisa el log de auditoría para ver el historial de acciones
- Verifica que tengas permisos de Super Admin
- Asegúrate de que el usuario sea un usuario creado (no mock)
