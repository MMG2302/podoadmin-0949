import { useWorkspaceWatermarkContext } from "../contexts/workspace-watermark-context";

export function useWorkspaceWatermark() {
  const { config, displayImage, scope, canEdit, loading, reload } = useWorkspaceWatermarkContext();
  return { config, displayImage, scope, canEdit, loading, reload: () => reload(true) };
}

export { saveWorkspaceWatermark } from "../contexts/workspace-watermark-context";
