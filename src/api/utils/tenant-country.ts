import { eq } from 'drizzle-orm';
import { database } from '../database';
import { clinics, createdUsers, professionalInfo } from '../database/schema';
import { DEFAULT_TENANT_COUNTRY, resolveTenantCountryCode, type TenantCountryCode } from '../../lib/phone-country';

export async function getCountryForClinic(clinicId: string | null | undefined): Promise<TenantCountryCode> {
  if (!clinicId) return DEFAULT_TENANT_COUNTRY;
  const row = await database
    .select({ countryCode: clinics.countryCode })
    .from(clinics)
    .where(eq(clinics.clinicId, clinicId))
    .limit(1);
  return resolveTenantCountryCode(row[0]?.countryCode);
}

export async function getCountryForPodiatrist(userId: string): Promise<TenantCountryCode> {
  const userRow = await database
    .select({ clinicId: createdUsers.clinicId })
    .from(createdUsers)
    .where(eq(createdUsers.userId, userId))
    .limit(1);
  if (userRow[0]?.clinicId) {
    return getCountryForClinic(userRow[0].clinicId);
  }
  const info = await database
    .select({ countryCode: professionalInfo.countryCode })
    .from(professionalInfo)
    .where(eq(professionalInfo.userId, userId))
    .limit(1);
  return resolveTenantCountryCode(info[0]?.countryCode);
}

export async function resolvePatientPhoneCountry(input: {
  clinicId?: string | null;
  createdByUserId: string;
}): Promise<TenantCountryCode> {
  if (input.clinicId) {
    return getCountryForClinic(input.clinicId);
  }
  return getCountryForPodiatrist(input.createdByUserId);
}
