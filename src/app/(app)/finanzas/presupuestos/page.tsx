import { FolderArchive, Save } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select } from "@/components/ui/field";
import { formatMoneyCOP } from "@/domain/finance";
import { buildBudgetProgress, getPeriodRange, periodFromSearchParam } from "@/domain/personal-finance";
import { ProgressBar } from "@/features/personal-finance/finance-primitives";
import { PeriodTabs } from "@/features/personal-finance/period-tabs";
import { archivePersonalBudgetAction, createPersonalBudgetAction } from "@/server/actions/personal-finance.actions";
import { getAppContext } from "@/server/context";
import { getPersonalCategories } from "@/server/personal-finance";

export default async function PersonalBudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const ctx = await getAppContext();
  if (!ctx.configured) return null;

  const params = await searchParams;
  const period = periodFromSearchParam(params.period ?? null);
  const range = getPeriodRange(period);
  const categories = await getPersonalCategories(ctx);
  const expenseCategories = categories.filter((category) => category.type === "expense");
  const [transactions, budgets] = await Promise.all([
    ctx.supabase
      .from("personal_transactions")
      .select("*")
      .eq("workspace_id", ctx.workspace.id)
      .eq("type", "expense")
      .is("archived_at", null)
      .gte("occurred_at", range.start)
      .lte("occurred_at", range.end),
    ctx.supabase
      .from("personal_budgets")
      .select("*")
      .eq("workspace_id", ctx.workspace.id)
      .lte("active_from", range.end)
      .or(`active_to.is.null,active_to.gte.${range.start}`)
      .order("created_at", { ascending: false }),
  ]);
  const progress = buildBudgetProgress(budgets.data ?? [], transactions.data ?? [], categories);

  return (
    <>
      <PageHeader
        title="Presupuestos"
        description="Define limites por categoria y revisa desviaciones con una lectura suave."
        action={<PeriodTabs basePath="/finanzas/presupuestos" active={period} />}
      />

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle>Crear presupuesto</CardTitle>
            <CardDescription>Mensual o trimestral, por categoria.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createPersonalBudgetAction} className="grid gap-4">
              <Field label="Categoria">
                <Select name="categoryId" required>
                  {expenseCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Periodo">
                  <Select name="periodType" defaultValue="monthly">
                    <option value="monthly">Mensual</option>
                    <option value="quarterly">Trimestral</option>
                  </Select>
                </Field>
                <Field label="Monto">
                  <Input name="amount" inputMode="decimal" required />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Desde">
                  <Input name="activeFrom" type="date" required defaultValue={range.start} />
                </Field>
                <Field label="Hasta opcional">
                  <Input name="activeTo" type="date" />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" name="rollover" className="h-4 w-4" />
                Rollover marcado para una fase posterior
              </label>
              <Button type="submit">
                <Save className="h-4 w-4" />
                Guardar presupuesto
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progreso</CardTitle>
            <CardDescription>{range.start} a {range.end}</CardDescription>
          </CardHeader>
          <CardContent>
            {progress.length ? (
              <div className="grid gap-4">
                {progress.map((item) => (
                  <div key={item.budget.id} className="rounded-[1.2rem] border border-border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold">{item.category?.name ?? "Categoria"}</p>
                        <p className="text-sm text-muted">
                          {formatMoneyCOP(item.spent)} de {formatMoneyCOP(item.budget.amount_cents)}
                        </p>
                      </div>
                      <Badge tone={item.ratio >= 1 ? "amber" : "green"}>{Math.round(item.ratio * 100)}%</Badge>
                    </div>
                    <div className="mt-3">
                      <ProgressBar value={item.ratio} tone={item.ratio >= 1 ? "pink" : "green"} />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-sm text-muted">Restante: {formatMoneyCOP(item.remaining)}</p>
                      <form action={archivePersonalBudgetAction}>
                        <input type="hidden" name="id" value={item.budget.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          <FolderArchive className="h-4 w-4" />
                          Cerrar
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Sin presupuestos activos" text="Crea un presupuesto para monitorear categorias sensibles." />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
