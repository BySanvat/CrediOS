import Link from "next/link";
import {
  Bell,
  Calculator,
  Gauge,
  Landmark,
  PiggyBank,
  Settings,
  Users,
  WalletCards,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { LogoutButton } from "./logout-button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/finanzas", label: "Finanzas", icon: PiggyBank },
  { href: "/simulador", label: "Simulador", icon: Calculator },
  { href: "/simulaciones", label: "Simulaciones", icon: WalletCards },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/creditos", label: "Creditos/deudas", icon: Landmark },
  { href: "/recordatorios", label: "Recordatorios", icon: Bell },
  { href: "/configuracion", label: "Configuracion", icon: Settings },
];

const mobileNavItems = navItems.filter((item) =>
  ["/dashboard", "/finanzas", "/simulador", "/creditos", "/configuracion"].includes(item.href),
);

export function AppShell({
  children,
  workspaceName,
}: {
  children: React.ReactNode;
  workspaceName: string;
}) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-border bg-card/90 p-5 shadow-[var(--shadow-soft)] backdrop-blur lg:block">
        <Link href="/dashboard" className="block">
          <p className="text-sm font-semibold text-accent">CrediOS by Sanvat</p>
          <p className="mt-1 text-lg font-semibold">{workspaceName}</p>
        </Link>
        <nav className="mt-8 grid gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-muted transition duration-150 hover:bg-surface-warm hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Workspace</p>
              <p className="font-semibold">{workspaceName}</p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LogoutButton />
            </div>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-card px-3 py-2 text-sm"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="px-4 py-6 pb-28 lg:px-8 lg:pb-8">{children}</main>
        <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 gap-1 rounded-[1.6rem] border border-border bg-card/95 p-1 shadow-[var(--shadow-soft)] backdrop-blur lg:hidden">
          {mobileNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-[1.25rem] text-[11px] font-medium text-muted transition hover:bg-surface-warm hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
