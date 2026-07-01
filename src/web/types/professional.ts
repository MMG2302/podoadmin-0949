export interface ProfessionalInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  countryCode?: string;
  licenseNumber: string;
  professionalLicense: string;
  consentText?: string;
  consentTextVersion?: number;
}
