import type { PaletteMode } from "../../types/color-palette";
import { contrastForeground } from "../../lib/color-utils";
import { useLanguage } from "../../contexts/language-context";

interface PalettePreviewMockupProps {
  mode: PaletteMode;
  className?: string;
}

/** Miniatura de la interfaz con la paleta aplicada. */
export function PalettePreviewMockup({ mode, className = "" }: PalettePreviewMockupProps) {
  const { t } = useLanguage();
  const ui = t.settings.palettePreviewUi;
  const sidebarFg = contrastForeground(mode.sidebar);
  const primaryFg = contrastForeground(mode.primary);
  const activeFg = contrastForeground(mode.surface);

  return (
    <div
      className={`rounded-xl border border-brand-border overflow-hidden ${className}`}
      style={{ backgroundColor: mode.canvas }}
    >
      <div className="flex h-36">
        <div
          className="w-16 shrink-0 flex flex-col p-2 gap-1"
          style={{ backgroundColor: mode.sidebar, color: sidebarFg }}
        >
          <div className="text-[8px] font-light opacity-80">{ui.brandShort}</div>
          <div
            className="text-[7px] px-1 py-0.5 rounded"
            style={{ backgroundColor: mode.surface, color: activeFg }}
          >
            {ui.home}
          </div>
          <div className="text-[7px] px-1 py-0.5 opacity-70">{ui.patients}</div>
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div
            className="h-6 flex items-center px-2 text-[8px] font-medium border-b"
            style={{
              backgroundColor: mode.surface,
              color: mode.primary,
              borderColor: mode.border,
            }}
          >
            {ui.preview}
          </div>
          <div className="flex-1 p-2 space-y-1.5">
            <div
              className="rounded-lg border p-2"
              style={{
                backgroundColor: mode.surface,
                borderColor: mode.border,
                color: mode.primary,
              }}
            >
              <p className="text-[8px] font-semibold">{ui.sampleCard}</p>
              <p className="text-[7px]" style={{ color: mode.muted }}>
                {ui.secondaryText}
              </p>
              <button
                type="button"
                className="mt-1 text-[7px] px-2 py-0.5 rounded"
                style={{ backgroundColor: mode.primary, color: primaryFg }}
              >
                {ui.action}
              </button>
            </div>
            <div className="flex gap-1">
              <span
                className="text-[6px] px-1 py-0.5 rounded"
                style={{ backgroundColor: mode.primary, color: primaryFg }}
              >
                {ui.button}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
