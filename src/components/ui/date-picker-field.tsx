"use client";

import { useMemo, useState } from "react";
import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const dayNames = ["L", "M", "M", "J", "V", "S", "D"];

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDisplayDate(value: string) {
  if (!value) return "Sin fecha";
  const date = parseDate(value);
  return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

export function DatePickerField({
  name,
  label = "Fecha",
  value,
  defaultValue,
  required,
  onValueChange,
  className,
}: {
  name: string;
  label?: string;
  value?: string;
  defaultValue?: string;
  required?: boolean;
  onValueChange?: (value: string) => void;
  className?: string;
}) {
  const today = toDateString(new Date());
  const initial = value ?? defaultValue ?? (required ? today : "");
  const [internalValue, setInternalValue] = useState(initial);
  const [open, setOpen] = useState(false);
  const selected = value ?? internalValue;
  const selectedDate = parseDate(selected || today);
  const [cursor, setCursor] = useState(() => new Date(Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), 1)));

  const days = useMemo(() => {
    const firstDay = cursor.getUTCDay() || 7;
    const daysInMonth = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0)).getUTCDate();
    return [
      ...Array.from({ length: firstDay - 1 }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];
  }, [cursor]);

  function selectDay(day: number) {
    const next = toDateString(new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), day)));
    setInternalValue(next);
    onValueChange?.(next);
    setOpen(false);
  }

  function moveMonth(delta: number) {
    setCursor((current) => new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + delta, 1)));
  }

  return (
    <div className={cn("relative grid gap-1.5 text-sm font-medium", className)}>
      <div className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <span className="text-xs font-normal text-muted">{formatDisplayDate(selected)}</span>
      </div>
      <input type="hidden" name={name} value={selected} required={required} />
      <Button type="button" variant="secondary" onClick={() => setOpen((current) => !current)} className="h-11 w-12 px-0" aria-label="Abrir calendario">
        <AppIcon name="calendar" />
      </Button>
      {open ? (
        <div className="soft-enter absolute left-0 top-full z-40 mt-2 w-[min(19rem,calc(100vw-2rem))] rounded-[1.35rem] border border-border bg-card p-3 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between gap-2">
            {!required && selected ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => {
                setInternalValue("");
                onValueChange?.("");
                setOpen(false);
              }}>
                Limpiar
              </Button>
            ) : null}
            <Button type="button" variant="ghost" size="sm" onClick={() => moveMonth(-1)} aria-label="Mes anterior">
              <AppIcon name="down" className="rotate-90" />
            </Button>
            <p className="text-sm font-semibold">
              {monthNames[cursor.getUTCMonth()]} {cursor.getUTCFullYear()}
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={() => moveMonth(1)} aria-label="Mes siguiente">
              <AppIcon name="down" className="-rotate-90" />
            </Button>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted">
            {dayNames.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((day, index) =>
              day ? (
                <button
                  key={`${cursor.toISOString()}-${day}`}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={cn(
                    "h-9 rounded-full text-sm transition hover:bg-surface-warm",
                    selected === toDateString(new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), day)))
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground",
                  )}
                >
                  {day}
                </button>
              ) : (
                <span key={`empty-${index}`} />
              ),
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
