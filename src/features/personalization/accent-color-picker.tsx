"use client";

import { useState } from "react";
import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ACCENT_COLOR_COOKIE, accentPalette, getAccentColor, type AccentColorId } from "@/lib/accent-theme";
import { cn } from "@/lib/utils/cn";

const maxAge = 60 * 60 * 24 * 365;

export function persistAccentColor(colorId: AccentColorId) {
  document.cookie = `${ACCENT_COLOR_COOKIE}=${colorId}; path=/; max-age=${maxAge}; SameSite=Lax`;
  window.localStorage.setItem("credios-accent-color", colorId);
  document.documentElement.dataset.accent = colorId;
}

export function AccentSwatches({
  value,
  onChange,
  compact,
}: {
  value: AccentColorId;
  onChange: (value: AccentColorId) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("grid gap-2", compact ? "grid-cols-7" : "grid-cols-4 sm:grid-cols-7")}>
      {accentPalette.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            "group grid min-h-14 place-items-center rounded-2xl border bg-card p-2 transition duration-150 hover:-translate-y-0.5",
            value === item.id ? "border-accent shadow-sm" : "border-border",
          )}
          aria-label={`Usar color ${item.name}`}
          title={item.name}
        >
          <span
            className="h-7 w-7 rounded-full border border-black/5 shadow-sm"
            style={{ backgroundColor: item.color }}
          />
          {!compact ? <span className="mt-1 text-[11px] text-muted">{item.name}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function AccentPreview({ value }: { value: AccentColorId }) {
  const color = getAccentColor(value);

  return (
    <div className="grid gap-3 rounded-[1.25rem] border border-border bg-background p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" style={{ backgroundColor: color.color }}>
          Boton principal
        </Button>
        <Badge tone="teal">Preview</Badge>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted">Metrica destacada</p>
            <p className="mt-1 text-2xl font-semibold tabular">$ 1.250.000</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: color.soft, color: color.color }}>
            <AppIcon name="chart" className="h-5 w-5" />
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full" style={{ width: "68%", backgroundColor: color.color }} />
        </div>
      </div>
    </div>
  );
}

export function AccentColorSetting({ initialAccent }: { initialAccent: AccentColorId }) {
  const [selected, setSelected] = useState<AccentColorId>(initialAccent);
  const [saved, setSaved] = useState(false);

  function save() {
    persistAccentColor(selected);
    setSaved(true);
  }

  return (
    <div className="grid gap-4">
      <AccentSwatches value={selected} onChange={(value) => {
        setSelected(value);
        setSaved(false);
        document.documentElement.dataset.accent = value;
      }} />
      <AccentPreview value={selected} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button type="button" onClick={save} className="w-full sm:w-auto">
          Guardar color
        </Button>
        {saved ? <p className="text-sm text-muted">Color aplicado a este navegador.</p> : null}
      </div>
    </div>
  );
}

export function AuthAccentPicker({ initialAccent }: { initialAccent: AccentColorId }) {
  const [selected, setSelected] = useState<AccentColorId>(initialAccent);

  function select(value: AccentColorId) {
    setSelected(value);
    persistAccentColor(value);
  }

  return (
    <div className="grid gap-2 rounded-[1.2rem] border border-border bg-card/70 p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <AppIcon name="palette" className="text-accent" />
        Elige el estilo de tu CrediOS
      </div>
      <AccentSwatches value={selected} onChange={select} compact />
    </div>
  );
}
