export interface Clinic {
  clinicId: string;
  clinicName: string;
  clinicCode: string;
  ownerId: string;
  createdAt: string;
  logo?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  mapsUrl?: string;
  licenseNumber?: string;
  website?: string;
  consentText?: string;
  consentTextVersion?: number;
}

/** Créditos de clínica (solo seed local legacy; producción usa D1). */
export interface ClinicCredits {
  clinicId: string;
  totalCredits: number;
  distributedToDate: number;
  createdAt: string;
  updatedAt: string;
}
