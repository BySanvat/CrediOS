import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { LogoutButton } from "./logout-button";
import { AppIcon } from "@/components/ui/app-icon";
import { MobileSideMenu, type NavigationItem } from "@/components/layout/mobile-side-menu";
import { type UsageMode, usageModeCopy } from "@/lib/usage-mode";

const navItems: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard", group: "Inicio" },
  { href: "/finanzas", label: "Finanzas", icon: "wallet", group: "Finanzas personales" },
  { href: "/finanzas/movimientos", label: "Movimientos", icon: "swap", group: "Finanzas personales" },
  { href: "/finanzas/presupuestos", label: "Presupuestos", icon: "target", group: "Finanzas personales" },
  { href: "/finanzas/reportes", label: "Reportes", icon: "chart", group: "Finanzas personales" },
  { href: "/simulador", label: "Simulador", icon: "calculator", group: "Creditos y cartera" },
  { href: "/simulaciones", label: "Simulaciones", icon: "file", group: "Creditos y cartera" },
  { href: "/clientes", label: "Clientes", icon: "users", group: "Creditos y cartera" },
  { href: "/creditos", label: "Creditos / deudas", icon: "credit", group: "Creditos y cartera" },
  { href: "/recordatorios", label: "Recordatorios", icon: "bell", group: "Cuenta" },
  { href: "/configuracion", label: "Configuracion", icon: "settings", group: "Cuenta" },
];

export function AppShell({
  children,
  workspaceName,
  usageMode,
}: {
  children: React.ReactNode;
  workspaceName: string;
  usageMode: UsageMode | null;
}) {
  const modeCopy = usageMode ? usageModeCopy[usageMode] : null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-border bg-card/90 p-5 shadow-[var(--shadow-soft)] backdrop-blur lg:block">
        <Link href="/dashboard" className="block">
          <p className="text-sm font-semibold text-accent">CrediOS by Sanvat</p>
          <p className="mt-1 text-lg font-semibold">{workspaceName}</p>
          {modeCopy ? <p className="mt-1 text-xs text-muted">{modeCopy.label}</p> : null}
        </Link>
        <nav className="mt-8 grid gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-muted transition duration-150 hover:bg-surface-warm hover:text-foreground"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-warm text-accent">
                <AppIcon name={item.icon} />
              </span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <MobileSideMenu items={navItems} workspaceName={workspaceName} />
              <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Workspace</p>
                <p className="truncate font-semibold">{workspaceName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LogoutButton />
            </div>
          </div>
        </header>
        <main className="min-w-0 px-4 py-5 sm:px-5 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
