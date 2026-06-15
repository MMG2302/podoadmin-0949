import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockResolveSystemAccess = vi.fn();
const mockGetSubscriptionForUser = vi.fn();

vi.mock('./access-control', () => ({
  resolveSystemAccess: (...args: unknown[]) => mockResolveSystemAccess(...args),
}));

vi.mock('./subscription-service', () => ({
  getSubscriptionForUser: (...args: unknown[]) => mockGetSubscriptionForUser(...args),
}));

import { buildUserAccessBadge } from './user-access-badge';

function baseRow(overrides: Record<string, unknown> = {}) {
  return {
    userId: 'user_1',
    email: 'mauricio@podo.com',
    role: 'podiatrist',
    clinicId: null,
    isBanned: false,
    isBlocked: false,
    isEnabled: false,
    disabledAt: Date.now(),
    ...overrides,
  } as Parameters<typeof buildUserAccessBadge>[0];
}

describe('buildUserAccessBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra Prueba aunque isEnabled=false y disabledAt exista si el trial está activo', async () => {
    mockResolveSystemAccess.mockResolvedValue({
      granted: true,
      reason: 'ip_trial',
    });
    mockGetSubscriptionForUser.mockResolvedValue({
      status: 'trial',
      isActive: true,
      daysRemaining: 26,
    });

    const badge = await buildUserAccessBadge(baseRow());

    expect(badge.label).toBe('Prueba (26 días)');
    expect(badge.tone).toBe('blue');
  });

  it('muestra período de gracia solo sin acceso de billing activo', async () => {
    mockResolveSystemAccess.mockResolvedValue({
      granted: false,
      reason: null,
    });
    mockGetSubscriptionForUser.mockResolvedValue({
      status: 'cancelled',
      isActive: false,
      daysRemaining: 0,
    });

    const badge = await buildUserAccessBadge(baseRow());

    expect(badge.label).toBe('Período de gracia (0 días)');
    expect(badge.tone).toBe('amber');
  });

  it('muestra Pendiente pago si no hay disabledAt administrativo', async () => {
    mockResolveSystemAccess.mockResolvedValue({
      granted: false,
      reason: null,
    });
    mockGetSubscriptionForUser.mockResolvedValue(null);

    const badge = await buildUserAccessBadge(
      baseRow({ disabledAt: null, isEnabled: false })
    );

    expect(badge.label).toBe('Pendiente pago');
  });
});
