"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { calculateLoanSummary, moneyToCents } from "@/domain/finance";
import { creditFriendlyPath } from "@/lib/utils/slug";
import { getAppContext } from "@/server/context";

const creditSchema = z.object({
  name: z.string().min(2),
  clientId: z.string().optional(),
  amount: z.string().min(1),
  rateValue: z.string().min(1),
  rateType: z.enum(["monthly_effective", "effective_annual", "nominal_annual"]),
  termMonths: z.coerce.number().int().min(1).max(600),
  startDate: z.string().min(8),
  monthlyFee: z.string().optional().default("0"),
  monthlyInsurance: z.string().optional().default("0"),
  notes: z.string().optional(),
});

export async function createCreditAction(formData: FormData) {
  const ctx = await getAppContext();
  if (!ctx.configured) redirect("/creditos");

  const parsed = creditSchema.parse(Object.fromEntries(formData));
  const clientId = parsed.clientId ? z.string().uuid().parse(parsed.clientId) : null;
  const principalCents = moneyToCents(parsed.amount);
  const monthlyFeeCents = moneyToCents(parsed.monthlyFee);
  const monthlyInsuranceCents = moneyToCents(parsed.monthlyInsurance);
  const summary = calculateLoanSummary({
    principalCents,
    rateValue: parsed.rateValue,
    rateType: parsed.rateType,
    termMonths: parsed.termMonths,
    startDate: parsed.startDate,
    monthlyFeeCents,
    monthlyInsuranceCents,
  });

  const { data: credit, error } = await ctx.supabase
    .from("credit_accounts")
    .insert({
      workspace_id: ctx.workspace.id,
      client_id: clientId,
      owner_id: ctx.user.id,
      name: parsed.name,
      type: "fixed_installment_credit",
      status: "active",
      principal_cents: principalCents,
      current_balance_cents: principalCents,
      rate_value: parsed.rateValue,
      rate_type: parsed.rateType,
      term_months: parsed.termMonths,
      start_date: parsed.startDate,
      monthly_fee_cents: monthlyFeeCents,
      monthly_insurance_cents: monthlyInsuranceCents,
      summary,
      notes: parsed.notes || null,
      is_personal: !clientId,
    })
    .select("id")
    .single();

  if (error || !credit) throw new Error(error?.message ?? "No se pudo crear la deuda.");

  const { error: installmentError } = await ctx.supabase.from("installments").insert(
    summary.schedule.map((row) => ({
      workspace_id: ctx.workspace.id,
      credit_account_id: credit.id,
      installment_number: row.installmentNumber,
      due_date: row.dueDate,
      principal_cents: row.principalCents,
      interest_cents: row.interestCents,
      fees_cents: row.feesCents,
      total_cents: row.totalCents,
      remaining_balance_cents: row.remainingBalanceCents,
      status: "pending",
    })),
  );

  if (installmentError) throw new Error(installmentError.message);

  await ctx.supabase.from("audit_events").insert({
    workspace_id: ctx.workspace.id,
    actor_id: ctx.user.id,
    entity_type: "credit_account",
    entity_id: credit.id,
    action: "credit_created",
    metadata: { source: "manual" },
  });

  revalidatePath("/creditos");
  redirect(creditFriendlyPath(credit.id, parsed.name));
}

export async function archiveCreditAction(formData: FormData) {
  const ctx = await getAppContext();
  if (!ctx.configured) return;

  const id = z.string().uuid().parse(formData.get("id"));
  const { error } = await ctx.supabase
    .from("credit_accounts")
    .update({ status: "archived", archived_at: new Date().toISOString() })
    .eq("workspace_id", ctx.workspace.id)
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/creditos");
}
