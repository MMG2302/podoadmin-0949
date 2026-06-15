import type { JWTPayload } from '../utils/jwt';
import { getAssignedPodiatristUserIds, getCreatedUserByIdOrUserId } from '../utils/tenant-isolation';

/** Tipos que el cliente puede solicitar vía POST /api/notifications */
export const CLIENT_NOTIFICATION_TYPES = [
  'system',
  'appointment',
  'reassignment',
] as const;

export type ClientNotificationType = (typeof CLIENT_NOTIFICATION_TYPES)[number];

export function isClientNotificationType(value: string): value is ClientNotificationType {
  return (CLIENT_NOTIFICATION_TYPES as readonly string[]).includes(value);
}

/**
 * Determina si el remitente autenticado puede crear una notificación para el destinatario.
 * Las notificaciones administrativas (admin_message, credit) solo se crean en el servidor.
 */
export async function assertCanNotifyUser(
  sender: JWTPayload,
  recipientUserId: string,
  type: ClientNotificationType
): Promise<{ allowed: true; recipientUserId: string } | { allowed: false; message: string }> {
  const targetId = recipientUserId.trim();
  if (!targetId) {
    return { allowed: false, message: 'userId destino inválido' };
  }

  const recipient = await getCreatedUserByIdOrUserId(targetId);
  if (!recipient) {
    return { allowed: false, message: 'Usuario destino no encontrado' };
  }
  const resolvedRecipientId = recipient.userId;

  if (resolvedRecipientId === sender.userId) {
    if (type === 'system') {
      return { allowed: true, recipientUserId: resolvedRecipientId };
    }
    if (type === 'reassignment' || type === 'appointment') {
      return { allowed: true, recipientUserId: resolvedRecipientId };
    }
    return { allowed: false, message: 'Tipo de notificación no permitido para ti mismo' };
  }

  if (sender.role === 'super_admin' || sender.role === 'admin') {
    return { allowed: true, recipientUserId: resolvedRecipientId };
  }

  if (sender.role === 'clinic_admin') {
    if (!sender.clinicId || recipient.clinicId !== sender.clinicId) {
      return { allowed: false, message: 'Solo puedes notificar usuarios de tu clínica' };
    }
    if (type === 'appointment' || type === 'reassignment') {
      return { allowed: true, recipientUserId: resolvedRecipientId };
    }
    return { allowed: false, message: 'No puedes enviar notificaciones de sistema a otros usuarios' };
  }

  if (sender.role === 'receptionist') {
    if (type !== 'appointment') {
      return { allowed: false, message: 'Las recepcionistas solo pueden enviar notificaciones de citas a podólogos asignados' };
    }
    if (recipient.role !== 'podiatrist') {
      return { allowed: false, message: 'Solo puedes notificar a podólogos asignados' };
    }
    const assigned = await getAssignedPodiatristUserIds(sender.userId);
    if (!assigned.includes(resolvedRecipientId)) {
      return { allowed: false, message: 'No puedes notificar a ese podólogo' };
    }
    return { allowed: true, recipientUserId: resolvedRecipientId };
  }

  if (sender.role === 'podiatrist') {
    return { allowed: false, message: 'No puedes enviar notificaciones a otros usuarios' };
  }

  return { allowed: false, message: 'Acceso denegado' };
}
