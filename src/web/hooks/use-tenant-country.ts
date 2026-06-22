import { useEffect, useState } from 'react';
import type { User } from '../contexts/auth-context';
import { api } from '../lib/api-client';
import { DEFAULT_TENANT_COUNTRY, resolveTenantCountryCode, type TenantCountryCode } from '../../lib/phone-country';

export function useTenantCountry(user: User | null): TenantCountryCode {
  const [country, setCountry] = useState<TenantCountryCode>(DEFAULT_TENANT_COUNTRY);

  useEffect(() => {
    if (!user) {
      setCountry(DEFAULT_TENANT_COUNTRY);
      return;
    }

    if (user.clinicId) {
      api
        .get<{ success?: boolean; clinic?: { countryCode?: string } }>(`/clinics/${user.clinicId}`)
        .then((res) => {
          if (res.success && res.data?.clinic?.countryCode) {
            setCountry(resolveTenantCountryCode(res.data.clinic.countryCode));
          } else {
            setCountry(DEFAULT_TENANT_COUNTRY);
          }
        })
        .catch(() => setCountry(DEFAULT_TENANT_COUNTRY));
      return;
    }

    if (user.role === 'podiatrist' && user.id) {
      api
        .get<{ success?: boolean; info?: { countryCode?: string } | null }>(`/professionals/info/${user.id}`)
        .then((res) => {
          const cc = res.data?.info?.countryCode;
          setCountry(resolveTenantCountryCode(cc));
        })
        .catch(() => setCountry(DEFAULT_TENANT_COUNTRY));
      return;
    }

    setCountry(DEFAULT_TENANT_COUNTRY);
  }, [user?.id, user?.clinicId, user?.role]);

  return country;
}
