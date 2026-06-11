import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMoneyCOP } from "@/domain/finance";
import { getPeriodRange, summarizeTransactions } from "@/domain/personal-finance";
import { getAppContext } from "@/server/context";

export default async function DashboardPage() {
  const ctx = await getAppContext();
  if (!ctx.configured) return null;

  const [
    simulations,
    clients,
    credits,
    installments,
    payments,
    reminders,
    personalTransactions,
  ] = await Promise.all([
    ctx.supabase.from("simulations").select("id", { count: "exact", head: true }).eq("workspace_id", ctx.workspace.id).is("archived_at", null),
    ctx.supabase.from("clients").select("id", { count: "exact", head: true }).eq("workspace_id", ctx.workspace.id).is("archived_at", null),
    ctx.supabase.from("credit_accounts").select("id,current_balance_cents,principal_cents,status,summary").eq("workspace_id", ctx.workspace.id).is("archived_at", null),
    ctx.supabase.from("installments").select("id,total_cents,due_date,status").eq("workspace_id", ctx.workspace.id).in("status", ["pending", "partial"]).order("due_date", { ascending: true }).limit(8),
    ctx.supabase.from("payments").select("amount_cents,interest_cents").eq("workspace_id", ctx.workspace.id),
    ctx.supabase.from("reminders").select("id,title,due_date,status").eq("workspace_id", ctx.workspace.id).eq("status", "pending").order("due_date", { ascending: true }).limit(6),
    ctx.supabase
      .from("personal_transactions")
      .select("type,amount_cents,occurred_at,archived_at")
      .eq("workspace_id", ctx.workspace.id)
      .is("archived_at", null)
      .gte("occurred_at", getPeriodRange("month").start)
      .lte("occurred_at", getPeriodRange("month").end)
      .limit(200),
  ]);

  const activeCredits = credits.data ?? [];
  const pendingInstallments = installments.data ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const saldo = activeCredits.reduce((sum, item) => sum + item.current_balance_cents, 0);
  const capital = activeCredits.reduce((sum, item) => sum + item.principal_cents, 0);
  const interestProjected = activeCredits.reduce((sum, item) => {
    const summary = item.summary as { totalInterestCents?: number } | null;
    return sum + (summary?.totalInterestCents ?? 0);
  }, 0);
  const interestPaid = (payments.data ?? []).reduce((sum, item) => sum + item.interest_cents, 0);
  const lateCount = pendingInstallments.filter((item) => item.due_date < today).length;
  const personalSummary = summarizeTransactions(personalTransactions.data ?? []);
  personalSummary.net = personalSummary.income - personalSummary.expense;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Resumen operativo de simulaciones, deudas, clientes, pagos y recordatorios."
        action={
          <Button asChild>
            <Link href="/simulador">Simular credito</Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric mark="S" label="Simulaciones" value={String(simulations.count ?? 0)} />
        <Metric mark="C" label="Clientes" value={String(clients.count ?? 0)} />
        <Metric mark="D" label="Deudas activas" value={String(activeCredits.filter((c) => c.status === "active").length)} />
        <Metric mark="V" label="Vencidas" value={String(lateCount)} tone={lateCount ? "text-amber-600" : ""} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MoneyMetric label="Capital registrado" value={capital} />
        <MoneyMetric label="Saldo pendiente" value={saldo} />
        <MoneyMetric label="Intereses proyectados" value={interestProjected} />
        <MoneyMetric label="Intereses pagados" value={interestPaid} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="bg-[linear-gradient(135deg,var(--card),var(--surface-warm))]">
          <CardHeader>
            <CardTitle>Finanzas personales</CardTitle>
            <CardDescription>Flujo personal del mes actual.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <MoneyMetric label="Ingresos" value={personalSummary.income} />
              <MoneyMetric label="Gastos" value={personalSummary.expense} />
              <MoneyMetric label="Balance" value={personalSummary.net} />
            </div>
            <div className="mt-5">
              <Button asChild href="/finanzas" variant="secondary">
                Abrir finanzas
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Proximas cuotas</CardTitle>
            <CardDescription>Cuotas pendientes o parciales ordenadas por fecha.</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingInstallments.length ? (
              <div className="grid gap-3">
                {pendingInstallments.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-md border border-border p-3">
                    <div>
                      <p className="font-medium">{item.due_date}</p>
                      <p className="text-sm text-muted">{item.status === "partial" ? "Pago parcial" : "Pendiente"}</p>
                    </div>
                    <p className="font-semibold tabular">{formatMoneyCOP(item.total_cents)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Sin cuotas pendientes" text="Crea una deuda administrada para ver proximas fechas de pago." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recordatorios</CardTitle>
            <CardDescription>Alertas internas pendientes.</CardDescription>
          </CardHeader>
          <CardContent>
            {(reminders.data ?? []).length ? (
              <div className="grid gap-3">
                {(reminders.data ?? []).map((item) => (
                  <div key={item.id} className="rounded-md border border-border p-3">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted">{item.due_date}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Sin recordatorios" text="Crea recordatorios internos para fechas importantes." />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Metric({
  mark,
  label,
  value,
  tone,
}: {
  mark: string;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className={`mt-1 text-2xl font-semibold tabular ${tone ?? ""}`}>{value}</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-warm text-xs font-semibold text-accent">
          {mark}
        </span>
      </CardContent>
    </Card>
  );
}

function MoneyMetric({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-muted">{label}</p>
        <p className="mt-1 text-xl font-semibold tabular">{formatMoneyCOP(value)}</p>
      </CardContent>
    </Card>
  );
}
