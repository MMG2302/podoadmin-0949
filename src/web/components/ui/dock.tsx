"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DockContextValue {
  mouseX: number | null;
  dockRef: React.RefObject<HTMLDivElement | null>;
  iconMagnification: number;
  iconDistance: number;
}

const DockContext = React.createContext<DockContextValue | null>(null);

const useDock = () => {
  const ctx = React.useContext(DockContext);
  if (!ctx) throw new Error("DockIcon must be used within Dock");
  return ctx;
};

interface DockProps {
  children: React.ReactNode;
  className?: string;
  iconMagnification?: number;
  iconDistance?: number;
}

export const Dock = ({
  children,
  className,
  iconMagnification = 50,
  iconDistance = 80,
}: DockProps) => {
  const dockRef = React.useRef<HTMLDivElement>(null);
  const [mouseX, setMouseX] = React.useState<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = dockRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMouseX(e.clientX - rect.left);
  };

  const handleMouseLeave = () => setMouseX(null);

  return (
    <DockContext.Provider
      value={{ mouseX, dockRef, iconMagnification, iconDistance }}
    >
      <div
        ref={dockRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "flex items-center justify-center gap-1 p-1.5 rounded-xl",
          "bg-black/5 dark:bg-white/5 backdrop-blur-sm",
          "transition-[height,width] duration-300 ease-out",
          className
        )}
      >
        {children}
      </div>
    </DockContext.Provider>
  );
};

interface DockIconProps {
  children: React.ReactNode;
  className?: string;
}

export const DockIcon = ({ children, className }: DockIconProps) => {
  const iconRef = React.useRef<HTMLDivElement>(null);
  const { mouseX, dockRef, iconMagnification, iconDistance } = useDock();
  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    if (mouseX === null) {
      setScale(1);
      return;
    }
    const icon = iconRef.current;
    const dock = dockRef.current;
    if (!icon || !dock) return;

    const rect = icon.getBoundingClientRect();
    const dockRect = dock.getBoundingClientRect();
    const iconCenterX = rect.left - dockRect.left + rect.width / 2;
    const distance = Math.abs(mouseX - iconCenterX);

    // Scale: 1 at distance >= iconDistance, up to iconMagnification/100 at distance 0
    const magnifiedScale = iconMagnification / 100;
    if (distance >= iconDistance) {
      setScale(1);
    } else {
      const range = iconDistance;
      const factor = 1 - distance / range;
      const s = 1 + factor * (magnifiedScale - 1);
      setScale(Math.max(1, Math.min(magnifiedScale, s)));
    }
  }, [mouseX, iconMagnification, iconDistance, dockRef]);

  const size = 36;
  const padding = Math.max(6, size * 0.2);

  return (
    <div
      ref={iconRef}
      className={cn(
        "flex items-center justify-center rounded-full shrink-0 overflow-visible",
        "bg-black/10 dark:bg-white/10",
        "transition-transform duration-150 ease-out",
        "hover:bg-black/15 dark:hover:bg-white/15",
        className
      )}
      style={{
        width: size + padding * 2,
        height: size + padding * 2,
        transform: `scale(${scale})`,
        transformOrigin: "center center",
      }}
    >
      <div className="flex items-center justify-center w-full h-full">
        {children}
      </div>
    </div>
  );
};
