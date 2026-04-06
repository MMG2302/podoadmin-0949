/**
 * Utilidades para tracking y validación de IPs
 */

/**
 * Obtiene la IP del cliente desde los headers de la solicitud
 */
export function getClientIP(headers: Headers): string {
  // Cloudflare Workers proporciona cf-connecting-ip
  const cfIP = headers.get('cf-connecting-ip');
  if (cfIP) return cfIP;

  // X-Forwarded-For (puede tener múltiples IPs, tomar la primera)
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',').map(ip => ip.trim());
    return ips[0] || 'unknown';
  }

  // X-Real-IP
  const xRealIP = headers.get('x-real-ip');
  if (xRealIP) return xRealIP;

  return 'unknown';
}

/**
 * Valida si una IP está en la whitelist
 */
export function isIPWhitelisted(ip: string, whitelist: string[]): boolean {
  if (!ip || ip === 'unknown') return false;
  
  return whitelist.some(allowedIP => {
    // Soporte para IPs exactas y rangos CIDR básicos
    if (allowedIP === ip) return true;
    
    // Si es un rango CIDR (ej: 192.168.1.0/24)
    if (allowedIP.includes('/')) {
      // Implementación básica de validación CIDR
      // En producción, usar una librería como ipaddr.js
      const [network, prefix] = allowedIP.split('/');
      const prefixLength = parseInt(prefix, 10);
      
      // Validación básica (simplificada)
      if (ip.startsWith(network.split('.').slice(0, Math.floor(prefixLength / 8)).join('.'))) {
        return true;
      }
    }
    
    return false;
  });
}

/**
 * Obtiene la whitelist de IPs desde variables de entorno
 */
export function getIPWhitelist(): string[] {
  const whitelistEnv = process.env.IP_WHITELIST;
  if (!whitelistEnv) return [];
  
  return whitelistEnv
    .split(',')
    .map(ip => ip.trim())
    .filter(ip => ip.length > 0);
}

/**
 * Crea un identificador combinado de email e IP para rate limiting
 */
export function createRateLimitIdentifier(email: string, ip: string): string {
  const emailLower = email.toLowerCase().trim();
  return `${emailLower}:${ip}`;
}

/**
 * Extrae email e IP de un identificador de rate limiting
 */
export function parseRateLimitIdentifier(identifier: string): { email: string; ip: string } {
  const parts = identifier.split(':');
  if (parts.length >= 2) {
    return {
      email: parts[0],
      ip: parts.slice(1).join(':'), // IP puede tener : (IPv6)
    };
  }
  return { email: identifier, ip: 'unknown' };
}
