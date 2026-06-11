"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { moneyToCents } from "@/domain/finance";
import {
  findCategorySeedByName,
  nextRecurringDate,
  parseQuickAdd,
  type BudgetPeriodType,
  type RecurringFrequency,
} from "@/domain/personal-finance";
import { getAppContext } from "@/server/context";
import { ensurePersonalCategories, getPersonalCategories } from "@/server/personal-finance";

function revalidateFinance() {
  revalidatePath("/finanzas");
  revalidatePath("/finanzas/movimientos");
  revalidatePath("/finanzas/presupuestos");
  revalidatePath("/finanzas/recurrentes");
  revalidatePath("/finanzas/reportes");
  revalidatePath("/dashboard");
}

async function duplicateHash(input: {
  workspaceId: string;
  type: string;
  amountCents: number;
  noteNormalized: string;
  occurredAt: string;
}) {
  const payload = `${input.workspaceId}|${input.type}|${input.amountCents}|${input.noteNormalized}|${input.occurredAt}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));

  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

const categorySchema = z.object({
  name: z.string().min(2).max(80),
  type: z.enum(["income", "expense"]),
  icon: z.string().optional(),
  colorToken: z.string().optional(),
});

export async function createPersonalCategoryAction(formData: FormData) {
  const ctx = await getAppContext();
  if (!ctx.configured) return;

  const parsed = categorySchema.parse(Object.fromEntries(formData));
  const seed = findCategorySeedByName(parsed.name);
  const { error } = await ctx.supabase.from("personal_categories").insert({
    workspace_id: ctx.workspace.id,
    name: parsed.name.trim(),
    type: parsed.type,
    icon: parsed.icon || seed?.icon || "circle",
    color_token: parsed.colorToken || seed?.colorToken || "sand",
    is_default: false,
  });

  if (error) throw new Error(error.message);
  revalidateFinance();
}

const transactionSchema = z.object({
  id: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  type: z.enum(["income", "expense"]),
  amount: z.string().min(1),
  occurredAt: z.string().min(8),
  note: z.string().min(1).max(240),
  source: z.enum(["manual", "voice", "import_stub"]).default("manual"),
});

export async function createPersonalTransactionAction(formData: FormData) {
  const ctx = await getAppContext();
  if (!ctx.configured) return;

  await ensurePersonalCategories(ctx);
  const parsed = transactionSchema.parse(Object.fromEntries(formData));
  const amountCents = moneyToCents(parsed.amount);
  const noteNormalized = parsed.note.trim().toLowerCase();
  const hash = await duplicateHash({
    workspaceId: ctx.workspace.id,
    type: parsed.type,
    amountCents,
    noteNormalized,
    occurredAt: parsed.occurredAt,
  });

  const { error } = await ctx.supabase.from("personal_transactions").insert({
    workspace_id: ctx.workspace.id,
    category_id: parsed.categoryId || null,
    type: parsed.type,
    amount_cents: amountCents,
    currency: ctx.workspace.default_currency,
    note_raw: parsed.note.trim(),
    note_normalized: noteNormalized,
    occurred_at: parsed.occurredAt,
    source: parsed.source,
    duplicate_hash: hash,
    created_by: ctx.user.id,
  });

  if (error) throw new Error(error.message);
  revalidateFinance();
}

const quickAddSchema = z.object({
  quickText: z.string().min(2).max(240),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  type: z.enum(["income", "expense"]).optional(),
  occurredAt: z.string().optional(),
});

export async function quickAddPersonalTransactionAction(formData: FormData) {
  const ctx = await getAppContext();
  if (!ctx.configured) return;

  const parsed = quickAddSchema.parse(Object.fromEntries(formData));
  const categories = await getPersonalCategories(ctx);
  const quick = parseQuickAdd(parsed.quickText);
  if (quick.amountCents <= 0) {
    throw new Error("Agrega un monto para registrar el movimiento.");
  }

  const type = parsed.type ?? quick.type;
  const suggested = categories.find(
    (category) => category.type === type && category.name.toLowerCase() === quick.suggestedCategoryName?.toLowerCase(),
  );
  const categoryId = parsed.categoryId || suggested?.id || categories.find((category) => category.type === type)?.id || null;
  const occurredAt = parsed.occurredAt || quick.occurredAt;
  const hash = await duplicateHash({
    workspaceId: ctx.workspace.id,
    type,
    amountCents: quick.amountCents,
    noteNormalized: quick.noteNormalized,
    occurredAt,
  });

  const { error } = await ctx.supabase.from("personal_transactions").insert({
    workspace_id: ctx.workspace.id,
    category_id: categoryId,
    type,
    amount_cents: quick.amountCents,
    currency: ctx.workspace.default_currency,
    note_raw: quick.noteRaw,
    note_normalized: quick.noteNormalized,
    occurred_at: occurredAt,
    source: "manual",
    duplicate_hash: hash,
    created_by: ctx.user.id,
  });

  if (error) throw new Error(error.message);
  revalidateFinance();
}

export async function updatePersonalTransactionAction(formData: FormData) {
  const ctx = await getAppContext();
  if (!ctx.configured) return;

  const parsed = transactionSchema.extend({ id: z.string().uuid() }).parse(Object.fromEntries(formData));
  const amountCents = moneyToCents(parsed.amount);
  const noteNormalized = parsed.note.trim().toLowerCase();
  const { error } = await ctx.supabase
    .from("personal_transactions")
    .update({
      category_id: parsed.categoryId || null,
      type: parsed.type,
      amount_cents: amountCents,
      note_raw: parsed.note.trim(),
      note_normalized: noteNormalized,
      occurred_at: parsed.occurredAt,
      duplicate_hash: await duplicateHash({
        workspaceId: ctx.workspace.id,
        type: parsed.type,
        amountCents,
        noteNormalized,
        occurredAt: parsed.occurredAt,
      }),
    })
    .eq("workspace_id", ctx.workspace.id)
    .eq("id", parsed.id);

  if (error) throw new Error(error.message);
  revalidateFinance();
}

export async function archivePersonalTransactionAction(formData: FormData) {
  const ctx = await getAppContext();
  if (!ctx.configured) return;

  const id = z.string().uuid().parse(formData.get("id"));
  const { error } = await ctx.supabase
    .from("personal_transactions")
    .update({ archived_at: new Date().toISOString() })
    .eq("workspace_id", ctx.workspace.id)
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateFinance();
}

const budgetSchema = z.object({
  categoryId: z.string().uuid(),
  periodType: z.enum(["monthly", "quarterly"]),
  amount: z.string().min(1),
  activeFrom: z.string().min(8),
  activeTo: z.string().optional().or(z.literal("")),
  rollover: z.string().optional(),
});

export async function createPersonalBudgetAction(formData: FormData) {
  const ctx = await getAppContext();
  if (!ctx.configured) return;

  const parsed = budgetSchema.parse(Object.fromEntries(formData));
  const { error } = await ctx.supabase.from("personal_budgets").insert({
    workspace_id: ctx.workspace.id,
    category_id: parsed.categoryId,
    period_type: parsed.periodType satisfies BudgetPeriodType,
    amount_cents: moneyToCents(parsed.amount),
    active_from: parsed.activeFrom,
    active_to: parsed.activeTo || null,
    rollover: parsed.rollover === "on",
  });

  if (error) throw new Error(error.message);
  revalidateFinance();
}

export async function archivePersonalBudgetAction(formData: FormData) {
  const ctx = await getAppContext();
  if (!ctx.configured) return;

  const id = z.string().uuid().parse(formData.get("id"));
  const { error } = await ctx.supabase
    .from("personal_budgets")
    .update({ active_to: new Date().toISOString().slice(0, 10) })
    .eq("workspace_id", ctx.workspace.id)
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateFinance();
}

const recurringSchema = z.object({
  categoryId: z.string().uuid().optional().or(z.literal("")),
  type: z.enum(["income", "expense"]),
  amount: z.string().min(1),
  noteTemplate: z.string().min(2).max(180),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  intervalCount: z.coerce.number().int().min(1).max(24),
  startsAt: z.string().min(8),
  endsAt: z.string().optional().or(z.literal("")),
});

export async function createRecurringRuleAction(formData: FormData) {
  const ctx = await getAppContext();
  if (!ctx.configured) return;

  await ensurePersonalCategories(ctx);
  const parsed = recurringSchema.parse(Object.fromEntries(formData));
  const { error } = await ctx.supabase.from("recurring_rules").insert({
    workspace_id: ctx.workspace.id,
    category_id: parsed.categoryId || null,
    type: parsed.type,
    amount_cents: moneyToCents(parsed.amount),
    currency: ctx.workspace.default_currency,
    note_template: parsed.noteTemplate.trim(),
    frequency: parsed.frequency satisfies RecurringFrequency,
    interval_count: parsed.intervalCount,
    starts_at: parsed.startsAt,
    ends_at: parsed.endsAt || null,
    next_run_at: parsed.startsAt,
    active: true,
  });

  if (error) throw new Error(error.message);
  revalidateFinance();
}

export async function toggleRecurringRuleAction(formData: FormData) {
  const ctx = await getAppContext();
  if (!ctx.configured) return;

  const id = z.string().uuid().parse(formData.get("id"));
  const active = formData.get("active") === "true";
  const { error } = await ctx.supabase
    .from("recurring_rules")
    .update({ active: !active })
    .eq("workspace_id", ctx.workspace.id)
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateFinance();
}

const confirmRecurringSchema = z.object({
  id: z.string().uuid(),
  occurredAt: z.string().min(8),
});

export async function confirmRecurringRuleAction(formData: FormData) {
  const ctx = await getAppContext();
  if (!ctx.configured) return;

  const parsed = confirmRecurringSchema.parse(Object.fromEntries(formData));
  const { data: rule, error } = await ctx.supabase
    .from("recurring_rules")
    .select("*")
    .eq("workspace_id", ctx.workspace.id)
    .eq("id", parsed.id)
    .single();

  if (error || !rule) throw new Error(error?.message ?? "No se encontro el fijo mensual.");

  const note = `${rule.type === "income" ? "Ingreso fijo" : "Gasto fijo"}: ${rule.note_template}`;
  const hash = await duplicateHash({
    workspaceId: ctx.workspace.id,
    type: rule.type,
    amountCents: rule.amount_cents,
    noteNormalized: note.toLowerCase(),
    occurredAt: parsed.occurredAt,
  });

  const { error: insertError } = await ctx.supabase.from("personal_transactions").insert({
    workspace_id: ctx.workspace.id,
    category_id: rule.category_id,
    type: rule.type,
    amount_cents: rule.amount_cents,
    currency: rule.currency,
    note_raw: note,
    note_normalized: note.toLowerCase(),
    occurred_at: parsed.occurredAt,
    source: "manual",
    duplicate_hash: hash,
    created_by: ctx.user.id,
  });

  if (insertError) throw new Error(insertError.message);

  const nextRunAt = nextRecurringDate(parsed.occurredAt, rule.frequency, rule.interval_count);
  const active = !rule.ends_at || nextRunAt <= rule.ends_at;
  const { error: updateError } = await ctx.supabase
    .from("recurring_rules")
    .update({ next_run_at: nextRunAt, active })
    .eq("workspace_id", ctx.workspace.id)
    .eq("id", rule.id);

  if (updateError) throw new Error(updateError.message);
  revalidateFinance();
}

const personalDebtSchema = z.object({
  name: z.string().min(2).max(120),
  amount: z.string().min(1),
  openedAt: z.string().min(8),
  notes: z.string().optional(),
});

export async function createPersonalDebtAction(formData: FormData) {
  const ctx = await getAppContext();
  if (!ctx.configured) return;

  const parsed = personalDebtSchema.parse(Object.fromEntries(formData));
  const amountCents = moneyToCents(parsed.amount);
  if (amountCents <= 0) throw new Error("El saldo inicial debe ser mayor a cero.");

  const { data: debt, error } = await ctx.supabase
    .from("personal_debts")
    .insert({
      workspace_id: ctx.workspace.id,
      name: parsed.name.trim(),
      initial_balance_cents: amountCents,
      current_balance_cents: amountCents,
      currency: ctx.workspace.default_currency,
      opened_at: parsed.openedAt,
      notes: parsed.notes || null,
      status: "active",
      created_by: ctx.user.id,
    })
    .select("id")
    .single();

  if (error || !debt) throw new Error(error?.message ?? "No se pudo crear el registro manual.");

  const { error: movementError } = await ctx.supabase.from("personal_debt_movements").insert({
    workspace_id: ctx.workspace.id,
    personal_debt_id: debt.id,
    direction: "increase",
    amount_cents: amountCents,
    movement_date: parsed.openedAt,
    note: "Saldo inicial",
    created_by: ctx.user.id,
  });

  if (movementError) throw new Error(movementError.message);
  revalidateFinance();
}

const personalDebtMovementSchema = z.object({
  debtId: z.string().uuid(),
  direction: z.enum(["increase", "decrease"]),
  amount: z.string().min(1),
  movementDate: z.string().min(8),
  note: z.string().optional(),
});

export async function createPersonalDebtMovementAction(formData: FormData) {
  const ctx = await getAppContext();
  if (!ctx.configured) return;

  const parsed = personalDebtMovementSchema.parse(Object.fromEntries(formData));
  const amountCents = moneyToCents(parsed.amount);
  if (amountCents <= 0) throw new Error("El movimiento debe ser mayor a cero.");

  const { data: debt, error } = await ctx.supabase
    .from("personal_debts")
    .select("id,current_balance_cents")
    .eq("workspace_id", ctx.workspace.id)
    .eq("id", parsed.debtId)
    .single();

  if (error || !debt) throw new Error(error?.message ?? "No se encontro el registro manual.");

  const nextBalance =
    parsed.direction === "increase"
      ? debt.current_balance_cents + amountCents
      : Math.max(0, debt.current_balance_cents - amountCents);

  const { error: movementError } = await ctx.supabase.from("personal_debt_movements").insert({
    workspace_id: ctx.workspace.id,
    personal_debt_id: debt.id,
    direction: parsed.direction,
    amount_cents: amountCents,
    movement_date: parsed.movementDate,
    note: parsed.note || null,
    created_by: ctx.user.id,
  });

  if (movementError) throw new Error(movementError.message);

  const { error: updateError } = await ctx.supabase
    .from("personal_debts")
    .update({ current_balance_cents: nextBalance, status: nextBalance === 0 ? "closed" : "active" })
    .eq("workspace_id", ctx.workspace.id)
    .eq("id", debt.id);

  if (updateError) throw new Error(updateError.message);
  revalidateFinance();
}

export async function goToFinancePeriodAction(formData: FormData) {
  const period = z.enum(["month", "quarter", "year"]).parse(formData.get("period"));
  redirect(`/finanzas?period=${period}`);
}
