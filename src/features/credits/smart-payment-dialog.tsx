"use client";

import { useMemo, useState } from "react";
import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { CurrencyInput } from "@/components/ui/financial-input";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { formatMoneyCOP, moneyToCents } from "@/domain/finance";
import { recordSmartPaymentAction } from "@/server/actions/payments.actions";

export function SmartPaymentDialog({
  creditId,
  installmentId,
  installmentLabel,
  requiredCents,
  payoffCents,
}: {
  creditId: string;
  installmentId: string;
  installmentLabel: string;
  requiredCents: number;
  payoffCents: number;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(Math.round(requiredCents / 100)));
  const [strategy, setStrategy] = useState<"applied_reduce_term" | "applied_reduce_payment">("applied_reduce_term");
  const amountCents = useMemo(() => {
    try {
      return moneyToCents(amount);
    } catch {
      return 0;
    }
  }, [amount]);
  const excessCents = Math.max(0, amountCents - requiredCents);

  function usePayoffAmount() {
    setAmount(String(Math.round(payoffCents / 100)));
  }

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        <AppIcon name="payment" />
        Pagar
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/25 px-3 py-3 backdrop-blur-sm sm:items-center">
          <div className="soft-enter flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-[1.5rem] border border-border bg-surface-modal shadow-[var(--shadow-soft)]">
            <div className="flex items-start justify-between gap-4 border-b border-border p-5">
              <div>
                <p className="text-sm font-semibold text-accent">Pago inteligente</p>
                <h2 className="mt-1 text-xl font-semibold">{installmentLabel}</h2>
                <p className="mt-1 text-sm leading-6 text-muted">
                  CrediOS aplica primero la cuota vencida o pendiente mas cercana.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-warm"
                aria-label="Cerrar pago"
              >
                <AppIcon name="close" />
              </button>
            </div>

            <form action={recordSmartPaymentAction} className="flex min-h-0 flex-1 flex-col">
              <div className="grid gap-4 overflow-y-auto p-5">
                <input type="hidden" name="creditId" value={creditId} />
                <input type="hidden" name="installmentId" value={installmentId} />

                <div className="grid gap-3 rounded-[1.2rem] border border-border bg-background p-4 sm:grid-cols-2 dark:bg-surface-elevated">
                  <div>
                    <p className="text-sm text-muted">Cuota que se pagara</p>
                    <p className="mt-1 text-xl font-semibold tabular">{formatMoneyCOP(requiredCents)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted">Pago total hoy</p>
                    <p className="mt-1 text-xl font-semibold tabular">{formatMoneyCOP(payoffCents)}</p>
                  </div>
                </div>

                <Field label="Valor a pagar">
                  <CurrencyInput name="amount" value={amount} onValueChange={setAmount} required />
                </Field>

                <Button type="button" variant="secondary" onClick={usePayoffAmount} className="w-full sm:w-fit">
                  Pago total al dia de hoy
                </Button>

                {excessCents > 0 ? (
                  <div className="grid gap-3 rounded-[1.2rem] border border-accent/40 bg-accent-soft/60 p-4">
                    <div>
                      <p className="font-semibold">Excedente detectado</p>
                      <p className="mt-1 text-sm leading-6 text-muted">
                        {formatMoneyCOP(excessCents)} se aplicara como abono a capital.
                      </p>
                    </div>
                    <Field label="Estrategia para el abono">
                      <Select
                        name="extraStrategy"
                        value={strategy}
                        onChange={(event) => setStrategy(event.target.value as "applied_reduce_term" | "applied_reduce_payment")}
                      >
                        <option value="applied_reduce_term">Reducir plazo / tiempo</option>
                        <option value="applied_reduce_payment">Reducir cuota</option>
                      </Select>
                    </Field>
                  </div>
                ) : (
                  <input type="hidden" name="extraStrategy" value="" />
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <DatePickerField name="paymentDate" label="Fecha" required defaultValue={new Date().toISOString().slice(0, 10)} />
                  <Field label="Metodo">
                    <Input name="method" placeholder="Efectivo, transferencia..." />
                  </Field>
                </div>
                <Field label="Notas">
                  <Textarea name="notes" placeholder="Contexto del pago" />
                </Field>
              </div>

              <div className="flex flex-col gap-2 border-t border-border bg-card p-4 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  Registrar pago
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
