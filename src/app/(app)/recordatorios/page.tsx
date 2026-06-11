import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { completeReminderAction, createReminderAction } from "@/server/actions/reminders.actions";
import { getAppContext } from "@/server/context";

export default async function RemindersPage() {
  const ctx = await getAppContext();
  if (!ctx.configured) return null;

  const [{ data: reminders }, { data: credits }, { data: clients }] = await Promise.all([
    ctx.supabase
      .from("reminders")
      .select("*, credit_accounts(name), clients(full_name)")
      .eq("workspace_id", ctx.workspace.id)
      .order("due_date", { ascending: true }),
    ctx.supabase
      .from("credit_accounts")
      .select("id,name")
      .eq("workspace_id", ctx.workspace.id)
      .is("archived_at", null)
      .order("name"),
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
        title="Recordatorios"
        description="Alertas internas para fechas de pago, seguimiento de cartera o tareas financieras."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Crear recordatorio</CardTitle>
            <CardDescription>No se envia email, push ni WhatsApp en este MVP.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createReminderAction} className="grid gap-4">
              <Field label="Titulo">
                <Input name="title" required />
              </Field>
              <Field label="Fecha">
                <Input name="dueDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
              </Field>
              <Field label="Credito/deuda opcional">
                <Select name="creditId" defaultValue="">
                  <option value="">Sin deuda asociada</option>
                  {(credits ?? []).map((credit) => (
                    <option key={credit.id} value={credit.id}>
                      {credit.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Cliente opcional">
                <Select name="clientId" defaultValue="">
                  <option value="">Sin cliente asociado</option>
                  {(clients ?? []).map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.full_name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Notas">
                <Textarea name="notes" />
              </Field>
              <Button type="submit">
                Crear recordatorio
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recordatorios internos</CardTitle>
            <CardDescription>Ordenados por fecha de vencimiento.</CardDescription>
          </CardHeader>
          <CardContent>
            {(reminders ?? []).length ? (
              <div className="grid gap-3">
                {(reminders ?? []).map((reminder) => (
                  <div key={reminder.id} className="rounded-md border border-border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold">{reminder.title}</p>
                        <p className="mt-1 text-sm text-muted">
                          {reminder.due_date} · {reminder.credit_accounts?.name ?? "Sin deuda"} ·{" "}
                          {reminder.clients?.full_name ?? "Sin cliente"}
                        </p>
                        <p className="mt-1 text-sm text-muted">{reminder.notes}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={reminder.status === "completed" ? "green" : "amber"}>{reminder.status}</Badge>
                        {reminder.status !== "completed" ? (
                          <form action={completeReminderAction}>
                            <input type="hidden" name="id" value={reminder.id} />
                            <Button type="submit" variant="secondary" size="sm">
                              Completar
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Sin recordatorios" text="Crea recordatorios internos para proximas fechas de pago o tareas." />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
