/**
 * Validación de logos subidos (clínicas y profesionales).
 * Aísla el sistema de cargas corruptas o maliciosas: solo acepta imágenes
 * seguras (JPEG/PNG/WebP), con límite de tamaño, rechazando SVG y otros
 * tipos que podrían ejecutar código o dañar el sistema.
 *
 * - Magic bytes: se leen bytes reales del binario decodificado (base64 → buffer),
 *   no se confía en Content-Type ni en el prefijo del data URI. Fallar rápido:
 *   tamaño → firma → polyglot → píxeles, antes de cualquier escritura en DB.
 * - Polyglots: escaneo inicio/fin del binario por patrones peligrosos; la defensa
 *   fuerte sería re-encode forzado server-side (ver DEFENSA_TEXTO_FOTOS.md).
 */

/** Tamaño máximo del binario de la imagen (bytes). 2MB para alinearse con frontend. */
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

/** Máximo de píxeles (ancho × alto) para evitar bombas de descompresión. 4096×4096 = 16M. */
export const MAX_IMAGE_PIXELS = 4096 * 4096;

const DEFAULT_SESSION_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB
/** Máximo tamaño por imagen en sesiones clínicas (bytes). Configurable con SESSION_IMAGE_MAX_BYTES (modo ligero). */
export const MAX_SESSION_IMAGE_BYTES =
  typeof process !== 'undefined' && process.env?.SESSION_IMAGE_MAX_BYTES
    ? Math.min(
        Math.max(parseInt(process.env.SESSION_IMAGE_MAX_BYTES, 10) || DEFAULT_SESSION_IMAGE_BYTES, 100 * 1024),
        DEFAULT_SESSION_IMAGE_BYTES
      )
    : DEFAULT_SESSION_IMAGE_BYTES;

/** Prefijos data URI permitidos (solo imágenes raster seguras; sin SVG para evitar XSS/XXE). */
const ALLOWED_DATA_URI_PREFIXES: { prefix: string; magic: number[][] }[] = [
  { prefix: 'data:image/jpeg;base64,', magic: [[0xff, 0xd8, 0xff]] },
  { prefix: 'data:image/jpg;base64,', magic: [[0xff, 0xd8, 0xff]] },
  { prefix: 'data:image/png;base64,', magic: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]] },
  {
    prefix: 'data:image/webp;base64,',
    magic: [
      [0x52, 0x49, 0x46, 0x46], // RIFF
    ],
  },
];

/** Bytes a escanear al inicio y al final del binario para patrones peligrosos (polyglots suelen inyectar ahí). */
const POLYGLOT_SCAN_BYTES = 8192;

/** Secuencias que indican código PHP/JS/HTML embebido (polyglot o RCE). Rechazar si aparecen. */
const DANGEROUS_ASCII_PATTERNS = [
  '<?php',
  '<?=',
  '<script',
  '</script',
  'javascript:',
  'vbscript:',
  'data:text/html',  // HTML embebido que podría ejecutarse
  'onerror=',
  'onload=',
  'eval(',
  '<iframe',
];

export interface LogoValidationResult {
  valid: true;
  sanitized: string;
}

export interface LogoValidationError {
  valid: false;
  error: string;
  message: string;
}

export type ValidateLogoResult = LogoValidationResult | LogoValidationError;

/** Tipo de imagen para leer dimensiones. */
type ImageType = 'jpeg' | 'png' | 'webp';

/**
 * Lee dimensiones (ancho × alto) desde la cabecera del binario para evitar bombas de descompresión.
 * PNG: IHDR en bytes 16–23 (width BE, height BE). JPEG: SOF0 (0xFF 0xC0) + 5,6 height BE, 7,8 width BE. WebP: VP8 frame.
 */
function getImageDimensions(bytes: Uint8Array, type: ImageType): { width: number; height: number } | null {
  if (type === 'png' && bytes.length >= 24) {
    const width = (bytes[16]! << 24) | (bytes[17]! << 16) | (bytes[18]! << 8) | bytes[19]!;
    const height = (bytes[20]! << 24) | (bytes[21]! << 16) | (bytes[22]! << 8) | bytes[23]!;
    return width > 0 && height > 0 ? { width, height } : null;
  }
  if ((type === 'jpeg' || type === 'jpg') && bytes.length >= 10) {
    for (let i = 0; i < Math.min(bytes.length - 9, 65536); i++) {
      if (bytes[i] === 0xff && (bytes[i + 1] === 0xc0 || bytes[i + 1] === 0xc1)) {
        const height = (bytes[i + 5]! << 8) | bytes[i + 6]!;
        const width = (bytes[i + 7]! << 8) | bytes[i + 8]!;
        return width > 0 && height > 0 ? { width, height } : null;
      }
    }
  }
  if (type === 'webp' && bytes.length >= 30) {
    // VP8 simple: tras "VP8 " (offset 12), frame: 4 size + 0x9d 0x01 0x2a + width(2 LE) height(2 LE)
    if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x20) {
      let o = 23;
      while (o < bytes.length - 4 && bytes[o] !== 0x9d) o++;
      if (bytes[o] === 0x9d && bytes[o + 1] === 0x01 && bytes[o + 2] === 0x2a) {
        const width = bytes[o + 3]! | (bytes[o + 4]! << 8);
        const height = bytes[o + 5]! | (bytes[o + 6]! << 8);
        return width > 0 && height > 0 ? { width, height } : null;
      }
    }
  }
  return null;
}

/**
 * Valida y normaliza un payload de logo (data URI base64).
 * - Solo permite image/jpeg, image/png, image/webp (no SVG ni otros tipos).
 * - Limita el tamaño del binario a MAX_LOGO_BYTES.
 * Devuelve el mismo string si es válido (sanitized = recortado a prefijo + base64 válido);
 * si no, devuelve { valid: false, error, message } para responder 400.
 */
export function validateLogoPayload(input: string | null | undefined): ValidateLogoResult {
  if (input == null || typeof input !== 'string') {
    return { valid: false, error: 'logo_invalid', message: 'Logo no válido o vacío.' };
  }

  const raw = input.trim();
  if (!raw) {
    return { valid: false, error: 'logo_invalid', message: 'Logo no válido o vacío.' };
  }

  const entry = ALLOWED_DATA_URI_PREFIXES.find((e) => raw.toLowerCase().startsWith(e.prefix));
  if (!entry) {
    return {
      valid: false,
      error: 'logo_type_not_allowed',
      message: 'Solo se permiten imágenes JPEG, PNG o WebP (no SVG ni otros formatos).',
    };
  }

  const base64Part = raw.slice(entry.prefix.length).replace(/\s/g, '');
  let binary: string;
  try {
    binary = atob(base64Part);
  } catch {
    return { valid: false, error: 'logo_invalid_base64', message: 'El logo no es una imagen base64 válida.' };
  }

  if (binary.length > MAX_LOGO_BYTES) {
    return {
      valid: false,
      error: 'logo_too_large',
      message: `El logo no puede superar ${MAX_LOGO_BYTES / 1024 / 1024} MB.`,
    };
  }

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const magicOk = entry.magic.some((sig) => {
    if (bytes.length < sig.length) return false;
    for (let i = 0; i < sig.length; i++) if (bytes[i] !== sig[i]) return false;
    return true;
  });
  if (!magicOk) {
    return {
      valid: false,
      error: 'logo_invalid_signature',
      message: 'El archivo no tiene la cabecera de una imagen válida (JPEG, PNG o WebP).',
    };
  }

  // WebP: además de RIFF, debe contener WEBP en el offset estándar (bytes 8–11)
  if (entry.prefix.includes('webp')) {
    const webp = [0x57, 0x45, 0x42, 0x50]; // 'WEBP'
    if (bytes.length < 12) {
      return { valid: false, error: 'logo_invalid_signature', message: 'El archivo no es un WebP válido.' };
    }
    for (let i = 0; i < 4; i++) if (bytes[8 + i] !== webp[i]) {
      return { valid: false, error: 'logo_invalid_signature', message: 'El archivo no es un WebP válido.' };
    }
  }

  // Rechazar polyglots: escanear solo inicio y final del binario (más rápido y menos falsos positivos)
  const head = binary.slice(0, POLYGLOT_SCAN_BYTES).toLowerCase();
  const tail = binary.length > POLYGLOT_SCAN_BYTES * 2
    ? binary.slice(-POLYGLOT_SCAN_BYTES).toLowerCase()
    : '';
  for (const pattern of DANGEROUS_ASCII_PATTERNS) {
    if (head.includes(pattern) || tail.includes(pattern)) {
      return {
        valid: false,
        error: 'logo_suspicious_content',
        message: 'El archivo contiene contenido no permitido (posible archivo ejecutable o script).',
      };
    }
  }

  // Límite de píxeles (anti-bomba de descompresión)
  const imgType: ImageType = entry.prefix.includes('jpeg') || entry.prefix.includes('jpg') ? 'jpeg' : entry.prefix.includes('png') ? 'png' : 'webp';
  const dims = getImageDimensions(bytes, imgType);
  if (dims && dims.width * dims.height > MAX_IMAGE_PIXELS) {
    return {
      valid: false,
      error: 'logo_too_many_pixels',
      message: `La imagen no puede superar ${MAX_IMAGE_PIXELS / 1_000_000} millones de píxeles (anti-bomba).`,
    };
  }

  const sanitized = entry.prefix + base64Part;
  return { valid: true, sanitized };
}

/**
 * Valida un payload de imagen (data URI base64) con tamaño máximo configurable.
 * Misma lógica que validateLogoPayload (magic bytes, polyglot, píxeles) pero maxBytes configurable.
 * Uso: imágenes de sesiones clínicas (body.images[]).
 */
export function validateImageDataUri(
  input: string | null | undefined,
  maxBytes: number = MAX_SESSION_IMAGE_BYTES
): ValidateLogoResult {
  if (input == null || typeof input !== 'string') {
    return { valid: false, error: 'image_invalid', message: 'Imagen no válida o vacía.' };
  }
  const raw = input.trim();
  if (!raw) return { valid: false, error: 'image_invalid', message: 'Imagen no válida o vacía.' };

  const entry = ALLOWED_DATA_URI_PREFIXES.find((e) => raw.toLowerCase().startsWith(e.prefix));
  if (!entry) {
    return {
      valid: false,
      error: 'image_type_not_allowed',
      message: 'Solo se permiten imágenes JPEG, PNG o WebP.',
    };
  }

  const base64Part = raw.slice(entry.prefix.length).replace(/\s/g, '');
  let binary: string;
  try {
    binary = atob(base64Part);
  } catch {
    return { valid: false, error: 'image_invalid_base64', message: 'Imagen base64 no válida.' };
  }

  if (binary.length > maxBytes) {
    return {
      valid: false,
      error: 'image_too_large',
      message: `Cada imagen no puede superar ${maxBytes / 1024 / 1024} MB.`,
    };
  }

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const magicOk = entry.magic.some((sig) => {
    if (bytes.length < sig.length) return false;
    for (let i = 0; i < sig.length; i++) if (bytes[i] !== sig[i]) return false;
    return true;
  });
  if (!magicOk) {
    return { valid: false, error: 'image_invalid_signature', message: 'Cabecera de imagen no válida.' };
  }

  if (entry.prefix.includes('webp') && bytes.length >= 12) {
    const webp = [0x57, 0x45, 0x42, 0x50];
    for (let i = 0; i < 4; i++) if (bytes[8 + i] !== webp[i]) {
      return { valid: false, error: 'image_invalid_signature', message: 'WebP no válido.' };
    }
  }

  const head = binary.slice(0, POLYGLOT_SCAN_BYTES).toLowerCase();
  const tail = binary.length > POLYGLOT_SCAN_BYTES * 2 ? binary.slice(-POLYGLOT_SCAN_BYTES).toLowerCase() : '';
  for (const pattern of DANGEROUS_ASCII_PATTERNS) {
    if (head.includes(pattern) || tail.includes(pattern)) {
      return {
        valid: false,
        error: 'image_suspicious_content',
        message: 'La imagen contiene contenido no permitido.',
      };
    }
  }

  const imgType: ImageType = entry.prefix.includes('jpeg') || entry.prefix.includes('jpg') ? 'jpeg' : entry.prefix.includes('png') ? 'png' : 'webp';
  const dims = getImageDimensions(bytes, imgType);
  if (dims && dims.width * dims.height > MAX_IMAGE_PIXELS) {
    return {
      valid: false,
      error: 'image_too_many_pixels',
      message: 'La imagen supera el límite de píxeles (anti-bomba).',
    };
  }

  const sanitized = entry.prefix + base64Part;
  return { valid: true, sanitized };
}
