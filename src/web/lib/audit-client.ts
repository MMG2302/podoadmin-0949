import { api } from "./api-client";

export async function postAuditLog(input: {
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  await api.post("/audit-logs", input);
}
