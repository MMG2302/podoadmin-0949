import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JWTPayload } from '../utils/jwt';

vi.mock('../utils/tenant-isolation', () => ({
  getCreatedUserByIdOrUserId: vi.fn(),
  getAssignedPodiatristUserIds: vi.fn(),
}));

import { assertCanNotifyUser, isClientNotificationType } from './notification-policy';
import { getAssignedPodiatristUserIds, getCreatedUserByIdOrUserId } from '../utils/tenant-isolation';

const getUser = vi.mocked(getCreatedUserByIdOrUserId);
const getAssigned = vi.mocked(getAssignedPodiatristUserIds);

function jwt(overrides: Partial<JWTPayload> = {}): JWTPayload {
  return {
    userId: 'admin_clinic_1',
    email: 'admin@clinic.test',
    role: 'clinic_admin',
    clinicId: 'clinic_1',
    ...overrides,
  };
}

function dbUser(
  userId: string,
  role: string,
  clinicId: string | null = 'clinic_1'
) {
  return {
    id: `pk_${userId}`,
    userId,
    role,
    clinicId,
    email: `${userId}@test.com`,
    name: userId,
  };
}

describe('isClientNotificationType', () => {
  it('acepta tipos permitidos para el cliente', () => {
    expect(isClientNotificationType('system')).toBe(true);
    expect(isClientNotificationType('appointment')).toBe(true);
    expect(isClientNotificationType('reassignment')).toBe(true);
  });

  it('rechaza tipos solo de servidor', () => {
    expect(isClientNotificationType('admin_message')).toBe(false);
    expect(isClientNotificationType('credit')).toBe(false);
    expect(isClientNotificationType('')).toBe(false);
  });
});

describe('assertCanNotifyUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAssigned.mockResolvedValue([]);
  });

  it('rechaza userId destino vacío', async () => {
    const result = await assertCanNotifyUser(jwt(), '  ', 'system');
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.message).toMatch(/inválido/i);
    expect(getUser).not.toHaveBeenCalled();
  });

  it('rechaza destinatario inexistente', async () => {
    getUser.mockResolvedValue(null);
    const result = await assertCanNotifyUser(jwt(), 'ghost', 'reassignment');
    expect(result).toEqual({ allowed: false, message: 'Usuario destino no encontrado' });
  });

  it('permite system al propio usuario', async () => {
    getUser.mockResolvedValue(dbUser('pod_1', 'podiatrist'));
    const result = await assertCanNotifyUser(
      jwt({ userId: 'pod_1', role: 'podiatrist', clinicId: 'clinic_1' }),
      'pod_1',
      'system'
    );
    expect(result).toEqual({ allowed: true, recipientUserId: 'pod_1' });
  });

  it('impide al podólogo notificar a otros', async () => {
    getUser.mockResolvedValue(dbUser('pod_2', 'podiatrist'));
    const result = await assertCanNotifyUser(
      jwt({ userId: 'pod_1', role: 'podiatrist', clinicId: 'clinic_1' }),
      'pod_2',
      'appointment'
    );
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.message).toMatch(/otros usuarios/i);
    }
  });

  it('permite clinic_admin notificar reasignación en su clínica', async () => {
    getUser.mockResolvedValue(dbUser('pod_2', 'podiatrist', 'clinic_1'));
    const result = await assertCanNotifyUser(jwt(), 'pod_2', 'reassignment');
    expect(result).toEqual({ allowed: true, recipientUserId: 'pod_2' });
  });

  it('impide clinic_admin notificar fuera de su clínica', async () => {
    getUser.mockResolvedValue(dbUser('pod_x', 'podiatrist', 'clinic_2'));
    const result = await assertCanNotifyUser(jwt(), 'pod_x', 'reassignment');
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.message).toMatch(/tu clínica/i);
    }
  });

  it('impide clinic_admin enviar system a terceros', async () => {
    getUser.mockResolvedValue(dbUser('pod_2', 'podiatrist', 'clinic_1'));
    const result = await assertCanNotifyUser(jwt(), 'pod_2', 'system');
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.message).toMatch(/sistema/i);
    }
  });

  it('permite recepcionista notificar cita a podólogo asignado', async () => {
    getUser.mockResolvedValue(dbUser('pod_2', 'podiatrist', 'clinic_1'));
    getAssigned.mockResolvedValue(['pod_2']);
    const result = await assertCanNotifyUser(
      jwt({ userId: 'rec_1', role: 'receptionist', clinicId: 'clinic_1' }),
      'pod_2',
      'appointment'
    );
    expect(result).toEqual({ allowed: true, recipientUserId: 'pod_2' });
    expect(getAssigned).toHaveBeenCalledWith('rec_1');
  });

  it('impide recepcionista notificar podólogo no asignado', async () => {
    getUser.mockResolvedValue(dbUser('pod_9', 'podiatrist', 'clinic_1'));
    getAssigned.mockResolvedValue(['pod_2']);
    const result = await assertCanNotifyUser(
      jwt({ userId: 'rec_1', role: 'receptionist', clinicId: 'clinic_1' }),
      'pod_9',
      'appointment'
    );
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.message).toMatch(/ese podólogo/i);
    }
  });

  it('impide recepcionista enviar reasignación', async () => {
    getUser.mockResolvedValue(dbUser('pod_2', 'podiatrist', 'clinic_1'));
    getAssigned.mockResolvedValue(['pod_2']);
    const result = await assertCanNotifyUser(
      jwt({ userId: 'rec_1', role: 'receptionist', clinicId: 'clinic_1' }),
      'pod_2',
      'reassignment'
    );
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.message).toMatch(/solo pueden enviar notificaciones de citas/i);
    }
  });

  it('permite super_admin notificar a cualquier usuario resuelto', async () => {
    getUser.mockResolvedValue(dbUser('any_user', 'admin', null));
    const result = await assertCanNotifyUser(
      jwt({ userId: 'sa_1', role: 'super_admin', clinicId: undefined }),
      'legacy_id',
      'reassignment'
    );
    expect(result).toEqual({ allowed: true, recipientUserId: 'any_user' });
  });

  it('resuelve destinatario por id interno al userId canónico', async () => {
    getUser.mockResolvedValue(dbUser('pod_canonical', 'podiatrist', 'clinic_1'));
    const result = await assertCanNotifyUser(jwt(), 'pk_legacy_row_id', 'appointment');
    expect(result).toEqual({ allowed: true, recipientUserId: 'pod_canonical' });
  });
});
