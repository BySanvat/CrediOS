import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import ClientsPage from "../clientes/_page";
import SettingsPage from "../configuracion/_page";
import CreditDetailPage from "../creditos/[id]/_page";
import CreditsPage from "../creditos/_page";
import DashboardPage from "../dashboard/_page";
import PersonalFinancePage from "../finanzas/_page";
import PersonalTransactionsPage from "../finanzas/movimientos/_page";
import PersonalBudgetsPage from "../finanzas/presupuestos/_page";
import PersonalRecurringPage from "../finanzas/recurrentes/_page";
import PersonalReportsPage from "../finanzas/reportes/_page";
import RemindersPage from "../recordatorios/_page";
import SimulationsPage from "../simulaciones/_page";
import SimulatorPage from "../simulador/_page";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditToolsSetting } from "@/features/onboarding/credit-tools-setting";
import { CREDIT_TOOLS_COOKIE, parseCreditToolsEnabled, shouldShowCreditTools } from "@/lib/credit-tools";
import { parseUsageMode, USAGE_MODE_COOKIE } from "@/lib/usage-mode";

type CatchAllProps = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PrivateCatchAllPage({ params, searchParams }: CatchAllProps) {
  const { slug = [] } = await params;
  const path = slug.join("/");
  const cookieStore = await cookies();
  const usageMode = parseUsageMode(cookieStore.get(USAGE_MODE_COOKIE)?.value);
  const creditToolsEnabled = shouldShowCreditTools(
    usageMode,
    parseCreditToolsEnabled(cookieStore.get(CREDIT_TOOLS_COOKIE)?.value),
  );

  if (!creditToolsEnabled && isCreditToolPath(slug)) {
    return <CreditToolsDisabledNotice />;
  }

  switch (path) {
    case "dashboard":
      return <DashboardPage />;
    case "simulador":
      return <SimulatorPage />;
    case "simulaciones":
      return <SimulationsPage />;
    case "clientes":
      return <ClientsPage searchParams={searchParams as Promise<{ q?: string }>} />;
    case "creditos":
      return <CreditsPage />;
    case "recordatorios":
      return <RemindersPage />;
    case "configuracion":
      return <SettingsPage />;
    case "finanzas":
      return <PersonalFinancePage searchParams={searchParams as Promise<{ period?: string }>} />;
    case "finanzas/movimientos":
      return (
        <PersonalTransactionsPage
          searchParams={
            searchParams as Promise<{
              period?: string;
              type?: string;
              category?: string;
              q?: string;
            }>
          }
        />
      );
    case "finanzas/presupuestos":
      return <PersonalBudgetsPage searchParams={searchParams as Promise<{ period?: string }>} />;
    case "finanzas/recurrentes":
      return <PersonalRecurringPage />;
    case "finanzas/reportes":
      return <PersonalReportsPage searchParams={searchParams as Promise<{ period?: string }>} />;
    default:
      if (slug[0] === "creditos" && slug.length === 2 && slug[1]) {
        return <CreditDetailPage params={Promise.resolve({ id: slug[1] })} />;
      }

      if (slug[0] === "creditos" && slug.length === 3 && slug[1]) {
        return <CreditDetailPage params={Promise.resolve({ id: slug[1] })} />;
      }

      notFound();
  }
}

function isCreditToolPath(slug: string[]) {
  if (!slug.length) return false;
  return slug[0] === "creditos" || slug[0] === "clientes" || slug[0] === "simulaciones";
}

function CreditToolsDisabledNotice() {
  return (
    <>
      <PageHeader
        title="Herramientas de cartera ocultas"
        description="Estas secciones estan ocultas en modo personal. Puedes activarlas sin borrar datos."
        icon="credit"
        action={
          <Button asChild variant="secondary">
            <Link href="/configuracion">Ir a ajustes</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Activa creditos, clientes y cartera</CardTitle>
          <CardDescription>
            Si tambien quieres administrar deudas con plan de pagos, clientes o cartera, activa estas herramientas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreditToolsSetting initialEnabled={false} />
        </CardContent>
      </Card>
    </>
  );
}
