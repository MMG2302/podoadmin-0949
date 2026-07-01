import { describe, expect, it } from 'vitest';
import { createAppointmentSchema, validateData } from './validation';

describe('createAppointmentSchema', () => {
  it('acepta patientId null (paciente pendiente)', () => {
    const result = validateData(createAppointmentSchema, {
      patientId: null,
      podiatristId: 'pod_test_001',
      date: '2026-06-30',
      time: '10:00',
      duration: 30,
      pendingPatientName: 'María López',
      pendingPatientPhone: '5512345678',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.patientId).toBeNull();
    }
  });

  it('acepta patientId como string', () => {
    const result = validateData(createAppointmentSchema, {
      patientId: 'pat_abc123',
      podiatristId: 'pod_test_001',
      date: '2026-06-30',
      time: '10:00',
      duration: '45',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.duration).toBe(45);
    }
  });
});
