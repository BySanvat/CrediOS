"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { calculateLoanSummary, moneyToCents } from "@/domain/finance";
import type { LoanSummary } from "@/domain/finance";
import { creditFriendlyPath } from "@/lib/utils/slug";
import { getAppContext } from "@/server/context";

const simulationSchema = z.object({
  name: z.string().min(2),
  productType: z.string().default("fixed_installment_credit"),
  amount: z.string().min(1),
  rateValue: z.string().min(1),
  rateType: z.enum(["monthly_effective", "effective_annual", "nominal_annual"]),
  termMonths: z.coerce.number().int().min(1).max(600),
  startDate: z.string().min(8),
  monthlyFee: z.string().optional().default("0"),
  monthlyInsurance: z.string().optional().default("0"),
  upfrontFee: z.string().optional().default("0"),
  notes: z.string().optional(),
});

export async function saveSimulationAction(formData: FormData) {
  const ctx = await getAppContext();
  if (!ctx.configured) {
    redirect("/simulador?error=supabase");
  }

  const parsed = simulationSchema.parse(Object.fromEntries(formData));
  const principalCents = moneyToCents(parsed.amount);
  const monthlyFeeCents = moneyToCents(parsed.monthlyFee);
  const monthlyInsuranceCents = moneyToCents(parsed.monthlyInsurance);
  const upfrontFeeCents = moneyToCents(parsed.upfrontFee);
  const summary = calculateLoanSummary({
    principalCents,
    rateValue: parsed.rateValue,
    rateType: parsed.rateType,
    termMonths: parsed.termMonths,
    startDate: parsed.startDate,
    monthlyFeeCents,
    monthlyInsuranceCents,
    upfrontFeeCents,
  });

  const { error } = await ctx.supabase.from("simulations").insert({
    workspace_id: ctx.workspace.id,
    owner_id: ctx.user.id,
    name: parsed.name,
    product_type: parsed.productType,
    principal_cents: principalCents,
    rate_value: parsed.rateValue,
    rate_type: parsed.rateType,
    term_months: parsed.termMonths,
    start_date: parsed.startDate,
    monthly_fee_cents: monthlyFeeCents,
    monthly_insurance_cents: monthlyInsuranceCents,
    upfront_fee_cents: upfrontFeeCents,
    notes: parsed.notes || null,
    summary,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/simulaciones");
  redirect("/simulaciones");
}

export async function archiveSimulationAction(formData: FormData) {
  const ctx = await getAppContext();
  if (!ctx.configured) {
    redirect("/simulaciones");
  }

  const id = z.string().uuid().parse(formData.get("id"));
  const { error } = await ctx.supabase
    .from("simulations")
    .update({ archived_at: new Date().toISOString() })
    .eq("workspace_id", ctx.workspace.id)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/simulaciones");
}

export async function duplicateSimulationAction(formData: FormData) {
  const ctx = await getAppContext();
  if (!ctx.configured) {
    redirect("/simulaciones");
  }

  const id = z.string().uuid().parse(formData.get("id"));
  const { data: simulation, error } = await ctx.supabase
    .from("simulations")
    .select("*")
    .eq("workspace_id", ctx.workspace.id)
    .eq("id", id)
    .single();

  if (error || !simulation) {
    throw new Error(error?.message ?? "No se encontro la simulacion.");
  }

  const { error: insertError } = await ctx.supabase.from("simulations").insert({
    workspace_id: ctx.workspace.id,
    owner_id: ctx.user.id,
    name: `${simulation.name} copia`,
    product_type: simulation.product_type,
    principal_cents: simulation.principal_cents,
    rate_value: simulation.rate_value,
    rate_type: simulation.rate_type,
    term_months: simulation.term_months,
    start_date: simulation.start_date,
    monthly_fee_cents: simulation.monthly_fee_cents,
    monthly_insurance_cents: simulation.monthly_insurance_cents,
    upfront_fee_cents: simulation.upfront_fee_cents,
    notes: simulation.notes,
    summary: simulation.summary,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  revalidatePath("/simulaciones");
}

export async function convertSimulationToCreditAction(formData: FormData) {
  const ctx = await getAppContext();
  if (!ctx.configured) {
    redirect("/simulaciones");
  }

  const id = z.string().uuid().parse(formData.get("id"));
  const clientIdRaw = formData.get("clientId")?.toString();
  const clientId = clientIdRaw ? z.string().uuid().parse(clientIdRaw) : null;

  const { data: simulation, error } = await ctx.supabase
    .from("simulations")
    .select("*")
    .eq("workspace_id", ctx.workspace.id)
    .eq("id", id)
    .single();

  if (error || !simulation) {
    throw new Error(error?.message ?? "No se encontro la simulacion.");
  }

  const summary = simulation.summary as LoanSummary;
  const { data: credit, error: creditError } = await ctx.supabase
    .from("credit_accounts")
    .insert({
      workspace_id: ctx.workspace.id,
      client_id: clientId,
      owner_id: ctx.user.id,
      source_simulation_id: simulation.id,
      name: simulation.name,
      type: simulation.product_type,
      status: "active",
      principal_cents: simulation.principal_cents,
      current_balance_cents: simulation.principal_cents,
      rate_value: simulation.rate_value,
      rate_type: simulation.rate_type,
      term_months: simulation.term_months,
      start_date: simulation.start_date,
      monthly_fee_cents: simulation.monthly_fee_cents,
      monthly_insurance_cents: simulation.monthly_insurance_cents,
      summary,
      notes: simulation.notes,
      is_personal: !clientId,
    })
    .select("id")
    .single();

  if (creditError || !credit) {
    throw new Error(creditError?.message ?? "No se pudo crear la deuda administrada.");
  }

  const installments = summary.schedule.map((row) => ({
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
  }));

  const { error: installmentError } = await ctx.supabase.from("installments").insert(installments);
  if (installmentError) {
    throw new Error(installmentError.message);
  }

  await ctx.supabase.from("audit_events").insert({
    workspace_id: ctx.workspace.id,
    actor_id: ctx.user.id,
    entity_type: "credit_account",
    entity_id: credit.id,
    action: "simulation_converted",
    metadata: { sourceSimulationId: simulation.id },
  });

  revalidatePath("/creditos");
  redirect(creditFriendlyPath(credit.id, simulation.name));
}
