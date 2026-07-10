export type WorkspaceWatermarkSource = "custom" | "clinic_logo";

export type WorkspaceWatermarkConfig = {
  enabled: boolean;
  source: WorkspaceWatermarkSource;
  /** data URI cuando source === custom */
  image: string | null;
  /** 0.01 – 1 (1% – 100%) */
  opacity: number;
  /** Ancho base como % del panel (20–200) */
  size: number;
  /** Escala adicional (50–400, 100 = sin cambio) */
  zoom: number;
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
  zoom: 100,
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
    typeof row.opacity === "number"
      ? clamp(row.opacity, 0.01, 1)
      : DEFAULT_WORKSPACE_WATERMARK.opacity;
  const size =
    typeof row.size === "number" ? clamp(row.size, 20, 200) : DEFAULT_WORKSPACE_WATERMARK.size;
  const zoom =
    typeof row.zoom === "number" ? clamp(row.zoom, 50, 400) : DEFAULT_WORKSPACE_WATERMARK.zoom;
  const positionX =
    typeof row.positionX === "number"
      ? clamp(row.positionX, 0, 100)
      : DEFAULT_WORKSPACE_WATERMARK.positionX;
  const positionY =
    typeof row.positionY === "number"
      ? clamp(row.positionY, 0, 100)
      : DEFAULT_WORKSPACE_WATERMARK.positionY;
  const source = row.source === "clinic_logo" ? "clinic_logo" : "custom";
  const image =
    source === "clinic_logo"
      ? null
      : typeof row.image === "string" && row.image.trim()
        ? row.image.trim()
        : null;
  return {
    enabled: row.enabled === true,
    source,
    image,
    opacity,
    size,
    zoom,
    positionX,
    positionY,
  };
}

export function watermarkIsVisible(resolution: WorkspaceWatermarkResolution | null): boolean {
  if (!resolution?.config.enabled) return false;
  return Boolean(resolution.displayImage);
}
