export type RateType = "monthly_effective" | "effective_annual" | "nominal_annual";

export type LoanInput = {
  principalCents: number;
  rateValue: string;
  rateType: RateType;
  termMonths: number;
  startDate: string;
  monthlyFeeCents?: number;
  monthlyInsuranceCents?: number;
  upfrontFeeCents?: number;
};

export type InstallmentRow = {
  installmentNumber: number;
  dueDate: string;
  principalCents: number;
  interestCents: number;
  feesCents: number;
  totalCents: number;
  remainingBalanceCents: number;
};

export type LoanSummary = {
  principalCents: number;
  baseMonthlyPaymentCents: number;
  totalMonthlyPaymentCents: number;
  totalInterestCents: number;
  totalFeesCents: number;
  upfrontFeeCents: number;
  totalPaidCents: number;
  termMonths: number;
  finalPaymentDate: string;
  monthlyRate: string;
  schedule: InstallmentRow[];
};

export type ExtraPaymentInput = {
  loan: LoanInput;
  extraPaymentCents: number;
  afterInstallmentNumber?: number;
};

export type ExtraPaymentResult = {
  strategy: "reduce_term" | "reduce_payment";
  newSummary: LoanSummary;
  interestSavingsCents: number;
  newTermMonths: number;
  newMonthlyPaymentCents: number;
};
