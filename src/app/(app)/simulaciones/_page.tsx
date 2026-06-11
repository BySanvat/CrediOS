import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Select } from "@/components/ui/field";
import { formatMoneyCOP } from "@/domain/finance";
import {
  archiveSimulationAction,
  convertSimulationToCreditAction,
  duplicateSimulationAction,
} from "@/server/actions/simulations.actions";
import { getAppContext } from "@/server/context";

export default async function SimulationsPage() {
  const ctx = await getAppContext();
  if (!ctx.configured) return null;

  const [{ data: simulations }, { data: clients }] = await Promise.all([
    ctx.supabase
      .from("simulations")
      .select("*")
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
        title="Simulaciones guardadas"
        description="Escenarios guardados por accion explicita. Puedes duplicarlos o convertirlos en una deuda administrada."
        icon="file"
        action={
          <Button asChild>
            <Link href="/simulador">Nueva simulacion</Link>
          </Button>
        }
      />

      {(simulations ?? []).length ? (
        <div className="grid gap-4">
          {(simulations ?? []).map((simulation) => {
            const summary = simulation.summary as {
              totalMonthlyPaymentCents?: number;
              totalInterestCents?: number;
              totalPaidCents?: number;
              finalPaymentDate?: string;
            };
            return (
              <Card key={simulation.id}>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>{simulation.name}</CardTitle>
                    <CardDescription>
                      {formatMoneyCOP(simulation.principal_cents)} · {simulation.term_months} meses ·{" "}
                      {simulation.rate_value}% · {simulation.rate_type}
                    </CardDescription>
                  </div>
                  <Badge tone="teal">Simulacion</Badge>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-3 sm:grid-cols-4">
                    <SmallMetric label="Cuota total" value={formatMoneyCOP(summary.totalMonthlyPaymentCents ?? 0)} />
                    <SmallMetric label="Intereses" value={formatMoneyCOP(summary.totalInterestCents ?? 0)} />
                    <SmallMetric label="Total pagado" value={formatMoneyCOP(summary.totalPaidCents ?? 0)} />
                    <SmallMetric label="Fecha final" value={summary.finalPaymentDate ?? "-"} />
                  </div>
                  <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
                    <form action={convertSimulationToCreditAction} className="grid gap-3 sm:grid-cols-[1fr_auto]">
                      <input type="hidden" name="id" value={simulation.id} />
                      <Field label="Asignar cliente opcional">
                        <Select name="clientId" defaultValue="">
                          <option value="">Personal / sin cliente</option>
                          {(clients ?? []).map((client) => (
                            <option key={client.id} value={client.id}>
                              {client.full_name}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Button type="submit" className="self-end">
                        Convertir
                      </Button>
                    </form>
                    <form action={duplicateSimulationAction} className="self-end">
                      <input type="hidden" name="id" value={simulation.id} />
                      <Button type="submit" variant="secondary">
                        Duplicar
                      </Button>
                    </form>
                    <form action={archiveSimulationAction} className="self-end">
                      <input type="hidden" name="id" value={simulation.id} />
                      <Button type="submit" variant="ghost">
                        Archivar
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Aun no hay simulaciones"
          text="Crea tu primera simulacion para comparar cuota, intereses y costo total."
          action={
            <Button asChild>
              <Link href="/simulador">Simular credito</Link>
            </Button>
          }
        />
      )}
    </>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-semibold tabular">{value}</p>
    </div>
  );
}
