"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  calculateLoanSummary,
  moneyToCents,
  simulateExtraPaymentReducePayment,
  simulateExtraPaymentReduceTerm,
  type LoanInput,
} from "@/domain/finance";
import { getAppContext } from "@/server/context";

const paymentSchema = z.object({
  creditId: z.string().uuid(),
  installmentId: z.string().uuid().optional().or(z.literal("")),
  amount: z.string().min(1),
  paymentDate: z.string().min(8),
  method: z.string().optional(),
  notes: z.string().optional(),
});

export async function recordPaymentAction(formData: FormData) {
  const ctx = await getAppContext();
  if (!ctx.configured) return;

  const parsed = paymentSchema.parse(Object.fromEntries(formData));
  const amountCents = moneyToCents(parsed.amount);
  const { error } = await ctx.supabase.rpc("record_credit_payment", {
    p_workspace_id: ctx.workspace.id,
    p_credit_account_id: parsed.creditId,
    p_installment_id: parsed.installmentId || null,
    p_amount_cents: amountCents,
    p_payment_date: parsed.paymentDate,
    p_method: parsed.method || null,
    p_notes: parsed.notes || null,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/creditos/${parsed.creditId}`);
  revalidatePath("/dashboard");
}

const extraPaymentSchema = z.object({
  creditId: z.string().uuid(),
  amount: z.string().min(1),
  paymentDate: z.string().min(8),
  strategy: z.enum(["applied_reduce_term", "applied_reduce_payment"]),
  notes: z.string().optional(),
});

export async function applyExtraPaymentAction(formData: FormData) {
  const ctx = await getAppContext();
  if (!ctx.configured) return;

  const parsed = extraPaymentSchema.parse(Object.fromEntries(formData));
  const amountCents = moneyToCents(parsed.amount);

  const { data: credit, error } = await ctx.supabase
    .from("credit_accounts")
    .select("*")
    .eq("workspace_id", ctx.workspace.id)
    .eq("id", parsed.creditId)
    .single();

  if (error || !credit) throw new Error(error?.message ?? "No se encontro la deuda.");
  if (amountCents > credit.current_balance_cents) {
    throw new Error("El abono no puede ser mayor al saldo pendiente.");
  }

  const loan: LoanInput = {
    principalCents: credit.current_balance_cents,
    rateValue: credit.rate_value,
    rateType: credit.rate_type,
    termMonths: credit.term_months,
    startDate: parsed.paymentDate,
    monthlyFeeCents: credit.monthly_fee_cents,
    monthlyInsuranceCents: credit.monthly_insurance_cents,
    upfrontFeeCents: 0,
  };
  const previousSummary = calculateLoanSummary(loan);
  const result =
    parsed.strategy === "applied_reduce_term"
      ? simulateExtraPaymentReduceTerm({ loan, extraPaymentCents: amountCents })
      : simulateExtraPaymentReducePayment({ loan, extraPaymentCents: amountCents });

  const { error: rpcError } = await ctx.supabase.rpc("apply_extra_payment", {
    p_workspace_id: ctx.workspace.id,
    p_credit_account_id: parsed.creditId,
    p_expected_current_balance_cents: credit.current_balance_cents,
    p_amount_cents: amountCents,
    p_payment_date: parsed.paymentDate,
    p_strategy: parsed.strategy,
    p_previous_summary: previousSummary,
    p_new_summary: result.newSummary,
    p_interest_savings_cents: result.interestSavingsCents,
    p_notes: parsed.notes || null,
  });

  if (rpcError) throw new Error(rpcError.message);

  revalidatePath(`/creditos/${parsed.creditId}`);
  revalidatePath("/dashboard");
}
