import {
  semanticAlertErrorClass,
  semanticAlertInfoClass,
  semanticAlertSuccessClass,
  semanticAlertWarningClass,
  semanticChipErrorClass,
  semanticChipInfoClass,
  semanticChipSuccessClass,
  semanticChipWarningClass,
} from "../../lib/form-field-classes";

interface PaletteSemanticPreviewMockupProps {
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

/** Vista previa de alertas semánticas con las mismas clases que el resto de la app. */
export function PaletteSemanticPreviewMockup({
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
    { key: "error" as const, label: labels.error, message: messages.error, box: semanticAlertErrorClass, chip: semanticChipErrorClass },
    { key: "warning" as const, label: labels.warning, message: messages.warning, box: semanticAlertWarningClass, chip: semanticChipWarningClass },
    { key: "success" as const, label: labels.success, message: messages.success, box: semanticAlertSuccessClass, chip: semanticChipSuccessClass },
    { key: "info" as const, label: labels.info, message: messages.info, box: semanticAlertInfoClass, chip: semanticChipInfoClass },
  ];

  return (
    <div className={`rounded-xl border border-brand-border overflow-hidden p-3 space-y-2 bg-brand-canvas ${className}`}>
      {items.map((item) => (
        <div key={item.key} className={`${item.box} !px-2.5 !py-2`}>
          <p className="text-[8px] font-semibold leading-tight">{item.label}</p>
          <p className="text-[7px] leading-snug mt-0.5 opacity-90">{item.message}</p>
        </div>
      ))}
      <div className="flex flex-wrap gap-1 pt-1">
        {items.map((item) => (
          <span key={`chip-${item.key}`} className={`${item.chip} !text-[6px] !px-1.5 !py-0.5`}>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
