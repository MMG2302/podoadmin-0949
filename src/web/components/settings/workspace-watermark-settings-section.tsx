import { useEffect, useState } from "react";
import {
  DEFAULT_WORKSPACE_WATERMARK,
  type WorkspaceWatermarkConfig,
  type WorkspaceWatermarkSource,
} from "../../types/workspace-watermark";
import { saveWorkspaceWatermark, useWorkspaceWatermark } from "../../hooks/use-workspace-watermark";

const MAX_FILE_BYTES = 2 * 1024 * 1024;

function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_BYTES) {
      reject(new Error("La imagen no puede superar 2 MB."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });
}

export function WorkspaceWatermarkSettingsSection() {
  const { config: initial, scope, canEdit, loading, reload } = useWorkspaceWatermark();
  const [config, setConfig] = useState<WorkspaceWatermarkConfig>(DEFAULT_WORKSPACE_WATERMARK);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setConfig(initial);
    setPreview(null);
  }, [initial]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-white/10 p-8 text-center text-sm text-gray-500">
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
    preview ?? (config.source === "custom" ? config.image : null);

  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-white/10 p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-[#1a1a1a] dark:text-white">Marca de agua del fondo</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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

          {config.source === "custom" && (
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="w-40 h-28 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900">
                {displayPreview ? (
                  <img src={displayPreview} alt="" className="max-w-full max-h-full object-contain opacity-40" />
                ) : (
                  <span className="text-xs text-gray-400 px-2 text-center">Sin imagen</span>
                )}
              </div>
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
                  className="inline-block px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
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
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-1 max-w-md">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Intensidad ({Math.round(config.opacity * 100)}%)
              </label>
              <input
                type="range"
                min={4}
                max={22}
                step={1}
                value={Math.round(config.opacity * 100)}
                onChange={(e) => patch({ opacity: Number(e.target.value) / 100 })}
                className="w-full"
              />
              <p className="text-xs text-gray-400 mt-1">6–10% suele verse bien como marca de agua.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Tamaño ({config.size}% del panel)
              </label>
              <input
                type="range"
                min={20}
                max={100}
                step={1}
                value={config.size}
                onChange={(e) => patch({ size: Number(e.target.value) })}
                className="w-full"
              />
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
            className="px-4 py-2 text-sm bg-[#1a1a1a] dark:bg-white dark:text-[#1a1a1a] text-white rounded-lg disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar marca de agua"}
        </button>

      {message && <p className="text-sm text-blue-700 dark:text-blue-300">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
