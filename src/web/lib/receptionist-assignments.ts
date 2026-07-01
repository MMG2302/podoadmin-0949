import type { User } from '../contexts/auth-context';
import { api } from './api-client';

const ASSIGNMENTS_FETCH_TIMEOUT_MS = 8_000;

/** Carga podólogos asignados desde la API (fuente de verdad para recepcionistas). */
export async function fetchReceptionistAssignedPodiatristIds(
  receptionistUserId: string
): Promise<string[]> {
  try {
    const res = await Promise.race([
      api.get<{ success?: boolean; assignedPodiatristIds?: string[] }>(
        `/receptionists/assigned-podiatrists/${receptionistUserId}`
      ),
      new Promise<{ success: false }>((resolve) => {
        setTimeout(() => resolve({ success: false }), ASSIGNMENTS_FETCH_TIMEOUT_MS);
      }),
    ]);
    if (res.success && Array.isArray(res.data?.assignedPodiatristIds)) {
      return res.data.assignedPodiatristIds;
    }
  } catch {
    /* red / servidor caído */
  }
  return [];
}

export async function hydrateReceptionistUser(user: User): Promise<User> {
  if (user.role !== 'receptionist' || !user.id) return user;
  const assignedPodiatristIds = await fetchReceptionistAssignedPodiatristIds(user.id);
  return { ...user, assignedPodiatristIds };
}

/** Actualiza asignaciones en segundo plano sin bloquear la UI. */
export function refreshReceptionistAssignmentsInBackground(
  user: User,
  onUpdate: (hydrated: User) => void
): void {
  if (user.role !== 'receptionist' || !user.id) return;
  void hydrateReceptionistUser(user).then(onUpdate).catch(() => {
    /* mantener sesión actual */
  });
}
