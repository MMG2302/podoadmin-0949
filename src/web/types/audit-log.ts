/** Registro de auditoría (shape del frontend; persistencia en D1 vía API). */
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  clinicId?: string | null;
}
