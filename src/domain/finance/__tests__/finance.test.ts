import { describe, expect, it } from "vitest";
import {
  calculateFixedPayment,
  calculateAccruedInterestForDays,
  calculateDailyRateFromMonthly,
  calculatePayoffQuote,
  calculateLoanSummary,
  convertAnnualEffectiveToMonthly,
  convertNominalAnnualToMonthly,
  generateAmortizationSchedule,
  getInstallmentRemainingCents,
  getNextPayableInstallment,
  moneyToCents,
  simulateExtraPaymentReducePayment,
  simulateExtraPaymentReduceTerm,
} from "../calculations";

const baseLoan = {
  principalCents: 10_000_000,
  rateValue: "2",
  rateType: "monthly_effective" as const,
  termMonths: 12,
  startDate: "2026-01-01",
  monthlyFeeCents: 0,
  monthlyInsuranceCents: 0,
  upfrontFeeCents: 0,
};

describe("financial engine", () => {
  it("converts money to cents with explicit rounding", () => {
    expect(moneyToCents("123,456")).toBe(12346);
    expect(moneyToCents("123.456")).toBe(12_345_600);
    expect(moneyToCents("1.000.000")).toBe(100_000_000);
  });

  it("handles zero interest", () => {
    const payment = calculateFixedPayment({ ...baseLoan, rateValue: "0" });
    expect(payment).toBe(833333);
  });

  it("handles one month term", () => {
    const summary = calculateLoanSummary({ ...baseLoan, termMonths: 1 });
    expect(summary.schedule).toHaveLength(1);
    expect(summary.schedule[0].remainingBalanceCents).toBe(0);
  });

  it("calculates monthly effective payment", () => {
    const payment = calculateFixedPayment(baseLoan);
    expect(payment).toBeGreaterThan(900000);
    expect(payment).toBeLessThan(1_000_000);
  });

  it("converts effective annual to monthly", () => {
    const monthly = convertAnnualEffectiveToMonthly("26.824179456");
    expect(monthly.toDecimalPlaces(4).toString()).toBe("0.02");
  });

  it("converts nominal annual to monthly", () => {
    const monthly = convertNominalAnnualToMonthly("24");
    expect(monthly.toString()).toBe("0.02");
  });

  it("includes monthly costs and upfront fees", () => {
    const summary = calculateLoanSummary({
      ...baseLoan,
      monthlyFeeCents: 10_000,
      monthlyInsuranceCents: 5_000,
      upfrontFeeCents: 50_000,
    });
    expect(summary.totalFeesCents).toBe(230_000);
    expect(summary.totalPaidCents).toBeGreaterThan(summary.principalCents);
  });

  it("adjusts the final installment to zero balance", () => {
    const summary = generateAmortizationSchedule(baseLoan);
    expect(summary.schedule.at(-1)?.remainingBalanceCents).toBe(0);
    expect(summary.schedule.reduce((sum, row) => sum + row.principalCents, 0)).toBe(
      baseLoan.principalCents,
    );
  });

  it("simulates extra payment reducing term", () => {
    const result = simulateExtraPaymentReduceTerm({
      loan: baseLoan,
      extraPaymentCents: 1_000_000,
      afterInstallmentNumber: 1,
    });
    expect(result.newTermMonths).toBeLessThan(baseLoan.termMonths);
    expect(result.interestSavingsCents).toBeGreaterThan(0);
  });

  it("simulates extra payment reducing payment", () => {
    const result = simulateExtraPaymentReducePayment({
      loan: baseLoan,
      extraPaymentCents: 1_000_000,
      afterInstallmentNumber: 1,
    });
    expect(result.newMonthlyPaymentCents).toBeLessThan(calculateLoanSummary(baseLoan).totalMonthlyPaymentCents);
    expect(result.interestSavingsCents).toBeGreaterThan(0);
  });

  it("does not accrue daily interest for zero days", () => {
    const dailyRate = calculateDailyRateFromMonthly("0.02");
    expect(calculateAccruedInterestForDays({ balanceCents: 1_000_000, dailyRate, days: 0 })).toBe(0);
  });

  it("accrues deterministic daily interest", () => {
    const dailyRate = calculateDailyRateFromMonthly("0.02");
    const oneDay = calculateAccruedInterestForDays({ balanceCents: 1_000_000, dailyRate, days: 1 });
    const fifteenDays = calculateAccruedInterestForDays({ balanceCents: 1_000_000, dailyRate, days: 15 });

    expect(oneDay).toBeGreaterThan(0);
    expect(fifteenDays).toBeGreaterThan(oneDay);
  });

  it("keeps zero rate payoff quote without accrued interest", () => {
    const quote = calculatePayoffQuote({
      currentBalanceCents: 1_000_000,
      rateValue: "0",
      rateType: "monthly_effective",
      accruesFromDate: "2026-01-01",
      asOfDate: "2026-01-16",
    });

    expect(quote.accruedInterestCents).toBe(0);
    expect(quote.payoffCents).toBe(1_000_000);
  });

  it("includes accrued interest in payoff quote", () => {
    const quote = calculatePayoffQuote({
      currentBalanceCents: 1_000_000,
      rateValue: "2",
      rateType: "monthly_effective",
      accruesFromDate: "2026-01-01",
      asOfDate: "2026-01-16",
    });

    expect(quote.days).toBe(15);
    expect(quote.accruedInterestCents).toBeGreaterThan(0);
    expect(quote.payoffCents).toBe(1_000_000 + quote.accruedInterestCents);
  });

  it("selects the next payable installment by late first then next pending", () => {
    const installments = [
      { id: "a", due_date: "2026-02-01", status: "pending", total_cents: 100_000 },
      { id: "b", due_date: "2026-01-01", status: "pending", total_cents: 100_000 },
    ];

    expect(getNextPayableInstallment(installments, "2026-01-15")?.id).toBe("b");
    expect(getNextPayableInstallment(installments, "2025-12-15")?.id).toBe("b");
  });

  it("calculates remaining installment amount after partial payments", () => {
    const installment = { id: "a", due_date: "2026-01-01", status: "partial", total_cents: 100_000 };
    const payments = [{ installment_id: "a", amount_cents: 35_000 }];

    expect(getInstallmentRemainingCents(installment, payments)).toBe(65_000);
  });
});
