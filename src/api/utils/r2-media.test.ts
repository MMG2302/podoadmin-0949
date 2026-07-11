import { describe, it, expect } from 'vitest';
import {
  isR2Reference,
  toR2Reference,
  r2KeyFromReference,
  isSessionImageFilePath,
  sessionImageFilePath,
  resolveLogoForClient,
  clinicLogoFilePath,
} from './r2-media';

describe('r2-media references', () => {
  it('detecta referencias r2', () => {
    expect(isR2Reference('r2://sessions/u/s/i.webp')).toBe(true);
    expect(isR2Reference('data:image/png;base64,abc')).toBe(false);
  });

  it('convierte key ↔ referencia', () => {
    const key = 'logos/clinic/clinic-1.webp';
    expect(r2KeyFromReference(toR2Reference(key))).toBe(key);
  });

  it('genera rutas proxy de sesión', () => {
    const id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    expect(sessionImageFilePath(id)).toBe(`/api/session-images/${id}/file`);
    expect(isSessionImageFilePath(sessionImageFilePath(id))).toBe(true);
  });

  it('resuelve logo r2 a URL de API', () => {
    expect(resolveLogoForClient(toR2Reference('logos/clinic/x.webp'), 'clinic', 'x')).toBe(
      clinicLogoFilePath('x')
    );
    expect(
      resolveLogoForClient(toR2Reference('logos/clinic/x.webp'), 'clinic', 'x', '2026-01-01T00:00:00.000Z')
    ).toBe(`${clinicLogoFilePath('x')}?v=2026-01-01T00%3A00%3A00.000Z`);
    expect(resolveLogoForClient('data:image/webp;base64,abc', 'clinic', 'x')).toBe(
      'data:image/webp;base64,abc'
    );
  });
});
