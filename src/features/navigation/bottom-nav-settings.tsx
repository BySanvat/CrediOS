"use client";

import { useMemo, useState } from "react";

import {
  BOTTOM_NAV_CHANGE_EVENT,
  BOTTOM_NAV_HIDDEN_KEY,
  BOTTOM_NAV_ORDER_KEY,
} from "@/components/layout/bottom-navigation";
import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { type NavigationItem } from "@/components/layout/mobile-side-menu";
import { cn } from "@/lib/utils/cn";

function readList(key: string) {
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function writeList(key: string, value: string[]) {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(BOTTOM_NAV_CHANGE_EVENT));
}

export function BottomNavSettings({ items }: { items: NavigationItem[] }) {
  const [order, setOrder] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : readList(BOTTOM_NAV_ORDER_KEY),
  );
  const [hidden, setHidden] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : readList(BOTTOM_NAV_HIDDEN_KEY),
  );

  const orderedItems = useMemo(() => {
    const orderedHrefs = [...order, ...items.map((item) => item.href)].filter(
      (href, index, list) => list.indexOf(href) === index,
    );
    return orderedHrefs
      .map((href) => items.find((item) => item.href === href))
      .filter((item): item is NavigationItem => Boolean(item));
  }, [items, order]);

  function persistOrder(next: string[]) {
    setOrder(next);
    writeList(BOTTOM_NAV_ORDER_KEY, next);
  }

  function persistHidden(next: string[]) {
    setHidden(next);
    writeList(BOTTOM_NAV_HIDDEN_KEY, next);
  }

  function move(href: string, delta: number) {
    const current = orderedItems.map((item) => item.href);
    const index = current.indexOf(href);
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= current.length) return;
    const next = [...current];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    persistOrder(next);
  }

  function toggle(href: string) {
    persistHidden(hidden.includes(href) ? hidden.filter((item) => item !== href) : [...hidden, href]);
  }

  function reset() {
    setOrder([]);
    setHidden([]);
    window.localStorage.removeItem(BOTTOM_NAV_ORDER_KEY);
    window.localStorage.removeItem(BOTTOM_NAV_HIDDEN_KEY);
    window.dispatchEvent(new Event(BOTTOM_NAV_CHANGE_EVENT));
  }

  return (
    <div className="grid select-none gap-3">
      <div className="grid gap-2">
        {orderedItems.map((item, index) => {
          const disabled = hidden.includes(item.href);

          return (
            <div
              key={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl border border-border bg-background p-2 dark:bg-surface-elevated",
                disabled && "opacity-55",
              )}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                <AppIcon name={item.icon} />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.label}</span>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 px-0" onClick={() => move(item.href, -1)} disabled={index === 0}>
                <AppIcon name="down" className="rotate-180" />
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 px-0" onClick={() => move(item.href, 1)} disabled={index === orderedItems.length - 1}>
                <AppIcon name="down" />
              </Button>
              <Button type="button" variant={disabled ? "secondary" : "ghost"} size="sm" onClick={() => toggle(item.href)}>
                {disabled ? "Mostrar" : "Ocultar"}
              </Button>
            </div>
          );
        })}
      </div>
      <Button type="button" variant="secondary" onClick={reset} className="w-full sm:w-fit">
        Restaurar accesos
      </Button>
    </div>
  );
}
