import { useEffect, useState } from "react";
import { api } from "../lib/api-client";
import {
  normalizeWorkspaceWatermark,
  type WorkspaceWatermarkConfig,
} from "../types/workspace-watermark";

type WatermarkState = {
  config: WorkspaceWatermarkConfig;
  displayImage: string | null;
};

const DEFAULT: WatermarkState = {
  config: normalizeWorkspaceWatermark(null),
  displayImage: null,
};

/** Marca de agua del `<main>`; se recarga al guardar en Configuración. */
export function useMainWorkspaceWatermark() {
  const [state, setState] = useState<WatermarkState>(DEFAULT);

  const reload = async () => {
    const res = await api.get<{
      success?: boolean;
      config?: WorkspaceWatermarkConfig;
      displayImage?: string | null;
    }>("/clinical/workspace-watermark");
    if (res.success && res.data?.config) {
      setState({
        config: normalizeWorkspaceWatermark(res.data.config),
        displayImage: res.data.displayImage ?? null,
      });
    } else {
      setState(DEFAULT);
    }
  };

  useEffect(() => {
    void reload();
    const onUpdate = () => void reload();
    window.addEventListener("workspace-watermark:updated", onUpdate);
    return () => window.removeEventListener("workspace-watermark:updated", onUpdate);
  }, []);

  const visible = state.config.enabled && Boolean(state.displayImage);

  return {
    visible,
    image: state.displayImage,
    opacity: state.config.opacity,
    size: state.config.size,
    positionX: state.config.positionX,
    positionY: state.config.positionY,
  };
}
