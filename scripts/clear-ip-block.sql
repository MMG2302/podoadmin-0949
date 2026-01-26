-- Script SQL para limpiar bloqueo de IP específica
-- Uso: wrangler d1 execute DB --file=scripts/clear-ip-block.sql
-- Reemplaza :ip_address con la IP que deseas limpiar antes de ejecutar

-- Para limpiar una IP específica, descomenta y edita la siguiente línea:
-- DELETE FROM registration_rate_limit WHERE identifier = 'TU_IP_AQUI';

-- Para limpiar todos los bloqueos expirados, descomenta la siguiente línea:
DELETE FROM registration_rate_limit WHERE blocked_until IS NOT NULL AND blocked_until < strftime('%s', 'now') * 1000;
