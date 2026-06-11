import { describe, expect, it } from "vitest";
import { buildBudgetProgress, nextRecurringDate, parseQuickAdd } from "@/domain/personal-finance";

describe("personal finance parser", () => {
  const today = new Date("2026-06-11T12:00:00");

  it("parses spanish lunch expense today", () => {
    const parsed = parseQuickAdd("almuerzo 28000 hoy", today);

    expect(parsed.amountCents).toBe(2_800_000);
    expect(parsed.occurredAt).toBe("2026-06-11");
    expect(parsed.type).toBe("expense");
    expect(parsed.suggestedCategoryName).toBe("Comida");
    expect(parsed.noteNormalized).toBe("almuerzo");
  });

  it("parses spanish gasoline expense yesterday", () => {
    const parsed = parseQuickAdd("gasolina 120000 ayer", today);

    expect(parsed.amountCents).toBe(12_000_000);
    expect(parsed.occurredAt).toBe("2026-06-10");
    expect(parsed.type).toBe("expense");
    expect(parsed.suggestedCategoryName).toBe("Transporte");
  });

  it("parses salary as income", () => {
    const parsed = parseQuickAdd("salario 2800000", today);

    expect(parsed.type).toBe("income");
    expect(parsed.suggestedCategoryName).toBe("Salario");
    expect(parsed.amountCents).toBe(280_000_000);
  });

  it("supports basic english dates", () => {
    const parsed = parseQuickAdd("coffee 5 yesterday", today);

    expect(parsed.occurredAt).toBe("2026-06-10");
    expect(parsed.suggestedCategoryName).toBe("Comida");
  });
});

describe("personal finance calculations", () => {
  it("builds budget progress by category", () => {
    const progress = buildBudgetProgress(
      [
        {
          id: "budget-1",
          category_id: "food",
          period_type: "monthly",
          amount_cents: 100_000,
          active_from: "2026-06-01",
        },
      ],
      [
        {
          category_id: "food",
          type: "expense",
          amount_cents: 40_000,
          occurred_at: "2026-06-10",
        },
      ],
      [{ id: "food", name: "Comida", type: "expense" }],
    );

    expect(progress[0].spent).toBe(40_000);
    expect(progress[0].remaining).toBe(60_000);
    expect(progress[0].ratio).toBe(0.4);
  });

  it("calculates next recurring dates", () => {
    expect(nextRecurringDate("2026-06-01", "weekly", 2)).toBe("2026-06-15");
    expect(nextRecurringDate("2026-06-01", "monthly", 1)).toBe("2026-07-01");
  });
});
