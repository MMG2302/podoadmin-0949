/** Tipos de créditos (legacy seed local; producción en D1). */
export interface CreditTransaction {
  id: string;
  userId: string;
  type: "monthly_allocation" | "purchase" | "consumption" | "reservation" | "release";
  amount: number;
  description: string;
  sessionId?: string;
  createdAt: string;
}

export interface UserCredits {
  userId: string;
  monthlyCredits: number;
  extraCredits: number;
  reservedCredits: number;
  lastMonthlyReset: string;
  monthlyRenewalAmount?: number;
}
