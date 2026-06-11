import { notFound } from "next/navigation";
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

type CatchAllProps = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PrivateCatchAllPage({ params, searchParams }: CatchAllProps) {
  const { slug = [] } = await params;
  const path = slug.join("/");

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

      notFound();
  }
}
