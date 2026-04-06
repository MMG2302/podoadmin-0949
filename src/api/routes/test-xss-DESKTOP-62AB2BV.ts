import { Hono } from 'hono';
import { escapeHtml, containsXssPayload, sanitizeString, validateAndSanitizeString } from '../utils/sanitization';

/**
 * Endpoint de prueba para payloads XSS
 * Útil para verificar que el escapado HTML funciona correctamente
 */
const testXssRoutes = new Hono();

/**
 * POST /api/test-xss
 * Prueba un payload XSS y muestra cómo se sanitiza
 */
testXssRoutes.post('/test-xss', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { input } = body;

    if (!input || typeof input !== 'string') {
      return c.json({
        error: 'Input requerido',
        message: 'Envía un campo "input" con el payload XSS a probar',
      }, 400);
    }

    // Probar diferentes métodos de sanitización
    const escaped = escapeHtml(input);
    const sanitized = sanitizeString(input);
    const validated = validateAndSanitizeString(input, true);
    const containsXss = containsXssPayload(input);

    return c.json({
      original: input,
      escaped,
      sanitized,
      validated: validated || 'RECHAZADO (contiene XSS)',
      containsXssPayload: containsXss,
      analysis: {
        length: input.length,
        hasScriptTags: /<script/i.test(input),
        hasEventHandlers: /on\w+\s*=/i.test(input),
        hasJavaScriptProtocol: /javascript:/i.test(input),
        hasIframe: /<iframe/i.test(input),
        hasImgOnError: /<img[^>]*onerror/i.test(input),
        hasSvgOnLoad: /<svg[^>]*onload/i.test(input),
        hasDataUri: /data:text\/html/i.test(input),
      },
      recommendation: containsXss
        ? 'Este payload contiene XSS y debe ser rechazado o escapado'
        : 'Este input parece seguro (pero siempre escapar antes de mostrar)',
    });
  } catch (error) {
    console.error('Error en test XSS:', error);
    return c.json({
      error: 'Error interno',
      message: 'Error al procesar el payload',
    }, 500);
  }
});

/**
 * GET /api/test-xss/payloads
 * Lista payloads XSS comunes para probar
 */
testXssRoutes.get('/test-xss/payloads', (c) => {
  const payloads = [
    {
      name: 'Payload básico',
      payload: '"><img src=x onerror=alert(\'XSS\')>',
      description: 'Payload común con img y onerror',
    },
    {
      name: 'Script tag',
      payload: '<script>alert(\'XSS\')</script>',
      description: 'Tag script básico',
    },
    {
      name: 'JavaScript protocol',
      payload: 'javascript:alert(\'XSS\')',
      description: 'Protocolo javascript:',
    },
    {
      name: 'Event handler',
      payload: 'onclick=alert(\'XSS\')',
      description: 'Event handler onclick',
    },
    {
      name: 'Iframe',
      payload: '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      description: 'Iframe con javascript:',
    },
    {
      name: 'SVG onload',
      payload: '<svg onload=alert(\'XSS\')>',
      description: 'SVG con onload',
    },
    {
      name: 'Data URI',
      payload: 'data:text/html,<script>alert(\'XSS\')</script>',
      description: 'Data URI con script',
    },
    {
      name: 'VBScript',
      payload: 'vbscript:alert(\'XSS\')',
      description: 'Protocolo vbscript:',
    },
    {
      name: 'Expression (IE)',
      payload: 'expression(alert(\'XSS\'))',
      description: 'Expression para IE',
    },
    {
      name: 'Encoded',
      payload: '&#60;script&#62;alert(\'XSS\')&#60;/script&#62;',
      description: 'HTML entities encoded',
    },
  ];

  return c.json({
    payloads,
    usage: {
      endpoint: 'POST /api/test-xss',
      body: { input: '<payload aquí>' },
      example: {
        input: '"><img src=x onerror=alert(\'XSS\')>',
      },
    },
  });
});

export default testXssRoutes;
