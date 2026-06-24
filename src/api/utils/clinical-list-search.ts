import { and, or, sql, type SQL } from 'drizzle-orm';
import { patients, clinicalSessions } from '../database/schema';

function escapeLikeTerm(term: string): string {
  return term.replace(/[%_\\]/g, '\\$&');
}

/** Condición LIKE para búsqueda de pacientes (nombre, email, teléfono, DNI). */
export function buildPatientSearchCondition(q: string): SQL | undefined {
  const trimmed = q.trim();
  if (!trimmed) return undefined;
  const pattern = `%${escapeLikeTerm(trimmed.toLowerCase())}%`;
  return or(
    sql`lower(${patients.firstName}) like ${pattern}`,
    sql`lower(${patients.lastName}) like ${pattern}`,
    sql`lower(coalesce(${patients.email}, '')) like ${pattern}`,
    sql`${patients.phone} like ${pattern}`,
    sql`lower(${patients.idNumber}) like ${pattern}`
  );
}

/** Búsqueda en sesiones por nombre de paciente o diagnóstico. */
export function buildSessionSearchCondition(q: string): SQL | undefined {
  const trimmed = q.trim();
  if (!trimmed) return undefined;
  const pattern = `%${escapeLikeTerm(trimmed.toLowerCase())}%`;
  return or(
    sql`lower(${patients.firstName}) like ${pattern}`,
    sql`lower(${patients.lastName}) like ${pattern}`,
    sql`lower(coalesce(${clinicalSessions.diagnosis}, '')) like ${pattern}`,
    sql`lower(coalesce(${clinicalSessions.notes}, '')) like ${pattern}`
  );
}

/** Filtro de estado almacenado en notes JSON. */
export function buildSessionStatusCondition(status: 'draft' | 'completed'): SQL {
  if (status === 'completed') {
    return sql`json_extract(${clinicalSessions.notes}, '$.status') = 'completed'`;
  }
  return or(
    sql`json_extract(${clinicalSessions.notes}, '$.status') IS NULL`,
    sql`json_extract(${clinicalSessions.notes}, '$.status') != 'completed'`
  )!;
}

export function mergeAnd(...conditions: (SQL | undefined)[]): SQL | undefined {
  const parts = conditions.filter((c): c is SQL => c !== undefined);
  if (parts.length === 0) return undefined;
  if (parts.length === 1) return parts[0];
  return and(...parts);
}
