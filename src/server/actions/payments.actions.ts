"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  calculateLoanSummary,
  getInstallmentRemainingCents,
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

const smartPaymentSchema = z.object({
  creditId: z.string().uuid(),
  installmentId: z.string().uuid(),
  amount: z.string().min(1),
  paymentDate: z.string().min(8),
  method: z.string().optional(),
  notes: z.string().optional(),
  extraStrategy: z.enum(["applied_reduce_term", "applied_reduce_payment"]).optional().or(z.literal("")),
});

export async function recordSmartPaymentAction(formData: FormData) {
  const ctx = await getAppContext();
  if (!ctx.configured) return;

  const parsed = smartPaymentSchema.parse(Object.fromEntries(formData));
  const amountCents = moneyToCents(parsed.amount);
  if (amountCents <= 0) throw new Error("El pago debe ser mayor a cero.");

  const [{ data: credit, error: creditError }, { data: installment, error: installmentError }, { data: payments }, { data: pendingInstallments }] =
    await Promise.all([
      ctx.supabase
        .from("credit_accounts")
        .select("*")
        .eq("workspace_id", ctx.workspace.id)
        .eq("id", parsed.creditId)
        .single(),
      ctx.supabase
        .from("installments")
        .select("*")
        .eq("workspace_id", ctx.workspace.id)
        .eq("credit_account_id", parsed.creditId)
        .eq("id", parsed.installmentId)
        .single(),
      ctx.supabase
        .from("payments")
        .select("installment_id,amount_cents")
        .eq("workspace_id", ctx.workspace.id)
        .eq("installment_id", parsed.installmentId),
      ctx.supabase
        .from("installments")
        .select("*")
        .eq("workspace_id", ctx.workspace.id)
        .eq("credit_account_id", parsed.creditId)
        .in("status", ["pending", "partial"])
        .order("due_date", { ascending: true }),
    ]);

  if (creditError || !credit) throw new Error(creditError?.message ?? "No se encontro la deuda.");
  if (installmentError || !installment) throw new Error(installmentError?.message ?? "No se encontro la cuota.");

  const remainingCents = getInstallmentRemainingCents(installment, payments ?? []);
  if (remainingCents <= 0) throw new Error("La cuota seleccionada ya esta cubierta.");

  const paymentAmountCents = Math.min(amountCents, remainingCents);
  const extraAmountCents = Math.max(0, amountCents - remainingCents);
  const paidBefore = (payments ?? []).reduce((sum, payment) => sum + payment.amount_cents, 0);
  const previousRatio = Math.min(1, paidBefore / Math.max(1, installment.total_cents));
  const newRatio = Math.min(1, (paidBefore + paymentAmountCents) / Math.max(1, installment.total_cents));
  const principalPaidCents = Math.max(0, Math.round(installment.principal_cents * (newRatio - previousRatio)));
  const balanceAfterInstallmentCents = Math.max(0, credit.current_balance_cents - principalPaidCents);

  let previousSummary = null;
  let newSummary = null;
  let interestSavingsCents = 0;
  const strategy = extraAmountCents > 0 ? parsed.extraStrategy : "";

  if (extraAmountCents > 0) {
    if (!strategy) {
      throw new Error("El excedente debe aplicarse como abono a capital: elige reducir cuota o reducir plazo.");
    }
    if (extraAmountCents > balanceAfterInstallmentCents) {
      throw new Error("El excedente no puede ser mayor al saldo pendiente despues de la cuota.");
    }

    const remainingTermMonths = Math.max(
      1,
      (pendingInstallments ?? []).filter((item) => item.id !== installment.id).length || credit.term_months,
    );
    const loan: LoanInput = {
      principalCents: balanceAfterInstallmentCents,
      rateValue: credit.rate_value,
      rateType: credit.rate_type,
      termMonths: remainingTermMonths,
      startDate: parsed.paymentDate,
      monthlyFeeCents: credit.monthly_fee_cents,
      monthlyInsuranceCents: credit.monthly_insurance_cents,
      upfrontFeeCents: 0,
    };

    previousSummary = calculateLoanSummary(loan);
    const result =
      strategy === "applied_reduce_term"
        ? simulateExtraPaymentReduceTerm({ loan, extraPaymentCents: extraAmountCents })
        : simulateExtraPaymentReducePayment({ loan, extraPaymentCents: extraAmountCents });
    newSummary = result.newSummary;
    interestSavingsCents = result.interestSavingsCents;
  }

  const { error } = await ctx.supabase.rpc("record_installment_payment_with_optional_extra", {
    p_workspace_id: ctx.workspace.id,
    p_credit_account_id: parsed.creditId,
    p_installment_id: parsed.installmentId,
    p_payment_amount_cents: paymentAmountCents,
    p_extra_amount_cents: extraAmountCents,
    p_payment_date: parsed.paymentDate,
    p_method: parsed.method || null,
    p_notes: parsed.notes || null,
    p_extra_strategy: strategy || null,
    p_expected_current_balance_cents: credit.current_balance_cents,
    p_previous_summary: previousSummary,
    p_new_summary: newSummary,
    p_interest_savings_cents: interestSavingsCents,
  });

  if (error) {
    if (error.message.includes("record_installment_payment_with_optional_extra")) {
      throw new Error("Falta aplicar la migracion 0005_smart_installment_payment_rpc.sql en Supabase.");
    }
    throw new Error(error.message);
  }

  revalidatePath(`/creditos/${parsed.creditId}`);
  revalidatePath("/creditos");
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
