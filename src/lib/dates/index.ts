import { addMonths, format, isBefore, parseISO } from "date-fns";

export function formatDate(value: string | Date) {
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, "yyyy-MM-dd");
}

export function addPaymentMonths(startDate: string, months: number) {
  return formatDate(addMonths(parseISO(startDate), months));
}

export function isPastDate(value: string) {
  return isBefore(parseISO(value), new Date());
}
