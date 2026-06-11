"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppIcon, type IconName } from "@/components/ui/app-icon";
import { cn } from "@/lib/utils/cn";

export type NavigationItem = {
  href: string;
  label: string;
  icon: IconName;
  group: "Inicio" | "Finanzas personales" | "Creditos y cartera" | "Cuenta";
};

export function MobileSideMenu({
  items,
  workspaceName,
}: {
  items: NavigationItem[];
  workspaceName: string;
}) {
  const [open, setOpen] = useState(false);

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
          "fixed inset-0 z-50 bg-foreground/25 opacity-0 backdrop-blur-sm transition duration-200 lg:hidden",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none",
        )}
        onClick={() => setOpen(false)}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[min(86vw,22rem)] -translate-x-full border-r border-border bg-card p-4 shadow-[var(--shadow-soft)] transition duration-200 lg:hidden",
          open ? "translate-x-0" : "",
        )}
        aria-hidden={!open}
      >
        <div className="flex items-start justify-between gap-3">
          <Link href="/dashboard" onClick={() => setOpen(false)} className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">CrediOS by Sanvat</p>
            <p className="mt-1 truncate text-lg font-semibold">{workspaceName}</p>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-warm text-foreground"
            aria-label="Cerrar menu principal"
          >
            <AppIcon name="close" className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-6 grid max-h-[calc(100vh-8rem)] gap-5 overflow-y-auto pr-1">
          {groups.map((group) => (
            <div key={group} className="grid gap-1.5">
              <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-muted">{group}</p>
              {items
                .filter((item) => item.group === group)
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-muted transition duration-150 hover:bg-surface-warm hover:text-foreground"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-warm text-accent">
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
