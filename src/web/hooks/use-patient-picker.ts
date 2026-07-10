import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api-client';
import { fetchAllClinicalPages } from '../lib/clinical-list-fetch';
import type { Patient } from '../types/clinical';

/** A partir de este número de pacientes se usa búsqueda indexada en lugar del &lt;select&gt;. */
export const PATIENT_SEARCH_SELECT_THRESHOLD = 15;

/** Búsqueda paginada de pacientes (nombre, email, teléfono, DNI…). */
export async function searchPatients(query: string, limit = 25): Promise<Patient[]> {
  const params = new URLSearchParams({ limit: String(limit), offset: '0' });
  const q = query.trim();
  if (q) params.set('q', q);
  const res = await api.get<{ success?: boolean; patients?: Patient[] }>(`/patients?${params}`);
  if (res.success && Array.isArray(res.data?.patients)) return res.data.patients;
  return [];
}

/** Carga una página inicial para decidir select clásico vs búsqueda. */
export async function fetchPatientPickerSample(limit = PATIENT_SEARCH_SELECT_THRESHOLD + 1): Promise<{
  patients: Patient[];
  hasMore: boolean;
}> {
  const res = await api.get<{
    success?: boolean;
    patients?: Patient[];
    pagination?: { hasMore?: boolean };
  }>(`/patients?limit=${limit}&offset=0`);
  if (!res.success || !Array.isArray(res.data?.patients)) {
    return { patients: [], hasMore: false };
  }
  return {
    patients: res.data.patients,
    hasMore: Boolean(res.data.pagination?.hasMore),
  };
}

/** Carga pacientes para selectores de formulario (solo cuando el formulario está abierto). */
export function usePatientPicker(enabled: boolean) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    try {
      const list = await fetchAllClinicalPages<Patient>(
        '/patients',
        'patients',
        () => 'Error al cargar pacientes'
      );
      setPatients(list);
    } catch {
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setPatients([]);
      return;
    }
    void reload();
  }, [enabled, reload]);

  return { patients, isLoading, reload };
}

const patientDetailCache = new Map<string, Patient>();

/** Obtiene un paciente por ID (caché en memoria + API). */
export async function fetchPatientById(id: string): Promise<Patient | null> {
  const cached = patientDetailCache.get(id);
  if (cached) return cached;
  const res = await api.get<{ success?: boolean; patient?: Patient }>(`/patients/${id}`);
  if (res.success && res.data?.patient) {
    patientDetailCache.set(id, res.data.patient);
    return res.data.patient;
  }
  return null;
}

export function invalidatePatientDetailCache(id: string) {
  patientDetailCache.delete(id);
}
