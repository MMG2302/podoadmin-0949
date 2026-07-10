import { api } from "./api-client";
import type { ClinicalStatsMap, Patient } from "../types/clinical";

export async function fetchClinicalStats(): Promise<ClinicalStatsMap> {
  const res = await api.get<{ success?: boolean; stats?: ClinicalStatsMap }>("/users/clinical-stats");
  if (res.success && res.data?.stats) return res.data.stats;
  return {};
}

export async function transferClinicalHistory(
  sourceUserId: string,
  targetUserId: string
): Promise<{ success: boolean; message?: string; patientsTransferred?: number; error?: string }> {
  const res = await api.post<{
    success?: boolean;
    message?: string;
    patientsTransferred?: number;
    error?: string;
  }>("/users/transfer-clinical-history", { sourceUserId, targetUserId });
  if (res.success && res.data?.success) {
    return {
      success: true,
      message: res.data.message,
      patientsTransferred: res.data.patientsTransferred,
    };
  }
  return { success: false, error: res.error || res.data?.message || "Error al transferir" };
}

export interface ClinicalProfileResponse {
  patientCount: number;
  sessionCount: number;
  patients: Patient[];
}

export async function fetchUserClinicalProfile(
  userId: string
): Promise<ClinicalProfileResponse | null> {
  const res = await api.get<{
    success?: boolean;
    patientCount?: number;
    sessionCount?: number;
    patients?: Patient[];
  }>(`/users/${encodeURIComponent(userId)}/clinical-profile`);
  if (res.success && res.data?.success) {
    return {
      patientCount: res.data.patientCount ?? 0,
      sessionCount: res.data.sessionCount ?? 0,
      patients: res.data.patients ?? [],
    };
  }
  return null;
}

export async function downloadUserClinicalExport(userId: string, fileName?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(userId)}/clinical-export`, {
      credentials: "include",
    });
    if (!res.ok) return false;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName ?? `user_${userId}_clinical_history.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}