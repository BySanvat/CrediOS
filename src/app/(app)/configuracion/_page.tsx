import { cookies } from "next/headers";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { CreditToolsSetting } from "@/features/onboarding/credit-tools-setting";
import { UsageModeSetting } from "@/features/onboarding/usage-mode-setting";
import { AccentColorSetting } from "@/features/personalization/accent-color-picker";
import { ACCENT_COLOR_COOKIE, parseAccentColor } from "@/lib/accent-theme";
import { CREDIT_TOOLS_COOKIE, parseCreditToolsEnabled, shouldShowCreditTools } from "@/lib/credit-tools";
import { parseUsageMode, USAGE_MODE_COOKIE } from "@/lib/usage-mode";
import { updateSettingsAction } from "@/server/actions/settings.actions";
import { getAppContext } from "@/server/context";

export default async function SettingsPage() {
  const ctx = await getAppContext();
  if (!ctx.configured) return null;
  const cookieStore = await cookies();
  const usageMode = parseUsageMode(cookieStore.get(USAGE_MODE_COOKIE)?.value);
  const accentColor = parseAccentColor(cookieStore.get(ACCENT_COLOR_COOKIE)?.value) ?? "apple-green";
  const showCreditTools = shouldShowCreditTools(
    usageMode,
    parseCreditToolsEnabled(cookieStore.get(CREDIT_TOOLS_COOKIE)?.value),
  );

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
        icon="settings"
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
            <CardTitle>Apariencia</CardTitle>
            <CardDescription>Personaliza el color de enfasis sin cambiar los colores de estado.</CardDescription>
          </CardHeader>
          <CardContent>
            <AccentColorSetting initialAccent={accentColor} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferencia de inicio</CardTitle>
            <CardDescription>Ordena el dashboard para uso personal o gestion de cartera.</CardDescription>
          </CardHeader>
          <CardContent>
            <UsageModeSetting initialMode={usageMode} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Herramientas de cartera</CardTitle>
            <CardDescription>Activa u oculta creditos, clientes, simulaciones y cartera en la navegacion.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreditToolsSetting initialEnabled={showCreditTools} />
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
