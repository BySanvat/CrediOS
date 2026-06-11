import { addDays, format, nextFriday, previousFriday, subDays } from "date-fns";
import { moneyToCents } from "@/domain/finance";
import { DEFAULT_PERSONAL_CATEGORIES } from "./categories";
import type { ParsedQuickAdd, PersonalTransactionType } from "./types";

const INCOME_WORDS = ["salario", "sueldo", "nomina", "ingreso", "venta", "freelance", "bonus", "salary", "payroll"];
const DATE_WORDS = ["hoy", "ayer", "manana", "tomorrow", "yesterday", "today", "viernes", "friday"];

export function normalizeQuickAddText(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function toDateString(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function parseRelativeDate(text: string, today: Date) {
  if (/\b(ayer|yesterday)\b/.test(text)) return toDateString(subDays(today, 1));
  if (/\b(hoy|today)\b/.test(text)) return toDateString(today);
  if (/\b(manana|tomorrow)\b/.test(text)) return toDateString(addDays(today, 1));
  if (/\b(viernes|friday)\b/.test(text)) {
    const next = nextFriday(today);
    const previous = previousFriday(today);
    const chosen = Math.abs(next.getTime() - today.getTime()) <= Math.abs(today.getTime() - previous.getTime())
      ? next
      : previous;
    return toDateString(chosen);
  }
  const iso = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  return iso ? iso[1] : toDateString(today);
}

function extractAmount(text: string) {
  const match = text.match(/(?:\$|cop)?\s*(\d[\d.,]*)\b/i);
  if (!match) return { amountCents: 0, amountToken: "" };
  const amountToken = match[1];
  const normalized = amountToken.includes(",") && amountToken.includes(".")
    ? amountToken.replace(/\./g, "").replace(",", ".")
    : amountToken.replace(/,/g, "");
  return { amountCents: moneyToCents(normalized), amountToken };
}

function guessType(text: string): PersonalTransactionType {
  return INCOME_WORDS.some((word) => text.includes(word)) ? "income" : "expense";
}

function guessCategory(text: string, type: PersonalTransactionType) {
  let best: { name: string; score: number } | null = null;
  for (const category of DEFAULT_PERSONAL_CATEGORIES.filter((item) => item.type === type)) {
    const score = category.keywords.reduce((sum, keyword) => sum + (text.includes(keyword) ? 1 : 0), 0);
    if (score > (best?.score ?? 0)) best = { name: category.name, score };
  }
  return best && best.score > 0 ? best.name : type === "income" ? "Ingresos extra" : "Otros gastos";
}

function cleanNote(text: string, amountToken: string) {
  const tokens = text
    .replace(amountToken, "")
    .split(" ")
    .filter((token) => token && !DATE_WORDS.includes(token) && token !== "el")
    .join(" ")
    .trim();
  return tokens || "Movimiento";
}

export function parseQuickAdd(input: string, today = new Date()): ParsedQuickAdd {
  const normalized = normalizeQuickAddText(input);
  const { amountCents, amountToken } = extractAmount(normalized);
  const type = guessType(normalized);
  const suggestedCategoryName = guessCategory(normalized, type);
  const noteNormalized = cleanNote(normalized, amountToken);
  const confidence = amountCents > 0 && suggestedCategoryName ? "high" : amountCents > 0 ? "medium" : "low";

  return {
    noteRaw: input.trim(),
    noteNormalized,
    amountCents,
    occurredAt: parseRelativeDate(normalized, today),
    type,
    suggestedCategoryName,
    confidence,
  };
}
