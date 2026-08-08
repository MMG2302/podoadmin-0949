import { describe, expect, it } from 'vitest';
import { findBackupCodeIndex, generateBackupCodes, hashBackupCodes } from './two-factor-auth';

describe('códigos de respaldo 2FA', () => {
  it('genera códigos con el formato agrupado y el alfabeto sin caracteres ambiguos', () => {
    for (const code of generateBackupCodes(10)) {
      expect(code).toMatch(/^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);
    }
  });

  it('no repite códigos entre tiradas', () => {
    const codes = [...generateBackupCodes(10), ...generateBackupCodes(10)];
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('no deja rastro del código en claro en lo que se almacena', async () => {
    const codes = generateBackupCodes(3);
    const stored = await hashBackupCodes(codes);

    for (const hash of stored) expect(hash).toMatch(/^[0-9a-f]{64}$/);
    for (const code of codes) {
      expect(stored).not.toContain(code);
      expect(stored.join()).not.toContain(code.replace(/-/g, ''));
    }
  });

  it('encuentra un código válido y devuelve su índice', async () => {
    const codes = generateBackupCodes(5);
    const stored = await hashBackupCodes(codes);

    expect(await findBackupCodeIndex(stored, codes[0])).toBe(0);
    expect(await findBackupCodeIndex(stored, codes[4])).toBe(4);
  });

  it('rechaza un código que no está almacenado', async () => {
    const stored = await hashBackupCodes(generateBackupCodes(5));
    expect(await findBackupCodeIndex(stored, 'ZZZZ-ZZZZ-ZZZZ')).toBe(-1);
  });

  it('acepta el código tecleado en minúsculas, sin guiones o con espacios', async () => {
    const [code] = generateBackupCodes(1);
    const stored = await hashBackupCodes([code]);

    expect(await findBackupCodeIndex(stored, code.toLowerCase())).toBe(0);
    expect(await findBackupCodeIndex(stored, code.replace(/-/g, ''))).toBe(0);
    expect(await findBackupCodeIndex(stored, `  ${code} `)).toBe(0);
  });

  it('resuelve las confusiones de Crockford (O por 0, I y L por 1)', async () => {
    const stored = await hashBackupCodes(['0000-1111-2222']);

    expect(await findBackupCodeIndex(stored, 'OOOO-IIII-2222')).toBe(0);
    expect(await findBackupCodeIndex(stored, 'oooo-llll-2222')).toBe(0);
  });

  it('sigue aceptando los códigos heredados guardados en claro', async () => {
    const legacy = ['12345678', '87654321'];

    expect(await findBackupCodeIndex(legacy, '87654321')).toBe(1);
    expect(await findBackupCodeIndex(legacy, '11111111')).toBe(-1);
  });

  it('distingue dos códigos almacenados aunque uno sea heredado', async () => {
    const [nuevo] = generateBackupCodes(1);
    const stored = [...(await hashBackupCodes([nuevo])), '12345678'];

    expect(await findBackupCodeIndex(stored, nuevo)).toBe(0);
    expect(await findBackupCodeIndex(stored, '12345678')).toBe(1);
  });
});
