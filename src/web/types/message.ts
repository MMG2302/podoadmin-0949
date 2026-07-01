/** Mensaje administrativo enviado (persistencia vía API /api/messages). */
export interface SentMessage {
  id: string;
  senderId: string;
  senderName: string;
  subject: string;
  body: string;
  recipientIds: string[];
  recipientType: "all" | "specific" | "single";
  sentAt: string;
}
