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

  const { data: credit, error: creditError } = await ctx.supabase
    .from("credit_accounts")
    .select("*")
    .eq("workspace_id", ctx.workspace.id)
    .eq("id", parsed.creditId)
    .single();

  if (creditError || !credit) throw new Error(creditError?.message ?? "No se encontro la deuda.");

  let principalCents = Math.min(amountCents, credit.current_balance_cents);
  let interestCents = 0;
  let feesCents = 0;
  let installmentStatus: string | null = null;

  if (parsed.installmentId) {
    const { data: installment } = await ctx.supabase
      .from("installments")
      .select("*")
      .eq("workspace_id", ctx.workspace.id)
      .eq("id", parsed.installmentId)
      .single();

    if (installment) {
      const { data: existingPayments } = await ctx.supabase
        .from("payments")
        .select("amount_cents")
        .eq("workspace_id", ctx.workspace.id)
        .eq("installment_id", parsed.installmentId);
      const paidBefore = (existingPayments ?? []).reduce((sum, payment) => sum + payment.amount_cents, 0);
      const paidAfter = paidBefore + amountCents;
      const ratio = Math.min(1, paidAfter / Math.max(1, installment.total_cents));
      principalCents = Math.round(installment.principal_cents * ratio) - Math.round(installment.principal_cents * Math.min(1, paidBefore / Math.max(1, installment.total_cents)));
      interestCents = Math.max(0, Math.round(installment.interest_cents * ratio));
      feesCents = Math.max(0, Math.round(installment.fees_cents * ratio));
      installmentStatus = paidAfter >= installment.total_cents ? "paid" : "partial";

      await ctx.supabase
        .from("installments")
        .update({
          status: installmentStatus,
          paid_at: installmentStatus === "paid" ? parsed.paymentDate : null,
        })
        .eq("workspace_id", ctx.workspace.id)
        .eq("id", parsed.installmentId);
    }
  }

  const newBalance = Math.max(0, credit.current_balance_cents - Math.max(0, principalCents));

  const { error } = await ctx.supabase.from("payments").insert({
    workspace_id: ctx.workspace.id,
    credit_account_id: parsed.creditId,
    installment_id: parsed.installmentId || null,
    amount_cents: amountCents,
    principal_cents: Math.max(0, principalCents),
    interest_cents: interestCents,
    fees_cents: feesCents,
    payment_date: parsed.paymentDate,
    method: parsed.method || null,
    notes: parsed.notes || null,
    created_by: ctx.user.id,
  });

  if (error) throw new Error(error.message);

  await ctx.supabase
    .from("credit_accounts")
    .update({ current_balance_cents: newBalance, status: newBalance === 0 ? "paid" : credit.status })
    .eq("workspace_id", ctx.workspace.id)
    .eq("id", parsed.creditId);

  await ctx.supabase.from("audit_events").insert({
    workspace_id: ctx.workspace.id,
    actor_id: ctx.user.id,
    entity_type: "credit_account",
    entity_id: parsed.creditId,
    action: "payment_recorded",
    metadata: { amountCents, installmentId: parsed.installmentId || null },
  });

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
  const newBalance = Math.max(0, credit.current_balance_cents - amountCents);

  const { error: insertError } = await ctx.supabase.from("extra_payments").insert({
    workspace_id: ctx.workspace.id,
    credit_account_id: parsed.creditId,
    amount_cents: amountCents,
    payment_date: parsed.paymentDate,
    strategy: parsed.strategy,
    previous_summary: previousSummary,
    new_summary: result.newSummary,
    interest_savings_cents: result.interestSavingsCents,
    notes: parsed.notes || null,
    created_by: ctx.user.id,
  });

  if (insertError) throw new Error(insertError.message);

  await ctx.supabase
    .from("installments")
    .update({ status: "cancelled" })
    .eq("workspace_id", ctx.workspace.id)
    .eq("credit_account_id", parsed.creditId)
    .in("status", ["pending", "partial"]);

  if (result.newSummary.schedule.length > 0) {
    await ctx.supabase.from("installments").insert(
      result.newSummary.schedule.map((row, index) => ({
        workspace_id: ctx.workspace.id,
        credit_account_id: parsed.creditId,
        installment_number: index + 1,
        due_date: row.dueDate,
        principal_cents: row.principalCents,
        interest_cents: row.interestCents,
        fees_cents: row.feesCents,
        total_cents: row.totalCents,
        remaining_balance_cents: row.remainingBalanceCents,
        status: "pending",
      })),
    );
  }

  await ctx.supabase
    .from("credit_accounts")
    .update({
      current_balance_cents: newBalance,
      summary: result.newSummary,
      term_months: result.newSummary.termMonths || credit.term_months,
      status: newBalance === 0 ? "paid" : credit.status,
    })
    .eq("workspace_id", ctx.workspace.id)
    .eq("id", parsed.creditId);

  await ctx.supabase.from("audit_events").insert({
    workspace_id: ctx.workspace.id,
    actor_id: ctx.user.id,
    entity_type: "credit_account",
    entity_id: parsed.creditId,
    action: "extra_payment_applied",
    metadata: { amountCents, strategy: parsed.strategy, interestSavingsCents: result.interestSavingsCents },
  });

  revalidatePath(`/creditos/${parsed.creditId}`);
  revalidatePath("/dashboard");
}
