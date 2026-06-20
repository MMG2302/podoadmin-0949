import { eq } from 'drizzle-orm';
import { database } from '../database';
import { clinics, professionalInfo } from '../database/schema';
import {
  createDefaultClinicalLayout,
  normalizeClinicalLayout,
  type ClinicalLayoutConfig,
} from '../../web/types/clinical-layout';

export type ClinicalLayoutScope = 'clinic' | 'professional';

export type ClinicalLayoutResolution = {
  layout: ClinicalLayoutConfig;
  scope: ClinicalLayoutScope;
  scopeId: string;
  canEdit: boolean;
};

type LayoutUser = {
  role: string;
  userId: string;
  clinicId?: string | null;
};

export function parseClinicalLayoutJson(raw: string | null | undefined): ClinicalLayoutConfig {
  if (!raw) return createDefaultClinicalLayout();
  try {
    return normalizeClinicalLayout(JSON.parse(raw));
  } catch {
    return createDefaultClinicalLayout();
  }
}

export async function resolveClinicalLayoutForUser(user: LayoutUser): Promise<ClinicalLayoutResolution> {
  if (user.clinicId) {
    const rows = await database
      .select({ clinicalLayoutJson: clinics.clinicalLayoutJson })
      .from(clinics)
      .where(eq(clinics.clinicId, user.clinicId))
      .limit(1);
    const canEdit = user.role === 'clinic_admin' || user.role === 'super_admin';
    return {
      layout: parseClinicalLayoutJson(rows[0]?.clinicalLayoutJson),
      scope: 'clinic',
      scopeId: user.clinicId,
      canEdit,
    };
  }

  if (user.role === 'podiatrist') {
    const rows = await database
      .select({ clinicalLayoutJson: professionalInfo.clinicalLayoutJson })
      .from(professionalInfo)
      .where(eq(professionalInfo.userId, user.userId))
      .limit(1);
    return {
      layout: parseClinicalLayoutJson(rows[0]?.clinicalLayoutJson),
      scope: 'professional',
      scopeId: user.userId,
      canEdit: true,
    };
  }

  return {
    layout: createDefaultClinicalLayout(),
    scope: 'professional',
    scopeId: user.userId,
    canEdit: false,
  };
}

export async function saveClinicalLayoutForUser(
  user: LayoutUser,
  layout: ClinicalLayoutConfig
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = normalizeClinicalLayout(layout);
  const json = JSON.stringify(normalized);

  if (user.clinicId) {
    if (user.role !== 'clinic_admin' && user.role !== 'super_admin') {
      return { ok: false, error: 'Solo el administrador de clínica puede editar el diseño.' };
    }
    await database
      .update(clinics)
      .set({ clinicalLayoutJson: json })
      .where(eq(clinics.clinicId, user.clinicId));
    return { ok: true };
  }

  if (user.role === 'podiatrist') {
    const existing = await database
      .select({ userId: professionalInfo.userId })
      .from(professionalInfo)
      .where(eq(professionalInfo.userId, user.userId))
      .limit(1);
    if (existing[0]) {
      await database
        .update(professionalInfo)
        .set({ clinicalLayoutJson: json })
        .where(eq(professionalInfo.userId, user.userId));
    } else {
      await database.insert(professionalInfo).values({
        userId: user.userId,
        name: '',
        clinicalLayoutJson: json,
      });
    }
    return { ok: true };
  }

  return { ok: false, error: 'Sin permiso para guardar diseño clínico.' };
}
