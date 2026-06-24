import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api-client';
import { fetchAllClinicalPages } from '../lib/clinical-list-fetch';
import type { Patient } from '../types/clinical';

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

export function clearPatientDetailCache() {
  patientDetailCache.clear();
}
