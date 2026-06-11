import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { EmptyState } from "@/components/ui/empty-state";
import { CurrencyInput } from "@/components/ui/financial-input";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { formatMoneyCOP } from "@/domain/finance";
import {
  buildBudgetProgress,
  buildCategoryTotals,
  buildPersonalInsights,
  getPeriodRange,
  getPreviousPeriodRange,
  periodFromSearchParam,
  summarizeTransactions,
} from "@/domain/personal-finance";
import { FinanceMetric, ProgressBar } from "@/features/personal-finance/finance-primitives";
import { PeriodTabs } from "@/features/personal-finance/period-tabs";
import { QuickAddComposer } from "@/features/personal-finance/quick-add-composer";
import {
  confirmRecurringRuleAction,
  createPersonalDebtAction,
  createPersonalDebtMovementAction,
} from "@/server/actions/personal-finance.actions";
import { getAppContext } from "@/server/context";
import { getPersonalCategories } from "@/server/personal-finance";

export default async function PersonalFinancePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const ctx = await getAppContext();
  if (!ctx.configured) return null;

  const params = await searchParams;
  const period = periodFromSearchParam(params.period ?? null);
  const range = getPeriodRange(period);
  const previousRange = getPreviousPeriodRange(period);
  const categories = await getPersonalCategories(ctx);

  const [transactions, previousTransactions, budgets, recurring, credits, manualDebts] = await Promise.all([
    ctx.supabase
      .from("personal_transactions")
      .select("*")
      .eq("workspace_id", ctx.workspace.id)
      .is("archived_at", null)
      .gte("occurred_at", range.start)
      .lte("occurred_at", range.end)
      .order("occurred_at", { ascending: false })
      .limit(200),
    ctx.supabase
      .from("personal_transactions")
      .select("*")
      .eq("workspace_id", ctx.workspace.id)
      .is("archived_at", null)
      .gte("occurred_at", previousRange.start)
      .lte("occurred_at", previousRange.end)
      .limit(200),
    ctx.supabase
      .from("personal_budgets")
      .select("*")
      .eq("workspace_id", ctx.workspace.id)
      .lte("active_from", range.end)
      .or(`active_to.is.null,active_to.gte.${range.start}`),
    ctx.supabase
      .from("recurring_rules")
      .select("*")
      .eq("workspace_id", ctx.workspace.id)
      .eq("active", true)
      .order("next_run_at", { ascending: true })
      .limit(5),
    ctx.supabase
      .from("credit_accounts")
      .select("id,current_balance_cents,status")
      .eq("workspace_id", ctx.workspace.id)
      .is("archived_at", null),
    ctx.supabase
      .from("personal_debts")
      .select("*")
      .eq("workspace_id", ctx.workspace.id)
      .is("archived_at", null)
      .order("opened_at", { ascending: false })
      .limit(12),
  ]);

  const periodTransactions = transactions.data ?? [];
  const summary = summarizeTransactions(periodTransactions);
  summary.net = summary.income - summary.expense;
  const debtBalance = (credits.data ?? []).reduce((sum, credit) => sum + credit.current_balance_cents, 0);
  const capacity = summary.net > 0 && debtBalance > 0 ? Math.round(summary.net * 0.35) : 0;
  const topCategories = buildCategoryTotals(periodTransactions, categories).slice(0, 5);
  const budgetProgress = buildBudgetProgress(budgets.data ?? [], periodTransactions, categories).slice(0, 4);
  const insights = buildPersonalInsights({
    transactions: periodTransactions,
    previousTransactions: previousTransactions.data ?? [],
    budgets: budgets.data ?? [],
    categories,
    debtBalanceCents: debtBalance,
  });

  const dueRecurring = (recurring.data ?? []).filter((rule) => rule.next_run_at <= new Date().toISOString().slice(0, 10));
  const manualDebtBalance = (manualDebts.data ?? []).reduce((sum, item) => sum + item.current_balance_cents, 0);

  return (
    <>
      <PageHeader
        title="Mis finanzas"
        description="Registra movimientos, entiende tu flujo y conecta tus decisiones con deudas y abonos."
        icon="wallet"
        action={<PeriodTabs basePath="/finanzas" active={period} />}
      />

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <QuickAddComposer categories={categories} />
        <Card className="bg-pastel-sand">
          <CardContent>
            <p className="text-sm text-muted">Capacidad de abono</p>
            <p className="mt-2 text-3xl font-semibold tabular">{formatMoneyCOP(capacity)}</p>
            <p className="mt-3 text-sm leading-6 text-muted">
              Estimacion conservadora usando 35% del flujo libre del periodo. No es una recomendacion automatica.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <FinanceMetric label="Ingresos" value={summary.income} tone="income" />
        <FinanceMetric label="Gastos" value={summary.expense} tone="expense" />
        <FinanceMetric label="Balance neto" value={summary.net} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Registros manuales</CardTitle>
            <CardDescription>
              Saldos flexibles sin tasa ni plan obligatorio: utiles para deudas informales, tarjetas o acumulados personales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
              <form action={createPersonalDebtAction} className="grid gap-4 rounded-[1.35rem] border border-border bg-background p-4">
                <p className="font-semibold">Nuevo registro simple</p>
                <Field label="Nombre">
                  <Input name="name" placeholder="Tarjeta, deuda familiar, gasto acumulado..." required />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Saldo inicial">
                    <CurrencyInput name="amount" required />
                  </Field>
                  <DatePickerField name="openedAt" label="Fecha" defaultValue={new Date().toISOString().slice(0, 10)} required />
                </div>
                <Field label="Notas">
                  <Textarea name="notes" placeholder="Contexto del registro manual" />
                </Field>
                <Button type="submit">Crear registro</Button>
              </form>

              <div className="grid gap-3">
                <div className="rounded-[1.35rem] border border-border bg-surface-warm p-4">
                  <p className="text-sm text-muted">Saldo total manual</p>
                  <p className="mt-1 text-3xl font-semibold tabular">{formatMoneyCOP(manualDebtBalance)}</p>
                </div>
                {(manualDebts.data ?? []).length ? (
                  (manualDebts.data ?? []).map((debt) => (
                    <details key={debt.id} className="rounded-[1.2rem] border border-border bg-card p-4">
                      <summary className="cursor-pointer list-none">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold">{debt.name}</p>
                            <p className="text-sm text-muted">{debt.opened_at}</p>
                          </div>
                          <Badge tone={debt.status === "closed" ? "green" : "teal"}>
                            {formatMoneyCOP(debt.current_balance_cents)}
                          </Badge>
                        </div>
                      </summary>
                      <form action={createPersonalDebtMovementAction} className="mt-4 grid gap-3 border-t border-border pt-4">
                        <input type="hidden" name="debtId" value={debt.id} />
                        <div className="grid gap-3 sm:grid-cols-3">
                          <Field label="Movimiento">
                            <Select name="direction" defaultValue="decrease">
                              <option value="decrease">Disminuir saldo</option>
                              <option value="increase">Aumentar saldo</option>
                            </Select>
                          </Field>
                          <Field label="Valor">
                            <CurrencyInput name="amount" required />
                          </Field>
                          <DatePickerField name="movementDate" label="Fecha" defaultValue={new Date().toISOString().slice(0, 10)} required />
                        </div>
                        <Field label="Nota">
                          <Input name="note" placeholder="Pago, ajuste, compra..." />
                        </Field>
                        <Button type="submit" variant="secondary">Registrar movimiento</Button>
                      </form>
                    </details>
                  ))
                ) : (
                  <EmptyState title="Sin registros manuales" text="Crea un saldo simple para controlarlo sin cuotas ni intereses." />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categorias top</CardTitle>
            <CardDescription>Distribucion de gastos del periodo.</CardDescription>
          </CardHeader>
          <CardContent>
            {topCategories.length ? (
              <div className="grid gap-4">
                {topCategories.map((item) => (
                  <div key={item.category?.id ?? "uncategorized"} className="grid gap-2">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium">{item.category?.name ?? "Sin categoria"}</p>
                      <p className="font-semibold tabular">{formatMoneyCOP(item.total)}</p>
                    </div>
                    <ProgressBar value={summary.expense ? item.total / summary.expense : 0} tone="blue" />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Sin gastos en el periodo" text="Registra movimientos para ver categorias dominantes." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Presupuestos criticos</CardTitle>
            <CardDescription>Los mas cerca de agotarse aparecen primero.</CardDescription>
          </CardHeader>
          <CardContent>
            {budgetProgress.length ? (
              <div className="grid gap-4">
                {budgetProgress.map((item) => (
                  <div key={item.budget.id} className="grid gap-2">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium">{item.category?.name ?? "Categoria"}</p>
                      <Badge tone={item.ratio >= 1 ? "amber" : "green"}>
                        {Math.round(item.ratio * 100)}%
                      </Badge>
                    </div>
                    <ProgressBar value={item.ratio} tone={item.ratio >= 1 ? "pink" : "green"} />
                    <p className="text-sm text-muted">Restante: {formatMoneyCOP(item.remaining)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Sin presupuestos"
                text="Crea presupuestos por categoria para detectar desvios a tiempo."
                action={<Button asChild href="/finanzas/presupuestos">Crear presupuesto</Button>}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Insights</CardTitle>
            <CardDescription>Lecturas deterministicas del periodo.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {insights.map((insight) => (
              <div key={insight.title} className="rounded-[1.2rem] border border-border bg-surface-warm p-4">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{insight.title}</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted">{insight.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fijos por confirmar</CardTitle>
            <CardDescription>Ingresos y gastos fijos no se suman ni restan hasta que confirmes.</CardDescription>
          </CardHeader>
          <CardContent>
            {dueRecurring.length ? (
              <div className="grid gap-3">
                {dueRecurring.map((rule) => (
                  <div key={rule.id} className="rounded-[1.2rem] border border-border p-4">
                    <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{rule.note_template}</p>
                      <p className="text-sm text-muted">Pendiente desde {rule.next_run_at}</p>
                    </div>
                    <p className="font-semibold tabular">{formatMoneyCOP(rule.amount_cents)}</p>
                    </div>
                    <form action={confirmRecurringRuleAction} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                      <input type="hidden" name="id" value={rule.id} />
                      <DatePickerField name="occurredAt" label="Fecha" defaultValue={new Date().toISOString().slice(0, 10)} required />
                      <Button type="submit" size="sm">Confirmar {rule.type === "income" ? "cobro" : "pago"}</Button>
                    </form>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Sin fijos pendientes"
                text="Los recurrentes apareceran aqui cuando llegue su fecha para que confirmes el movimiento."
                action={<Button asChild href="/finanzas/recurrentes">Crear recurrente</Button>}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild href="/finanzas/movimientos" variant="secondary">
          Ver movimientos
        </Button>
        <Button asChild href="/finanzas/reportes" variant="secondary">
          Reportes
        </Button>
      </div>
    </>
  );
}
