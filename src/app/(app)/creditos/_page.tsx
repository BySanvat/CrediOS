import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { EmptyState } from "@/components/ui/empty-state";
import { CurrencyInput, RateInput } from "@/components/ui/financial-input";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { formatMoneyCOP } from "@/domain/finance";
import { creditFriendlyPath } from "@/lib/utils/slug";
import { archiveCreditAction, createCreditAction } from "@/server/actions/credits.actions";
import { getAppContext } from "@/server/context";

export default async function CreditsPage() {
  const ctx = await getAppContext();
  if (!ctx.configured) return null;

  const [{ data: credits }, { data: clients }] = await Promise.all([
    ctx.supabase
      .from("credit_accounts")
      .select("*, clients(full_name)")
      .eq("workspace_id", ctx.workspace.id)
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
    ctx.supabase
      .from("clients")
      .select("id,full_name")
      .eq("workspace_id", ctx.workspace.id)
      .is("archived_at", null)
      .order("full_name"),
  ]);

  return (
    <>
      <PageHeader
        title="Creditos y deudas"
        description="Registra deudas manuales o administra las creadas desde simulaciones con seguimiento claro."
        icon="credit"
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Crear deuda administrada</CardTitle>
            <CardDescription>Usa datos manuales cuando ya tienes una deuda o cartera registrada.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createCreditAction} className="grid gap-4">
              <Field label="Nombre">
                <Input name="name" placeholder="Credito vivienda, deuda personal..." required />
              </Field>
              <Field label="Cliente opcional">
                <Select name="clientId" defaultValue="">
                  <option value="">Personal / sin cliente</option>
                  {(clients ?? []).map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.full_name}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Monto">
                  <CurrencyInput name="amount" required />
                </Field>
                <Field label="Plazo meses">
                  <Input name="termMonths" type="number" min={1} max={600} required />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tasa">
                  <RateInput name="rateValue" required />
                </Field>
                <Field label="Tipo de tasa">
                  <Select name="rateType" defaultValue="monthly_effective">
                    <option value="monthly_effective">Mensual efectiva</option>
                    <option value="effective_annual">Efectiva anual</option>
                    <option value="nominal_annual">Nominal anual</option>
                  </Select>
                </Field>
              </div>
              <DatePickerField name="startDate" label="Fecha" required defaultValue={new Date().toISOString().slice(0, 10)} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Cargo mensual">
                  <CurrencyInput name="monthlyFee" defaultValue="0" />
                </Field>
                <Field label="Seguro mensual">
                  <CurrencyInput name="monthlyInsurance" defaultValue="0" />
                </Field>
              </div>
              <Field label="Notas">
                <Textarea name="notes" />
              </Field>
              <Button type="submit">
                Crear deuda
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deudas registradas</CardTitle>
            <CardDescription>Consulta saldos, plan de pagos, pagos y abonos.</CardDescription>
          </CardHeader>
          <CardContent>
            {(credits ?? []).length ? (
              <div className="grid gap-3">
                {(credits ?? []).map((credit) => (
                  <div key={credit.id} className="rounded-md border border-border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <Link href={creditFriendlyPath(credit.id, credit.name)} className="font-semibold text-accent">
                          {credit.name}
                        </Link>
                        <p className="mt-1 text-sm text-muted">
                          {credit.clients?.full_name ?? "Personal"} · saldo {formatMoneyCOP(credit.current_balance_cents)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={credit.status === "paid" ? "green" : "teal"}>{credit.status}</Badge>
                        <form action={archiveCreditAction}>
                          <input type="hidden" name="id" value={credit.id} />
                          <Button type="submit" variant="ghost" size="sm">
                            Archivar
                          </Button>
                        </form>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Sin deudas administradas"
                text="Crea una deuda manual o convierte una simulacion guardada para empezar el seguimiento."
                action={
                  <Button asChild>
                    <Link href="/simulador">Simular credito</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
