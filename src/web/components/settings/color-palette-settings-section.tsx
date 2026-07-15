import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLanguage } from "../../contexts/language-context";
import {
  type PaletteMode,
  type PaletteSettings,
  type PaletteTokenId,
  normalizePaletteSettings,
} from "../../types/color-palette";
import {
  applyPaletteStyles,
  buildPaletteStylesheet,
  getPaletteSectionsState,
  getPaletteSettings,
  resetAllPalette,
  resetPaletteMode,
  savePaletteSectionOpen,
  savePaletteSettings,
} from "../../lib/palette-preferences";
import { PaintColorPicker } from "./paint-color-picker";
import { PalettePreviewMockup } from "./palette-preview-mockup";
import { PaletteSemanticPreviewMockup } from "./palette-semantic-preview-mockup";
import { PaletteWhatsappPreviewMockup } from "./palette-whatsapp-preview-mockup";

type EditMode = "light" | "dark";

interface PaletteCollapsibleGroupProps {
  title: string;
  previewTitle: string;
  open: boolean;
  onToggle: () => void;
  tokenIds: PaletteTokenId[];
  tokenLabels: Record<PaletteTokenId, string>;
  previewMode: PaletteMode;
  preview: ReactNode;
  onPickToken: (id: PaletteTokenId) => void;
  changeColorLabel: string;
}

function PaletteCollapsibleGroup({
  title,
  previewTitle,
  open,
  onToggle,
  tokenIds,
  tokenLabels,
  previewMode,
  preview,
  onPickToken,
  changeColorLabel,
}: PaletteCollapsibleGroupProps) {
  return (
    <section className="rounded-xl border border-brand-border overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-brand-canvas hover:bg-brand-border/20 transition-colors text-left"
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-ink">
          {title}
        </span>
        <svg
          className={`w-4 h-4 shrink-0 text-brand-muted transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6 border-t border-brand-border">
          <ul className="space-y-2">
            {tokenIds.map((id) => (
              <li key={id} className="flex items-center gap-3">
                <span className="flex-1 text-sm text-brand-ink">{tokenLabels[id]}</span>
                <button
                  type="button"
                  className="w-8 h-8 rounded border border-brand-border shrink-0 hover:ring-2 hover:ring-brand-ink/30"
                  style={{ backgroundColor: previewMode[id] }}
                  title={previewMode[id]}
                  onClick={() => onPickToken(id)}
                />
                <button
                  type="button"
                  className="text-xs text-brand-muted hover:text-brand-ink underline"
                  onClick={() => onPickToken(id)}
                >
                  {changeColorLabel}
                </button>
              </li>
            ))}
          </ul>

          <div className="lg:sticky lg:top-4 self-start">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted mb-2">
              {previewTitle}
            </p>
            {preview}
          </div>
        </div>
      )}
    </section>
  );
}

export function ColorPaletteSettingsSection() {
  const { t } = useLanguage();
  const [editMode, setEditMode] = useState<EditMode>("light");
  const [draft, setDraft] = useState<PaletteSettings>(() => getPaletteSettings());
  const [pickerToken, setPickerToken] = useState<PaletteTokenId | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [brandOpen, setBrandOpen] = useState(() => getPaletteSectionsState().brand);
  const [semanticOpen, setSemanticOpen] = useState(() => getPaletteSectionsState().semantic);
  const [whatsappOpen, setWhatsappOpen] = useState(() => getPaletteSectionsState().whatsapp);

  const toggleBrand = () => {
    setBrandOpen((v) => {
      const next = !v;
      savePaletteSectionOpen("brand", next);
      return next;
    });
  };

  const toggleSemantic = () => {
    setSemanticOpen((v) => {
      const next = !v;
      savePaletteSectionOpen("semantic", next);
      return next;
    });
  };

  const toggleWhatsapp = () => {
    setWhatsappOpen((v) => {
      const next = !v;
      savePaletteSectionOpen("whatsapp", next);
      return next;
    });
  };

  const tokenLabels = t.settings.paletteTokens;
  const previewMode = draft[editMode];

  const brandTokenIds = useMemo(
    () =>
      ["sidebar", "primary", "primaryHover", "canvas", "surface", "muted", "border"] as PaletteTokenId[],
    [],
  );
  const semanticTokenIds = useMemo(
    () =>
      ["error", "errorBg", "warning", "warningBg", "success", "successBg", "info", "infoBg"] as PaletteTokenId[],
    [],
  );
  const whatsappTokenIds = useMemo(
    () => ["whatsapp", "whatsappBg", "whatsappBorder", "whatsappMuted"] as PaletteTokenId[],
    [],
  );

  const applyDraftPreview = useCallback((settings: PaletteSettings) => {
    let el = document.getElementById("podoadmin-palette-preview") as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = "podoadmin-palette-preview";
    }
    el.textContent = buildPaletteStylesheet(settings);
    document.head.appendChild(el);
  }, []);

  // Vista previa en vivo: no restaurar localStorage en cada cambio de draft
  // (evita que al guardar se pisen los tokens semánticos con valores antiguos).
  useEffect(() => {
    applyDraftPreview(draft);
    return () => {
      document.getElementById("podoadmin-palette-preview")?.remove();
    };
  }, [draft, applyDraftPreview]);

  useEffect(() => {
    return () => {
      document.getElementById("podoadmin-palette-preview")?.remove();
      applyPaletteStyles();
    };
  }, []);

  const handleColorAccept = (hex: string) => {
    if (!pickerToken) return;
    setDraft((prev) => ({
      ...prev,
      [editMode]: { ...prev[editMode], [pickerToken]: hex },
    }));
    setPickerToken(null);
  };

  const handleSave = () => {
    const normalized = normalizePaletteSettings(draft);
    savePaletteSettings(normalized);
    setDraft(normalized);
    // Tras guardar, quitar la capa de preview: la paleta persistida ya está activa.
    document.getElementById("podoadmin-palette-preview")?.remove();
    setMessage(t.settings.settingsSaved);
    setTimeout(() => setMessage(null), 2500);
  };

  const handleResetMode = () => {
    const next = resetPaletteMode(editMode);
    setDraft(next);
  };

  const handleResetAll = () => {
    const next = resetAllPalette();
    setDraft(next);
  };

  return (
    <div className="surface-card p-6">
      <h3 className="text-lg font-semibold text-brand-ink mb-1">{t.settings.appearance}</h3>
      <p className="text-sm text-brand-muted mb-4">{t.settings.paletteHint}</p>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setEditMode("light")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            editMode === "light"
              ? "bg-brand-ink text-brand-ink-fg"
              : "bg-brand-canvas text-brand-ink hover:bg-brand-border/30"
          }`}
        >
          {t.settings.lightMode}
        </button>
        <button
          type="button"
          onClick={() => setEditMode("dark")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            editMode === "dark"
              ? "bg-brand-ink text-brand-ink-fg"
              : "bg-brand-canvas text-brand-ink hover:bg-brand-border/30"
          }`}
        >
          {t.settings.darkMode}
        </button>
      </div>

      <div className="space-y-4 mb-6">
        <PaletteCollapsibleGroup
          title={t.settings.paletteGroupBrand}
          previewTitle={t.settings.palettePreviewBrand}
          open={brandOpen}
          onToggle={toggleBrand}
          tokenIds={brandTokenIds}
          tokenLabels={tokenLabels}
          previewMode={previewMode}
          onPickToken={setPickerToken}
          changeColorLabel={t.settings.changeColor}
          preview={<PalettePreviewMockup mode={previewMode} />}
        />

        <PaletteCollapsibleGroup
          title={t.settings.paletteGroupSemantic}
          previewTitle={t.settings.palettePreviewSemantic}
          open={semanticOpen}
          onToggle={toggleSemantic}
          tokenIds={semanticTokenIds}
          tokenLabels={tokenLabels}
          previewMode={previewMode}
          onPickToken={setPickerToken}
          changeColorLabel={t.settings.changeColor}
          preview={
            <PaletteSemanticPreviewMockup
              labels={t.settings.palettePreviewLabels}
              messages={t.settings.palettePreviewMessages}
            />
          }
        />

        <PaletteCollapsibleGroup
          title={t.settings.paletteGroupWhatsapp}
          previewTitle={t.settings.palettePreviewWhatsapp}
          open={whatsappOpen}
          onToggle={toggleWhatsapp}
          tokenIds={whatsappTokenIds}
          tokenLabels={tokenLabels}
          previewMode={previewMode}
          onPickToken={setPickerToken}
          changeColorLabel={t.settings.changeColor}
          preview={
            <PaletteWhatsappPreviewMockup
              title={t.settings.paletteGroupWhatsapp}
              description={t.settings.paletteWhatsappPreviewDesc}
              buttonLabel={t.settings.paletteTokens.whatsapp}
            />
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-brand-border">
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium bg-brand-ink text-brand-ink-fg rounded-lg hover:bg-brand-ink-hover"
        >
          {t.settings.saveSettings}
        </button>
        <button
          type="button"
          onClick={handleResetMode}
          className="px-4 py-2 text-sm border border-brand-border rounded-lg hover:bg-brand-canvas text-brand-ink"
        >
          {t.settings.resetPaletteMode}
        </button>
        <button
          type="button"
          onClick={handleResetAll}
          className="px-4 py-2 text-sm border border-brand-border rounded-lg hover:bg-brand-canvas text-brand-muted"
        >
          {t.settings.resetPaletteAll}
        </button>
        {message && <span className="text-sm text-semantic-success">{message}</span>}
      </div>

      {pickerToken && (
        <PaintColorPicker
          value={previewMode[pickerToken]}
          onAccept={handleColorAccept}
          onCancel={() => setPickerToken(null)}
        />
      )}
    </div>
  );
}

export type { PaletteMode, PaletteSettings };
