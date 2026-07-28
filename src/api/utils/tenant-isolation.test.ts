import { describe, expect, it, vi } from 'vitest';
import type { JWTPayload } from './jwt';

// tenant-isolation.ts is the shared primitive every fix from the 2026-07-28 Claude
// Security scan (F1-F5) leans on: getPatientAccessDeniedReason/getSessionAccessDeniedReason
// gate every route that reads or writes a single patient/session-owned record. If this
// file's role logic ever weakens (e.g. a role falls through to an implicit allow), every
// one of those fixes silently stops protecting anything. These tests pin down the
// per-role behaviour directly.

const selectRows: Array<{ assignedPodiatristIds: string | null }> = [];

vi.mock('../database', () => ({
  database: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve(selectRows)),
        })),
      })),
    })),
  },
}));

import { getPatientAccessDeniedReason, invalidateAssignedPodiatristCache } from './tenant-isolation';

function user(overrides: Partial<JWTPayload>): JWTPayload {
  return { userId: 'u1', email: 'u1@example.com', role: 'podiatrist', ...overrides };
}

describe('getPatientAccessDeniedReason', () => {
  it('super_admin and admin always pass, regardless of ownership', async () => {
    const row = { createdBy: 'someone-else', clinicId: 'other-clinic' };
    expect(await getPatientAccessDeniedReason(user({ role: 'super_admin' }), row)).toBeNull();
    expect(await getPatientAccessDeniedReason(user({ role: 'admin' }), row)).toBeNull();
  });

  it('clinic_admin without an assigned clinic is always denied', async () => {
    const row = { createdBy: 'anyone', clinicId: null };
    const denied = await getPatientAccessDeniedReason(user({ role: 'clinic_admin', clinicId: undefined }), row);
    expect(denied).toBe('clinic_admin_sin_clinica');
  });

  it('clinic_admin is denied a row from a different clinic, allowed one from their own', async () => {
    const u = user({ role: 'clinic_admin', clinicId: 'clinic-A' });
    expect(await getPatientAccessDeniedReason(u, { createdBy: 'x', clinicId: 'clinic-B' })).not.toBeNull();
    expect(await getPatientAccessDeniedReason(u, { createdBy: 'x', clinicId: 'clinic-A' })).toBeNull();
  });

  it('podiatrist is denied a row they did not create, allowed their own', async () => {
    const u = user({ role: 'podiatrist', userId: 'podiatrist-1' });
    expect(await getPatientAccessDeniedReason(u, { createdBy: 'podiatrist-2' })).not.toBeNull();
    expect(await getPatientAccessDeniedReason(u, { createdBy: 'podiatrist-1' })).toBeNull();
  });

  it('receptionist is denied a row from a podiatrist not on their assigned list, allowed one that is', async () => {
    invalidateAssignedPodiatristCache('reception-1');
    selectRows.length = 0;
    selectRows.push({ assignedPodiatristIds: JSON.stringify(['podiatrist-A', 'podiatrist-B']) });
    const u = user({ role: 'receptionist', userId: 'reception-1' });

    expect(await getPatientAccessDeniedReason(u, { createdBy: 'podiatrist-C' })).not.toBeNull();
    expect(await getPatientAccessDeniedReason(u, { createdBy: 'podiatrist-A' })).toBeNull();
  });

  it('an unrecognized role is denied by default, never implicitly allowed', async () => {
    const u = user({ role: 'unknown-future-role' as JWTPayload['role'] });
    const denied = await getPatientAccessDeniedReason(u, { createdBy: 'anyone', clinicId: 'anything' });
    expect(denied).not.toBeNull();
  });
});
