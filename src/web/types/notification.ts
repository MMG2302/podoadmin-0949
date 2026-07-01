export type NotificationType =
  | "reassignment"
  | "appointment"
  | "credit"
  | "system"
  | "admin_message";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: {
    fromUserId?: string;
    fromUserName?: string;
    toUserId?: string;
    toUserName?: string;
    patientId?: string;
    patientName?: string;
    reassignedById?: string;
    reassignedByName?: string;
    clinicAdminId?: string;
    clinicAdminName?: string;
    reassignmentDate?: string;
    creditAmount?: number;
    appointmentDate?: string;
    reason?: string;
    senderId?: string;
    senderName?: string;
    messageId?: string;
    sentAt?: string;
    subject?: string;
  };
}
