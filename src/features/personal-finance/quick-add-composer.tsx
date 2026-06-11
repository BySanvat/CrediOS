"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { Field, Input, Select } from "@/components/ui/field";
import { formatMoneyCOP } from "@/domain/finance";
import { parseQuickAdd } from "@/domain/personal-finance";
import { quickAddPersonalTransactionAction } from "@/server/actions/personal-finance.actions";

type CategoryOption = {
  id: string;
  name: string;
  type: "income" | "expense";
};

export function QuickAddComposer({ categories }: { categories: CategoryOption[] }) {
  const [text, setText] = useState("");
  const [directionOverride, setDirectionOverride] = useState<"income" | "expense" | null>(null);
  const [movementKind, setMovementKind] = useState<"normal" | "fixed">("normal");
  const parsed = useMemo(() => parseQuickAdd(text || ""), [text]);
  const direction = directionOverride ?? parsed.type;

  const matchingCategory = categories.find(
    (category) =>
      category.type === direction &&
      category.name.toLowerCase() === parsed.suggestedCategoryName?.toLowerCase(),
  );

  return (
    <Card className="overflow-hidden bg-[linear-gradient(135deg,var(--card),var(--surface-warm))]">
      <CardContent className="grid gap-4">
        <form action={quickAddPersonalTransactionAction} className="grid gap-4">
          <Field label="Registro rapido">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                name="quickText"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="almuerzo 28000 hoy"
                className="h-14 text-base"
                required
              />
              <div className="grid grid-cols-2 gap-2 sm:w-56">
                <button
                  type="submit"
                  name="direction"
                  value="expense"
                  onPointerDown={() => setDirectionOverride("expense")}
                  className="h-14 rounded-full border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-400/12 dark:text-rose-200"
                >
                  Egreso
                </button>
                <button
                  type="submit"
                  name="direction"
                  value="income"
                  onPointerDown={() => setDirectionOverride("income")}
                  className="h-14 rounded-full border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-400/20 dark:bg-emerald-400/12 dark:text-emerald-200"
                >
                  Ingreso
                </button>
              </div>
            </div>
          </Field>

          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Tipo">
              <Select
                name="movementKind"
                value={movementKind}
                onChange={(event) => setMovementKind(event.target.value as "normal" | "fixed")}
              >
                <option value="normal">Normal</option>
                <option value="fixed">Fijo</option>
              </Select>
            </Field>
            <Field label="Categoria">
              <Select name="categoryId" defaultValue={matchingCategory?.id ?? ""} key={matchingCategory?.id ?? "none"}>
                <option value="">Sugerida</option>
                {categories
                  .filter((category) => category.type === direction)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </Select>
            </Field>
            <DatePickerField name="occurredAt" label="Fecha" defaultValue={parsed.occurredAt} key={parsed.occurredAt} />
            {movementKind === "fixed" ? (
              <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-border bg-background px-4 text-sm font-medium dark:bg-surface-elevated">
                <input name="priority" type="checkbox" className="h-4 w-4 accent-[var(--accent)]" />
                Prioridad
              </label>
            ) : null}
          </div>
        </form>

        <div className="grid gap-3 rounded-[1.2rem] border border-border bg-card/70 p-4 text-sm sm:grid-cols-4">
          <Preview label="Monto" value={parsed.amountCents ? formatMoneyCOP(parsed.amountCents) : "-"} />
          <Preview label="Nota" value={parsed.noteNormalized || "-"} />
          <Preview label="Categoria" value={matchingCategory?.name ?? parsed.suggestedCategoryName ?? "-"} />
          <Preview label="Confianza" value={parsed.confidence} />
        </div>
      </CardContent>
    </Card>
  );
}

function Preview({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 truncate font-semibold tabular">{value}</p>
    </div>
  );
}
