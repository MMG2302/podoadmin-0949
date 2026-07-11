import { eq } from 'drizzle-orm';
import { database } from '../database';
import { clinics, professionalInfo, professionalLogos } from '../database/schema';
import { resolveLogoForClient } from './r2-media';
import {
  DEFAULT_DASHBOARD_LOGO,
  normalizeDashboardLogo,
  type DashboardLogoConfig,
} from '../../web/types/dashboard-logo';

type DashboardLogoUser = {
  role: string;
  userId: string;
  clinicId?: string | null;
};

export type DashboardLogoResolution = {
  config: DashboardLogoConfig;
  logoUrl: string | null;
  visible: boolean;
  canEdit: boolean;
  scope: 'clinic' | 'professional';
  scopeId: string;
};

export function parseDashboardLogoJson(
  raw: string | null | undefined,
  enabledFallback = false
): DashboardLogoConfig {
  if (!raw) return normalizeDashboardLogo(null, enabledFallback);
  try {
    return normalizeDashboardLogo(JSON.parse(raw), enabledFallback);
  } catch {
    return normalizeDashboardLogo(null, enabledFallback);
  }
}

async function resolveLogoImage(user: DashboardLogoUser): Promise<string | null> {
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

export async function resolveDashboardLogoForUser(
  user: DashboardLogoUser
): Promise<DashboardLogoResolution> {
  const logoUrl = await resolveLogoImage(user);

  if (user.clinicId) {
    const rows = await database
      .select({
        dashboardLogoEnabled: clinics.dashboardLogoEnabled,
        dashboardLogoJson: clinics.dashboardLogoJson,
      })
      .from(clinics)
      .where(eq(clinics.clinicId, user.clinicId))
      .limit(1);
    const enabledFallback = rows[0]?.dashboardLogoEnabled === true;
    const config = parseDashboardLogoJson(rows[0]?.dashboardLogoJson, enabledFallback);
    const canEdit = user.role === 'clinic_admin' || user.role === 'super_admin';
    return {
      config,
      logoUrl,
      visible: config.enabled && Boolean(logoUrl),
      canEdit,
      scope: 'clinic',
      scopeId: user.clinicId,
    };
  }

  if (user.role === 'podiatrist') {
    const rows = await database
      .select({
        dashboardLogoEnabled: professionalInfo.dashboardLogoEnabled,
        dashboardLogoJson: professionalInfo.dashboardLogoJson,
      })
      .from(professionalInfo)
      .where(eq(professionalInfo.userId, user.userId))
      .limit(1);
    const enabledFallback = rows[0]?.dashboardLogoEnabled === true;
    const config = parseDashboardLogoJson(rows[0]?.dashboardLogoJson, enabledFallback);
    return {
      config,
      logoUrl,
      visible: config.enabled && Boolean(logoUrl),
      canEdit: true,
      scope: 'professional',
      scopeId: user.userId,
    };
  }

  return {
    config: { ...DEFAULT_DASHBOARD_LOGO },
    logoUrl: null,
    visible: false,
    canEdit: false,
    scope: 'professional',
    scopeId: user.userId,
  };
}

export async function saveDashboardLogoForUser(
  user: DashboardLogoUser,
  config: DashboardLogoConfig
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = normalizeDashboardLogo(config);
  const json = JSON.stringify(normalized);

  if (user.clinicId) {
    if (user.role !== 'clinic_admin' && user.role !== 'super_admin') {
      return {
        ok: false,
        error: 'Solo el administrador de la clínica puede configurar el logo del dashboard.',
      };
    }
    await database
      .update(clinics)
      .set({
        dashboardLogoJson: json,
        dashboardLogoEnabled: normalized.enabled,
      })
      .where(eq(clinics.clinicId, user.clinicId));
    return { ok: true };
  }

  if (user.role === 'podiatrist') {
    await database
      .insert(professionalInfo)
      .values({
        userId: user.userId,
        name: '',
        dashboardLogoJson: json,
        dashboardLogoEnabled: normalized.enabled,
      })
      .onConflictDoUpdate({
        target: professionalInfo.userId,
        set: {
          dashboardLogoJson: json,
          dashboardLogoEnabled: normalized.enabled,
        },
      });
    return { ok: true };
  }

  return { ok: false, error: 'No autorizado' };
}
