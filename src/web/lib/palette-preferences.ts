/** Persistencia y aplicación global de la paleta de colores. */

import {
  CUSTOM_SWATCH_COUNT,
  DEFAULT_PALETTE_SETTINGS,
  PALETTE_TOKEN_CSS_VAR,
  PALETTE_TOKEN_IDS,
  type PaletteMode,
  type PaletteSettings,
  normalizePaletteSettings,
} from "../types/color-palette";
import { contrastForeground } from "./color-utils";

const PALETTE_KEY = "podoadmin_palette";
const SWATCHES_KEY = "podoadmin_palette_swatches";
const SECTIONS_KEY = "podoadmin_palette_sections";
const STYLE_ID = "podoadmin-palette";

export type PaletteSectionId = "brand" | "semantic";

export type PaletteSectionsState = Record<PaletteSectionId, boolean>;

const DEFAULT_PALETTE_SECTIONS: PaletteSectionsState = {
  brand: true,
  semantic: true,
};

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* private mode */
    }
  },
};

function modeToCssVars(mode: PaletteMode): string {
  const lines: string[] = [];
  for (const id of PALETTE_TOKEN_IDS) {
    lines.push(`${PALETTE_TOKEN_CSS_VAR[id]}: ${mode[id]};`);
  }
  lines.push(`--brand-sidebar-fg: ${contrastForeground(mode.sidebar)};`);
  lines.push(`--brand-ink-fg: ${contrastForeground(mode.primary)};`);
  lines.push(`--brand-sidebar-active-bg: ${mode.surface};`);
  lines.push(`--brand-sidebar-active-fg: ${contrastForeground(mode.surface)};`);
  return lines.join("\n  ");
}

export function buildPaletteStylesheet(settings: PaletteSettings): string {
  return `:root {\n  ${modeToCssVars(settings.light)}\n}\n.dark {\n  ${modeToCssVars(settings.dark)}\n}`;
}

export function applyPaletteStyles(settings?: PaletteSettings): void {
  const palette = settings ?? getPaletteSettings();
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = buildPaletteStylesheet(palette);
}

export function getPaletteSettings(): PaletteSettings {
  const raw = safeStorage.getItem(PALETTE_KEY);
  if (!raw) return DEFAULT_PALETTE_SETTINGS;
  try {
    return normalizePaletteSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_PALETTE_SETTINGS;
  }
}

export function savePaletteSettings(settings: PaletteSettings): void {
  safeStorage.setItem(PALETTE_KEY, JSON.stringify(settings));
  applyPaletteStyles(settings);
  window.dispatchEvent(new CustomEvent("palette:updated", { detail: settings }));
}

export function getPaletteSectionsState(): PaletteSectionsState {
  const raw = safeStorage.getItem(SECTIONS_KEY);
  if (!raw) return { ...DEFAULT_PALETTE_SECTIONS };
  try {
    const parsed = JSON.parse(raw) as Partial<PaletteSectionsState>;
    return {
      brand: typeof parsed.brand === "boolean" ? parsed.brand : DEFAULT_PALETTE_SECTIONS.brand,
      semantic:
        typeof parsed.semantic === "boolean" ? parsed.semantic : DEFAULT_PALETTE_SECTIONS.semantic,
    };
  } catch {
    return { ...DEFAULT_PALETTE_SECTIONS };
  }
}

export function savePaletteSectionOpen(id: PaletteSectionId, open: boolean): void {
  const next = { ...getPaletteSectionsState(), [id]: open };
  safeStorage.setItem(SECTIONS_KEY, JSON.stringify(next));
}

export function resetPaletteMode(mode: "light" | "dark"): PaletteSettings {
  const current = getPaletteSettings();
  const next: PaletteSettings = {
    ...current,
    [mode]: { ...DEFAULT_PALETTE_SETTINGS[mode] },
  };
  savePaletteSettings(next);
  return next;
}

export function resetAllPalette(): PaletteSettings {
  savePaletteSettings(DEFAULT_PALETTE_SETTINGS);
  return DEFAULT_PALETTE_SETTINGS;
}

export function getCustomSwatches(): string[] {
  const raw = safeStorage.getItem(SWATCHES_KEY);
  if (!raw) return Array(CUSTOM_SWATCH_COUNT).fill("#ffffff") as string[];
  try {
    const arr = JSON.parse(raw) as string[];
    if (!Array.isArray(arr)) return Array(CUSTOM_SWATCH_COUNT).fill("#ffffff") as string[];
    return Array.from({ length: CUSTOM_SWATCH_COUNT }, (_, i) => arr[i] ?? "#ffffff");
  } catch {
    return Array(CUSTOM_SWATCH_COUNT).fill("#ffffff") as string[];
  }
}

export function saveCustomSwatches(swatches: string[]): void {
  safeStorage.setItem(SWATCHES_KEY, JSON.stringify(swatches.slice(0, CUSTOM_SWATCH_COUNT)));
  window.dispatchEvent(new CustomEvent("palette:swatches-updated"));
}

export function addToCustomSwatches(hex: string, slot?: number): string[] {
  const swatches = getCustomSwatches();
  const idx = slot ?? swatches.findIndex((s) => s === "#ffffff" || !s);
  const target = idx >= 0 ? idx : 0;
  swatches[target] = hex;
  saveCustomSwatches(swatches);
  return swatches;
}

export function getBrandCssVar(varName: string, fallback = ""): string {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return v || fallback;
}
