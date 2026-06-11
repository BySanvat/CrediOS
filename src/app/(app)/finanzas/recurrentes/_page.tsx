import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { formatMoneyCOP } from "@/domain/finance";
import { createRecurringRuleAction, toggleRecurringRuleAction } from "@/server/actions/personal-finance.actions";
import { getAppContext } from "@/server/context";
import { getPersonalCategories } from "@/server/personal-finance";

export default async function PersonalRecurringPage() {
  const ctx = await getAppContext();
  if (!ctx.configured) return null;

  const categories = await getPersonalCategories(ctx);
  const { data: rules } = await ctx.supabase
    .from("recurring_rules")
    .select("*, personal_categories(name,type)")
    .eq("workspace_id", ctx.workspace.id)
    .order("next_run_at", { ascending: true })
    .limit(120);

  return (
    <>
      <PageHeader
        title="Recurrentes"
        description="Reglas visibles para gastos e ingresos frecuentes. P0 no ejecuta cargos automaticos."
      />

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nueva regla</CardTitle>
            <CardDescription>Anticipa pagos, suscripciones o ingresos repetidos.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createRecurringRuleAction} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tipo">
                  <Select name="type" defaultValue="expense">
                    <option value="expense">Gasto</option>
                    <option value="income">Ingreso</option>
                  </Select>
                </Field>
                <Field label="Categoria">
                  <Select name="categoryId" defaultValue="">
                    <option value="">Sin categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Nota">
                <Textarea name="noteTemplate" placeholder="Netflix, arriendo, salario..." required />
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Monto">
                  <Input name="amount" inputMode="decimal" required />
                </Field>
                <Field label="Frecuencia">
                  <Select name="frequency" defaultValue="monthly">
                    <option value="daily">Diaria</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                    <option value="yearly">Anual</option>
                  </Select>
                </Field>
                <Field label="Intervalo">
                  <Input name="intervalCount" type="number" min={1} max={24} defaultValue={1} required />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Inicia">
                  <Input name="startsAt" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
                </Field>
                <Field label="Termina opcional">
                  <Input name="endsAt" type="date" />
                </Field>
              </div>
              <Button type="submit">
                Guardar recurrente
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reglas</CardTitle>
            <CardDescription>Ordenadas por proxima fecha.</CardDescription>
          </CardHeader>
          <CardContent>
            {(rules ?? []).length ? (
              <div className="grid gap-3">
                {(rules ?? []).map((rule) => (
                  <div key={rule.id} className="rounded-[1.2rem] border border-border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold">{rule.note_template}</p>
                        <p className="text-sm text-muted">
                          Proxima: {rule.next_run_at} · {rule.frequency} cada {rule.interval_count}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={rule.active ? "green" : "neutral"}>{rule.active ? "Activo" : "Inactivo"}</Badge>
                        <p className="font-semibold tabular">{formatMoneyCOP(rule.amount_cents)}</p>
                      </div>
                    </div>
                    <form action={toggleRecurringRuleAction} className="mt-3">
                      <input type="hidden" name="id" value={rule.id} />
                      <input type="hidden" name="active" value={String(rule.active)} />
                      <Button type="submit" variant="ghost" size="sm">
                        {rule.active ? "Pausar" : "Activar"}
                      </Button>
                    </form>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Sin recurrentes" text="Agrega reglas para anticipar gastos fijos e ingresos frecuentes." />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
