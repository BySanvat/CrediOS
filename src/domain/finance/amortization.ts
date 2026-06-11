import Decimal from "decimal.js";
import { addPaymentMonths } from "@/lib/dates";
import { getMonthlyRate } from "./rates";
import { roundToCents } from "./money";
import type { InstallmentRow, LoanInput, LoanSummary } from "./types";

type InternalScheduleOptions = LoanInput & {
  fixedBasePaymentCents?: number;
  maxMonths?: number;
};

export function calculateFixedPayment(input: LoanInput) {
  const principal = new Decimal(input.principalCents);
  const rate = getMonthlyRate(input.rateValue, input.rateType);
  const term = input.termMonths;

  if (term < 1) {
    throw new Error("El plazo debe ser mayor a cero.");
  }

  if (principal.lte(0)) {
    throw new Error("El monto debe ser mayor a cero.");
  }

  if (rate.eq(0)) {
    return roundToCents(principal.div(term));
  }

  const numerator = principal.mul(rate);
  const denominator = new Decimal(1).minus(new Decimal(1).plus(rate).pow(-term));
  return roundToCents(numerator.div(denominator));
}

function generateInternalSchedule(input: InternalScheduleOptions): LoanSummary {
  const monthlyRate = getMonthlyRate(input.rateValue, input.rateType);
  const monthlyFeeCents = input.monthlyFeeCents ?? 0;
  const monthlyInsuranceCents = input.monthlyInsuranceCents ?? 0;
  const upfrontFeeCents = input.upfrontFeeCents ?? 0;
  const feesPerMonth = monthlyFeeCents + monthlyInsuranceCents;
  const basePaymentCents = input.fixedBasePaymentCents ?? calculateFixedPayment(input);
  const maxMonths = input.maxMonths ?? input.termMonths;
  const schedule: InstallmentRow[] = [];
  let balance = input.principalCents;
  let totalInterestCents = 0;
  let totalFeesCents = upfrontFeeCents;
  let month = 1;

  while (balance > 0 && month <= maxMonths) {
    const interestCents = roundToCents(new Decimal(balance).mul(monthlyRate));
    let principalCents = basePaymentCents - interestCents;

    if (monthlyRate.gt(0) && principalCents <= 0) {
      throw new Error("La cuota no amortiza el credito con la tasa indicada.");
    }

    if (month === maxMonths || principalCents > balance) {
      principalCents = balance;
    }

    const basePaymentForPeriod = principalCents + interestCents;
    const totalCents = basePaymentForPeriod + feesPerMonth;
    balance = Math.max(0, balance - principalCents);
    totalInterestCents += interestCents;
    totalFeesCents += feesPerMonth;

    schedule.push({
      installmentNumber: month,
      dueDate: addPaymentMonths(input.startDate, month),
      principalCents,
      interestCents,
      feesCents: feesPerMonth,
      totalCents,
      remainingBalanceCents: balance,
    });

    month += 1;
  }

  const totalPaidCents =
    schedule.reduce((total, item) => total + item.totalCents, upfrontFeeCents);

  return {
    principalCents: input.principalCents,
    baseMonthlyPaymentCents: basePaymentCents,
    totalMonthlyPaymentCents: basePaymentCents + feesPerMonth,
    totalInterestCents,
    totalFeesCents,
    upfrontFeeCents,
    totalPaidCents,
    termMonths: schedule.length,
    finalPaymentDate: schedule.at(-1)?.dueDate ?? input.startDate,
    monthlyRate: monthlyRate.toDecimalPlaces(12).toString(),
    schedule,
  };
}

export function generateAmortizationSchedule(input: LoanInput) {
  return generateInternalSchedule(input);
}

export function calculateLoanSummary(input: LoanInput) {
  return generateAmortizationSchedule(input);
}

export function generateScheduleWithFixedPayment(input: LoanInput, fixedBasePaymentCents: number) {
  return generateInternalSchedule({
    ...input,
    fixedBasePaymentCents,
    maxMonths: 600,
  });
}
