export type PersonalTransactionType = "income" | "expense";
export type PersonalPeriod = "month" | "quarter" | "year";
export type BudgetPeriodType = "monthly" | "quarterly";
export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";

export type PersonalCategorySeed = {
  name: string;
  type: PersonalTransactionType;
  icon: string;
  colorToken: string;
  keywords: string[];
};

export type ParsedQuickAdd = {
  noteRaw: string;
  noteNormalized: string;
  amountCents: number;
  occurredAt: string;
  type: PersonalTransactionType;
  suggestedCategoryName: string | null;
  confidence: "low" | "medium" | "high";
};

export type PersonalTransactionLike = {
  id?: string;
  category_id?: string | null;
  type: PersonalTransactionType;
  amount_cents: number;
  note_normalized?: string;
  occurred_at: string;
  archived_at?: string | null;
};

export type PersonalCategoryLike = {
  id: string;
  name: string;
  type: PersonalTransactionType;
  color_token?: string;
};

export type PersonalBudgetLike = {
  id?: string;
  category_id: string;
  period_type: BudgetPeriodType;
  amount_cents: number;
  active_from: string;
  active_to?: string | null;
};

export type PeriodRange = {
  period: PersonalPeriod;
  start: string;
  end: string;
  label: string;
};
