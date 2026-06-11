import { describe, expect, it } from "vitest";
import {
  calculateFixedPayment,
  calculateLoanSummary,
  convertAnnualEffectiveToMonthly,
  convertNominalAnnualToMonthly,
  generateAmortizationSchedule,
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
});
