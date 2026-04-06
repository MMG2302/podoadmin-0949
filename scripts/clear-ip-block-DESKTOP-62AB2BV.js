#!/usr/bin/env node
/**
 * Script helper para limpiar el bloqueo de una IP en el rate limiting de registro
 * 
 * ⚠️  IMPORTANTE: Este script NO puede ejecutarse directamente con Node.js porque
 *     la base de datos requiere el entorno de Cloudflare Workers (cloudflare:workers).
 * 
 * 📋 OPCIONES DISPONIBLES:
 * 
 * 1. Usar el endpoint API (RECOMENDADO - solo en desarrollo):
 *    curl -X POST http://localhost:8787/api/auth/clear-ip-block \\
 *      -H "Content-Type: application/json" \\
 *      -d '{"ipAddress": "192.168.1.1"}'  # Opcional: sin IP limpia todos los bloqueos expirados
 * 
 *    O con GET (más simple):
 *    curl "http://localhost:8787/api/auth/clear-ip-block?ip=192.168.1.1"
 *    curl "http://localhost:8787/api/auth/clear-ip-block"  # Limpia todos los expirados
 * 
 * 2. Usar wrangler d1 execute con SQL:
 *    # Limpiar IP específica:
 *    wrangler d1 execute DB --command="DELETE FROM registration_rate_limit WHERE identifier = '192.168.1.1'"
 * 
 *    # Limpiar todos los bloqueos expirados:
 *    wrangler d1 execute DB --command="DELETE FROM registration_rate_limit WHERE blocked_until IS NOT NULL AND blocked_until < ${Date.now()}"
 * 
 *    # Limpiar TODOS los registros (cuidado):
 *    wrangler d1 execute DB --command="DELETE FROM registration_rate_limit"
 * 
 * 3. Usar archivos SQL:
 *    wrangler d1 execute DB --file=scripts/clear-ip-block.sql
 *    wrangler d1 execute DB --file=scripts/clear-ip-block-all.sql
 */

const ipAddress = process.argv[2];
const baseUrl = process.env.API_URL || 'http://localhost:8787';

if (ipAddress) {
  console.log(`
📝 Para limpiar la IP: ${ipAddress}

Ejecuta uno de estos comandos:

1. Usando curl (endpoint API):
   curl -X POST ${baseUrl}/api/auth/clear-ip-block \\
     -H "Content-Type: application/json" \\
     -d '{"ipAddress": "${ipAddress}"}'

   O más simple (GET):
   curl "${baseUrl}/api/auth/clear-ip-block?ip=${ipAddress}"

2. Usando wrangler d1:
   wrangler d1 execute DB --command="DELETE FROM registration_rate_limit WHERE identifier = '${ipAddress}'"
`);
} else {
  console.log(`
📝 Para limpiar todos los bloqueos expirados:

Ejecuta uno de estos comandos:

1. Usando curl (endpoint API):
   curl -X POST ${baseUrl}/api/auth/clear-ip-block \\
     -H "Content-Type: application/json"

   O más simple:
   curl "${baseUrl}/api/auth/clear-ip-block"

2. Usando wrangler d1:
   wrangler d1 execute DB --command="DELETE FROM registration_rate_limit WHERE blocked_until IS NOT NULL AND blocked_until < ${Date.now()}"

3. Usando archivo SQL:
   wrangler d1 execute DB --file=scripts/clear-ip-block.sql
`);
}

process.exit(0);
