import type { PersonalBudgetLike, PersonalCategoryLike, PersonalTransactionLike } from "./types";

export type PersonalInsight = {
  title: string;
  detail: string;
  tone: "neutral" | "green" | "amber" | "red";
};

export function summarizeTransactions(transactions: PersonalTransactionLike[]) {
  return transactions.reduce(
    (summary, transaction) => {
      if (transaction.archived_at) return summary;
      if (transaction.type === "income") summary.income += transaction.amount_cents;
      if (transaction.type === "expense") summary.expense += transaction.amount_cents;
      return summary;
    },
    { income: 0, expense: 0, net: 0 },
  );
}

export function buildCategoryTotals(transactions: PersonalTransactionLike[], categories: PersonalCategoryLike[]) {
  const map = new Map<string, { category: PersonalCategoryLike | null; total: number }>();
  for (const transaction of transactions) {
    if (transaction.archived_at || transaction.type !== "expense") continue;
    const key = transaction.category_id ?? "uncategorized";
    const existing = map.get(key) ?? {
      category: categories.find((category) => category.id === transaction.category_id) ?? null,
      total: 0,
    };
    existing.total += transaction.amount_cents;
    map.set(key, existing);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export function buildBudgetProgress(
  budgets: PersonalBudgetLike[],
  transactions: PersonalTransactionLike[],
  categories: PersonalCategoryLike[],
) {
  return budgets.map((budget) => {
    const spent = transactions
      .filter((transaction) => transaction.type === "expense" && transaction.category_id === budget.category_id && !transaction.archived_at)
      .reduce((sum, transaction) => sum + transaction.amount_cents, 0);
    const category = categories.find((item) => item.id === budget.category_id) ?? null;
    const ratio = budget.amount_cents ? spent / budget.amount_cents : 0;
    return {
      budget,
      category,
      spent,
      remaining: budget.amount_cents - spent,
      ratio,
    };
  }).sort((a, b) => b.ratio - a.ratio);
}

export function buildPersonalInsights({
  transactions,
  previousTransactions,
  budgets,
  categories,
  debtBalanceCents,
}: {
  transactions: PersonalTransactionLike[];
  previousTransactions: PersonalTransactionLike[];
  budgets: PersonalBudgetLike[];
  categories: PersonalCategoryLike[];
  debtBalanceCents: number;
}): PersonalInsight[] {
  const current = summarizeTransactions(transactions);
  current.net = current.income - current.expense;
  const previous = summarizeTransactions(previousTransactions);
  previous.net = previous.income - previous.expense;
  const budgetProgress = buildBudgetProgress(budgets, transactions, categories);
  const insights: PersonalInsight[] = [];

  const worstBudget = budgetProgress.find((item) => item.ratio >= 1);
  if (worstBudget) {
    insights.push({
      title: "Presupuesto en alerta",
      detail: `${worstBudget.category?.name ?? "Una categoria"} supero el presupuesto del periodo.`,
      tone: "amber",
    });
  }

  const topExpense = buildCategoryTotals(transactions, categories)[0];
  if (topExpense) {
    insights.push({
      title: "Mayor gasto variable",
      detail: `${topExpense.category?.name ?? "Sin categoria"} concentra el gasto mas alto del periodo.`,
      tone: "neutral",
    });
  }

  if (previous.expense > 0) {
    const delta = current.expense - previous.expense;
    insights.push({
      title: delta > 0 ? "Gasto por encima del periodo anterior" : "Gasto menor al periodo anterior",
      detail: delta > 0 ? "Revisa si el aumento fue puntual o recurrente." : "El periodo actual va mas liviano que el anterior.",
      tone: delta > 0 ? "amber" : "green",
    });
  }

  if (current.net > 0 && debtBalanceCents > 0) {
    const potential = Math.round(current.net * 0.35);
    if (potential > 0) {
      insights.push({
        title: "Capacidad de abono",
        detail: `Podrias separar cerca del 35% del flujo libre para evaluar un abono extraordinario.`,
        tone: "green",
      });
    }
  }

  if (!insights.length) {
    insights.push({
      title: "Primeras senales",
      detail: "Registra algunos movimientos y presupuestos para revelar patrones utiles.",
      tone: "neutral",
    });
  }

  return insights.slice(0, 4);
}
