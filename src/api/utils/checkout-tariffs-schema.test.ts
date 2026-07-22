import { describe, it, expect } from 'vitest';
import { checkoutTariffsBodySchema } from './validation';
import { normalizeCheckoutTariffs } from '../../web/types/checkout-tariff';

/**
 * Regresión: el body de PUT /checkout-handoffs/tariffs debe CONSERVAR durationMinutes.
 * Antes se descartaba en la validación (Zod quita campos no declarados), así que la
 * "pauta guiada" de "Tiempo por servicio" nunca se persistía.
 */
describe('checkoutTariffsBodySchema', () => {
  it('conserva durationMinutes (pauta) al validar y persiste en el JSON', () => {
    const parsed = checkoutTariffsBodySchema.parse({
      podiatristId: 'user_podiatrist_001',
      tariffs: [
        { id: 'consulta', label: 'Consulta', amountCents: 60000, durationMinutes: 30 },
        { id: 'revision', label: 'Revisión', amountCents: 40000 }, // sin pauta
      ],
    });

    expect(parsed.tariffs[0].durationMinutes).toBe(30);
    expect(parsed.tariffs[1].durationMinutes).toBeUndefined();

    // La cadena que realmente se guarda (normalize + JSON.stringify) mantiene la duración.
    const json = JSON.stringify(normalizeCheckoutTariffs(parsed.tariffs));
    expect(json).toContain('"durationMinutes":30');
  });

  it('rechaza duraciones fuera de rango (5..480)', () => {
    expect(
      checkoutTariffsBodySchema.safeParse({
        tariffs: [{ id: 'x', label: 'X', amountCents: 1000, durationMinutes: 2 }],
      }).success
    ).toBe(false);
    expect(
      checkoutTariffsBodySchema.safeParse({
        tariffs: [{ id: 'x', label: 'X', amountCents: 1000, durationMinutes: 999 }],
      }).success
    ).toBe(false);
  });
});
