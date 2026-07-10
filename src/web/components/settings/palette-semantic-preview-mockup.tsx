import type { PaletteMode } from "../../types/color-palette";

interface PaletteSemanticPreviewMockupProps {
  mode: PaletteMode;
  className?: string;
  labels?: {
    error: string;
    warning: string;
    success: string;
    info: string;
  };
  messages?: {
    error: string;
    warning: string;
    success: string;
    info: string;
  };
}

/** Vista previa de alertas y estados semánticos con la paleta aplicada. */
export function PaletteSemanticPreviewMockup({
  mode,
  className = "",
  labels = {
    error: "Error",
    warning: "Advertencia",
    success: "Éxito",
    info: "Info",
  },
  messages = {
    error: "No se pudo guardar el registro.",
    warning: "Revisa los datos antes de continuar.",
    success: "Cambios guardados correctamente.",
    info: "La sesión expira en 5 minutos.",
  },
}: PaletteSemanticPreviewMockupProps) {
  const items = [
    { key: "error" as const, label: labels.error, message: messages.error, bg: mode.errorBg, color: mode.error },
    { key: "warning" as const, label: labels.warning, message: messages.warning, bg: mode.warningBg, color: mode.warning },
    { key: "success" as const, label: labels.success, message: messages.success, bg: mode.successBg, color: mode.success },
    { key: "info" as const, label: labels.info, message: messages.info, bg: mode.infoBg, color: mode.info },
  ];

  return (
    <div
      className={`rounded-xl border overflow-hidden p-3 space-y-2 ${className}`}
      style={{ backgroundColor: mode.canvas, borderColor: mode.border }}
    >
      {items.map((item) => (
        <div
          key={item.key}
          className="rounded-lg border px-2.5 py-2"
          style={{
            backgroundColor: item.bg,
            borderColor: item.color,
            color: item.color,
          }}
        >
          <p className="text-[8px] font-semibold leading-tight">{item.label}</p>
          <p className="text-[7px] leading-snug mt-0.5 opacity-90">{item.message}</p>
        </div>
      ))}
      <div className="flex flex-wrap gap-1 pt-1">
        {items.map((item) => (
          <span
            key={`chip-${item.key}`}
            className="text-[6px] px-1.5 py-0.5 rounded-full border"
            style={{
              backgroundColor: item.bg,
              borderColor: item.color,
              color: item.color,
            }}
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
