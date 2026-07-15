import {
  whatsappButtonClass,
  whatsappMutedTextClass,
  whatsappPanelClass,
} from "../../lib/form-field-classes";
import { useLanguage } from "../../contexts/language-context";

interface PaletteWhatsappPreviewMockupProps {
  className?: string;
  title?: string;
  description?: string;
  buttonLabel?: string;
}

/** Vista previa de panel y botón WhatsApp Web con tokens de paleta. */
export function PaletteWhatsappPreviewMockup({
  className = "",
  title,
  description,
  buttonLabel,
}: PaletteWhatsappPreviewMockupProps) {
  const { t } = useLanguage();
  const resolvedTitle = title ?? t.settings.paletteGroupWhatsapp;
  const resolvedDescription = description ?? t.settings.paletteWhatsappPreviewDesc;
  const resolvedButton = buttonLabel ?? t.settings.paletteTokens.whatsapp;

  return (
    <div className={`${whatsappPanelClass} !p-3 space-y-2 ${className}`}>
      <p className="text-[9px] font-semibold text-brand-ink leading-tight">{resolvedTitle}</p>
      <p className={`text-[7px] leading-snug opacity-90 ${whatsappMutedTextClass}`}>{resolvedDescription}</p>
      <button type="button" className={`${whatsappButtonClass} !px-2 !py-1 !text-[7px] pointer-events-none`}>
        {resolvedButton}
      </button>
    </div>
  );
}
