import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Textarea } from "@/components/ui/field";
import { archiveClientAction, createClientAction } from "@/server/actions/clients.actions";
import { getAppContext } from "@/server/context";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const ctx = await getAppContext();
  if (!ctx.configured) return null;

  const { q } = await searchParams;
  let query = ctx.supabase
    .from("clients")
    .select("*, credit_accounts(id,current_balance_cents,status)")
    .eq("workspace_id", ctx.workspace.id)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (q) {
    query = query.ilike("full_name", `%${q}%`);
  }

  const { data: clients } = await query;

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Organiza personas asociadas a cartera. Para deudas propias puedes crear creditos personales sin cliente."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Crear cliente</CardTitle>
            <CardDescription>Los datos sensibles son opcionales; guarda solo lo necesario.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createClientAction} className="grid gap-4">
              <Field label="Nombre completo">
                <Input name="fullName" required />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Documento">
                  <Input name="documentId" />
                </Field>
                <Field label="Telefono">
                  <Input name="phone" />
                </Field>
              </div>
              <Field label="Correo">
                <Input name="email" type="email" />
              </Field>
              <Field label="Direccion">
                <Input name="address" />
              </Field>
              <Field label="Notas">
                <Textarea name="notes" />
              </Field>
              <Button type="submit">
                Crear cliente
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clientes registrados</CardTitle>
            <CardDescription>Busqueda simple y archivado seguro.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="mb-4">
              <Input name="q" placeholder="Buscar por nombre" defaultValue={q ?? ""} />
            </form>
            {(clients ?? []).length ? (
              <div className="grid gap-3">
                {(clients ?? []).map((client) => (
                  <div key={client.id} className="rounded-md border border-border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold">{client.full_name}</p>
                        <p className="mt-1 text-sm text-muted">
                          {[client.phone, client.email].filter(Boolean).join(" · ") || "Sin contacto registrado"}
                        </p>
                        <p className="mt-1 text-sm text-muted">{client.notes}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{client.credit_accounts?.length ?? 0} creditos</Badge>
                        <form action={archiveClientAction}>
                          <input type="hidden" name="id" value={client.id} />
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
              <EmptyState title="Sin clientes" text="Crea clientes para organizar cartera y asociar creditos administrados." />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
