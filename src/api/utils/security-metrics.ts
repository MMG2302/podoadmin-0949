import { database } from '../database';
import { securityMetrics } from '../database/schema';
import { eq, desc, and, gte } from 'drizzle-orm';

/**
 * Utilidades para métricas de seguridad
 * Registra eventos de seguridad para análisis y monitoreo
 */

export type SecurityMetricType =
  | 'failed_login'
  | 'successful_login'
  | 'registration_success'
  | 'registration_failed'
  | 'email_verified'
  | 'email_verification_failed'
  | 'blocked_user'
  | 'unblocked_user'
  | 'banned_user'
  | '2fa_enabled'
  | '2fa_disabled'
  | '2fa_used'
  | '2fa_failed'
  | 'captcha_shown'
  | 'captcha_passed'
  | 'captcha_failed'
  | 'token_revoked'
  | 'password_changed'
  | 'account_locked'
  | 'suspicious_activity';

export interface SecurityMetric {
  metricType: SecurityMetricType;
  userId?: string;
  ipAddress?: string;
  details?: Record<string, any>;
  clinicId?: string;
}

/**
 * Registra una métrica de seguridad
 */
export async function recordSecurityMetric(metric: SecurityMetric): Promise<void> {
  try {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    await database.insert(securityMetrics).values({
      id,
      metricType: metric.metricType,
      userId: metric.userId || null,
      ipAddress: metric.ipAddress || null,
      details: metric.details ? JSON.stringify(metric.details) : null,
      clinicId: metric.clinicId || null,
      createdAt: now,
    });
  } catch (error) {
    console.error('Error registrando métrica de seguridad:', error);
  }
}

/**
 * Obtiene métricas de seguridad por tipo
 */
export async function getMetricsByType(
  metricType: SecurityMetricType,
  limit: number = 100
): Promise<any[]> {
  try {
    const metrics = await database
      .select()
      .from(securityMetrics)
      .where(eq(securityMetrics.metricType, metricType))
      .orderBy(desc(securityMetrics.createdAt))
      .limit(limit);

    return metrics.map((m) => ({
      ...m,
      details: m.details ? JSON.parse(m.details) : null,
    }));
  } catch (error) {
    console.error('Error obteniendo métricas por tipo:', error);
    return [];
  }
}

/**
 * Obtiene métricas de seguridad en un rango de tiempo
 */
export async function getMetricsByTimeRange(
  startTime: string, // ISO string
  endTime: string, // ISO string
  limit: number = 500
): Promise<any[]> {
  try {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    const metrics = await database
      .select()
      .from(securityMetrics)
      .where(
        and(
          gte(securityMetrics.createdAt, startTime),
          // Note: SQLite doesn't have native date comparison, so we filter in memory
        )
      )
      .orderBy(desc(securityMetrics.createdAt))
      .limit(limit);

    // Filtrar por rango de tiempo en memoria
    return metrics
      .filter((m) => {
        const createdAt = new Date(m.createdAt).getTime();
        return createdAt >= start && createdAt <= end;
      })
      .map((m) => ({
        ...m,
        details: m.details ? JSON.parse(m.details) : null,
      }));
  } catch (error) {
    console.error('Error obteniendo métricas por rango de tiempo:', error);
    return [];
  }
}

/**
 * Obtiene estadísticas de seguridad (conteos por tipo)
 */
export async function getSecurityStats(
  startTime?: string,
  endTime?: string
): Promise<Record<SecurityMetricType, number>> {
  try {
    const allMetrics = await database.select().from(securityMetrics);

    let filtered = allMetrics;
    if (startTime && endTime) {
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();
      filtered = allMetrics.filter((m) => {
        const createdAt = new Date(m.createdAt).getTime();
        return createdAt >= start && createdAt <= end;
      });
    }

    const stats: Record<string, number> = {};
    filtered.forEach((m) => {
      stats[m.metricType] = (stats[m.metricType] || 0) + 1;
    });

    return stats as Record<SecurityMetricType, number>;
  } catch (error) {
    console.error('Error obteniendo estadísticas de seguridad:', error);
    return {} as Record<SecurityMetricType, number>;
  }
}
