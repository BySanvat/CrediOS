import { notFound } from "next/navigation";
import { CreditHistoryDialog } from "@/features/credits/credit-history-dialog";
import { ExtraPaymentForm } from "@/features/credits/extra-payment-form";
import { IncreaseCreditDialog } from "@/features/credits/increase-credit-dialog";
import { SmartPaymentDialog } from "@/features/credits/smart-payment-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  calculatePayoffQuote,
  formatMoneyCOP,
  getInstallmentRemainingCents,
  getNextPayableInstallment,
  type RateType,
} from "@/domain/finance";
import { resolveCreditIdFromSlug } from "@/lib/utils/slug";
import { getAppContext } from "@/server/context";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function CreditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAppContext();
  if (!ctx.configured) return null;

  const { id: identifier } = await params;
  let creditId = identifier;

  if (!uuidPattern.test(identifier)) {
    const { data: candidates } = await ctx.supabase
      .from("credit_accounts")
      .select("id,name,created_at")
      .eq("workspace_id", ctx.workspace.id)
      .is("archived_at", null);
    const resolved = resolveCreditIdFromSlug(identifier, candidates ?? []);
    if (!resolved) notFound();
    creditId = resolved;
  }

  const [{ data: credit }, { data: installments }, { data: payments }, { data: extraPayments }] =
    await Promise.all([
      ctx.supabase
        .from("credit_accounts")
        .select("*, clients(full_name)")
        .eq("workspace_id", ctx.workspace.id)
        .eq("id", creditId)
        .single(),
      ctx.supabase
        .from("installments")
        .select("*")
        .eq("workspace_id", ctx.workspace.id)
        .eq("credit_account_id", creditId)
        .order("installment_number"),
      ctx.supabase
        .from("payments")
        .select("*")
        .eq("workspace_id", ctx.workspace.id)
        .eq("credit_account_id", creditId)
        .order("payment_date", { ascending: false }),
      ctx.supabase
        .from("extra_payments")
        .select("*")
        .eq("workspace_id", ctx.workspace.id)
        .eq("credit_account_id", creditId)
        .order("payment_date", { ascending: false }),
    ]);

  if (!credit) notFound();

  const pendingInstallments = (installments ?? []).filter((item) =>
    ["pending", "partial"].includes(item.status),
  );
  const paidAmount = (payments ?? []).reduce((sum, payment) => sum + payment.amount_cents, 0);
  const today = new Date().toISOString().slice(0, 10);
  const nextPayable = getNextPayableInstallment(pendingInstallments, today, payments ?? []);
  const nextPayableRemainingCents = nextPayable
    ? getInstallmentRemainingCents(nextPayable, payments ?? [])
    : 0;
  const lastPaymentDate = (payments ?? [])
    .map((payment) => payment.payment_date)
    .filter(Boolean)
    .sort()
    .at(-1);
  const payoffQuote = calculatePayoffQuote({
    currentBalanceCents: credit.current_balance_cents,
    rateValue: credit.rate_value,
    rateType: credit.rate_type as RateType,
    accruesFromDate: lastPaymentDate ?? credit.start_date,
    asOfDate: today,
  });

  return (
    <>
      <PageHeader
        title={credit.name}
        description={`${credit.clients?.full_name ?? "Deuda personal"} - saldo ${formatMoneyCOP(
          credit.current_balance_cents,
        )}`}
        icon="credit"
        action={
          <div className="flex items-center gap-3">
            <IncreaseCreditDialog
              creditId={credit.id}
              currentBalanceCents={credit.current_balance_cents}
              defaultTermMonths={Math.max(1, pendingInstallments.length || credit.term_months)}
            />
            {nextPayable ? (
              <SmartPaymentDialog
                creditId={credit.id}
                installmentId={nextPayable.id}
                installmentLabel={`Cuota #${nextPayable.installment_number} - ${nextPayable.due_date}`}
                requiredCents={nextPayableRemainingCents}
                payoffCents={payoffQuote.payoffCents}
                trigger="round"
              />
            ) : null}
          </div>
        }
      />

      <Card className="mt-4">
        <CardContent className="grid gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium">Resumen del credito</p>
              <p className="mt-1 text-sm text-muted">
                Incluye interes corrido desde {payoffQuote.accruesFromDate} hasta {payoffQuote.asOfDate}.
              </p>
            </div>
            <p className="text-2xl font-semibold tabular text-accent">{formatMoneyCOP(payoffQuote.payoffCents)}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Metric label="Monto inicial" value={formatMoneyCOP(credit.principal_cents)} />
            <Metric label="Capital pendiente" value={formatMoneyCOP(credit.current_balance_cents)} />
            <Metric label="Intereses cobrados" value={formatMoneyCOP(payoffQuote.accruedInterestCents)} />
            <Metric label="Pago total hoy" value={formatMoneyCOP(payoffQuote.payoffCents)} />
            <Metric label="Pagado a hoy" value={formatMoneyCOP(paidAmount)} />
          </div>
          <p className="text-xs leading-5 text-muted">
            El calculo de interes corrido es bajo demanda y no hace escrituras diarias.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <p className="text-sm font-semibold">Acciones</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Gestiona pagos, abonos e historial sin alargar la vista principal.
            </p>
          </div>
          <div className="grid gap-2 sm:col-span-2 sm:grid-cols-3">
            <ExtraPaymentForm
              creditId={credit.id}
              currentBalanceCents={credit.current_balance_cents}
              rateValue={credit.rate_value}
              rateType={credit.rate_type as RateType}
              termMonths={Math.max(1, pendingInstallments.length || credit.term_months)}
              monthlyFeeCents={credit.monthly_fee_cents}
              monthlyInsuranceCents={credit.monthly_insurance_cents}
            />
            <CreditHistoryDialog title="Pagos registrados" type="payments" rows={payments ?? []} />
            <CreditHistoryDialog title="Abonos registrados" type="extra" rows={extraPayments ?? []} />
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 transition hover:bg-surface-warm">
              <div>
                <p className="text-lg font-semibold">Plan de pagos</p>
                <p className="mt-1 text-sm leading-6 text-muted">Cuotas vigentes y canceladas por recalculos de abonos.</p>
              </div>
              <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted">
                Ver plan
              </span>
            </summary>
          <CardContent className="overflow-x-auto border-t border-border">
            {(installments ?? []).length ? (
              <table className="w-full min-w-[820px] border-separate border-spacing-y-1 text-left text-sm">
                <thead className="text-xs uppercase text-muted">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Capital</th>
                    <th className="px-3 py-2">Interes</th>
                    <th className="px-3 py-2">Cargos</th>
                    <th className="px-3 py-2">Total</th>
                    <th className="px-3 py-2">Saldo</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2">Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {(installments ?? []).map((row) => (
                    <tr key={row.id} className="odd:bg-card even:bg-accent-soft/45 dark:odd:bg-surface-elevated dark:even:bg-accent-soft/20">
                      <td className="rounded-l-2xl px-3 py-3 tabular">{row.installment_number}</td>
                      <td className="px-3 py-3">{row.due_date}</td>
                      <td className="px-3 py-3 tabular">{formatMoneyCOP(row.principal_cents)}</td>
                      <td className="px-3 py-3 tabular">{formatMoneyCOP(row.interest_cents)}</td>
                      <td className="px-3 py-3 tabular">{formatMoneyCOP(row.fees_cents)}</td>
                      <td className="px-3 py-3 tabular font-medium">{formatMoneyCOP(row.total_cents)}</td>
                      <td className="px-3 py-3 tabular">{formatMoneyCOP(row.remaining_balance_cents)}</td>
                      <td className="px-3 py-3">
                        <Badge tone={row.status === "paid" ? "green" : row.status === "cancelled" ? "neutral" : "amber"}>
                          {row.status}
                        </Badge>
                      </td>
                      <td className="rounded-r-2xl px-3 py-3">
                        {nextPayable?.id === row.id ? (
                          <SmartPaymentDialog
                            creditId={credit.id}
                            installmentId={row.id}
                            installmentLabel={`Cuota #${row.installment_number} - ${row.due_date}`}
                            requiredCents={nextPayableRemainingCents}
                            payoffCents={payoffQuote.payoffCents}
                          />
                        ) : (
                          <span className="text-xs text-muted">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState title="Sin cuotas" text="Esta deuda todavia no tiene plan de pagos generado." />
            )}
          </CardContent>
          </details>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cuota proxima</CardTitle>
            <CardDescription>La accion - superior abre el pago con esta cuota cargada automaticamente.</CardDescription>
          </CardHeader>
          <CardContent>
            {nextPayable ? (
              <div className="rounded-3xl border border-border bg-muted/30 p-4">
                <p className="text-sm text-muted">
                  #{nextPayable.installment_number} - {nextPayable.due_date}
                </p>
                <p className="mt-2 text-2xl font-semibold tabular">{formatMoneyCOP(nextPayableRemainingCents)}</p>
              </div>
            ) : (
              <EmptyState title="Sin cuotas por pagar" text="No hay cuotas pendientes para registrar pago." />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-muted">{label}</p>
        <p className="mt-1 text-xl font-semibold tabular">{value}</p>
      </CardContent>
    </Card>
  );
}
