import { generateAmortizationSchedule, generateScheduleWithFixedPayment } from "./amortization";
import type { ExtraPaymentInput, ExtraPaymentResult, LoanInput } from "./types";

function getBalanceAfterInstallment(loan: LoanInput, afterInstallmentNumber = 0) {
  if (afterInstallmentNumber <= 0) {
    return loan.principalCents;
  }

  const baseline = generateAmortizationSchedule(loan);
  return (
    baseline.schedule.find((row) => row.installmentNumber === afterInstallmentNumber)
      ?.remainingBalanceCents ?? loan.principalCents
  );
}

export function simulateExtraPaymentReduceTerm(input: ExtraPaymentInput): ExtraPaymentResult {
  const baseline = generateAmortizationSchedule(input.loan);
  const balance = getBalanceAfterInstallment(input.loan, input.afterInstallmentNumber);
  const newPrincipal = Math.max(0, balance - input.extraPaymentCents);
  const remainingLoan: LoanInput = {
    ...input.loan,
    principalCents: newPrincipal,
    upfrontFeeCents: 0,
  };
  const newSummary =
    newPrincipal === 0
      ? { ...baseline, principalCents: 0, schedule: [], termMonths: 0, totalInterestCents: 0, totalPaidCents: 0 }
      : generateScheduleWithFixedPayment(remainingLoan, baseline.baseMonthlyPaymentCents);

  return {
    strategy: "reduce_term",
    newSummary,
    interestSavingsCents: Math.max(0, baseline.totalInterestCents - newSummary.totalInterestCents),
    newTermMonths: newSummary.termMonths,
    newMonthlyPaymentCents: newSummary.totalMonthlyPaymentCents,
  };
}

export function simulateExtraPaymentReducePayment(input: ExtraPaymentInput): ExtraPaymentResult {
  const baseline = generateAmortizationSchedule(input.loan);
  const balance = getBalanceAfterInstallment(input.loan, input.afterInstallmentNumber);
  const remainingTerm = Math.max(1, input.loan.termMonths - (input.afterInstallmentNumber ?? 0));
  const newPrincipal = Math.max(0, balance - input.extraPaymentCents);
  const remainingLoan: LoanInput = {
    ...input.loan,
    principalCents: newPrincipal,
    termMonths: remainingTerm,
    upfrontFeeCents: 0,
  };
  const newSummary =
    newPrincipal === 0
      ? { ...baseline, principalCents: 0, schedule: [], termMonths: 0, totalInterestCents: 0, totalPaidCents: 0 }
      : generateAmortizationSchedule(remainingLoan);

  return {
    strategy: "reduce_payment",
    newSummary,
    interestSavingsCents: Math.max(0, baseline.totalInterestCents - newSummary.totalInterestCents),
    newTermMonths: newSummary.termMonths,
    newMonthlyPaymentCents: newSummary.totalMonthlyPaymentCents,
  };
}
