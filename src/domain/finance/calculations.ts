export { calculateFixedPayment, calculateLoanSummary, generateAmortizationSchedule } from "./amortization";
export { simulateExtraPaymentReducePayment, simulateExtraPaymentReduceTerm } from "./extra-payments";
export { convertAnnualEffectiveToMonthly, convertNominalAnnualToMonthly, getMonthlyRate } from "./rates";
export { centsToMoney, formatMoneyCOP, moneyToCents } from "./money";
export type { ExtraPaymentResult, InstallmentRow, LoanInput, LoanSummary, RateType } from "./types";
