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
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">Orientación de página</label>
      <div className="flex gap-2">
        {(
          [
            { value: "portrait", label: "Vertical" },
            { value: "landscape", label: "Horizontal" },
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
      setMessage("Preferencias de impresión guardadas.");
    } else {
      setError(res.error || "No se pudo guardar.");
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
        Cargando preferencias de impresión…
      </div>
    );
  }

  const disabled = !canEdit;

  return (
    <div className="bg-brand-surface rounded-xl border border-brand-border p-6 space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-brand-ink">Configuración de impresiones</h3>
        <p className="text-sm text-gray-500 mt-1">
          Ajusta cómo se ven la historia clínica y las recetas al imprimir o guardar como PDF.{" "}
          {scope === "clinic"
            ? "Aplica a toda la clínica."
            : "Aplica a tu consultorio independiente."}
        </p>
      </div>

      {disabled && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-200">
          Solo el administrador de la clínica puede cambiar estas opciones. Se muestran en modo lectura.
        </p>
      )}

      <PrintSettingsPreviewMockup config={config} logoUrl={logoUrl} />

      {/* General */}
      <SubCard title="General" description="Se aplica a ambos documentos.">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Alineación de la cabecera</label>
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
                {align === "left" ? "Izquierda" : "Centrada"}
              </button>
            ))}
          </div>
        </div>

        <Toggle
          disabled={disabled}
          checked={config.monochrome}
          onChange={(v) => patch({ monochrome: v })}
          label="Imprimir en blanco y negro"
          hint="Escala de grises, ideal para ahorrar tinta."
        />
        <Toggle
          disabled={disabled}
          checked={config.showGeneratedByFooter}
          onChange={(v) => patch({ showGeneratedByFooter: v })}
          label='Mostrar "Generado por PodoAdmin" en el pie'
        />

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Texto de pie de página personalizado
          </label>
          <textarea
            value={config.footerText}
            disabled={disabled}
            maxLength={300}
            rows={2}
            onChange={(e) => patch({ footerText: e.target.value })}
            placeholder="Ej. Horario de atención, aviso legal, redes sociales…"
            className="w-full px-3 py-2 text-sm bg-brand-surface text-brand-ink border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-ink focus:border-transparent disabled:opacity-60"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{config.footerText.length}/300</p>
        </div>
      </SubCard>

      {/* Historia clínica */}
      <SubCard title="Historia clínica" description="Documento completo del paciente.">
        <Toggle
          disabled={disabled}
          checked={config.history.showLogo}
          onChange={(v) => patchHistory({ showLogo: v })}
          label="Mostrar logo en la cabecera"
        />
        <Toggle
          disabled={disabled}
          checked={config.history.showLegalData}
          onChange={(v) => patchHistory({ showLegalData: v })}
          label="Mostrar datos legales"
          hint="RFC, CLUES, COFEPRIS y registro sanitario."
        />
        <Toggle
          disabled={disabled}
          checked={config.history.includePhotos}
          onChange={(v) => patchHistory({ includePhotos: v })}
          label="Incluir fotografías clínicas"
          hint="Requiere que el bloque de imágenes esté activo en el diseñador."
        />
        <Toggle
          disabled={disabled}
          checked={config.history.compact}
          onChange={(v) => patchHistory({ compact: v })}
          label="Diseño compacto"
          hint="Menos márgenes, tipografía y diagramas más pequeños para ahorrar páginas."
        />
        <OrientationPicker
          disabled={disabled}
          value={config.history.orientation}
          onChange={(v) => patchHistory({ orientation: v })}
          hint="Recomendado: vertical para historias clínicas."
        />
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Filas de evolución clínica a imprimir
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
      <SubCard title="Recetas" description="Formato de las recetas / prescripciones.">
        <Toggle
          disabled={disabled}
          checked={config.prescription.showLogo}
          onChange={(v) => patchPrescription({ showLogo: v })}
          label="Mostrar logo en la cabecera"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Toggle
            disabled={disabled}
            checked={config.prescription.showWeight}
            onChange={(v) => patchPrescription({ showWeight: v })}
            label="Mostrar peso del paciente"
          />
          <Toggle
            disabled={disabled}
            checked={config.prescription.showHeight}
            onChange={(v) => patchPrescription({ showHeight: v })}
            label="Mostrar estatura del paciente"
          />
          <Toggle
            disabled={disabled}
            checked={config.prescription.showNextVisit}
            onChange={(v) => patchPrescription({ showNextVisit: v })}
            label="Mostrar próxima visita"
          />
          <Toggle
            disabled={disabled}
            checked={config.prescription.showNotes}
            onChange={(v) => patchPrescription({ showNotes: v })}
            label="Mostrar notas adicionales"
          />
        </div>
        <Toggle
          disabled={disabled}
          checked={config.prescription.showSignatureCedula}
          onChange={(v) => patchPrescription({ showSignatureCedula: v })}
          label="Mostrar cédula/registro en la firma"
        />
        <Toggle
          disabled={disabled}
          checked={config.prescription.compact}
          onChange={(v) => patchPrescription({ compact: v })}
          label="Diseño compacto"
          hint="Menos márgenes y tipografía más pequeña para ocupar menos espacio."
        />
        <OrientationPicker
          disabled={disabled}
          value={config.prescription.orientation}
          onChange={(v) => patchPrescription({ orientation: v })}
          hint="Recomendado: horizontal para recetas."
        />
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Posición del folio</label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: "inline", label: "En cabecera (recomendado)" },
                { value: "bar", label: "Barra destacada" },
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
            El folio en cabecera ahorra una línea completa y suele caber en una sola página.
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
            {saving ? "Guardando…" : "Guardar preferencias"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="px-4 py-2 text-sm bg-brand-canvas text-brand-ink rounded-lg font-medium hover:bg-brand-border/30 transition-colors disabled:opacity-50"
          >
            Restablecer valores por defecto
          </button>
        </div>
      )}

      {message && <p className={formSuccessClass}>{message}</p>}
      {error && <p className={formErrorClass}>{error}</p>}
    </div>
  );
}
