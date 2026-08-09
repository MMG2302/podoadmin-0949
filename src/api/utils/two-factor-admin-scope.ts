/**
 * Quién puede quitarle la verificación en dos pasos a otra cuenta: solo un `super_admin`.
 *
 * Es deliberadamente más estrecho que bloquear o deshabilitar usuarios. Quitar el 2FA deja
 * una cuenta protegida únicamente por su contraseña, así que la capacidad no se reparte
 * entre clinic_admins ni podólogos: queda en la administración de la plataforma, que es
 * quien puede verificar por otro canal a quién está atendiendo.
 *
 * Vive en su propio módulo y sin consultas a la base para poder probar la regla como
 * función pura, y para que ampliarla más adelante sea un cambio localizado y visible.
 */

type Requester = { userId: string; role: string; clinicId?: string | null };

type Target = { userId: string; role: string; clinicId?: string | null };

/** Devuelve el motivo del rechazo, o `null` si la operación está permitida. */
export function twoFactorResetDeniedReason(requester: Requester, target: Target): string | null {
  // Nadie se restablece a sí mismo, ni siquiera un super_admin: quien robara una sesión ya
  // abierta podría quitar el 2FA sin conocer ningún código, dejando la cuenta protegida solo
  // por la contraseña. Para la cuenta propia está `/2fa/disable`, que sí exige un código.
  if (requester.userId === target.userId) {
    return 'No puedes restablecer tu propia verificación en dos pasos desde aquí';
  }

  if (requester.role !== 'super_admin') {
    return 'Solo la administración de la plataforma puede restablecer la verificación en dos pasos';
  }

  return null;
}
