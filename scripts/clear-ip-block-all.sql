-- Script SQL para limpiar TODOS los bloqueos de IP (cuidado: esto elimina todos los registros)
-- Uso: wrangler d1 execute DB --file=scripts/clear-ip-block-all.sql

-- Elimina todos los registros de rate limiting (incluyendo bloqueos)
DELETE FROM registration_rate_limit;
