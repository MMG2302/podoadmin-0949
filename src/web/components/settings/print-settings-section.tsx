import { useEffect, useState, type ReactNode } from "react";
import {
  DEFAULT_PRINT_PREFERENCES,
  EVOLUTION_ROWS_OPTIONS,
  type PrintPageOrientation,
  type PrintPreferencesConfig,
} from "../../types/print-preferences";
import {
  fetchPrintPreferencesData,
  savePrintPreferences,
} from "../../lib/print-preferences-client";
import { formErrorClass, formSuccessClass } from "../../lib/form-field-classes";
import { PrintSettingsPreviewMockup } from "./print-settings-preview-mockup";
import { useAuth } from "../../contexts/auth-context";
import { useLanguage } from "../../contexts/language-context";
import { api } from "../../lib/api-client";

function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-start gap-3 ${disabled ? "opacity-60" : "cursor-pointer"}`}>
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="min-w-0">
        <span className="block text-sm text-brand-ink">{label}</span>
        {hint && <span className="block text-xs text-gray-500 mt-0.5">{hint}</span>}
      </span>
    </label>
  );
}

function OrientationPicker({
  value,
  onChange,
  disabled,
  hint,
}: {
  value: PrintPageOrientation;
  onChange: (value: PrintPageOrientation) => void;
  disabled?: boolean;
  hint?: string;
}) {
  const { t } = useLanguage();
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{t.settings.print.orientation}</label>
      <div className="flex gap-2">
        {(
          [
            { value: "portrait", label: t.settings.print.portrait },
            { value: "landscape", label: t.settings.print.landscape },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              value === opt.value
                ? "bg-brand-ink text-brand-ink-fg"
                : "bg-brand-canvas text-brand-muted hover:bg-brand-border/40"
            } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function SubCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-brand-border bg-gray-50 dark:bg-gray-900/40 p-4 space-y-3">
      <div>
        <h4 className="text-sm font-semibold text-brand-ink">{title}</h4>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function PrintSettingsSection() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [config, setConfig] = useState<PrintPreferencesConfig>(DEFAULT_PRINT_PREFERENCES);
  const [canEdit, setCanEdit] = useState(false);
  const [scope, setScope] = useState<"clinic" | "professional">("professional");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const data = await fetchPrintPreferencesData(true);
      if (cancelled) return;
      setConfig(data.config);
      setCanEdit(data.canEdit);
      setScope(data.scope);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setLogoUrl(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      if (user.clinicId) {
        const res = await api.get<{ success?: boolean; logo?: string | null }>(
          `/clinics/${user.clinicId}/logo`
        );
        if (!cancelled && res.success && res.data?.logo) {
          setLogoUrl(res.data.logo);
          return;
        }
      }
      const res = await api.get<{ success?: boolean; logo?: string | null }>(
        `/professionals/logo/${user.id}`
      );
      if (!cancelled) {
        setLogoUrl(res.success && res.data?.logo ? res.data.logo : null);
      }
    })();
    const onLogoUpdated = () => {
      void (async () => {
        if (user.clinicId) {
          const res = await api.get<{ success?: boolean; logo?: string | null }>(
            `/clinics/${user.clinicId}/logo`
          );
          if (!cancelled && res.success && res.data?.logo) {
            setLogoUrl(res.data.logo);
            return;
          }
        }
        const res = await api.get<{ success?: boolean; logo?: string | null }>(
          `/professionals/logo/${user.id}`
        );
        if (!cancelled) {
          setLogoUrl(res.success && res.data?.logo ? res.data.logo : null);
        }
      })();
    };
    window.addEventListener("clinic-logo:updated", onLogoUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener("clinic-logo:updated", onLogoUpdated);
    };
  }, [user?.id, user?.clinicId]);

  const patch = (patchVal: Partial<PrintPreferencesConfig>) => {
    setConfig((prev) => ({ ...prev, ...patchVal }));
    setMessage(null);
    setError(null);
  };
  const patchHistory = (patchVal: Partial<PrintPreferencesConfig["history"]>) => {
    setConfig((prev) => ({ ...prev, history: { ...prev.history, ...patchVal } }));
    setMessage(null);
    setError(null);
  };
  const patchPrescription = (patchVal: Partial<PrintPreferencesConfig["prescription"]>) => {
    setConfig((prev) => ({ ...prev, prescription: { ...prev.prescription, ...patchVal } }));
    setMessage(null);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    const res = await savePrintPreferences(config);
    setSaving(false);
    if (res.ok) {
      if (res.data) {
        setConfig(res.data.config);
        setCanEdit(res.data.canEdit);
      }
      setMessage(t.settings.print.saved);
    } else {
      setError(res.error || t.settings.print.saveFailed);
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_PRINT_PREFERENCES);
    setMessage(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="bg-brand-surface rounded-xl border border-brand-border p-8 text-center text-sm text-gray-500">
        {t.settings.print.loading}
      </div>
    );
  }

  const disabled = !canEdit;

  return (
    <div className="bg-brand-surface rounded-xl border border-brand-border p-6 space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-brand-ink">{t.settings.print.title}</h3>
        <p className="text-sm text-gray-500 mt-1">
          {t.settings.print.hint}{" "}
          {scope === "clinic"
            ? t.settings.settingsScope.appliesClinic
            : t.settings.settingsScope.appliesIndependent}
        </p>
      </div>

      {disabled && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-200">
          {t.settings.print.readOnlyHint}
        </p>
      )}

      <PrintSettingsPreviewMockup config={config} logoUrl={logoUrl} />

      {/* General */}
      <SubCard title={t.settings.print.generalTitle} description={t.settings.print.generalDesc}>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t.settings.print.headerAlign}</label>
          <div className="flex gap-2">
            {(["left", "center"] as const).map((align) => (
              <button
                key={align}
                type="button"
                disabled={disabled}
                onClick={() => patch({ headerAlign: align })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  config.headerAlign === align
                    ? "bg-brand-ink text-brand-ink-fg"
                    : "bg-brand-canvas text-brand-muted hover:bg-brand-border/40"
                } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {align === "left" ? t.settings.print.alignLeft : t.settings.print.alignCenter}
              </button>
            ))}
          </div>
        </div>

        <Toggle
          disabled={disabled}
          checked={config.monochrome}
          onChange={(v) => patch({ monochrome: v })}
          label={t.settings.print.monochrome}
          hint={t.settings.print.monochromeHint}
        />
        <Toggle
          disabled={disabled}
          checked={config.showGeneratedByFooter}
          onChange={(v) => patch({ showGeneratedByFooter: v })}
          label={t.settings.print.showGeneratedBy}
        />

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            {t.settings.print.footerText}
          </label>
          <textarea
            value={config.footerText}
            disabled={disabled}
            maxLength={300}
            rows={2}
            onChange={(e) => patch({ footerText: e.target.value })}
            placeholder={t.settings.print.footerPlaceholder}
            className="w-full px-3 py-2 text-sm bg-brand-surface text-brand-ink border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-ink focus:border-transparent disabled:opacity-60"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{config.footerText.length}/300</p>
        </div>
      </SubCard>

      {/* Historia clínica */}
      <SubCard title={t.settings.print.historyTitle} description={t.settings.print.historyDesc}>
        <Toggle
          disabled={disabled}
          checked={config.history.showLogo}
          onChange={(v) => patchHistory({ showLogo: v })}
          label={t.settings.print.showLogo}
        />
        <Toggle
          disabled={disabled}
          checked={config.history.showLegalData}
          onChange={(v) => patchHistory({ showLegalData: v })}
          label={t.settings.print.showLegalData}
          hint={t.settings.print.showLegalDataHint}
        />
        <Toggle
          disabled={disabled}
          checked={config.history.includePhotos}
          onChange={(v) => patchHistory({ includePhotos: v })}
          label={t.settings.print.includePhotos}
          hint={t.settings.print.includePhotosHint}
        />
        <Toggle
          disabled={disabled}
          checked={config.history.compact}
          onChange={(v) => patchHistory({ compact: v })}
          label={t.settings.print.compact}
          hint={t.settings.print.compactHistoryHint}
        />
        <OrientationPicker
          disabled={disabled}
          value={config.history.orientation}
          onChange={(v) => patchHistory({ orientation: v })}
          hint={t.settings.print.orientationHistoryHint}
        />
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            {t.settings.print.evolutionRows}
          </label>
          <div className="flex flex-wrap gap-2">
            {EVOLUTION_ROWS_OPTIONS.map((rows) => (
              <button
                key={rows}
                type="button"
                disabled={disabled}
                onClick={() => patchHistory({ evolutionRows: rows })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  config.history.evolutionRows === rows
                    ? "bg-brand-ink text-brand-ink-fg"
                    : "bg-brand-canvas text-brand-muted hover:bg-brand-border/40"
                } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {rows}
              </button>
            ))}
          </div>
        </div>
      </SubCard>

      {/* Recetas */}
      <SubCard title={t.settings.print.rxTitle} description={t.settings.print.rxDesc}>
        <Toggle
          disabled={disabled}
          checked={config.prescription.showLogo}
          onChange={(v) => patchPrescription({ showLogo: v })}
          label={t.settings.print.showLogo}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Toggle
            disabled={disabled}
            checked={config.prescription.showWeight}
            onChange={(v) => patchPrescription({ showWeight: v })}
            label={t.settings.print.showWeight}
          />
          <Toggle
            disabled={disabled}
            checked={config.prescription.showHeight}
            onChange={(v) => patchPrescription({ showHeight: v })}
            label={t.settings.print.showHeight}
          />
          <Toggle
            disabled={disabled}
            checked={config.prescription.showNextVisit}
            onChange={(v) => patchPrescription({ showNextVisit: v })}
            label={t.settings.print.showNextVisit}
          />
          <Toggle
            disabled={disabled}
            checked={config.prescription.showNotes}
            onChange={(v) => patchPrescription({ showNotes: v })}
            label={t.settings.print.showNotes}
          />
        </div>
        <Toggle
          disabled={disabled}
          checked={config.prescription.showSignatureCedula}
          onChange={(v) => patchPrescription({ showSignatureCedula: v })}
          label={t.settings.print.showSignatureCedula}
        />
        <Toggle
          disabled={disabled}
          checked={config.prescription.compact}
          onChange={(v) => patchPrescription({ compact: v })}
          label={t.settings.print.compact}
          hint={t.settings.print.compactRxHint}
        />
        <OrientationPicker
          disabled={disabled}
          value={config.prescription.orientation}
          onChange={(v) => patchPrescription({ orientation: v })}
          hint={t.settings.print.orientationRxHint}
        />
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t.settings.print.folioPosition}</label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: "inline", label: t.settings.print.folioInline },
                { value: "bar", label: t.settings.print.folioBar },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={disabled}
                onClick={() => patchPrescription({ folioPosition: opt.value })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  config.prescription.folioPosition === opt.value
                    ? "bg-brand-ink text-brand-ink-fg"
                    : "bg-brand-canvas text-brand-muted hover:bg-brand-border/40"
                } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {t.settings.print.folioHint}
          </p>
        </div>
      </SubCard>

      {!disabled && (
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="px-4 py-2 text-sm bg-brand-ink text-brand-ink-fg rounded-lg font-medium hover:bg-brand-ink-hover transition-colors disabled:opacity-50"
          >
            {saving ? t.settings.print.saving : t.settings.print.save}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="px-4 py-2 text-sm bg-brand-canvas text-brand-ink rounded-lg font-medium hover:bg-brand-border/30 transition-colors disabled:opacity-50"
          >
            {t.settings.print.reset}
          </button>
        </div>
      )}

      {message && <p className={formSuccessClass}>{message}</p>}
      {error && <p className={formErrorClass}>{error}</p>}
    </div>
  );
}
