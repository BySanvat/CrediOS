"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { AppIcon } from "@/components/ui/app-icon";
import { type NavigationItem } from "@/components/layout/mobile-side-menu";
import { type UsageMode } from "@/lib/usage-mode";
import { cn } from "@/lib/utils/cn";

export const BOTTOM_NAV_ORDER_KEY = "credios-bottom-nav-order";
export const BOTTOM_NAV_HIDDEN_KEY = "credios-bottom-nav-hidden";
export const BOTTOM_NAV_CHANGE_EVENT = "credios-bottom-nav-change";

function getDefaultHrefs(usageMode: UsageMode | null, showCreditTools: boolean) {
  if (usageMode === "portfolio" && showCreditTools) {
    return ["/dashboard", "/creditos", "/clientes", "/simulador", "/configuracion"];
  }

  return ["/dashboard", "/finanzas", "/finanzas/movimientos", "/simulador", "/configuracion"];
}

function readList(key: string) {
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function shortLabel(label: string) {
  if (label === "Dashboard") return "Inicio";
  if (label === "Mis finanzas") return "Mis fin.";
  if (label === "Movimientos") return "Movs";
  if (label === "Configuracion") return "Ajustes";
  if (label === "Creditos / deudas") return "Creditos";
  return label;
}

export function BottomNavigation({
  items,
  usageMode,
  showCreditTools,
}: {
  items: NavigationItem[];
  usageMode: UsageMode | null;
  showCreditTools: boolean;
}) {
  const pathname = usePathname();
  const [order, setOrder] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);

  useEffect(() => {
    function refresh() {
      setOrder(readList(BOTTOM_NAV_ORDER_KEY));
      setHidden(readList(BOTTOM_NAV_HIDDEN_KEY));
    }

    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(BOTTOM_NAV_CHANGE_EVENT, refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(BOTTOM_NAV_CHANGE_EVENT, refresh);
    };
  }, []);

  const navItems = useMemo(() => {
    const byHref = new Map(items.map((item) => [item.href, item]));
    const defaults = getDefaultHrefs(usageMode, showCreditTools);
    const orderedHrefs = [...order, ...defaults].filter((href, index, list) => list.indexOf(href) === index);

    return orderedHrefs
      .map((href) => byHref.get(href))
      .filter((item): item is NavigationItem => Boolean(item))
      .filter((item) => !hidden.includes(item.href))
      .slice(0, 5);
  }, [hidden, items, order, showCreditTools, usageMode]);

  if (!navItems.length) return null;

  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-40 rounded-[1.6rem] border border-white/12 bg-[rgba(8,12,18,0.72)] p-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] shadow-[0_22px_70px_rgba(0,0,0,0.28)] backdrop-blur-[18px] lg:hidden"
      aria-label="Accesos rapidos"
    >
      <div className="grid grid-cols-5 gap-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-[1.2rem] px-1 text-[11px] font-semibold text-white/70 transition",
                active ? "bg-white/16 text-white" : "hover:bg-white/10 hover:text-white",
              )}
            >
              <AppIcon name={item.icon} className={cn("h-5 w-5", active ? "text-accent" : "text-white/70")} />
              <span className="max-w-full truncate">{shortLabel(item.label)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
