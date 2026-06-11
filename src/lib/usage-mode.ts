export const USAGE_MODE_COOKIE = "credios_usage_mode";

export type UsageMode = "personal" | "portfolio";

export function parseUsageMode(value: string | null | undefined): UsageMode | null {
  return value === "personal" || value === "portfolio" ? value : null;
}

export const usageModeCopy: Record<
  UsageMode,
  {
    label: string;
    description: string;
    dashboardTitle: string;
    dashboardDescription: string;
    primaryHref: string;
    primaryAction: string;
  }
> = {
  personal: {
    label: "Uso personal",
    description: "Quiero organizar mis deudas, movimientos, presupuestos y finanzas del dia a dia.",
    dashboardTitle: "Panel personal",
    dashboardDescription: "Tus movimientos, presupuestos, registros manuales y flujo personal en primer plano.",
    primaryHref: "/finanzas",
    primaryAction: "Abrir Mis finanzas",
  },
  portfolio: {
    label: "Gestion de cartera",
    description: "Quiero administrar clientes, creditos, pagos, abonos y cartera.",
    dashboardTitle: "Dashboard de cartera",
    dashboardDescription: "Clientes, deudas, pagos, abonos, vencimientos y simulaciones para operar tu cartera.",
    primaryHref: "/creditos",
    primaryAction: "Gestionar cartera",
  },
};
