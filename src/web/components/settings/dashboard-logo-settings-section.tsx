import { useEffect, useState } from "react";
import {
  DEFAULT_DASHBOARD_LOGO,
  type DashboardLogoConfig,
} from "../../types/dashboard-logo";
import { DashboardLogoDisplay } from "../ui/dashboard-logo-display";
import { saveDashboardLogo, useDashboardLogo } from "../../hooks/use-dashboard-logo";
import { formErrorClass, formSuccessClass } from "../../lib/form-field-classes";

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
        Cargando opciones del dashboard…
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
      setMessage("Configuración del logo en dashboard guardada.");
      await reload(true);
      window.dispatchEvent(new CustomEvent("dashboard-logo:updated"));
    } else {
      setError(res.error || "Error al guardar.");
    }
  };

  if (!editable) {
    return (
      <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
        <p className="text-sm font-medium text-brand-ink">Logo en el dashboard</p>
        <p className="text-sm text-gray-500">
          {config.enabled
            ? "El administrador de la clínica ha activado la visualización del logo en el dashboard."
            : "El logo no se muestra en el dashboard."}
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
        <p className="text-sm font-medium text-brand-ink">Logo en el dashboard</p>
        <p className="text-xs text-gray-500 mt-1">
          Tarjeta en la pantalla principal. Ajusta tamaño, posición e intensidad.{" "}
          {scope === "clinic" ? "Aplica a toda la clínica." : "Aplica a tu consultorio."}
        </p>
      </div>

      <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(e) => patch({ enabled: e.target.checked })}
        />
        Mostrar logo en el dashboard
      </label>

      {config.enabled && (
        <>
          <DashboardLogoPreview logoUrl={logoUrl} config={config} />

          <div className="grid gap-4 sm:grid-cols-1 max-w-md">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Opacidad ({Math.round(config.opacity * 100)}%)
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
                Tamaño ({config.size}% del área de la tarjeta)
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
                Zoom ({config.zoom}%)
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
                Amplía o reduce el logo dentro del área. La tarjeta crece para evitar recortes.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Posición horizontal ({config.positionX}%)
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
                <span>Izquierda</span>
                <span>Centro</span>
                <span>Derecha</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Posición vertical ({config.positionY}%)
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
                <span>Arriba</span>
                <span>Centro</span>
                <span>Abajo</span>
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
        {saving ? "Guardando…" : "Guardar logo en dashboard"}
      </button>

      {message && <p className={formSuccessClass}>{message}</p>}
      {error && <p className={formErrorClass}>{error}</p>}
    </div>
  );
}
