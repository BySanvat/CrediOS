import Decimal from "decimal.js";
import { normalizePercent } from "./money";
import type { RateType } from "./types";

export function convertAnnualEffectiveToMonthly(rateValue: string | number) {
  const annual = normalizePercent(rateValue);
  return new Decimal(1).plus(annual).pow(new Decimal(1).div(12)).minus(1);
}

export function convertNominalAnnualToMonthly(rateValue: string | number) {
  return normalizePercent(rateValue).div(12);
}

export function getMonthlyRate(rateValue: string | number, rateType: RateType) {
  if (rateType === "monthly_effective") {
    return normalizePercent(rateValue);
  }

  if (rateType === "effective_annual") {
    return convertAnnualEffectiveToMonthly(rateValue);
  }

  return convertNominalAnnualToMonthly(rateValue);
}
