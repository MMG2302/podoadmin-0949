import { useEffect, useState } from "react";
import {
  DEFAULT_WORKSPACE_WATERMARK,
  type WorkspaceWatermarkConfig,
  type WorkspaceWatermarkSource,
} from "../../types/workspace-watermark";
import { saveWorkspaceWatermark, useWorkspaceWatermark } from "../../hooks/use-workspace-watermark";
import { compressImageForLogo } from "../../lib/image-compress";

const MAX_FILE_BYTES = 2 * 1024 * 1024;

async function readImageFile(file: File): Promise<string> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("La imagen no puede superar 2 MB.");
  }
  return compressImageForLogo(file);
}

export function WorkspaceWatermarkSettingsSection() {
  const { config: initial, displayImage, scope, canEdit, loading, reload } = useWorkspaceWatermark();
  const [config, setConfig] = useState<WorkspaceWatermarkConfig>(DEFAULT_WORKSPACE_WATERMARK);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setConfig(initial);
    setPreview(null);
  }, [initial]);

  useEffect(() => {
    const onLogoUpdated = () => void reload();
    window.addEventListener("clinic-logo:updated", onLogoUpdated);
    return () => window.removeEventListener("clinic-logo:updated", onLogoUpdated);
  }, [reload]);

  if (loading) {
    return (
      <div className="bg-brand-surface rounded-xl border border-brand-border p-8 text-center text-sm text-gray-500">
        Cargando marca de agua…
      </div>
    );
  }

  if (!canEdit) {
    return null;
  }

  const patch = (patchVal: Partial<WorkspaceWatermarkConfig>) => {
    setConfig((prev) => ({ ...prev, ...patchVal }));
    setMessage(null);
    setError(null);
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (file.type && !validTypes.includes(file.type)) {
      setError("Formato no válido. Use PNG, JPG o WebP (máx. 2 MB).");
      return;
    }

    try {
      const dataUri = await readImageFile(file);
      setPreview(dataUri);
      patch({ source: "custom", image: dataUri, enabled: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar imagen.");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    const res = await saveWorkspaceWatermark(config);
    setSaving(false);
    if (res.ok) {
      setMessage("Marca de agua guardada.");
      setPreview(null);
      await reload();
      window.dispatchEvent(new CustomEvent("workspace-watermark:updated"));
    } else {
      setError(res.error || "Error al guardar.");
    }
  };

  const displayPreview =
    preview ??
    (config.source === "custom"
      ? config.image
      : config.source === "clinic_logo"
        ? displayImage
        : null);

  return (
    <div className="bg-brand-surface rounded-xl border border-brand-border p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-brand-ink">Marca de agua del fondo</h3>
        <p className="text-sm text-brand-muted mt-1">
          Imagen sutil en el área principal. Ajusta tamaño, posición e intensidad.{" "}
          {scope === "clinic"
            ? "Aplica a toda la clínica."
            : "Aplica a tu consultorio independiente."}
        </p>
      </div>

      <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => patch({ enabled: e.target.checked })}
            />
            Mostrar marca de agua en el fondo
          </label>

          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500">Imagen</p>
            <div className="flex flex-wrap gap-3">
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="watermark-source"
                  checked={config.source === "custom"}
                  onChange={() => patch({ source: "custom" as WorkspaceWatermarkSource })}
                />
                Imagen personalizada
              </label>
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="watermark-source"
                  checked={config.source === "clinic_logo"}
                  onChange={() => patch({ source: "clinic_logo" as WorkspaceWatermarkSource, enabled: true })}
                />
                Usar logo {scope === "clinic" ? "de la clínica" : "profesional"}
              </label>
            </div>
          </div>

          {(config.source === "custom" || config.source === "clinic_logo") && (
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="w-40 h-28 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900">
                {displayPreview ? (
                  <img
                    src={displayPreview}
                    alt=""
                    className="max-w-full max-h-full object-contain"
                    style={{ opacity: config.opacity }}
                  />
                ) : (
                  <span className="text-xs text-gray-400 px-2 text-center">
                    {config.source === "clinic_logo" ? "Sin logo configurado" : "Sin imagen"}
                  </span>
                )}
              </div>
              {config.source === "custom" ? (
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    id="workspace-watermark-upload"
                    className="hidden"
                    onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
                  />
                  <label
                    htmlFor="workspace-watermark-upload"
                    className="inline-block px-3 py-2 text-sm border border-brand-border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Subir imagen
                  </label>
                  <p className="text-xs text-gray-400">JPEG, PNG o WebP · máx. 2 MB</p>
                  {(displayPreview || config.image) && (
                    <button
                      type="button"
                      onClick={() => {
                        setPreview(null);
                        patch({ image: null, enabled: false });
                      }}
                      className="block text-xs text-red-600 hover:underline"
                    >
                      Quitar imagen
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400 max-w-xs">
                  Se usará el logo {scope === "clinic" ? "de la clínica" : "profesional"} configurado en esta
                  pantalla. Si no ves vista previa, sube el logo primero en la sección correspondiente.
                </p>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-1 max-w-md">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Intensidad ({Math.round(config.opacity * 100)}%)
              </label>
              <input
                type="range"
                min={1}
                max={100}
                step={1}
                value={Math.round(config.opacity * 100)}
                onChange={(e) => patch({ opacity: Number(e.target.value) / 100 })}
                className="w-full"
              />
              <p className="text-xs text-gray-400 mt-1">6–10% suele verse bien como marca de agua sutil.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Tamaño ({config.size}% del panel)
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
                Sube el zoom (200% o más) para cubrir toda el área visible. Combina con posición centrada.
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

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="px-4 py-2 text-sm bg-brand-ink text-brand-ink-fg rounded-lg disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar marca de agua"}
        </button>

      {message && <p className="text-sm text-blue-700 dark:text-blue-300">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
