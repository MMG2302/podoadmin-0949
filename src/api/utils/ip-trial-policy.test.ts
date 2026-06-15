import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSelect = vi.fn();

vi.mock('../database', () => ({
  database: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}));

vi.mock('./ipquery-client', () => ({
  queryIpWithIpQuery: vi.fn(),
  evaluateIpTrialRisk: vi.fn(),
}));

import { checkPublicRegistrationIpTrialPolicy } from './ip-trial-service';

function mockHasIpUsedTrial(used: boolean) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: (resolve: (v: unknown[]) => void) => resolve(used ? [{ id: 'grant-1' }] : []),
  };
  mockSelect.mockReturnValue(chain);
}

describe('checkPublicRegistrationIpTrialPolicy', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    mockSelect.mockReset();
  });

  it('permite registro si la IP nunca usó trial', async () => {
    mockHasIpUsedTrial(false);
    vi.stubEnv('NODE_ENV', 'production');

    const result = await checkPublicRegistrationIpTrialPolicy({
      clientIp: '203.0.113.10',
      role: 'podiatrist',
    });

    expect(result.allowed).toBe(true);
  });

  it('bloquea registro independiente si la IP ya consumió trial', async () => {
    mockHasIpUsedTrial(true);
    vi.stubEnv('NODE_ENV', 'production');

    const result = await checkPublicRegistrationIpTrialPolicy({
      clientIp: '203.0.113.10',
      role: 'podiatrist',
      joiningExistingClinic: false,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('ip_already_used');
  });

  it('permite unirse a clínica existente aunque la IP ya usó trial', async () => {
    mockHasIpUsedTrial(true);
    vi.stubEnv('NODE_ENV', 'production');

    const result = await checkPublicRegistrationIpTrialPolicy({
      clientIp: '203.0.113.10',
      role: 'podiatrist',
      joiningExistingClinic: true,
    });

    expect(result.allowed).toBe(true);
  });
});
