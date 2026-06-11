import { Download } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMoneyCOP } from "@/domain/finance";
import {
  buildCategoryTotals,
  buildPersonalInsights,
  getPeriodRange,
  getPreviousPeriodRange,
  periodFromSearchParam,
  summarizeTransactions,
} from "@/domain/personal-finance";
import { FinanceMetric, ProgressBar } from "@/features/personal-finance/finance-primitives";
import { PeriodTabs } from "@/features/personal-finance/period-tabs";
import { getAppContext } from "@/server/context";
import { getPersonalCategories } from "@/server/personal-finance";

export default async function PersonalReportsPage({
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
  const [transactions, previousTransactions, budgets, credits] = await Promise.all([
    ctx.supabase
      .from("personal_transactions")
      .select("*")
      .eq("workspace_id", ctx.workspace.id)
      .is("archived_at", null)
      .gte("occurred_at", range.start)
      .lte("occurred_at", range.end)
      .order("occurred_at", { ascending: false })
      .limit(500),
    ctx.supabase
      .from("personal_transactions")
      .select("*")
      .eq("workspace_id", ctx.workspace.id)
      .is("archived_at", null)
      .gte("occurred_at", previousRange.start)
      .lte("occurred_at", previousRange.end)
      .limit(500),
    ctx.supabase
      .from("personal_budgets")
      .select("*")
      .eq("workspace_id", ctx.workspace.id)
      .lte("active_from", range.end)
      .or(`active_to.is.null,active_to.gte.${range.start}`),
    ctx.supabase
      .from("credit_accounts")
      .select("current_balance_cents")
      .eq("workspace_id", ctx.workspace.id)
      .is("archived_at", null),
  ]);

  const periodTransactions = transactions.data ?? [];
  const summary = summarizeTransactions(periodTransactions);
  summary.net = summary.income - summary.expense;
  const debtBalance = (credits.data ?? []).reduce((sum, credit) => sum + credit.current_balance_cents, 0);
  const categoryTotals = buildCategoryTotals(periodTransactions, categories);
  const insights = buildPersonalInsights({
    transactions: periodTransactions,
    previousTransactions: previousTransactions.data ?? [],
    budgets: budgets.data ?? [],
    categories,
    debtBalanceCents: debtBalance,
  });

  return (
    <>
      <PageHeader
        title="Reportes"
        description="Resumen limpio del periodo y export CSV para analisis externo."
        action={<PeriodTabs basePath="/finanzas/reportes" active={period} />}
      />

      <div className="flex justify-end">
        <Button asChild href={`/finanzas/reportes/export?period=${period}`} variant="secondary">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <FinanceMetric label="Ingresos" value={summary.income} tone="income" />
        <FinanceMetric label="Gastos" value={summary.expense} tone="expense" />
        <FinanceMetric label="Balance" value={summary.net} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Distribucion por categoria</CardTitle>
            <CardDescription>{range.start} a {range.end}</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryTotals.length ? (
              <div className="grid gap-4">
                {categoryTotals.map((item) => (
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
              <EmptyState title="Sin datos" text="El reporte aparecera cuando registres movimientos en el periodo." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Insights</CardTitle>
            <CardDescription>Sin IA externa, solo reglas explicables.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {insights.map((insight) => (
              <div key={insight.title} className="rounded-[1.2rem] border border-border bg-surface-warm p-4">
                <p className="font-semibold">{insight.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{insight.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
