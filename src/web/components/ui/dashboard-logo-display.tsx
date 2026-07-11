import { cn } from "@/lib/utils";
import {
  dashboardLogoImageStyle,
  dashboardLogoLayout,
  type DashboardLogoConfig,
} from "@/types/dashboard-logo";

interface DashboardLogoDisplayProps {
  logoUrl: string;
  config: DashboardLogoConfig;
  alt?: string;
  className?: string;
  preview?: boolean;
}

/** Logo en tarjeta del dashboard: tamaño = área base, zoom = escala del logo */
export function DashboardLogoDisplay({
  logoUrl,
  config,
  alt = "Logo",
  className,
  preview = false,
}: DashboardLogoDisplayProps) {
  const { baseHeight, baseWidthPercent, outerMinHeight } = dashboardLogoLayout(config);

  return (
    <div
      className={cn(
        "relative w-full rounded-xl border border-brand-border bg-brand-surface",
        preview && "max-w-xs",
        className
      )}
      style={{ minHeight: outerMinHeight }}
    >
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden p-6">
        <div
          className="relative mx-auto max-w-full"
          style={{
            width: `${baseWidthPercent}%`,
            height: baseHeight,
          }}
        >
          <img
            key={`${config.size}-${config.zoom}-${config.positionX}-${config.positionY}-${config.opacity}`}
            src={logoUrl}
            alt={alt}
            className="absolute select-none origin-center"
            style={dashboardLogoImageStyle(config)}
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
