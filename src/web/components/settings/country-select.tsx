import {
  TENANT_COUNTRY_CODES,
  countryLabel,
  resolveTenantCountryCode,
  type TenantCountryCode,
} from '../../../lib/phone-country';

type CountrySelectProps = {
  value: string;
  onChange: (code: TenantCountryCode) => void;
  className?: string;
  id?: string;
};

export function CountrySelect({ value, onChange, className, id }: CountrySelectProps) {
  const resolved = resolveTenantCountryCode(value);
  return (
    <select
      id={id}
      value={resolved}
      onChange={(e) => onChange(resolveTenantCountryCode(e.target.value))}
      className={
        className ??
        'w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent bg-white'
      }
    >
      {TENANT_COUNTRY_CODES.map((code) => (
        <option key={code} value={code}>
          {countryLabel(code)} (+{code})
        </option>
      ))}
    </select>
  );
}
