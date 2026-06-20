export type WorkspaceWatermarkSource = "custom" | "clinic_logo";

export type WorkspaceWatermarkConfig = {
  enabled: boolean;
  source: WorkspaceWatermarkSource;
  /** data URI cuando source === custom */
  image: string | null;
  /** 0.04 – 0.22 */
  opacity: number;
  /** Ancho máximo como % del panel (20–100) */
  size: number;
  /** 0 = izquierda, 50 = centro, 100 = derecha */
  positionX: number;
  /** 0 = arriba, 50 = centro, 100 = abajo */
  positionY: number;
};

export type WorkspaceWatermarkResolution = {
  config: WorkspaceWatermarkConfig;
  /** Imagen resuelta para mostrar (custom o logo de clínica/profesional) */
  displayImage: string | null;
  scope: "clinic" | "professional";
  scopeId: string;
  canEdit: boolean;
};

export const DEFAULT_WORKSPACE_WATERMARK: WorkspaceWatermarkConfig = {
  enabled: false,
  source: "custom",
  image: null,
  opacity: 0.08,
  size: 72,
  positionX: 50,
  positionY: 50,
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function normalizeWorkspaceWatermark(raw: unknown): WorkspaceWatermarkConfig {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_WORKSPACE_WATERMARK };
  const row = raw as Partial<WorkspaceWatermarkConfig>;
  const opacity =
    typeof row.opacity === "number" && row.opacity >= 0.03 && row.opacity <= 0.3
      ? row.opacity
      : DEFAULT_WORKSPACE_WATERMARK.opacity;
  const size =
    typeof row.size === "number" ? clamp(row.size, 20, 100) : DEFAULT_WORKSPACE_WATERMARK.size;
  const positionX =
    typeof row.positionX === "number"
      ? clamp(row.positionX, 0, 100)
      : DEFAULT_WORKSPACE_WATERMARK.positionX;
  const positionY =
    typeof row.positionY === "number"
      ? clamp(row.positionY, 0, 100)
      : DEFAULT_WORKSPACE_WATERMARK.positionY;
  return {
    enabled: row.enabled === true,
    source: row.source === "clinic_logo" ? "clinic_logo" : "custom",
    image: typeof row.image === "string" && row.image.trim() ? row.image.trim() : null,
    opacity,
    size,
    positionX,
    positionY,
  };
}

export function watermarkIsVisible(resolution: WorkspaceWatermarkResolution | null): boolean {
  if (!resolution?.config.enabled) return false;
  return Boolean(resolution.displayImage);
}
