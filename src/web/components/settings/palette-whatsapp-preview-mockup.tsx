import {
  whatsappButtonClass,
  whatsappMutedTextClass,
  whatsappPanelClass,
} from "../../lib/form-field-classes";

interface PaletteWhatsappPreviewMockupProps {
  className?: string;
  title?: string;
  description?: string;
  buttonLabel?: string;
}

/** Vista previa de panel y botón WhatsApp Web con tokens de paleta. */
export function PaletteWhatsappPreviewMockup({
  className = "",
  title = "WhatsApp Web",
  description = "Envía mensajes manualmente desde tu número.",
  buttonLabel = "Abrir WhatsApp Web",
}: PaletteWhatsappPreviewMockupProps) {
  return (
    <div className={`${whatsappPanelClass} !p-3 space-y-2 ${className}`}>
      <p className="text-[9px] font-semibold text-brand-ink leading-tight">{title}</p>
      <p className={`text-[7px] leading-snug opacity-90 ${whatsappMutedTextClass}`}>{description}</p>
      <button type="button" className={`${whatsappButtonClass} !px-2 !py-1 !text-[7px] pointer-events-none`}>
        {buttonLabel}
      </button>
    </div>
  );
}
