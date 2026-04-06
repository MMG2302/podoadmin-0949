# Guía de Migración de Datos

Esta guía explica cómo migrar datos de localStorage a la base de datos D1.

## Pasos de Migración

### 1. Generar Migraciones de Base de Datos

```bash
# Generar migraciones desde el schema
bun run db:generate

# Aplicar migraciones localmente
bun run db:migrate
```

### 2. Configurar Variables de Entorno

```bash
# Ejecutar script de configuración
node scripts/setup-env.js
```

O manualmente crear `.env` con las variables necesarias (ver `ENV_VARIABLES.md`).

### 3. Migrar Rate Limiting a D1

El rate limiting ahora puede usar D1 para persistencia. Para habilitarlo:

1. Actualizar `src/api/routes/auth.ts` para usar funciones de `rate-limit-d1.ts`:

```typescript
// Cambiar de:
import { checkRateLimit, recordFailedAttempt } from '../utils/rate-limit';

// A:
import { checkRateLimitD1, recordFailedAttemptD1 } from '../utils/rate-limit-d1';
```

2. Las funciones son async, así que usar `await`:

```typescript
const rateLimitCheck = await checkRateLimitD1(identifier);
const failedAttempt = await recordFailedAttemptD1(identifier);
```

### 4. Migrar Datos de localStorage

**Opción A: Migración Automática (Recomendada)**

Crear un endpoint de migración que lea datos del cliente y los migre:

```typescript
// En src/api/routes/migration.ts
app.post('/migrate', requireAuth(), async (c) => {
  const body = await c.req.json();
  // body contiene datos de localStorage del cliente
  
  await migratePatientsFromLocalStorage(body.patients);
  await migrateSessionsFromLocalStorage(body.sessions);
  // ... etc
});
```

**Opción B: Migración Manual**

1. Exportar datos de localStorage desde el cliente
2. Usar las funciones de migración en `src/api/utils/migration.ts`
3. Ejecutar migración en un script o endpoint administrativo

### 5. Actualizar Código para Usar Base de Datos

Reemplazar llamadas a `storage.ts` (localStorage) con consultas a D1:

**Antes (localStorage):**
```typescript
import { getPatients, savePatient } from '../../web/lib/storage';

const patients = getPatients();
savePatient(patientData);
```

**Después (D1):**
```typescript
import { database } from '../database';
import { patients } from '../database/schema';
import { eq } from 'drizzle-orm';

const allPatients = await database.select().from(patients);
await database.insert(patients).values(patientData);
```

## Estructura de Datos Migrados

### Tablas Creadas

- `patients` - Pacientes
- `clinical_sessions` - Sesiones clínicas
- `created_users` - Usuarios creados
- `user_credits` - Créditos de usuario
- `credit_transactions` - Transacciones de créditos
- `clinics` - Clínicas
- `clinic_credits` - Créditos de clínica
- `clinic_credit_distributions` - Distribuciones de créditos
- `appointments` - Citas
- `audit_log` - Log de auditoría
- `rate_limit_attempts` - Intentos de rate limiting

## Verificación

Después de la migración:

1. Verificar que los datos se migraron correctamente:
```bash
bun run db:studio
```

2. Probar funcionalidad:
   - Login
   - Crear/editar pacientes
   - Crear sesiones
   - Verificar créditos

3. Verificar rate limiting:
   - Intentar login fallido múltiples veces
   - Verificar que se persiste en D1

## Rollback

Si necesitas revertir la migración:

1. Los datos originales en localStorage del cliente siguen disponibles
2. Puedes deshabilitar el uso de D1 volviendo a las funciones de memoria
3. Las migraciones de D1 se pueden revertir manualmente

## Notas Importantes

- **Backup**: Siempre hacer backup antes de migrar
- **Validación**: Validar datos antes de insertar en D1
- **Sanitización**: Los datos se sanitizan automáticamente con los middlewares
- **Prepared Statements**: Drizzle usa prepared statements automáticamente
- **Transacciones**: Para operaciones complejas, usar transacciones de Drizzle

## Próximos Pasos

1. ✅ Migrar rate limiting a D1
2. ✅ Integrar servicio de email real
3. ⚠️ Migrar todas las funciones de storage.ts a D1
4. ⚠️ Actualizar frontend para usar API en lugar de localStorage
5. ⚠️ Implementar sincronización bidireccional si es necesario
