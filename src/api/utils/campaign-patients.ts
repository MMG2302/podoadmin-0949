import { isNotNull } from 'drizzle-orm';
import type { JWTPayload } from './jwt';
import { database } from '../database';
import { patients } from '../database/schema';
import { mergeScopeWhere, resolveClinicalListScope } from './clinical-list-scope';

type CampaignFilter = {
  clinicId?: string;
  hasPhone?: boolean;
  clinicOnly?: boolean;
};

export async function fetchPatientsForWhatsAppCampaign(
  user: JWTPayload,
  filter: CampaignFilter
): Promise<Array<{ id: string; phone: string; clinicId: string | null; firstName: string; lastName: string }>> {
  const scope = await resolveClinicalListScope(user);
  const extra =
    filter.hasPhone !== false ? isNotNull(patients.phone) : undefined;
  const where = mergeScopeWhere(
    scope,
    { createdBy: patients.createdBy, clinicId: patients.clinicId },
    extra
  );

  let query = database
    .select({
      id: patients.id,
      phone: patients.phone,
      clinicId: patients.clinicId,
      firstName: patients.firstName,
      lastName: patients.lastName,
    })
    .from(patients)
    .$dynamic();

  if (where) query = query.where(where);

  let rows = await query.limit(5000);

  if (filter.clinicOnly && user.clinicId) {
    rows = rows.filter((p) => p.clinicId === user.clinicId);
  }
  if (filter.clinicId) {
    rows = rows.filter((p) => p.clinicId === filter.clinicId);
  }

  return rows.filter((p) => String(p.phone ?? '').trim().length > 0);
}
