import { useWorkspaceWatermarkContext } from "../contexts/workspace-watermark-context";

/** Marca de agua del `<main>`; datos compartidos vía contexto. */
export function useMainWorkspaceWatermark() {
  const { config, displayImage } = useWorkspaceWatermarkContext();
  const visible = config.enabled && Boolean(displayImage);

  return {
    visible,
    image: displayImage,
    opacity: config.opacity,
    size: config.size,
    zoom: config.zoom,
    positionX: config.positionX,
    positionY: config.positionY,
  };
}
