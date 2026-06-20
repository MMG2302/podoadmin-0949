import type { patients as patientsTable } from '../database/schema';
import { getAssignedPodiatristUserIds } from './tenant-isolation';

type DbPatient = typeof patientsTable.$inferSelect;

export type CampaignPatientFilter = {
  clinicOnly?: boolean;
  hasPhone?: boolean;
  clinicId?: string;
};

type CampaignUser = {
  role: string;
  userId: string;
  clinicId?: string | null;
};

/** Misma visibilidad que GET /patients + filtro opcional de campaña. */
export async function filterPatientsForWhatsAppCampaign(
  rows: DbPatient[],
  user: CampaignUser,
  filter: CampaignPatientFilter
): Promise<DbPatient[]> {
  let list = rows;

  if (user.role === 'podiatrist') {
    list = list.filter((p) => p.createdBy === user.userId);
  } else if (user.role === 'receptionist') {
    const assignedIds = await getAssignedPodiatristUserIds(user.userId);
    list = assignedIds.length === 0 ? [] : list.filter((p) => assignedIds.includes(p.createdBy));
  } else if (user.role === 'clinic_admin' && user.clinicId) {
    list = list.filter((p) => p.clinicId === user.clinicId);
  }

  if (filter.clinicId) {
    list = list.filter((p) => p.clinicId === filter.clinicId);
  } else if (filter.clinicOnly !== false && user.clinicId) {
    list = list.filter((p) => !p.clinicId || p.clinicId === user.clinicId);
  }

  if (filter.hasPhone !== false) {
    list = list.filter((p) => p.phone && p.phone.replace(/\D/g, '').length >= 8);
  }

  return list;
}
