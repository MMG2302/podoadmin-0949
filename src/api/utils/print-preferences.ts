import { eq } from 'drizzle-orm';
import { database } from '../database';
import { clinics, professionalInfo } from '../database/schema';
import {
  DEFAULT_PRINT_PREFERENCES,
  normalizePrintPreferences,
  type PrintPreferencesConfig,
} from '../../web/types/print-preferences';

type PrintPreferencesUser = {
  role: string;
  userId: string;
  clinicId?: string | null;
};

export type PrintPreferencesResolution = {
  config: PrintPreferencesConfig;
  scope: 'clinic' | 'professional';
  scopeId: string;
  canEdit: boolean;
};

export function parsePrintPreferencesJson(raw: string | null | undefined): PrintPreferencesConfig {
  if (!raw) return normalizePrintPreferences(null);
  try {
    return normalizePrintPreferences(JSON.parse(raw));
  } catch {
    return normalizePrintPreferences(null);
  }
}

export async function resolvePrintPreferencesForUser(
  user: PrintPreferencesUser
): Promise<PrintPreferencesResolution> {
  if (user.clinicId) {
    const rows = await database
      .select({ printPreferencesJson: clinics.printPreferencesJson })
      .from(clinics)
      .where(eq(clinics.clinicId, user.clinicId))
      .limit(1);
    const config = parsePrintPreferencesJson(rows[0]?.printPreferencesJson);
    const canEdit = user.role === 'clinic_admin' || user.role === 'super_admin';
    return { config, scope: 'clinic', scopeId: user.clinicId, canEdit };
  }

  if (user.role === 'podiatrist') {
    const rows = await database
      .select({ printPreferencesJson: professionalInfo.printPreferencesJson })
      .from(professionalInfo)
      .where(eq(professionalInfo.userId, user.userId))
      .limit(1);
    const config = parsePrintPreferencesJson(rows[0]?.printPreferencesJson);
    return { config, scope: 'professional', scopeId: user.userId, canEdit: true };
  }

  return {
    config: { ...DEFAULT_PRINT_PREFERENCES },
    scope: 'professional',
    scopeId: user.userId,
    canEdit: false,
  };
}

export async function savePrintPreferencesForUser(
  user: PrintPreferencesUser,
  config: PrintPreferencesConfig
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = normalizePrintPreferences(config);
  const json = JSON.stringify(normalized);

  if (user.clinicId) {
    if (user.role !== 'clinic_admin' && user.role !== 'super_admin') {
      return {
        ok: false,
        error: 'Solo el administrador de la clínica puede configurar las impresiones.',
      };
    }
    await database
      .update(clinics)
      .set({ printPreferencesJson: json })
      .where(eq(clinics.clinicId, user.clinicId));
    return { ok: true };
  }

  if (user.role === 'podiatrist') {
    await database
      .insert(professionalInfo)
      .values({
        userId: user.userId,
        name: '',
        printPreferencesJson: json,
      })
      .onConflictDoUpdate({
        target: professionalInfo.userId,
        set: { printPreferencesJson: json },
      });
    return { ok: true };
  }

  return { ok: false, error: 'No autorizado' };
}
