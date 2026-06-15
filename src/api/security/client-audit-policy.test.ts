import { describe, expect, it } from 'vitest';
import {
  CLIENT_AUDIT_ACTIONS,
  sanitizeClientAuditForUser,
  validateClientAuditBody,
} from './client-audit-policy';

describe('validateClientAuditBody', () => {
  it('acepta PRINT_VIOLATION_FORM con resourceType session', () => {
    const result = validateClientAuditBody({
      action: 'PRINT_VIOLATION_FORM',
      resourceType: 'session',
      resourceId: 'sess_1',
      details: {
        sessionId: 'sess_1',
        patientId: 'pat_1',
        violationType: 'print_from_form',
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.action).toBe('PRINT_VIOLATION_FORM');
      expect(result.data.details).toMatchObject({ violationType: 'print_from_form' });
    }
  });

  it('rechaza acciones no incluidas en la lista blanca', () => {
    const result = validateClientAuditBody({
      action: 'DELETE_USER',
      resourceType: 'user',
      resourceId: 'u1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toMatch(/inválido/i);
    }
  });

  it('rechaza resourceType incompatible con la acción', () => {
    const result = validateClientAuditBody({
      action: 'PRINT_VIOLATION_FORM',
      resourceType: 'user',
      resourceId: 'x',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toMatch(/no permitido/i);
    }
  });

  it('rechaza details con campos extra (schema estricto)', () => {
    const result = validateClientAuditBody({
      action: 'PRINT_VIOLATION_FORM',
      resourceType: 'session',
      details: {
        sessionId: 's1',
        injectedField: '<script>',
      },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toMatch(/inválidos/i);
    }
  });

  it('rechaza cuerpo sin action', () => {
    const result = validateClientAuditBody({ resourceType: 'session' });
    expect(result.success).toBe(false);
  });

  it('documenta la única acción permitida actualmente', () => {
    expect(CLIENT_AUDIT_ACTIONS).toEqual(['PRINT_VIOLATION_FORM']);
  });
});

describe('sanitizeClientAuditForUser', () => {
  it('fija reportedByUserId y clinicId desde el JWT, no desde el body', () => {
    const validated = validateClientAuditBody({
      action: 'PRINT_VIOLATION_FORM',
      resourceType: 'session',
      resourceId: 'sess_1',
      clinicId: 'clinic_maliciosa',
      details: { sessionId: 'sess_1', podiatristId: 'otro_usuario' },
    });
    expect(validated.success).toBe(true);
    if (!validated.success) return;

    const sanitized = sanitizeClientAuditForUser(validated.data, 'user_real', 'clinic_real');
    expect(sanitized.clinicId).toBe('clinic_real');
    expect(sanitized.details?.reportedByUserId).toBe('user_real');
    expect(sanitized.details?.podiatristId).toBe('otro_usuario');
    expect(sanitized.action).toBe('PRINT_VIOLATION_FORM');
  });

  it('omite clinicId si el usuario no tiene clínica', () => {
    const validated = validateClientAuditBody({
      action: 'PRINT_VIOLATION_FORM',
      resourceType: 'session',
    });
    expect(validated.success).toBe(true);
    if (!validated.success) return;

    const sanitized = sanitizeClientAuditForUser(validated.data, 'pod_1', null);
    expect(sanitized.clinicId).toBeUndefined();
  });
});
