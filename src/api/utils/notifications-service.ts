import { database } from '../database';
import { notifications as notificationsTable, patients as patientsTable, createdUsers } from '../database/schema';
import { eq } from 'drizzle-orm';
import type { ClientNotificationType } from '../security/notification-policy';

const generateNotificationId = () => `notif_${crypto.randomUUID().replace(/-/g, '')}`;

export type NotificationType = ClientNotificationType | 'credit' | 'admin_message' | 'system';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Crea una notificación en base de datos (uso interno del servidor).
 * No valida permisos: llamar solo desde rutas ya autorizadas.
 */
export async function createNotification(input: CreateNotificationInput): Promise<string> {
  const id = generateNotificationId();
  const now = new Date().toISOString();
  const title = input.title.slice(0, 500);
  const message = input.message.slice(0, 5000);

  await database.insert(notificationsTable).values({
    id,
    userId: input.userId,
    type: input.type,
    title,
    message,
    read: false,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    createdAt: now,
  });

  return id;
}

export async function createNotifications(inputs: CreateNotificationInput[]): Promise<void> {
  for (const input of inputs) {
    await createNotification(input);
  }
}

/**
 * Recepcionistas habilitados que tienen asignado al podólogo dado
 * (assignedPodiatristIds es un JSON array en la fila del recepcionista).
 */
export async function getReceptionistUserIdsForPodiatrist(podiatristUserId: string): Promise<string[]> {
  const rows = await database
    .select({
      userId: createdUsers.userId,
      assignedPodiatristIds: createdUsers.assignedPodiatristIds,
      isEnabled: createdUsers.isEnabled,
    })
    .from(createdUsers)
    .where(eq(createdUsers.role, 'receptionist'));

  const result: string[] = [];
  for (const row of rows) {
    if (row.isEnabled === false || !row.assignedPodiatristIds) continue;
    try {
      const ids = JSON.parse(row.assignedPodiatristIds) as unknown;
      if (Array.isArray(ids) && ids.includes(podiatristUserId)) {
        result.push(row.userId);
      }
    } catch {
      /* JSON inválido: ignorar */
    }
  }
  return result;
}

/** Nombre del podólogo para mensajes dirigidos a su recepcionista. */
async function getPodiatristName(podiatristUserId: string): Promise<string> {
  const rows = await database
    .select({ name: createdUsers.name })
    .from(createdUsers)
    .where(eq(createdUsers.userId, podiatristUserId))
    .limit(1);
  return rows[0]?.name || 'el podólogo';
}

/**
 * Replica una notificación de agenda del podólogo hacia sus recepcionistas asignados,
 * anteponiendo el nombre del doctor para dar contexto.
 */
export async function notifyAssignedReceptionists(
  podiatristUserId: string,
  input: Omit<CreateNotificationInput, 'userId'>
): Promise<void> {
  const receptionistIds = await getReceptionistUserIdsForPodiatrist(podiatristUserId);
  if (receptionistIds.length === 0) return;
  const podiatristName = await getPodiatristName(podiatristUserId);
  const message = `[${podiatristName}] ${input.message}`;
  await createNotifications(
    receptionistIds.map((userId) => ({ ...input, userId, message }))
  );
}

export interface AppointmentNotificationContext {
  podiatristUserId: string;
  actorUserId: string;
  actorName: string;
  patientId?: string | null;
  date: string;
  time: string;
  notes?: string;
  isReassignment: boolean;
}

/**
 * Notifica al podólogo sobre una cita nueva o reasignada (desde operaciones de backend).
 */
export async function notifyPodiatristAboutAppointment(ctx: AppointmentNotificationContext): Promise<void> {
  let patientLabel = '';
  if (ctx.patientId) {
    const rows = await database
      .select({ firstName: patientsTable.firstName, lastName: patientsTable.lastName })
      .from(patientsTable)
      .where(eq(patientsTable.id, ctx.patientId))
      .limit(1);
    if (rows[0]) {
      patientLabel = `${rows[0].firstName} ${rows[0].lastName}`.trim();
    }
  }

  const dateLabel = formatAppointmentDateLabel(ctx.date, ctx.time);
  const title = ctx.isReassignment ? 'Cita reasignada' : 'Nueva cita';
  const message =
    patientLabel.length > 0
      ? ctx.isReassignment
        ? `Se te ha reasignado una cita con ${patientLabel} el ${dateLabel}`
        : `Tienes una nueva cita con ${patientLabel} el ${dateLabel}`
      : ctx.isReassignment
        ? `Se te ha reasignado una cita programada el ${dateLabel}${ctx.notes ? ` - ${ctx.notes}` : ''}`
        : `Tienes una nueva cita programada el ${dateLabel}${ctx.notes ? ` - ${ctx.notes}` : ''}`;

  const metadata = {
    appointmentDate: ctx.date,
    reason: ctx.notes || undefined,
    fromUserId: ctx.actorUserId,
    fromUserName: ctx.actorName,
    patientId: ctx.patientId || undefined,
    patientName: patientLabel || undefined,
  };

  await createNotification({
    userId: ctx.podiatristUserId,
    type: 'appointment',
    title,
    message,
    metadata,
  });

  // El recepcionista asignado también gestiona la agenda: replicar la notificación
  // (sin incluir al actor si él mismo es el recepcionista que creó la cita).
  await notifyAssignedReceptionistsExcept(ctx.podiatristUserId, ctx.actorUserId, {
    type: 'appointment',
    title,
    message,
    metadata,
  });
}

async function notifyAssignedReceptionistsExcept(
  podiatristUserId: string,
  excludeUserId: string | null,
  input: Omit<CreateNotificationInput, 'userId'>
): Promise<void> {
  const receptionistIds = (await getReceptionistUserIdsForPodiatrist(podiatristUserId)).filter(
    (id) => id !== excludeUserId
  );
  if (receptionistIds.length === 0) return;
  const podiatristName = await getPodiatristName(podiatristUserId);
  const message = `[${podiatristName}] ${input.message}`;
  await createNotifications(receptionistIds.map((userId) => ({ ...input, userId, message })));
}

export interface PatientReassignmentNotificationContext {
  clinicAdminUserId: string;
  clinicAdminName: string;
  previousPodiatristUserId: string | null;
  newPodiatristUserId: string;
  patientId: string;
  patientFullName: string;
}

export async function notifyPatientReassignment(ctx: PatientReassignmentNotificationContext): Promise<void> {
  const previousRows = ctx.previousPodiatristUserId
    ? await database
        .select({ name: createdUsers.name })
        .from(createdUsers)
        .where(eq(createdUsers.userId, ctx.previousPodiatristUserId))
        .limit(1)
    : [];
  const newRows = await database
    .select({ name: createdUsers.name })
    .from(createdUsers)
    .where(eq(createdUsers.userId, ctx.newPodiatristUserId))
    .limit(1);

  const previousName = previousRows[0]?.name || 'sin asignar';
  const newName = newRows[0]?.name || 'podólogo';
  const now = new Date().toISOString();

  const commonMetadata = {
    patientId: ctx.patientId,
    patientName: ctx.patientFullName,
    fromUserId: ctx.previousPodiatristUserId ?? undefined,
    fromUserName: previousName,
    toUserId: ctx.newPodiatristUserId,
    toUserName: newName,
    reassignedById: ctx.clinicAdminUserId,
    reassignedByName: ctx.clinicAdminName,
    clinicAdminId: ctx.clinicAdminUserId,
    clinicAdminName: ctx.clinicAdminName,
    reassignmentDate: now,
  };

  const payloads: CreateNotificationInput[] = [
    {
      userId: ctx.clinicAdminUserId,
      type: 'reassignment',
      title: 'Reasignación realizada',
      message: `Has reasignado al paciente ${ctx.patientFullName} del Dr. ${previousName} al Dr. ${newName}.`,
      metadata: commonMetadata,
    },
    {
      userId: ctx.newPodiatristUserId,
      type: 'reassignment',
      title: 'Nuevo paciente asignado',
      message: `El paciente ${ctx.patientFullName} te ha sido asignado desde el Dr. ${previousName} por ${ctx.clinicAdminName}.`,
      metadata: commonMetadata,
    },
  ];

  if (ctx.previousPodiatristUserId && ctx.previousPodiatristUserId !== ctx.newPodiatristUserId) {
    payloads.push({
      userId: ctx.previousPodiatristUserId,
      type: 'reassignment',
      title: 'Paciente reasignado',
      message: `El paciente ${ctx.patientFullName} ha sido reasignado de ti al Dr. ${newName} por ${ctx.clinicAdminName}.`,
      metadata: commonMetadata,
    });
  }

  await createNotifications(payloads);
}

function formatAppointmentDateLabel(date: string, time: string): string {
  try {
    const d = new Date(`${date}T${time}`);
    if (Number.isNaN(d.getTime())) {
      return `${date} a las ${time}`;
    }
    return d.toLocaleString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return `${date} a las ${time}`;
  }
}
