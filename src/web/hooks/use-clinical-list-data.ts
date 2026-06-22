import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api-client';
import { fetchAllClinicalPages } from '../lib/clinical-list-fetch';
import type { ClinicalSession, Patient } from '../types/clinical';

const CACHE_TTL_MS = 30_000;
let cache: { patients?: Patient[]; sessions?: ClinicalSession[]; at?: number } = {};

export function invalidateClinicalListCache() {
  cache = {};
}

export function useClinicalListData() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [sessions, setSessions] = useState<ClinicalSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [p, s] = await Promise.all([
        fetchAllClinicalPages<Patient>('/patients', 'patients', () => 'Error al cargar pacientes'),
        fetchAllClinicalPages<ClinicalSession>('/sessions', 'sessions', () => 'Error al cargar sesiones'),
      ]);
      setPatients(p);
      setSessions(s);
      cache = { patients: p, sessions: s, at: Date.now() };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos clínicos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cache.patients && cache.sessions && cache.at && Date.now() - cache.at < CACHE_TTL_MS) {
      setPatients(cache.patients);
      setSessions(cache.sessions);
      setIsLoading(false);
      return;
    }
    void reload();
  }, [reload]);

  return { patients, sessions, isLoading, error, reload };
}
