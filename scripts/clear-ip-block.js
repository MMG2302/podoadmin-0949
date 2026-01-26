/**
 * Script para limpiar el bloqueo de una IP en el rate limiting de registro
 * Uso: node scripts/clear-ip-block.js [IP_ADDRESS]
 * Si no se proporciona IP, limpia todos los bloqueos
 */

import { database } from '../src/api/database/index.js';
import { registrationRateLimit } from '../src/api/database/schema.js';
import { eq, lt } from 'drizzle-orm';

async function clearIPBlock(ipAddress) {
  try {
    if (ipAddress) {
      // Limpiar IP específica
      const result = await database
        .delete(registrationRateLimit)
        .where(eq(registrationRateLimit.identifier, ipAddress));
      console.log(`✅ Bloqueo de IP ${ipAddress} limpiado`);
    } else {
      // Limpiar todos los bloqueos expirados
      const now = Date.now();
      const result = await database
        .delete(registrationRateLimit)
        .where(lt(registrationRateLimit.blockedUntil, now));
      console.log(`✅ Todos los bloqueos expirados limpiados`);
    }
  } catch (error) {
    console.error('❌ Error limpiando bloqueo:', error);
    process.exit(1);
  }
}

// Obtener IP del argumento de línea de comandos
const ipAddress = process.argv[2];

if (ipAddress) {
  console.log(`Limpiando bloqueo para IP: ${ipAddress}`);
} else {
  console.log('Limpiando todos los bloqueos expirados...');
}

clearIPBlock(ipAddress).then(() => {
  console.log('✅ Completado');
  process.exit(0);
});
