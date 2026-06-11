import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { updateSettingsAction } from "@/server/actions/settings.actions";
import { getAppContext } from "@/server/context";

export default async function SettingsPage() {
  const ctx = await getAppContext();
  if (!ctx.configured) return null;

  const { data: profile } = await ctx.supabase
    .from("profiles")
    .select("full_name,email")
    .eq("id", ctx.user.id)
    .single();

  return (
    <>
      <PageHeader
        title="Configuracion"
        description="Perfil, workspace, moneda base y preparacion para deploy. El tema claro/oscuro se controla desde la barra superior."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Perfil y workspace</CardTitle>
            <CardDescription>Los cambios se validan en servidor y respetan el workspace actual.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateSettingsAction} className="grid gap-4">
              <Field label="Nombre de usuario">
                <Input name="fullName" defaultValue={profile?.full_name ?? ""} />
              </Field>
              <Field label="Correo">
                <Input value={profile?.email ?? ctx.user.email ?? ""} readOnly />
              </Field>
              <Field label="Nombre del workspace">
                <Input name="workspaceName" defaultValue={ctx.workspace.name} required />
              </Field>
              <Field label="Moneda base">
                <Select name="defaultCurrency" defaultValue={ctx.workspace.default_currency}>
                  <option value="COP">COP</option>
                  <option value="USD">USD</option>
                </Select>
              </Field>
              <Button type="submit">
                Guardar configuracion
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preparacion Vercel/Supabase</CardTitle>
            <CardDescription>Variables requeridas para correr y desplegar.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 text-sm text-muted">
              <p>
                Configura `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
                `DATABASE_URL` y `NEXT_PUBLIC_APP_URL` en local y Vercel.
              </p>
              <p>
                Aplica la migracion `src/lib/db/migrations/0001_initial_schema_and_rls.sql` antes de usar datos reales.
              </p>
              <p>
                No uses `service_role` en el navegador y no guardes credenciales reales en el repositorio.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
