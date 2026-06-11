import Decimal from "decimal.js";
import { getMonthlyRate } from "./rates";
import { normalizePercent, roundToCents } from "./money";
import type { RateType } from "./types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function calculateDailyRateFromMonthly(monthlyRate: Decimal.Value) {
  return new Decimal(1).plus(monthlyRate).pow(new Decimal(1).div(30)).minus(1);
}

export function calculateDailyRateFromAnnualEffective(effectiveAnnualRate: Decimal.Value) {
  return new Decimal(1).plus(effectiveAnnualRate).pow(new Decimal(1).div(365)).minus(1);
}

export function calculateAccruedInterestForDays({
  balanceCents,
  dailyRate,
  days,
}: {
  balanceCents: number;
  dailyRate: Decimal.Value;
  days: number;
}) {
  if (balanceCents <= 0 || days <= 0) return 0;

  const factor = new Decimal(1).plus(dailyRate).pow(days).minus(1);
  return roundToCents(new Decimal(balanceCents).mul(factor));
}

export function daysBetweenDates(fromDate: string, toDate: string) {
  const from = Date.UTC(...dateParts(fromDate));
  const to = Date.UTC(...dateParts(toDate));

  return Math.max(0, Math.floor((to - from) / MS_PER_DAY));
}

export function calculatePayoffQuote({
  currentBalanceCents,
  rateValue,
  rateType,
  accruesFromDate,
  asOfDate,
}: {
  currentBalanceCents: number;
  rateValue: string | number;
  rateType: RateType;
  accruesFromDate: string;
  asOfDate: string;
}) {
  const days = daysBetweenDates(accruesFromDate, asOfDate);
  const dailyRate =
    rateType === "effective_annual"
      ? calculateDailyRateFromAnnualEffective(normalizePercent(rateValue))
      : calculateDailyRateFromMonthly(getMonthlyRate(rateValue, rateType));
  const accruedInterestCents = calculateAccruedInterestForDays({
    balanceCents: currentBalanceCents,
    dailyRate,
    days,
  });

  return {
    asOfDate,
    accruesFromDate,
    days,
    currentBalanceCents,
    accruedInterestCents,
    payoffCents: currentBalanceCents + accruedInterestCents,
    dailyRate: dailyRate.toString(),
  };
}

function dateParts(value: string): [number, number, number] {
  const [year, month, day] = value.split("-").map(Number);
  return [year, month - 1, day];
}
