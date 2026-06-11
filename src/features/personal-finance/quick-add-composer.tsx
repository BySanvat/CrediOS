"use client";

import { SendHorizonal } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  const parsed = useMemo(() => parseQuickAdd(text || ""), [text]);
  const matchingCategory = categories.find(
    (category) =>
      category.type === parsed.type &&
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
              <Button type="submit" size="lg" className="sm:w-40">
                <SendHorizonal className="h-4 w-4" />
                Registrar
              </Button>
            </div>
          </Field>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Tipo">
              <Select name="type" defaultValue={parsed.type} key={parsed.type}>
                <option value="expense">Gasto</option>
                <option value="income">Ingreso</option>
              </Select>
            </Field>
            <Field label="Categoria">
              <Select name="categoryId" defaultValue={matchingCategory?.id ?? ""} key={matchingCategory?.id ?? "none"}>
                <option value="">Sugerida</option>
                {categories
                  .filter((category) => category.type === parsed.type)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Fecha">
              <Input name="occurredAt" type="date" defaultValue={parsed.occurredAt} key={parsed.occurredAt} />
            </Field>
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
