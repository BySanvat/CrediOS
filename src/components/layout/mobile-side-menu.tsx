"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AppIcon, type IconName } from "@/components/ui/app-icon";
import { cn } from "@/lib/utils/cn";

export type NavigationItem = {
  href: string;
  label: string;
  icon: IconName;
  group: "Inicio" | "Mis finanzas" | "Creditos y cartera" | "Cuenta";
};

export function MobileSideMenu({
  items,
  workspaceName,
}: {
  items: NavigationItem[];
  workspaceName: string;
}) {
  const [open, setOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const groups = Array.from(new Set(items.map((item) => item.group)));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:bg-surface-warm lg:hidden"
        aria-label="Abrir menu principal"
      >
        <AppIcon name="menu" className="h-5 w-5" />
      </button>

      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 opacity-0 backdrop-blur-[18px] transition duration-200 lg:hidden",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none",
        )}
        onClick={() => setOpen(false)}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(88vw,22rem)] -translate-x-full flex-col overflow-hidden border-r border-white/10 bg-[rgba(8,12,18,0.78)] text-white shadow-[0_28px_90px_rgba(0,0,0,0.38)] backdrop-blur-[18px] transition duration-200 lg:hidden",
          open ? "translate-x-0" : "",
        )}
        onPointerDown={(event) => {
          touchStartX.current = event.clientX;
        }}
        onPointerUp={(event) => {
          if (touchStartX.current == null) return;
          const deltaX = event.clientX - touchStartX.current;
          touchStartX.current = null;
          if (deltaX < -70) setOpen(false);
        }}
        aria-hidden={!open}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
          <Link href="/finanzas" onClick={() => setOpen(false)} className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">CrediOS by Sanvat</p>
            <p className="mt-1 truncate text-lg font-semibold">{workspaceName}</p>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/15"
            aria-label="Cerrar menu principal"
          >
            <AppIcon name="close" className="h-5 w-5" />
          </button>
        </div>

        <nav className="grid min-h-0 flex-1 gap-5 overflow-y-auto px-4 py-5 pb-10">
          {groups.map((group) => (
            <div key={group} className="grid gap-1.5">
              <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-white/55">{group}</p>
              {items
                .filter((item) => item.group === group)
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition duration-150 hover:bg-white/10 hover:text-white",
                      pathname === item.href || pathname.startsWith(`${item.href}/`)
                        ? "bg-white/14 text-white"
                        : "text-white/72",
                    )}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-accent">
                      <AppIcon name={item.icon} />
                    </span>
                    <span className="min-w-0 truncate">{item.label}</span>
                  </Link>
                ))}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
