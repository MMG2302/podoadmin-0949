import { useCallback, useEffect, useState } from 'react';
import { fetchAllClinicalPages } from '../lib/clinical-list-fetch';
import { useLanguage } from '../contexts/language-context';
import type { ClinicalSession, Patient } from '../types/clinical';

export function useClinicalListData() {
  const { t } = useLanguage();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [sessions, setSessions] = useState<ClinicalSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const patientsError = t.clinicalList.loadPatientsError;
  const sessionsError = t.clinicalList.loadSessionsError;
  const clinicalError = t.clinicalList.loadClinicalDataError;

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [p, s] = await Promise.all([
        fetchAllClinicalPages<Patient>('/patients', 'patients', () => patientsError),
        fetchAllClinicalPages<ClinicalSession>('/sessions', 'sessions', () => sessionsError),
      ]);
      setPatients(p);
      setSessions(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : clinicalError);
    } finally {
      setIsLoading(false);
    }
  }, [patientsError, sessionsError, clinicalError]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { patients, sessions, isLoading, error, reload };
}
