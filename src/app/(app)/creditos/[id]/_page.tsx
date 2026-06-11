import Link from "next/link";
import { notFound } from "next/navigation";
import { ExtraPaymentForm } from "@/features/credits/extra-payment-form";
import { IncreaseCreditDialog } from "@/features/credits/increase-credit-dialog";
import { SmartPaymentDialog } from "@/features/credits/smart-payment-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
          <Button asChild variant="secondary">
            <Link href="/creditos">Volver</Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-5">
        <Metric label="Principal" value={formatMoneyCOP(credit.principal_cents)} />
        <Metric label="Capital pendiente" value={formatMoneyCOP(credit.current_balance_cents)} />
        <Metric label="Interes corrido" value={formatMoneyCOP(payoffQuote.accruedInterestCents)} />
        <Metric label="Pago total hoy" value={formatMoneyCOP(payoffQuote.payoffCents)} />
        <Metric label="Pagado" value={formatMoneyCOP(paidAmount)} />
      </div>

      <Card className="mt-4">
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium">Saldo estimado al dia de hoy</p>
            <p className="text-sm text-muted">
              Incluye intereses corridos desde {payoffQuote.accruesFromDate} hasta {payoffQuote.asOfDate}.
              El calculo es bajo demanda y no hace escrituras diarias.
            </p>
          </div>
          <p className="text-2xl font-semibold tabular text-accent">{formatMoneyCOP(payoffQuote.payoffCents)}</p>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Acciones rapidas</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Usa + para aumentar el saldo registrado y - para pagar o disminuir la cuota pendiente mas cercana.
            </p>
          </div>
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

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pago inteligente</CardTitle>
              <CardDescription>
                CrediOS elige automaticamente la cuota vencida o pendiente mas cercana.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nextPayable ? (
                <div className="grid gap-4">
                  <div className="rounded-3xl border border-border bg-muted/30 p-4">
                    <p className="text-sm text-muted">
                      Proxima cuota pagable: #{nextPayable.installment_number} - {nextPayable.due_date}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tabular">
                      {formatMoneyCOP(nextPayableRemainingCents)}
                    </p>
                  </div>
                  <SmartPaymentDialog
                    creditId={credit.id}
                    installmentId={nextPayable.id}
                    installmentLabel={`Cuota #${nextPayable.installment_number} - ${nextPayable.due_date}`}
                    requiredCents={nextPayableRemainingCents}
                    payoffCents={payoffQuote.payoffCents}
                  />
                </div>
              ) : (
                <EmptyState title="Sin cuotas por pagar" text="No hay cuotas pendientes para registrar pago." />
              )}
            </CardContent>
          </Card>

          <ExtraPaymentForm
            creditId={credit.id}
            currentBalanceCents={credit.current_balance_cents}
            rateValue={credit.rate_value}
            rateType={credit.rate_type as RateType}
            termMonths={Math.max(1, pendingInstallments.length || credit.term_months)}
            monthlyFeeCents={credit.monthly_fee_cents}
            monthlyInsuranceCents={credit.monthly_insurance_cents}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pagos registrados</CardTitle>
          </CardHeader>
          <CardContent>
            {(payments ?? []).length ? (
              <div className="grid gap-3">
                {(payments ?? []).map((payment) => (
                  <div key={payment.id} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{payment.payment_date}</p>
                      <p className="font-semibold tabular">{formatMoneyCOP(payment.amount_cents)}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted">{payment.method || "Sin metodo"} - {payment.notes}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Sin pagos" text="Registra pagos para ver historial." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Abonos registrados</CardTitle>
          </CardHeader>
          <CardContent>
            {(extraPayments ?? []).length ? (
              <div className="grid gap-3">
                {(extraPayments ?? []).map((payment) => (
                  <div key={payment.id} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{payment.payment_date}</p>
                      <p className="font-semibold tabular">{formatMoneyCOP(payment.amount_cents)}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {payment.strategy} - ahorro estimado {formatMoneyCOP(payment.interest_savings_cents)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Sin abonos" text="Simula y aplica abonos para comparar estrategias." />
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
