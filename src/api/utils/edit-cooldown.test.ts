import { describe, it, expect } from 'vitest';
import {
  EDIT_COOLDOWN_MS,
  getEditCooldownBlockedUntil,
  getNextEditAllowedAt,
  isWithinEditCooldown,
} from './edit-cooldown';

describe('edit-cooldown', () => {
  it('detecta cooldown activo dentro de 15 días', () => {
    const recent = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(isWithinEditCooldown(recent)).toBe(true);
    expect(getEditCooldownBlockedUntil(recent)).toBe(getNextEditAllowedAt(recent));
  });

  it('permite cambios pasados 15 días', () => {
    const old = new Date(Date.now() - EDIT_COOLDOWN_MS - 1000).toISOString();
    expect(isWithinEditCooldown(old)).toBe(false);
    expect(getEditCooldownBlockedUntil(old)).toBeNull();
  });
});
