import Decimal from "decimal.js";

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export function moneyToCents(value: string | number) {
  if (value === "" || value === null || value === undefined) {
    return 0;
  }

  return new Decimal(value).mul(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}

export function centsToMoney(cents: number) {
  return new Decimal(cents).div(100).toDecimalPlaces(2).toNumber();
}

export function roundToCents(value: Decimal.Value) {
  return new Decimal(value).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}

export function formatMoneyCOP(cents: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(centsToMoney(cents));
}

export function normalizePercent(value: string | number) {
  const decimal = new Decimal(value || 0);
  return decimal.div(100);
}
