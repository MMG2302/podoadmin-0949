import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api-client";
import { useLanguage } from "../../contexts/language-context";
import type { Translations } from "../../i18n/translations";
import {
  formWarningClass,
  semanticAlertErrorClass,
  semanticAlertSuccessClass,
  semanticDestructiveTextClass,
} from "../../lib/form-field-classes";
import { WhatsAppSetupGuide } from "./whatsapp-setup-guide";

type WhatsAppTranslations = Translations["whatsapp"];

export interface ReminderSchedule {
  daysBefore: number[];
  hoursBefore: number[];
}

export interface WhatsAppConfigDto {
  configured: boolean;
  enabled: boolean;
  remindersEnabled: boolean;
  reminderHoursBefore: number[];
  reminderSchedule?: ReminderSchedule;
  phoneNumberId: string | null;
  wabaId: string | null;
  businessPhoneE164: string | null;
  templateName: string | null;
  templateLanguage: string;
  defaultExtraNote: string | null;
  receptionistApiEnabled?: boolean;
  status: string;
  lastError: string | null;
  hasAccessToken: boolean;
  updatedAt: string | null;
}

const DAY_OPTIONS = [5, 2, 1] as const;
const HOUR_OPTIONS = [48, 24, 12, 6, 4, 2, 1] as const;
const MAX_HOUR_SLOTS = 8;

type FormState = {
  phoneNumberId: string;
  wabaId: string;
  accessToken: string;
  businessPhoneE164: string;
  enabled: boolean;
  remindersEnabled: boolean;
  day5: boolean;
  day2: boolean;
  day1: boolean;
  hourSlots: number[];
  templateName: string;
  templateLanguage: string;
  defaultExtraNote: string;
  receptionistApiEnabled: boolean;
};

const emptyForm: FormState = {
  phoneNumberId: "",
  wabaId: "",
  accessToken: "",
  businessPhoneE164: "",
  enabled: false,
  remindersEnabled: true,
  day5: true,
  day2: true,
  day1: true,
  hourSlots: [48, 24, 12],
  templateName: "",
  templateLanguage: "es",
  defaultExtraNote: "",
  receptionistApiEnabled: false,
};

function formatStatusLabel(status: string, t: WhatsAppTranslations): string {
  if (status === "connected") return t.statusConnected;
  if (status === "error") return t.statusError;
  return t.statusPending;
}

function normalizeHourSlots(slots: number[]): number[] {
  const allowed = new Set<number>(HOUR_OPTIONS);
  const unique = [...new Set(slots.filter((h) => allowed.has(h as (typeof HOUR_OPTIONS)[number])))]
    .sort((a, b) => b - a)
    .slice(0, MAX_HOUR_SLOTS);
  return unique.length ? unique : [24];
}

function scheduleFromForm(form: FormState): ReminderSchedule {
  const daysBefore: number[] = [];
  if (form.day5) daysBefore.push(5);
  if (form.day2) daysBefore.push(2);
  if (form.day1) daysBefore.push(1);
  return {
    daysBefore: daysBefore.length ? daysBefore : [5, 2, 1],
    hoursBefore: normalizeHourSlots(form.hourSlots),
  };
}

function formFromSchedule(schedule: ReminderSchedule | undefined, hoursFallback: number[]): Pick<FormState, "day5" | "day2" | "day1" | "hourSlots"> {
  const days = schedule?.daysBefore?.length ? schedule.daysBefore : [5, 2, 1];
  const hours = schedule?.hoursBefore?.length ? schedule.hoursBefore : hoursFallback;
  return {
    day5: days.includes(5),
    day2: days.includes(2),
    day1: days.includes(1),
    hourSlots: normalizeHourSlots(hours.length ? hours : [24, 12, 2]),
  };
}

function hourLabel(h: number, w: WhatsAppTranslations): string {
  return w.reminderHourBefore.replace("{hours}", String(h));
}

export function WhatsAppSettingsSection() {
  const { t } = useLanguage();
  const w = t.whatsapp;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [config, setConfig] = useState<WhatsAppConfigDto | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showTokenField, setShowTokenField] = useState(true);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api.get<{ success?: boolean; config?: WhatsAppConfigDto }>(
      "/integrations/whatsapp/me"
    );
    setLoading(false);
    if (!res.success || !res.data?.config) {
      const isNotFound = res.error === "Not Found" || res.error?.toLowerCase().includes("not found");
      setError(isNotFound ? w.errorApiUnavailable : res.error || w.errorLoad);
      return;
    }
    const c = res.data.config;
    setConfig(c);
    const scheduleBits = formFromSchedule(c.reminderSchedule, c.reminderHoursBefore || [24, 48]);
    setForm({
      phoneNumberId: c.phoneNumberId || "",
      wabaId: c.wabaId || "",
      accessToken: "",
      businessPhoneE164: c.businessPhoneE164 || "",
      enabled: c.enabled,
      remindersEnabled: c.remindersEnabled,
      ...scheduleBits,
      templateName: c.templateName || "",
      templateLanguage: c.templateLanguage || "es",
      defaultExtraNote: c.defaultExtraNote || "",
      receptionistApiEnabled: c.receptionistApiEnabled === true,
    });
    setShowTokenField(!c.hasAccessToken);
  }, [w.errorLoad, w.errorApiUnavailable]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const updateHourSlot = (index: number, value: number) => {
    setForm((f) => {
      const next = [...f.hourSlots];
      next[index] = value;
      return { ...f, hourSlots: normalizeHourSlots(next) };
    });
  };

  const addHourSlot = () => {
    setForm((f) => {
      if (f.hourSlots.length >= MAX_HOUR_SLOTS) return f;
      const used = new Set(f.hourSlots);
      const nextHour = HOUR_OPTIONS.find((h) => !used.has(h)) ?? 2;
      return { ...f, hourSlots: normalizeHourSlots([...f.hourSlots, nextHour]) };
    });
  };

  const removeHourSlot = (index: number) => {
    setForm((f) => {
      if (f.hourSlots.length <= 1) return f;
      const next = f.hourSlots.filter((_, i) => i !== index);
      return { ...f, hourSlots: normalizeHourSlots(next) };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!form.phoneNumberId.trim()) {
      setError(w.errorPhoneRequired);
      return;
    }
    if (showTokenField && !form.accessToken.trim()) {
      setError(w.errorTokenRequired);
      return;
    }
    if (form.enabled && !form.templateName.trim()) {
      setError(w.errorTemplateRequired);
      return;
    }

    if (form.remindersEnabled && !form.day5 && !form.day2 && !form.day1) {
      setError(w.reminderDaysRequired);
      return;
    }

    const schedule = scheduleFromForm(form);

    setSaving(true);
    const body: Record<string, unknown> = {
      phoneNumberId: form.phoneNumberId.trim(),
      wabaId: form.wabaId.trim() || null,
      businessPhoneE164: form.businessPhoneE164.trim() || null,
      enabled: form.enabled,
      remindersEnabled: form.remindersEnabled,
      reminderSchedule: schedule,
      reminderHoursBefore: schedule.hoursBefore,
      templateName: form.templateName.trim() || null,
      templateLanguage: form.templateLanguage.trim() || "es",
      defaultExtraNote: form.defaultExtraNote.trim() || null,
      receptionistApiEnabled: form.receptionistApiEnabled,
    };
    if (form.accessToken.trim()) {
      body.accessToken = form.accessToken.trim();
    }

    const res = await api.put<{ success?: boolean; config?: WhatsAppConfigDto; connectionWarning?: string; message?: string }>(
      "/integrations/whatsapp/me",
      body
    );
    setSaving(false);

    if (!res.success) {
      setError(res.error || (res.data as { message?: string })?.message || w.errorSave);
      return;
    }
    if (res.data?.config) setConfig(res.data.config);
    setForm((f) => ({ ...f, accessToken: "" }));
    setShowTokenField(false);
    const warn = res.data?.connectionWarning;
    setSuccess(warn ? w.successSavedWarning.replace("{warning}", warn) : w.successSaved);
    setTimeout(() => setSuccess(null), 5000);
  };

  const handleTest = async () => {
    setTesting(true);
    setError(null);
    const res = await api.post<{
      success?: boolean;
      config?: WhatsAppConfigDto;
      error?: string;
      displayPhoneNumber?: string;
    }>("/integrations/whatsapp/me/test");
    setTesting(false);
    if (!res.success) {
      setError(res.error || w.errorTest);
      return;
    }
    if (res.data?.config) setConfig(res.data.config);
    if (res.data?.success) {
      setSuccess(
        res.data.displayPhoneNumber
          ? w.successTestWithPhone.replace("{phone}", res.data.displayPhoneNumber)
          : w.successTest
      );
    } else {
      setError(res.data?.error || w.errorTestFailed);
    }
    setTimeout(() => setSuccess(null), 5000);
  };

  const handleDisconnect = async () => {
    if (!confirm(w.disconnectConfirm)) return;
    setSaving(true);
    const res = await api.delete<{ success?: boolean }>("/integrations/whatsapp/me");
    setSaving(false);
    if (!res.success) {
      setError(res.error || w.errorDisconnect);
      return;
    }
    setConfig(null);
    setForm(emptyForm);
    setShowTokenField(true);
    setSuccess(w.successDisconnected);
    setTimeout(() => setSuccess(null), 4000);
  };

  const remindersDisabled = !form.remindersEnabled;

  const toggleDay = (field: "day5" | "day2" | "day1") => {
    setForm((f) => {
      const next = { ...f, [field]: !f[field] };
      const anyDay = next.day5 || next.day2 || next.day1;
      if (!anyDay) return f;
      return next;
    });
  };

  if (loading) {
    return (
      <div className="bg-brand-surface rounded-xl border border-brand-border p-6">
        <div className="mb-4 p-4 rounded-lg bg-brand-canvas border border-brand-border">
          <p className="text-sm font-medium text-brand-ink">{w.purposeTitle}</p>
          <p className="text-sm text-brand-muted mt-1">{w.purposeDescription}</p>
        </div>
        <p className="text-sm text-brand-muted">{w.loading}</p>
      </div>
    );
  }

  const statusColor =
    config?.status === "connected"
      ? "text-semantic-success"
      : config?.status === "error"
        ? "text-semantic-error"
        : "text-semantic-warning";

  return (
    <div className="bg-brand-surface rounded-xl border border-brand-border p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-brand-ink">{w.title}</h3>
        <p className="text-sm text-brand-muted mt-1">{w.subtitle}</p>
      </div>

      <div className="mb-4 p-4 rounded-lg bg-brand-canvas border border-brand-border">
        <p className="text-sm font-medium text-brand-ink">{w.purposeTitle}</p>
        <p className="text-sm text-brand-muted mt-1">{w.purposeDescription}</p>
      </div>

      <WhatsAppSetupGuide />

      {config?.configured && (
        <div className="mb-4 p-3 rounded-lg bg-brand-canvas/50 text-sm">
          <span className="text-gray-500">{w.statusLabel} </span>
          <span className={`font-medium ${statusColor}`}>{formatStatusLabel(config.status, w)}</span>
          {config.businessPhoneE164 && (
            <span className="ml-2 text-brand-muted">· {config.businessPhoneE164}</span>
          )}
          {config.lastError && config.status === "error" && (
            <p className="mt-1 text-semantic-error text-xs">{config.lastError}</p>
          )}
        </div>
      )}

      {error && (
        <div className={`mb-4 ${semanticAlertErrorClass} !p-3`}>{error}</div>
      )}
      {success && (
        <div className={`mb-4 ${semanticAlertSuccessClass} !p-3`}>{success}</div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-brand-muted mb-1">{w.phoneNumberIdLabel}</label>
          <input
            type="text"
            value={form.phoneNumberId}
            onChange={(e) => setForm({ ...form, phoneNumberId: e.target.value })}
            className="w-full px-4 py-2.5 border border-brand-border rounded-lg bg-white dark:bg-gray-950 text-brand-ink"
            placeholder={w.phoneNumberIdPlaceholder}
            autoComplete="off"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-muted mb-1">{w.wabaIdLabel}</label>
          <input
            type="text"
            value={form.wabaId}
            onChange={(e) => setForm({ ...form, wabaId: e.target.value })}
            className="w-full px-4 py-2.5 border border-brand-border rounded-lg bg-white dark:bg-gray-950"
            placeholder={w.wabaIdPlaceholder}
            autoComplete="off"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-muted mb-1">
            {w.accessTokenLabel} {showTokenField ? w.accessTokenRequired : w.accessTokenKeepCurrent}
          </label>
          <input
            type="password"
            value={form.accessToken}
            onChange={(e) => setForm({ ...form, accessToken: e.target.value })}
            className="w-full px-4 py-2.5 border border-brand-border rounded-lg bg-white dark:bg-gray-950"
            placeholder={config?.hasAccessToken ? w.accessTokenPlaceholderSaved : w.accessTokenPlaceholderNew}
            autoComplete="new-password"
          />
          {config?.hasAccessToken && (
            <button type="button" className="mt-1 text-xs text-brand-ink dark:text-gray-300 underline" onClick={() => setShowTokenField((v) => !v)}>
              {showTokenField ? w.hideTokenField : w.changeToken}
            </button>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-muted mb-1">{w.publicPhoneLabel}</label>
          <input
            type="text"
            value={form.businessPhoneE164}
            onChange={(e) => setForm({ ...form, businessPhoneE164: e.target.value })}
            className="w-full px-4 py-2.5 border border-brand-border rounded-lg bg-white dark:bg-gray-950"
            placeholder={w.publicPhonePlaceholder}
          />
        </div>

        <div className="border-t border-brand-border pt-4 space-y-4">
          <p className="text-sm font-medium text-brand-muted">{w.remindersSection}</p>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.remindersEnabled}
              onChange={(e) => setForm({ ...form, remindersEnabled: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-brand-muted">{w.remindersAuto}</span>
          </label>

          <div className={`space-y-4 rounded-lg border border-brand-border p-4 ${remindersDisabled ? "opacity-60" : ""}`}>
            <p className="text-xs text-brand-muted">{w.reminderScheduleHint}</p>

            <div>
              <p className="text-sm font-medium text-brand-muted mb-2">{w.reminderDaysBefore}</p>
              <p className="text-xs text-brand-muted mb-3">{w.reminderDaysHelp}</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={w.reminderDaysBefore}>
                {DAY_OPTIONS.map((d) => {
                  const field = d === 5 ? "day5" : d === 2 ? "day2" : "day1";
                  const active = form[field];
                  const label =
                    d === 1 ? w.reminderDayOne.replace("{days}", "1") : w.reminderDayMany.replace("{days}", String(d));
                  return (
                    <button
                      key={d}
                      type="button"
                      disabled={remindersDisabled}
                      onClick={() => toggleDay(field)}
                      aria-pressed={active}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        active
                          ? "bg-brand-ink text-brand-ink-fg border-brand-ink"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-800"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {active ? "✓ " : ""}
                      {label}
                    </button>
                  );
                })}
              </div>
              {!form.day5 && !form.day2 && !form.day1 && (
                <p className={`${formWarningClass} !text-xs mt-2`}>{w.reminderDaysRequired}</p>
              )}
            </div>

            <div className="border-t border-brand-border pt-4">
              <p className="text-sm font-medium text-brand-muted mb-2">{w.reminderHoursBefore}</p>
              <p className="text-xs text-brand-muted mb-3">{w.reminderHoursHelp}</p>
              <div className="space-y-2">
                {form.hourSlots.map((h, index) => (
                  <div key={`hour-slot-${index}`} className="flex flex-wrap items-center gap-2">
                    <select
                      value={h}
                      disabled={remindersDisabled}
                      onChange={(e) => updateHourSlot(index, parseInt(e.target.value, 10))}
                      className="min-w-[200px] flex-1 max-w-xs px-3 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface text-brand-ink disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={w.reminderSelectHour}
                    >
                      {HOUR_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {hourLabel(opt, w)}
                        </option>
                      ))}
                    </select>
                    {form.hourSlots.length > 1 && (
                      <button
                        type="button"
                        disabled={remindersDisabled}
                        onClick={() => removeHourSlot(index)}
                        className="text-sm text-semantic-error hover:underline px-2 disabled:opacity-50"
                      >
                        {w.reminderRemoveHour}
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {form.hourSlots.length < MAX_HOUR_SLOTS && (
                <button
                  type="button"
                  disabled={remindersDisabled}
                  onClick={addHourSlot}
                  className="mt-2 text-sm font-medium text-brand-ink underline disabled:opacity-50"
                >
                  {w.reminderAddHour}
                </button>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{w.reminderHoursHint}</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-muted mb-1">{w.templateNameLabel}</label>
          <input
            type="text"
            value={form.templateName}
            onChange={(e) => setForm({ ...form, templateName: e.target.value })}
            className="w-full px-4 py-2.5 border border-brand-border rounded-lg bg-white dark:bg-gray-950"
            placeholder={w.templateNamePlaceholder}
          />
          <p className="text-xs text-gray-500 mt-1">{w.templateHint}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-muted mb-1">{w.defaultExtraNoteLabel}</label>
          <textarea
            value={form.defaultExtraNote}
            onChange={(e) => setForm({ ...form, defaultExtraNote: e.target.value.slice(0, 500) })}
            rows={3}
            className="w-full px-4 py-2.5 border border-brand-border rounded-lg bg-brand-surface text-sm"
            placeholder={w.defaultExtraNotePlaceholder}
          />
          <p className="text-xs text-gray-500 mt-1">{w.defaultExtraNoteHint}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-muted mb-1">{w.templateLanguageLabel}</label>
          <input
            type="text"
            value={form.templateLanguage}
            onChange={(e) => setForm({ ...form, templateLanguage: e.target.value })}
            className="w-full max-w-[120px] px-4 py-2.5 border border-brand-border rounded-lg bg-brand-surface"
            placeholder={w.templateLanguagePlaceholder}
          />
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
          <span className="text-sm font-medium text-brand-muted">{w.integrationActive}</span>
        </label>

        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={form.receptionistApiEnabled}
            onChange={(e) => setForm({ ...form, receptionistApiEnabled: e.target.checked })}
            disabled={!form.enabled}
            className="mt-1"
          />
          <span className="text-sm text-brand-muted">
            Permitir a recepción usar el envío automático por API Meta (recordatorios y historial).
          </span>
        </label>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg font-medium disabled:opacity-50"
          >
            {saving ? w.saving : w.save}
          </button>
          {config?.configured && (
            <>
              <button
                type="button"
                onClick={handleTest}
                disabled={testing || saving}
                className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg font-medium disabled:opacity-50"
              >
                {testing ? w.testing : w.testConnection}
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={saving}
                className={`px-5 py-2.5 border border-semantic-error/30 rounded-lg font-medium disabled:opacity-50 ${semanticDestructiveTextClass}`}
              >
                {w.disconnect}
              </button>
            </>
          )}
        </div>
      </form>

      <p className="mt-4 text-xs text-gray-500 dark:text-gray-500">
        {w.guidesFooter}{" "}
        <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" target="_blank" rel="noopener noreferrer" className="underline">
          {w.guidesCloudApi}
        </a>
        {" · "}
        <a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noopener noreferrer" className="underline">
          {w.guidesSystemUsers}
        </a>
        . {w.consentNote}
      </p>
    </div>
  );
}
