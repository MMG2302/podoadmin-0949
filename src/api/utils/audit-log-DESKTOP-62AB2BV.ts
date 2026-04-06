import { database } from '../database';
import { auditLog } from '../database/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';

/**
 * Utilidades para logging de auditoría en el servidor
 * Registra todas las acciones sensibles para seguridad y cumplimiento
 */

export interface AuditLogEntry {
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  clinicId?: string;
}

/**
 * Registra un evento en el log de auditoría
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    await database.insert(auditLog).values({
      id,
      userId: entry.userId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId || null,
      details: entry.details ? JSON.stringify(entry.details) : null,
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent || null,
      clinicId: entry.clinicId || null,
      createdAt: now,
    });
  } catch (error) {
    console.error('Error registrando evento de auditoría:', error);
    // No lanzar error para no interrumpir el flujo principal
  }
}

/**
 * Obtiene logs de auditoría para un usuario
 */
export async function getAuditLogsByUser(
  userId: string,
  limit: number = 100
): Promise<any[]> {
  try {
    const logs = await database
      .select()
      .from(auditLog)
      .where(eq(auditLog.userId, userId))
      .orderBy(desc(auditLog.createdAt))
      .limit(limit);

    return logs.map((log) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    }));
  } catch (error) {
    console.error('Error obteniendo logs de auditoría:', error);
    return [];
  }
}

/**
 * Obtiene logs de auditoría por tipo de acción
 */
export async function getAuditLogsByAction(
  action: string,
  limit: number = 100
): Promise<any[]>
{
  try {
    const logs = await database
      .select()
      .from(auditLog)
      .where(eq(auditLog.action, action))
      .orderBy(desc(auditLog.createdAt))
      .limit(limit);

    return logs.map((log) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    }));
  } catch (error) {
    console.error('Error obteniendo logs por acción:', error);
    return [];
  }
}

/**
 * Obtiene todos los logs de auditoría (solo para super_admin)
 */
export async function getAllAuditLogs(limit: number = 500): Promise<any[]> {
  try {
    const logs = await database
      .select()
      .from(auditLog)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit);

    return logs.map((log) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    }));
  } catch (error) {
    console.error('Error obteniendo todos los logs:', error);
    return [];
  }
}

export interface AuditLogExportFilters {
  from?: string; // ISO date
  to?: string; // ISO date
  userId?: string;
  clinicId?: string;
  action?: string;
  limit?: number;
}

/**
 * Obtiene logs de auditoría con filtros para exportación (evidencias / compliance).
 */
export async function getAuditLogsForExport(filters: AuditLogExportFilters = {}): Promise<any[]> {
  const { from, to, userId, clinicId, action, limit = 1000 } = filters;
  const maxLimit = Math.min(limit, 5000);
  const conditions: any[] = [];
  if (from) conditions.push(gte(auditLog.createdAt, from));
  if (to) conditions.push(lte(auditLog.createdAt, to));
  if (userId) conditions.push(eq(auditLog.userId, userId));
  if (clinicId) conditions.push(eq(auditLog.clinicId, clinicId));
  if (action) conditions.push(eq(auditLog.action, action));

  try {
    const logs =
      conditions.length > 0
        ? await database
            .select()
            .from(auditLog)
            .where(and(...conditions))
            .orderBy(desc(auditLog.createdAt))
            .limit(maxLimit)
        : await database.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(maxLimit);

    return logs.map((log) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    }));
  } catch (error) {
    console.error('Error obteniendo logs para export:', error);
    return [];
  }
}

/**
 * Cuenta cuántas veces un usuario ha registrado PRINT_VIOLATION_FORM desde una fecha.
 * Usado para alertar a super admins cuando hay >= 5 violaciones en la última hora.
 */
export async function getRecentPrintViolationCount(
  userId: string,
  sinceIso: string
): Promise<number> {
  try {
    const rows = await database
      .select({ id: auditLog.id })
      .from(auditLog)
      .where(
        and(
          eq(auditLog.userId, userId),
          eq(auditLog.action, 'PRINT_VIOLATION_FORM'),
          gte(auditLog.createdAt, sinceIso)
        )
      );
    return rows.length;
  } catch (error) {
    console.error('Error contando violaciones de impresión:', error);
    return 0;
  }
}
