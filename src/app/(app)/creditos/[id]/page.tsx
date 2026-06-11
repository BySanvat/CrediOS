import Link from "next/link";
import { notFound } from "next/navigation";
import { ExtraPaymentForm } from "@/features/credits/extra-payment-form";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { formatMoneyCOP, type RateType } from "@/domain/finance";
import { recordPaymentAction } from "@/server/actions/payments.actions";
import { getAppContext } from "@/server/context";

export default async function CreditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAppContext();
  if (!ctx.configured) return null;

  const { id } = await params;
  const [{ data: credit }, { data: installments }, { data: payments }, { data: extraPayments }] =
    await Promise.all([
      ctx.supabase
        .from("credit_accounts")
        .select("*, clients(full_name)")
        .eq("workspace_id", ctx.workspace.id)
        .eq("id", id)
        .single(),
      ctx.supabase
        .from("installments")
        .select("*")
        .eq("workspace_id", ctx.workspace.id)
        .eq("credit_account_id", id)
        .order("installment_number"),
      ctx.supabase
        .from("payments")
        .select("*")
        .eq("workspace_id", ctx.workspace.id)
        .eq("credit_account_id", id)
        .order("payment_date", { ascending: false }),
      ctx.supabase
        .from("extra_payments")
        .select("*")
        .eq("workspace_id", ctx.workspace.id)
        .eq("credit_account_id", id)
        .order("payment_date", { ascending: false }),
    ]);

  if (!credit) notFound();

  const pendingInstallments = (installments ?? []).filter((item) =>
    ["pending", "partial"].includes(item.status),
  );
  const paidAmount = (payments ?? []).reduce((sum, payment) => sum + payment.amount_cents, 0);

  return (
    <>
      <PageHeader
        title={credit.name}
        description={`${credit.clients?.full_name ?? "Deuda personal"} · saldo ${formatMoneyCOP(
          credit.current_balance_cents,
        )}`}
        action={
          <Button asChild variant="secondary">
            <Link href="/creditos">
              Volver
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Principal" value={formatMoneyCOP(credit.principal_cents)} />
        <Metric label="Saldo" value={formatMoneyCOP(credit.current_balance_cents)} />
        <Metric label="Pagado" value={formatMoneyCOP(paidAmount)} />
        <Metric label="Estado" value={credit.status} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Plan de pagos</CardTitle>
            <CardDescription>Cuotas vigentes y canceladas por recalculos de abonos.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {(installments ?? []).length ? (
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs uppercase text-muted">
                  <tr>
                    <th className="py-2">#</th>
                    <th>Fecha</th>
                    <th>Capital</th>
                    <th>Interes</th>
                    <th>Cargos</th>
                    <th>Total</th>
                    <th>Saldo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {(installments ?? []).map((row) => (
                    <tr key={row.id} className="border-t border-border">
                      <td className="py-2 tabular">{row.installment_number}</td>
                      <td>{row.due_date}</td>
                      <td className="tabular">{formatMoneyCOP(row.principal_cents)}</td>
                      <td className="tabular">{formatMoneyCOP(row.interest_cents)}</td>
                      <td className="tabular">{formatMoneyCOP(row.fees_cents)}</td>
                      <td className="tabular font-medium">{formatMoneyCOP(row.total_cents)}</td>
                      <td className="tabular">{formatMoneyCOP(row.remaining_balance_cents)}</td>
                      <td>
                        <Badge tone={row.status === "paid" ? "green" : row.status === "cancelled" ? "neutral" : "amber"}>
                          {row.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState title="Sin cuotas" text="Esta deuda todavia no tiene plan de pagos generado." />
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Registrar pago</CardTitle>
              <CardDescription>Registra pagos manuales sobre cuotas o sobre el saldo.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={recordPaymentAction} className="grid gap-4">
                <input type="hidden" name="creditId" value={credit.id} />
                <Field label="Cuota opcional">
                  <Select name="installmentId" defaultValue={pendingInstallments[0]?.id ?? ""}>
                    <option value="">Sin cuota especifica</option>
                    {pendingInstallments.map((item) => (
                      <option key={item.id} value={item.id}>
                        #{item.installment_number} · {item.due_date} · {formatMoneyCOP(item.total_cents)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Valor">
                    <Input name="amount" inputMode="decimal" required />
                  </Field>
                  <Field label="Fecha">
                    <Input name="paymentDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
                  </Field>
                </div>
                <Field label="Metodo">
                  <Input name="method" placeholder="Efectivo, transferencia..." />
                </Field>
                <Field label="Notas">
                  <Textarea name="notes" />
                </Field>
                <Button type="submit">Registrar pago</Button>
              </form>
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
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{payment.payment_date}</p>
                      <p className="font-semibold tabular">{formatMoneyCOP(payment.amount_cents)}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted">{payment.method || "Sin metodo"} · {payment.notes}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Sin pagos" text="Registra pagos manuales para ver historial." />
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
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{payment.payment_date}</p>
                      <p className="font-semibold tabular">{formatMoneyCOP(payment.amount_cents)}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {payment.strategy} · ahorro estimado {formatMoneyCOP(payment.interest_savings_cents)}
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
