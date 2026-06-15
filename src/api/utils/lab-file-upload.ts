/**
 * Validación de adjuntos de laboratorio (PDF / imágenes) para R2.
 */

export const MAX_LAB_FILE_BYTES = 10 * 1024 * 1024;

const ALLOWED: { mime: string; magic: number[][] }[] = [
  { mime: 'application/pdf', magic: [[0x25, 0x50, 0x44, 0x46]] },
  { mime: 'image/jpeg', magic: [[0xff, 0xd8, 0xff]] },
  { mime: 'image/png', magic: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]] },
  { mime: 'image/webp', magic: [[0x52, 0x49, 0x46, 0x46]] },
];

function decodeBase64Payload(dataUriOrBase64: string): { buffer: Uint8Array; mime: string } | null {
  let b64 = dataUriOrBase64.trim();
  let mime = 'application/octet-stream';
  const m = b64.match(/^data:([^;]+);base64,(.+)$/);
  if (m) {
    mime = m[1];
    b64 = m[2];
  }
  try {
    const binary = atob(b64);
    const buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
    return { buffer, mime };
  } catch {
    return null;
  }
}

function matchesMagic(buffer: Uint8Array, magic: number[][]): boolean {
  return magic.some((sig) => sig.every((byte, i) => buffer[i] === byte));
}

export function validateLabFileInput(
  fileBase64: string,
  declaredMime?: string
): { valid: true; buffer: Uint8Array; mimeType: string } | { valid: false; message: string } {
  const decoded = decodeBase64Payload(fileBase64);
  if (!decoded) return { valid: false, message: 'Archivo base64 inválido.' };
  if (decoded.buffer.length > MAX_LAB_FILE_BYTES) {
    return { valid: false, message: 'El archivo supera el tamaño máximo (10 MB).' };
  }
  const mime = declaredMime || decoded.mime;
  const rule = ALLOWED.find((a) => a.mime === mime);
  if (!rule) {
    return { valid: false, message: 'Tipo no permitido. Usa PDF, JPEG, PNG o WebP.' };
  }
  if (!matchesMagic(decoded.buffer, rule.magic)) {
    return { valid: false, message: 'El contenido no coincide con el tipo declarado.' };
  }
  return { valid: true, buffer: decoded.buffer, mimeType: mime };
}
