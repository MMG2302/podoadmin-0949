/** Tokens de paleta personalizable (marca + semánticos). */

export type PaletteTokenId =
  | "sidebar"
  | "primary"
  | "primaryHover"
  | "canvas"
  | "surface"
  | "muted"
  | "border"
  | "error"
  | "errorBg"
  | "warning"
  | "warningBg"
  | "success"
  | "successBg"
  | "info"
  | "infoBg";

export type PaletteMode = Record<PaletteTokenId, string>;

export interface PaletteSettings {
  light: PaletteMode;
  dark: PaletteMode;
}

/** Mapeo token → variable CSS en documento. */
export const PALETTE_TOKEN_CSS_VAR: Record<PaletteTokenId, string> = {
  sidebar: "--brand-sidebar",
  primary: "--brand-ink",
  primaryHover: "--brand-ink-hover",
  canvas: "--brand-canvas",
  surface: "--brand-surface",
  muted: "--brand-muted",
  border: "--brand-border",
  error: "--semantic-error",
  errorBg: "--semantic-error-bg",
  warning: "--semantic-warning",
  warningBg: "--semantic-warning-bg",
  success: "--semantic-success",
  successBg: "--semantic-success-bg",
  info: "--semantic-info",
  infoBg: "--semantic-info-bg",
};

export const PALETTE_TOKEN_IDS = Object.keys(PALETTE_TOKEN_CSS_VAR) as PaletteTokenId[];

export const DEFAULT_PALETTE_LIGHT: PaletteMode = {
  sidebar: "#1a1a1a",
  primary: "#1a1a1a",
  primaryHover: "#2a2a2a",
  canvas: "#f9fafb",
  surface: "#ffffff",
  muted: "#6b7280",
  border: "#e5e7eb",
  error: "#dc2626",
  errorBg: "#fef2f2",
  warning: "#92400e",
  warningBg: "#fffbeb",
  success: "#16a34a",
  successBg: "#f0fdf4",
  info: "#2563eb",
  infoBg: "#eff6ff",
};

export const DEFAULT_PALETTE_DARK: PaletteMode = {
  sidebar: "#1a1a1a",
  primary: "#ffffff",
  primaryHover: "#e5e7eb",
  canvas: "#030712",
  surface: "#111827",
  muted: "#9ca3af",
  border: "#374151",
  error: "#fca5a5",
  errorBg: "#450a0a",
  warning: "#fde68a",
  warningBg: "#451a03",
  success: "#4ade80",
  successBg: "#14532d",
  info: "#93c5fd",
  infoBg: "#1e3a5f",
};

export const DEFAULT_PALETTE_SETTINGS: PaletteSettings = {
  light: { ...DEFAULT_PALETTE_LIGHT },
  dark: { ...DEFAULT_PALETTE_DARK },
};

/** 48 colores básicos estilo Paint (8×6). */
export const PAINT_BASIC_COLORS: readonly string[] = [
  "#000000", "#7f7f7f", "#880015", "#ed1c24", "#ff7f27", "#fff200", "#22b14c", "#00a2e8",
  "#3f48cc", "#a349a4", "#ffffff", "#c3c3c3", "#b97a57", "#ffaec9", "#ffc90e", "#efe4b0",
  "#b5e61d", "#99d9ea", "#7092be", "#c8bfe7", "#000000", "#808080", "#800000", "#ff0000",
  "#ff8000", "#ffff00", "#008000", "#008080",
  "#000080", "#800080", "#808080", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ffff00",
  "#00ffff", "#ff00ff", "#c0c0c0", "#808080", "#800000", "#808000", "#008000", "#008080",
  "#000080", "#800080", "#808080", "#ffffff",
];

export const CUSTOM_SWATCH_COUNT = 16;

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function normalizeHex(value: string): string | null {
  const trimmed = value.trim();
  if (!HEX_RE.test(trimmed)) return null;
  if (trimmed.length === 4) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return trimmed.toLowerCase();
}

export function isValidHex(value: string): boolean {
  return normalizeHex(value) !== null;
}

export function mergePaletteMode(
  partial: Partial<PaletteMode> | undefined,
  defaults: PaletteMode,
): PaletteMode {
  const out = { ...defaults };
  if (!partial) return out;
  for (const id of PALETTE_TOKEN_IDS) {
    const v = partial[id];
    if (v && isValidHex(v)) out[id] = normalizeHex(v)!;
  }
  return out;
}

export function normalizePaletteSettings(raw: unknown): PaletteSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_PALETTE_SETTINGS;
  const obj = raw as Partial<PaletteSettings>;
  return {
    light: mergePaletteMode(obj.light, DEFAULT_PALETTE_LIGHT),
    dark: mergePaletteMode(obj.dark, DEFAULT_PALETTE_DARK),
  };
}
