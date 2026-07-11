export type DashboardLogoConfig = {
  enabled: boolean;
  /** 0.01 – 1 */
  opacity: number;
  /** Escala visual como % del área de la tarjeta (20–200) */
  size: number;
  /** Escala adicional (50–400, 100 = sin cambio) */
  zoom: number;
  /** 0 = izquierda, 50 = centro, 100 = derecha */
  positionX: number;
  /** 0 = arriba, 50 = centro, 100 = abajo */
  positionY: number;
};

export const DEFAULT_DASHBOARD_LOGO: DashboardLogoConfig = {
  enabled: false,
  opacity: 1,
  size: 85,
  zoom: 100,
  positionX: 50,
  positionY: 50,
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function normalizeDashboardLogo(
  raw: unknown,
  enabledFallback = false
): DashboardLogoConfig {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_DASHBOARD_LOGO, enabled: enabledFallback };
  }
  const row = raw as Partial<DashboardLogoConfig>;
  const opacity =
    typeof row.opacity === "number"
      ? clamp(row.opacity, 0.01, 1)
      : DEFAULT_DASHBOARD_LOGO.opacity;
  const size =
    typeof row.size === "number" ? clamp(row.size, 20, 200) : DEFAULT_DASHBOARD_LOGO.size;
  const zoom =
    typeof row.zoom === "number" ? clamp(row.zoom, 50, 400) : DEFAULT_DASHBOARD_LOGO.zoom;
  const positionX =
    typeof row.positionX === "number"
      ? clamp(row.positionX, 0, 100)
      : DEFAULT_DASHBOARD_LOGO.positionX;
  const positionY =
    typeof row.positionY === "number"
      ? clamp(row.positionY, 0, 100)
      : DEFAULT_DASHBOARD_LOGO.positionY;
  return {
    enabled: row.enabled === true || (row.enabled === undefined && enabledFallback),
    opacity,
    size,
    zoom,
    positionX,
    positionY,
  };
}

const BASE_INNER_HEIGHT = 116;
const CARD_PADDING = 48;

export type DashboardLogoLayout = {
  sizeScale: number;
  zoomScale: number;
  baseHeight: number;
  baseWidthPercent: number;
  outerMinHeight: number;
};

/** Tamaño = área base; zoom = escala visual del logo (la tarjeta crece para no recortar) */
export function dashboardLogoLayout(config: DashboardLogoConfig): DashboardLogoLayout {
  const sizeScale = config.size / 100;
  const zoomScale = config.zoom / 100;
  const baseHeight = Math.round(BASE_INNER_HEIGHT * sizeScale);
  const baseWidthPercent = Math.min(100, config.size);
  const outerMinHeight = Math.round(baseHeight * zoomScale) + CARD_PADDING;
  return {
    sizeScale,
    zoomScale,
    baseHeight,
    baseWidthPercent,
    outerMinHeight,
  };
}

export function dashboardLogoImageStyle(config: DashboardLogoConfig): {
  left: string;
  top: string;
  transform: string;
  opacity: number;
  width: string;
  height: string;
  objectFit: "contain";
} {
  return {
    left: `${config.positionX}%`,
    top: `${config.positionY}%`,
    transform: `translate(-50%, -50%) scale(${config.zoom / 100})`,
    opacity: config.opacity,
    width: "100%",
    height: "100%",
    objectFit: "contain",
  };
}
