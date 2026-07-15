import { useEffect, useState } from "react";
import {
  DEFAULT_DASHBOARD_LOGO,
  type DashboardLogoConfig,
} from "../../types/dashboard-logo";
import { DashboardLogoDisplay } from "../ui/dashboard-logo-display";
import { saveDashboardLogo, useDashboardLogo } from "../../hooks/use-dashboard-logo";
import { formErrorClass, formSuccessClass } from "../../lib/form-field-classes";
import { useLanguage } from "../../contexts/language-context";

interface DashboardLogoSettingsSectionProps {
  /** Logo actual para vista previa (puede venir de la sección de carga) */
  logoUrl?: string | null;
  /** Solo lectura (podólogo de clínica) */
  readOnly?: boolean;
}

function DashboardLogoPreview({
  logoUrl,
  config,
}: {
  logoUrl: string;
  config: DashboardLogoConfig;
}) {
  return <DashboardLogoDisplay logoUrl={logoUrl} config={config} preview />;
}

export function DashboardLogoSettingsSection({
  logoUrl: logoUrlProp,
  readOnly = false,
}: DashboardLogoSettingsSectionProps) {
  const { t } = useLanguage();
  const { config: initial, logoUrl: apiLogoUrl, canEdit, scope, loading, reload, applyData } = useDashboardLogo();
  const [config, setConfig] = useState<DashboardLogoConfig>(DEFAULT_DASHBOARD_LOGO);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const logoUrl = logoUrlProp ?? apiLogoUrl;
  const editable = canEdit && !readOnly;

  useEffect(() => {
    setConfig(initial);
  }, [initial]);

  useEffect(() => {
    const onLogoUpdated = () => void reload();
    window.addEventListener("clinic-logo:updated", onLogoUpdated);
    return () => window.removeEventListener("clinic-logo:updated", onLogoUpdated);
  }, [reload]);

  if (loading) {
    return (
      <div className="pt-4 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-500">
        {t.settings.dashboardLogo.loading}
      </div>
    );
  }

  if (!logoUrl) {
    return null;
  }

  const patch = (patchVal: Partial<DashboardLogoConfig>) => {
    setConfig((prev) => ({ ...prev, ...patchVal }));
    setMessage(null);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    const res = await saveDashboardLogo(config, applyData);
    setSaving(false);
    if (res.ok) {
      setMessage(t.settings.dashboardLogo.saved);
      await reload(true);
      window.dispatchEvent(new CustomEvent("dashboard-logo:updated"));
    } else {
      setError(res.error || t.settings.dashboardLogo.saveFailed);
    }
  };

  if (!editable) {
    return (
      <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
        <p className="text-sm font-medium text-brand-ink">{t.settings.dashboardLogo.title}</p>
        <p className="text-sm text-gray-500">
          {config.enabled
            ? t.settings.dashboardLogo.enabledByAdmin
            : t.settings.dashboardLogo.notShown}
        </p>
        {config.enabled && (
          <DashboardLogoPreview logoUrl={logoUrl} config={config} />
        )}
      </div>
    );
  }

  return (
    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
      <div>
        <p className="text-sm font-medium text-brand-ink">{t.settings.dashboardLogo.title}</p>
        <p className="text-xs text-gray-500 mt-1">
          {t.settings.dashboardLogo.hint}{" "}
          {scope === "clinic" ? t.settings.settingsScope.appliesClinic : t.settings.settingsScope.appliesPractice}
        </p>
      </div>

      <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(e) => patch({ enabled: e.target.checked })}
        />
        {t.settings.dashboardLogo.show}
      </label>

      {config.enabled && (
        <>
          <DashboardLogoPreview logoUrl={logoUrl} config={config} />

          <div className="grid gap-4 sm:grid-cols-1 max-w-md">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                {t.settings.dashboardLogo.opacity.replace("{pct}", String(Math.round(config.opacity * 100)))}
              </label>
              <input
                type="range"
                min={10}
                max={100}
                step={1}
                value={Math.round(config.opacity * 100)}
                onChange={(e) => patch({ opacity: Number(e.target.value) / 100 })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                {t.settings.dashboardLogo.size.replace("{pct}", String(config.size))}
              </label>
              <input
                type="range"
                min={20}
                max={200}
                step={1}
                value={config.size}
                onChange={(e) => patch({ size: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                {t.settings.dashboardLogo.zoom.replace("{pct}", String(config.zoom))}
              </label>
              <input
                type="range"
                min={50}
                max={400}
                step={5}
                value={config.zoom}
                onChange={(e) => patch({ zoom: Number(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-gray-400 mt-1">
                {t.settings.dashboardLogo.zoomHint}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                {t.settings.dashboardLogo.positionX.replace("{pct}", String(config.positionX))}
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={config.positionX}
                onChange={(e) => patch({ positionX: Number(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-gray-400 mt-1 flex justify-between">
                <span>{t.settings.dashboardLogo.left}</span>
                <span>{t.settings.dashboardLogo.center}</span>
                <span>{t.settings.dashboardLogo.right}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                {t.settings.dashboardLogo.positionY.replace("{pct}", String(config.positionY))}
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={config.positionY}
                onChange={(e) => patch({ positionY: Number(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-gray-400 mt-1 flex justify-between">
                <span>{t.settings.dashboardLogo.top}</span>
                <span>{t.settings.dashboardLogo.center}</span>
                <span>{t.settings.dashboardLogo.bottom}</span>
              </p>
            </div>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={saving}
        className="px-4 py-2 text-sm bg-brand-ink text-brand-ink-fg rounded-lg disabled:opacity-50"
      >
        {saving ? t.settings.dashboardLogo.saving : t.settings.dashboardLogo.save}
      </button>

      {message && <p className={formSuccessClass}>{message}</p>}
      {error && <p className={formErrorClass}>{error}</p>}
    </div>
  );
}
