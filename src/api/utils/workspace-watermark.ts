import { eq } from 'drizzle-orm';
import { database } from '../database';
import { clinics, professionalInfo, professionalLogos } from '../database/schema';
import { resolveLogoForClient } from './r2-media';
import {
  DEFAULT_WORKSPACE_WATERMARK,
  normalizeWorkspaceWatermark,
  type WorkspaceWatermarkConfig,
  type WorkspaceWatermarkResolution,
} from '../../web/types/workspace-watermark';

type WatermarkUser = {
  role: string;
  userId: string;
  clinicId?: string | null;
};

export function parseWorkspaceWatermarkJson(raw: string | null | undefined): WorkspaceWatermarkConfig {
  if (!raw) return { ...DEFAULT_WORKSPACE_WATERMARK };
  try {
    return normalizeWorkspaceWatermark(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_WORKSPACE_WATERMARK };
  }
}

async function resolveLogoImage(user: WatermarkUser): Promise<string | null> {
  if (user.clinicId) {
    const rows = await database
      .select({ logo: clinics.logo, logoUpdatedAt: clinics.logoUpdatedAt })
      .from(clinics)
      .where(eq(clinics.clinicId, user.clinicId))
      .limit(1);
    const row = rows[0];
    return resolveLogoForClient(row?.logo ?? null, 'clinic', user.clinicId, row?.logoUpdatedAt);
  }
  if (user.role === 'podiatrist') {
    const rows = await database
      .select({ logo: professionalLogos.logo, updatedAt: professionalLogos.updatedAt })
      .from(professionalLogos)
      .where(eq(professionalLogos.userId, user.userId))
      .limit(1);
    const row = rows[0];
    const stored = row?.logo?.trim() ? row.logo : null;
    return resolveLogoForClient(stored, 'professional', user.userId, row?.updatedAt);
  }
  return null;
}

function resolveDisplayImage(config: WorkspaceWatermarkConfig, logoImage: string | null): string | null {
  if (!config.enabled) return null;
  if (config.source === 'clinic_logo') return logoImage;
  return config.image;
}

export async function resolveWorkspaceWatermarkForUser(
  user: WatermarkUser
): Promise<WorkspaceWatermarkResolution> {
  const logoImage = await resolveLogoImage(user);

  if (user.clinicId) {
    const rows = await database
      .select({ workspaceWatermarkJson: clinics.workspaceWatermarkJson })
      .from(clinics)
      .where(eq(clinics.clinicId, user.clinicId))
      .limit(1);
    const config = parseWorkspaceWatermarkJson(rows[0]?.workspaceWatermarkJson);
    const canEdit = user.role === 'clinic_admin' || user.role === 'super_admin';
    return {
      config,
      displayImage: resolveDisplayImage(config, logoImage),
      scope: 'clinic',
      scopeId: user.clinicId,
      canEdit,
    };
  }

  if (user.role === 'podiatrist') {
    const rows = await database
      .select({ workspaceWatermarkJson: professionalInfo.workspaceWatermarkJson })
      .from(professionalInfo)
      .where(eq(professionalInfo.userId, user.userId))
      .limit(1);
    const config = parseWorkspaceWatermarkJson(rows[0]?.workspaceWatermarkJson);
    return {
      config,
      displayImage: resolveDisplayImage(config, logoImage),
      scope: 'professional',
      scopeId: user.userId,
      canEdit: true,
    };
  }

  return {
    config: { ...DEFAULT_WORKSPACE_WATERMARK },
    displayImage: null,
    scope: 'professional',
    scopeId: user.userId,
    canEdit: false,
  };
}

export async function saveWorkspaceWatermarkForUser(
  user: WatermarkUser,
  config: WorkspaceWatermarkConfig
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = normalizeWorkspaceWatermark(config);
  const json = JSON.stringify(normalized);

  if (user.clinicId) {
    if (user.role !== 'clinic_admin' && user.role !== 'super_admin') {
      return { ok: false, error: 'Solo el administrador de la clínica puede configurar la marca de agua.' };
    }
    await database
      .update(clinics)
      .set({ workspaceWatermarkJson: json })
      .where(eq(clinics.clinicId, user.clinicId));
    return { ok: true };
  }

  if (user.role === 'podiatrist') {
    await database
      .insert(professionalInfo)
      .values({
        userId: user.userId,
        name: '',
        workspaceWatermarkJson: json,
      })
      .onConflictDoUpdate({
        target: professionalInfo.userId,
        set: { workspaceWatermarkJson: json },
      });
    return { ok: true };
  }

  return { ok: false, error: 'No autorizado' };
}
