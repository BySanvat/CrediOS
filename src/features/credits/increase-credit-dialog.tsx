"use client";

import { useState } from "react";

import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { CurrencyInput } from "@/components/ui/financial-input";
import { Field, Input, Textarea } from "@/components/ui/field";
import { formatMoneyCOP } from "@/domain/finance";
import { increaseCreditBalanceAction } from "@/server/actions/credits.actions";

export function IncreaseCreditDialog({
  creditId,
  currentBalanceCents,
  defaultTermMonths,
}: {
  creditId: string;
  currentBalanceCents: number;
  defaultTermMonths: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-2xl font-semibold text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-100 dark:border-emerald-400/20 dark:bg-emerald-400/12 dark:text-emerald-200"
        aria-label="Aumentar credito registrado"
        title="Aumentar credito"
      >
        +
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/25 px-3 py-3 backdrop-blur-sm sm:items-center">
          <div className="soft-enter flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-[1.5rem] border border-border bg-surface-modal shadow-[var(--shadow-soft)]">
            <div className="flex items-start justify-between gap-4 border-b border-border p-5">
              <div>
                <p className="text-sm font-semibold text-accent">Aumentar saldo</p>
                <h2 className="mt-1 text-xl font-semibold">Retanqueo administrativo</h2>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Saldo actual: {formatMoneyCOP(currentBalanceCents)}. CrediOS solo registra el ajuste que indiques.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-warm"
                aria-label="Cerrar aumento"
              >
                <AppIcon name="close" />
              </button>
            </div>

            <form action={increaseCreditBalanceAction} className="flex min-h-0 flex-1 flex-col">
              <div className="grid gap-4 overflow-y-auto p-5">
                <input type="hidden" name="creditId" value={creditId} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Valor">
                    <CurrencyInput name="amount" required />
                  </Field>
                  <Field label="Nuevo plazo meses">
                    <Input name="termMonths" type="number" min={1} max={600} defaultValue={defaultTermMonths} required />
                  </Field>
                </div>
                <DatePickerField name="movementDate" label="Fecha" defaultValue={new Date().toISOString().slice(0, 10)} required />
                <Field label="Notas">
                  <Textarea name="notes" placeholder="Contexto del aumento registrado por el usuario" />
                </Field>
              </div>
              <div className="flex flex-col gap-2 border-t border-border bg-card p-4 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  Registrar aumento
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
