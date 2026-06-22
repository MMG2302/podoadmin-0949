import { and, eq, isNull, like, sql } from 'drizzle-orm';
import { database } from '../database';
import { patients } from '../database/schema';

export async function generateNextPatientFolio(clinicId?: string | null): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = clinicId ? `CL-${year}-` : `IND-${year}-`;

  const where = clinicId
    ? and(eq(patients.clinicId, clinicId), like(patients.folio, `${prefix}%`))
    : and(isNull(patients.clinicId), like(patients.folio, `${prefix}%`));

  const rows = await database
    .select({ maxNum: sql<number>`max(cast(substr(${patients.folio}, -4) as integer))` })
    .from(patients)
    .where(where);

  const next = (rows[0]?.maxNum ?? 0) + 1;
  return `${prefix}${String(next).padStart(4, '0')}`;
}
