import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { EmptyState } from "@/components/ui/empty-state";
import { CurrencyInput } from "@/components/ui/financial-input";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { formatMoneyCOP } from "@/domain/finance";
import { getPeriodRange, periodFromSearchParam } from "@/domain/personal-finance";
import { PeriodTabs } from "@/features/personal-finance/period-tabs";
import { QuickAddComposer } from "@/features/personal-finance/quick-add-composer";
import {
  archivePersonalCategoryAction,
  archivePersonalTransactionAction,
  createPersonalCategoryAction,
  createPersonalTransactionAction,
  updatePersonalTransactionAction,
} from "@/server/actions/personal-finance.actions";
import { getAppContext } from "@/server/context";
import { getPersonalCategories } from "@/server/personal-finance";

export default async function PersonalTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; type?: string; category?: string; q?: string }>;
}) {
  const ctx = await getAppContext();
  if (!ctx.configured) return null;

  const params = await searchParams;
  const period = periodFromSearchParam(params.period ?? null);
  const range = getPeriodRange(period);
  const categories = await getPersonalCategories(ctx);
  let query = ctx.supabase
    .from("personal_transactions")
    .select("*, personal_categories(name,type,color_token)")
    .eq("workspace_id", ctx.workspace.id)
    .is("archived_at", null)
    .gte("occurred_at", range.start)
    .lte("occurred_at", range.end)
    .order("occurred_at", { ascending: false })
    .limit(120);

  if (params.type === "income" || params.type === "expense") query = query.eq("type", params.type);
  if (params.category) query = query.eq("category_id", params.category);
  if (params.q) query = query.ilike("note_normalized", `%${params.q.toLowerCase()}%`);

  const { data: transactions } = await query;

  return (
    <>
      <PageHeader
        title="Movimientos"
        description="Captura ingresos y egresos con fecha completa, categoria y trazabilidad por workspace."
        icon="swap"
        action={<PeriodTabs basePath="/finanzas/movimientos" active={period} />}
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <QuickAddComposer categories={categories} />

        <Card>
          <CardHeader>
            <CardTitle>Nuevo movimiento manual</CardTitle>
            <CardDescription>Usalo cuando quieras controlar todos los campos.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createPersonalTransactionAction} className="grid gap-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <Field label="Direccion">
                  <Select name="type" defaultValue="expense">
                    <option value="expense">Egreso</option>
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
                    <option value="__create" disabled>Crear categoria</option>
                  </Select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Monto">
                  <CurrencyInput name="amount" required />
                </Field>
                <DatePickerField name="occurredAt" label="Fecha" required defaultValue={new Date().toISOString().slice(0, 10)} />
              </div>
              <Field label="Nota">
                <Textarea name="note" required />
              </Field>
              <input type="hidden" name="source" value="manual" />
              <Button type="submit">
                Registrar movimiento
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <Card>
          <CardHeader>
            <CardTitle>Categorias</CardTitle>
            <CardDescription>Crea categorias propias sin tocar las predeterminadas.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createPersonalCategoryAction} className="grid gap-4">
              <Field label="Nombre">
                <Input name="name" placeholder="Mascotas, educacion..." required />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Direccion">
                  <Select name="type" defaultValue="expense">
                    <option value="expense">Egreso</option>
                    <option value="income">Ingreso</option>
                  </Select>
                </Field>
                <Field label="Color">
                  <Select name="colorToken" defaultValue="sand">
                    <option value="sand">Arena</option>
                    <option value="blue">Azul</option>
                    <option value="pink">Rosa</option>
                    <option value="green">Verde</option>
                    <option value="yellow">Amarillo</option>
                  </Select>
                </Field>
              </div>
              <Button type="submit" variant="secondary">Crear categoria</Button>
            </form>
            <div className="mt-5 grid gap-2">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background p-3 dark:bg-surface-elevated">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{category.name}</p>
                    <p className="text-xs text-muted">{category.type === "income" ? "Ingreso" : "Egreso"}</p>
                  </div>
                  <form action={archivePersonalCategoryAction}>
                    <input type="hidden" name="id" value={category.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      Archivar
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial del periodo</CardTitle>
            <CardDescription>{range.start} a {range.end}</CardDescription>
          </CardHeader>
          <CardContent>
            {(transactions ?? []).length ? (
              <div className="grid gap-3">
                {(transactions ?? []).map((transaction) => (
                  <details key={transaction.id} className="rounded-[1.2rem] border border-border bg-card p-4">
                    <summary className="cursor-pointer list-none">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold">{transaction.note_raw}</p>
                          <p className="text-sm text-muted">
                            {transaction.occurred_at} · {transaction.personal_categories?.name ?? "Sin categoria"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge tone={transaction.type === "income" ? "green" : "neutral"}>
                            {transaction.type === "income" ? "Ingreso" : "Egreso"}
                          </Badge>
                          <p className="font-semibold tabular">{formatMoneyCOP(transaction.amount_cents)}</p>
                        </div>
                      </div>
                    </summary>
                    <form action={updatePersonalTransactionAction} className="mt-4 grid gap-4 border-t border-border pt-4">
                      <input type="hidden" name="id" value={transaction.id} />
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                        <Field label="Direccion">
                          <Select name="type" defaultValue={transaction.type}>
                            <option value="expense">Egreso</option>
                            <option value="income">Ingreso</option>
                          </Select>
                        </Field>
                        <Field label="Categoria">
                          <Select name="categoryId" defaultValue={transaction.category_id ?? ""}>
                            <option value="">Sin categoria</option>
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                            <option value="__create" disabled>Crear categoria</option>
                          </Select>
                        </Field>
                        <Field label="Monto">
                          <CurrencyInput name="amount" defaultValue={String(transaction.amount_cents / 100)} />
                        </Field>
                        <DatePickerField name="occurredAt" label="Fecha" defaultValue={transaction.occurred_at} />
                      </div>
                      <Field label="Nota">
                        <Textarea name="note" defaultValue={transaction.note_raw} />
                      </Field>
                      <input type="hidden" name="source" value={transaction.source} />
                      <Button type="submit" size="sm" className="w-fit">Guardar cambios</Button>
                    </form>
                    <form action={archivePersonalTransactionAction} className="mt-3">
                      <input type="hidden" name="id" value={transaction.id} />
                      <Button type="submit" size="sm" variant="ghost">
                        Archivar
                      </Button>
                    </form>
                  </details>
                ))}
              </div>
            ) : (
              <EmptyState title="Sin movimientos" text="Registra tu primer ingreso o egreso para iniciar el seguimiento." />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
