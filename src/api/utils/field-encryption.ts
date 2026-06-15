/**
 * Cifrado AES-GCM para secretos en reposo (tokens WhatsApp, etc.).
 * Clave: WHATSAPP_TOKEN_ENCRYPTION_KEY o CSRF_SECRET (≥ 32 chars).
 */

const ALGO = 'AES-GCM';
const IV_BYTES = 12;

function getEncryptionKeyMaterial(): string {
  const key =
    process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY?.trim() ||
    process.env.CSRF_SECRET?.trim();
  if (!key || key.length < 32) {
    throw new Error('WHATSAPP_TOKEN_ENCRYPTION_KEY o CSRF_SECRET (≥32) requerido para cifrar tokens');
  }
  return key;
}

async function deriveAesKey(material: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(material));
  return crypto.subtle.importKey('raw', hash, { name: ALGO }, false, ['encrypt', 'decrypt']);
}

export async function encryptSecret(plaintext: string): Promise<string> {
  const key = await deriveAesKey(getEncryptionKeyMaterial());
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const cipher = await crypto.subtle.encrypt(
    { name: ALGO, iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  const combined = new Uint8Array(iv.length + cipher.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipher), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptSecret(encoded: string): Promise<string> {
  const key = await deriveAesKey(getEncryptionKeyMaterial());
  const raw = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const iv = raw.slice(0, IV_BYTES);
  const data = raw.slice(IV_BYTES);
  const plain = await crypto.subtle.decrypt({ name: ALGO, iv }, key, data);
  return new TextDecoder().decode(plain);
}
