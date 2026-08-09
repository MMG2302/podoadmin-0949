import { describe, expect, it } from 'vitest';
import { twoFactorResetDeniedReason } from './two-factor-admin-scope';

const superAdmin = { userId: 'u_super', role: 'super_admin' as const, clinicId: null };

const recepcionistaClinicaA = { userId: 'u_rec_a', role: 'receptionist', clinicId: 'clinic_a' };
const podologoClinicaA = { userId: 'u_podo_a', role: 'podiatrist', clinicId: 'clinic_a' };
const otroSuperAdmin = { userId: 'u_super_2', role: 'super_admin', clinicId: null };

describe('alcance del reseteo administrativo de 2FA', () => {
  it('nadie puede restablecerse a sí mismo, tampoco un super_admin', () => {
    const propio = { userId: superAdmin.userId, role: 'super_admin', clinicId: null };
    expect(twoFactorResetDeniedReason(superAdmin, propio)).not.toBeNull();
  });

  it('un super_admin puede restablecer cualquier otra cuenta', () => {
    expect(twoFactorResetDeniedReason(superAdmin, recepcionistaClinicaA)).toBeNull();
    expect(twoFactorResetDeniedReason(superAdmin, podologoClinicaA)).toBeNull();
    expect(twoFactorResetDeniedReason(superAdmin, otroSuperAdmin)).toBeNull();
  });

  it('un clinic_admin no puede restablecer, ni siquiera dentro de su clínica', () => {
    const clinicAdmin = { userId: 'u_admin_a', role: 'clinic_admin', clinicId: 'clinic_a' };
    expect(twoFactorResetDeniedReason(clinicAdmin, recepcionistaClinicaA)).not.toBeNull();
  });

  it('un podólogo no puede restablecer, ni a una recepcionista que creó', () => {
    const podologo = { userId: 'u_podo', role: 'podiatrist', clinicId: null };
    const suRecepcionista = { userId: 'u_rec_x', role: 'receptionist', clinicId: null };
    expect(twoFactorResetDeniedReason(podologo, suRecepcionista)).not.toBeNull();
  });

  it('el rol admin de soporte tampoco llega', () => {
    const soporte = { userId: 'u_soporte', role: 'admin', clinicId: null };
    expect(twoFactorResetDeniedReason(soporte, recepcionistaClinicaA)).not.toBeNull();
  });

  it('una recepcionista no puede restablecer a nadie', () => {
    const recepcion = { userId: 'u_rec_a2', role: 'receptionist', clinicId: 'clinic_a' };
    expect(twoFactorResetDeniedReason(recepcion, recepcionistaClinicaA)).not.toBeNull();
  });

  it('un rol desconocido queda rechazado por defecto', () => {
    const raro = { userId: 'u_raro', role: 'auditor_externo', clinicId: 'clinic_a' };
    expect(twoFactorResetDeniedReason(raro, recepcionistaClinicaA)).not.toBeNull();
  });
});
