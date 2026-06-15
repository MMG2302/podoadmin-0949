import { eq } from 'drizzle-orm';
import { database } from '../database';
import { userWhatsappIntegrations } from '../database/schema';
import { encryptSecret, decryptSecret } from './field-encryption';
import { testWhatsAppConnection } from './whatsapp-meta-api';

export const WHATSAPP_CONFIG_ROLES = ['podiatrist', 'clinic_admin'] as const;
export type WhatsAppConfigRole = (typeof WHATSAPP_CONFIG_ROLES)[number];

export function canConfigureWhatsApp(role: string): boolean {
  return (WHATSAPP_CONFIG_ROLES as readonly string[]).includes(role);
}

export interface ReminderSchedule {
  daysBefore: number[];
  hoursBefore: number[];
}

export interface WhatsAppConfigPublic {
  configured: boolean;
  enabled: boolean;
  remindersEnabled: boolean;
  reminderHoursBefore: number[];
  reminderSchedule: ReminderSchedule;
  phoneNumberId: string | null;
  wabaId: string | null;
  businessPhoneE164: string | null;
  templateName: string | null;
  templateLanguage: string;
  defaultExtraNote: string | null;
  status: string;
  lastError: string | null;
  hasAccessToken: boolean;
  updatedAt: string | null;
}

const DEFAULT_SCHEDULE: ReminderSchedule = {
  daysBefore: [5, 2, 1],
  hoursBefore: [24, 12, 2],
};

function parseReminderHours(raw: string | null): number[] {
  if (!raw) return [24, 48];
  try {
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [24, 48];
    return arr.filter((n) => typeof n === 'number' && n > 0 && n <= 168) as number[];
  } catch {
    return [24, 48];
  }
}

export function parseReminderSchedule(
  scheduleRaw: string | null,
  hoursFallback: string | null
): ReminderSchedule {
  if (scheduleRaw) {
    try {
      const parsed = JSON.parse(scheduleRaw) as ReminderSchedule;
      return {
        daysBefore: Array.isArray(parsed.daysBefore) ? parsed.daysBefore : DEFAULT_SCHEDULE.daysBefore,
        hoursBefore: Array.isArray(parsed.hoursBefore) ? parsed.hoursBefore : DEFAULT_SCHEDULE.hoursBefore,
      };
    } catch {
      /* fallthrough */
    }
  }
  return {
    daysBefore: DEFAULT_SCHEDULE.daysBefore,
    hoursBefore: parseReminderHours(hoursFallback),
  };
}

function mapRowToPublic(row: typeof userWhatsappIntegrations.$inferSelect): WhatsAppConfigPublic {
  return {
    configured: true,
    enabled: row.enabled,
    remindersEnabled: row.remindersEnabled,
    reminderHoursBefore: parseReminderHours(row.reminderHoursBefore),
    reminderSchedule: parseReminderSchedule(row.reminderSchedule ?? null, row.reminderHoursBefore),
    phoneNumberId: row.phoneNumberId,
    wabaId: row.wabaId ?? null,
    businessPhoneE164: row.businessPhoneE164 ?? null,
    templateName: row.templateName ?? null,
    templateLanguage: row.templateLanguage || 'es',
    defaultExtraNote: row.defaultExtraNote ?? null,
    status: row.status,
    lastError: row.lastError ?? null,
    hasAccessToken: Boolean(row.accessTokenEnc),
    updatedAt: row.updatedAt,
  };
}

export async function getWhatsAppConfigPublic(userId: string): Promise<WhatsAppConfigPublic> {
  const row = await database
    .select()
    .from(userWhatsappIntegrations)
    .where(eq(userWhatsappIntegrations.userId, userId))
    .limit(1)
    .then((r) => r[0]);

  if (!row) {
    return {
      configured: false,
      enabled: false,
      remindersEnabled: true,
      reminderHoursBefore: [24, 48],
      reminderSchedule: DEFAULT_SCHEDULE,
      phoneNumberId: null,
      wabaId: null,
      businessPhoneE164: null,
      templateName: null,
      templateLanguage: 'es',
      defaultExtraNote: null,
      status: 'pending',
      lastError: null,
      hasAccessToken: false,
      updatedAt: null,
    };
  }
  return mapRowToPublic(row);
}

export interface SaveWhatsAppConfigInput {
  phoneNumberId: string;
  wabaId?: string | null;
  accessToken?: string;
  businessPhoneE164?: string | null;
  enabled?: boolean;
  remindersEnabled?: boolean;
  reminderHoursBefore?: number[];
  reminderSchedule?: ReminderSchedule;
  templateName?: string | null;
  templateLanguage?: string;
  defaultExtraNote?: string | null;
}

export async function saveWhatsAppConfig(
  userId: string,
  clinicId: string | null | undefined,
  input: SaveWhatsAppConfigInput
): Promise<{ config: WhatsAppConfigPublic; testError?: string }> {
  const existing = await database
    .select()
    .from(userWhatsappIntegrations)
    .where(eq(userWhatsappIntegrations.userId, userId))
    .limit(1)
    .then((r) => r[0]);

  let accessToken = input.accessToken?.trim();
  if (!accessToken && existing) {
    accessToken = await decryptSecret(existing.accessTokenEnc);
  }
  if (!accessToken) {
    throw new Error('ACCESS_TOKEN_REQUIRED');
  }

  const test = await testWhatsAppConnection(input.phoneNumberId.trim(), accessToken);
  const now = new Date().toISOString();
  const schedule =
    input.reminderSchedule ??
    ({
      daysBefore: [5, 2, 1],
      hoursBefore: (input.reminderHoursBefore?.length ? input.reminderHoursBefore : [24, 12, 2]).slice(0, 8),
    } as ReminderSchedule);
  const reminderHours = JSON.stringify(schedule.hoursBefore.slice(0, 8));
  const reminderScheduleJson = JSON.stringify({
    daysBefore: schedule.daysBefore.filter((d) => [5, 2, 1].includes(d) || d > 0).slice(0, 5),
    hoursBefore: schedule.hoursBefore.filter((h) => h > 0 && h <= 168).slice(0, 12),
  });
  const tokenEnc = await encryptSecret(accessToken);
  const status = test.ok ? 'connected' : 'error';
  const lastError = test.ok ? null : test.error || 'Error de conexión';
  const businessPhone =
    input.businessPhoneE164?.trim() ||
    (test.displayPhoneNumber ? `+${test.displayPhoneNumber.replace(/\D/g, '')}` : null);

  const values = {
    userId,
    clinicId: clinicId ?? null,
    phoneNumberId: input.phoneNumberId.trim(),
    wabaId: input.wabaId?.trim() || null,
    businessPhoneE164: businessPhone,
    accessTokenEnc: tokenEnc,
    enabled: input.enabled ?? false,
    remindersEnabled: input.remindersEnabled ?? true,
    reminderHoursBefore: reminderHours,
    reminderSchedule: reminderScheduleJson,
    templateName: input.templateName?.trim() || null,
    templateLanguage: (input.templateLanguage || 'es').trim().slice(0, 10) || 'es',
    defaultExtraNote: input.defaultExtraNote?.trim().slice(0, 500) || null,
    status,
    lastError,
    updatedAt: now,
  };

  if (existing) {
    await database
      .update(userWhatsappIntegrations)
      .set(values)
      .where(eq(userWhatsappIntegrations.userId, userId));
  } else {
    await database.insert(userWhatsappIntegrations).values({
      ...values,
      createdAt: now,
    });
  }

  const config = await getWhatsAppConfigPublic(userId);
  return { config, testError: test.ok ? undefined : test.error };
}

export async function deleteWhatsAppConfig(userId: string): Promise<void> {
  await database.delete(userWhatsappIntegrations).where(eq(userWhatsappIntegrations.userId, userId));
}

export async function testStoredWhatsAppConfig(userId: string): Promise<{
  ok: boolean;
  error?: string;
  displayPhoneNumber?: string;
}> {
  const row = await database
    .select()
    .from(userWhatsappIntegrations)
    .where(eq(userWhatsappIntegrations.userId, userId))
    .limit(1)
    .then((r) => r[0]);

  if (!row) {
    return { ok: false, error: 'NOT_CONFIGURED' };
  }

  const token = await decryptSecret(row.accessTokenEnc);
  const test = await testWhatsAppConnection(row.phoneNumberId, token);
  const now = new Date().toISOString();

  await database
    .update(userWhatsappIntegrations)
    .set({
      status: test.ok ? 'connected' : 'error',
      lastError: test.ok ? null : test.error || 'Error',
      businessPhoneE164: test.displayPhoneNumber
        ? row.businessPhoneE164 || `+${test.displayPhoneNumber.replace(/\D/g, '')}`
        : row.businessPhoneE164,
      updatedAt: now,
    })
    .where(eq(userWhatsappIntegrations.userId, userId));

  return {
    ok: test.ok,
    error: test.error,
    displayPhoneNumber: test.displayPhoneNumber,
  };
}

export async function getWhatsAppCredentialsForUser(userId: string): Promise<{
  phoneNumberId: string;
  accessToken: string;
  templateName: string | null;
  templateLanguage: string;
  defaultExtraNote: string | null;
  remindersEnabled: boolean;
  enabled: boolean;
} | null> {
  const row = await database
    .select()
    .from(userWhatsappIntegrations)
    .where(eq(userWhatsappIntegrations.userId, userId))
    .limit(1)
    .then((r) => r[0]);
  if (!row) return null;
  const accessToken = await decryptSecret(row.accessTokenEnc);
  return {
    phoneNumberId: row.phoneNumberId,
    accessToken,
    templateName: row.templateName ?? null,
    templateLanguage: row.templateLanguage || 'es',
    defaultExtraNote: row.defaultExtraNote ?? null,
    remindersEnabled: row.remindersEnabled,
    enabled: row.enabled,
  };
}
