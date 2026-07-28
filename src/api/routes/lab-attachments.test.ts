import { describe, expect, it } from 'vitest';
import { isValidLabFileKey } from './lab-attachments';

// Regression guard for Claude Security finding F1 (fixed 2026-07-28): the upload
// endpoint used to accept any client-supplied fileKey verbatim, letting an
// authenticated user point at another clinic's object in the shared bucket
// (e.g. `logos/clinic/clinic_7.webp`). isValidLabFileKey is the allowlist that
// closes that hole; these tests fail if it is ever loosened.
describe('isValidLabFileKey', () => {
  const patientId = 'patient-123';

  it('accepts a well-formed key confined to the patient namespace', () => {
    expect(isValidLabFileKey(`lab/${patientId}/abc-def.webp`, patientId)).toBe(true);
    expect(isValidLabFileKey(`lab/${patientId}/report_2026.pdf`, patientId)).toBe(true);
  });

  it('rejects a key pointing at another patient/namespace', () => {
    expect(isValidLabFileKey('logos/clinic/clinic_7.webp', patientId)).toBe(false);
    expect(isValidLabFileKey(`lab/other-patient/x.webp`, patientId)).toBe(false);
    expect(isValidLabFileKey(`sessions/user/session/img.webp`, patientId)).toBe(false);
  });

  it('rejects path traversal and extra path segments', () => {
    expect(isValidLabFileKey(`lab/${patientId}/../other-patient/x.webp`, patientId)).toBe(false);
    expect(isValidLabFileKey(`lab/${patientId}/sub/x.webp`, patientId)).toBe(false);
    expect(isValidLabFileKey(`lab/${patientId}/`, patientId)).toBe(false);
  });

  it('rejects characters outside the safe filename set', () => {
    expect(isValidLabFileKey(`lab/${patientId}/x y.webp`, patientId)).toBe(false);
    expect(isValidLabFileKey(`lab/${patientId}/x?y.webp`, patientId)).toBe(false);
  });
});
