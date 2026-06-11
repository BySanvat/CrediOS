import { addDays, endOfMonth, endOfQuarter, endOfYear, format, startOfMonth, startOfQuarter, startOfYear, subDays } from "date-fns";
import type { PersonalPeriod, PeriodRange, RecurringFrequency } from "./types";

export function toDateString(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function getPeriodRange(period: PersonalPeriod, anchor = new Date()): PeriodRange {
  if (period === "quarter") {
    return {
      period,
      start: toDateString(startOfQuarter(anchor)),
      end: toDateString(endOfQuarter(anchor)),
      label: "Trimestre",
    };
  }

  if (period === "year") {
    return {
      period,
      start: toDateString(startOfYear(anchor)),
      end: toDateString(endOfYear(anchor)),
      label: "Anio",
    };
  }

  return {
    period,
    start: toDateString(startOfMonth(anchor)),
    end: toDateString(endOfMonth(anchor)),
    label: "Mes",
  };
}

export function getPreviousPeriodRange(period: PersonalPeriod, anchor = new Date()): PeriodRange {
  const current = getPeriodRange(period, anchor);
  const previousAnchor = subDays(new Date(`${current.start}T12:00:00`), 1);
  return getPeriodRange(period, previousAnchor);
}

export function nextRecurringDate(start: string, frequency: RecurringFrequency, intervalCount: number) {
  const startDate = new Date(`${start}T12:00:00`);
  const interval = Math.max(1, intervalCount);
  if (frequency === "daily") return toDateString(addDays(startDate, interval));
  if (frequency === "weekly") return toDateString(addDays(startDate, interval * 7));
  if (frequency === "yearly") return `${startDate.getFullYear() + interval}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`;
  const month = startDate.getMonth() + interval;
  return toDateString(new Date(startDate.getFullYear(), month, startDate.getDate()));
}

export function periodFromSearchParam(value: string | null): PersonalPeriod {
  if (value === "quarter" || value === "year") return value;
  return "month";
}
