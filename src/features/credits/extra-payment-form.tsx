"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { CurrencyInput } from "@/components/ui/financial-input";
import { Field, Select, Textarea } from "@/components/ui/field";
import {
  formatMoneyCOP,
  moneyToCents,
  simulateExtraPaymentReducePayment,
  simulateExtraPaymentReduceTerm,
  type RateType,
} from "@/domain/finance";
import { applyExtraPaymentAction } from "@/server/actions/payments.actions";

export function ExtraPaymentForm({
  creditId,
  currentBalanceCents,
  rateValue,
  rateType,
  termMonths,
  monthlyFeeCents,
  monthlyInsuranceCents,
}: {
  creditId: string;
  currentBalanceCents: number;
  rateValue: string;
  rateType: RateType;
  termMonths: number;
  monthlyFeeCents: number;
  monthlyInsuranceCents: number;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("500000");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [strategy, setStrategy] = useState<"applied_reduce_term" | "applied_reduce_payment">(
    "applied_reduce_term",
  );

  const comparison = useMemo(() => {
    try {
      const extraPaymentCents = moneyToCents(amount);
      const loan = {
        principalCents: currentBalanceCents,
        rateValue,
        rateType,
        termMonths,
        startDate: paymentDate,
        monthlyFeeCents,
        monthlyInsuranceCents,
        upfrontFeeCents: 0,
      };

      return {
        reduceTerm: simulateExtraPaymentReduceTerm({ loan, extraPaymentCents }),
        reducePayment: simulateExtraPaymentReducePayment({ loan, extraPaymentCents }),
      };
    } catch {
      return null;
    }
  }, [amount, currentBalanceCents, monthlyFeeCents, monthlyInsuranceCents, paymentDate, rateType, rateValue, termMonths]);

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)} className="w-full">
        Abono a capital
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/25 px-3 py-3 backdrop-blur-sm sm:items-center">
          <Card className="soft-enter flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden bg-surface-modal">
            <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border">
              <div>
                <CardTitle>Abono a capital</CardTitle>
                <CardDescription>Compara reduccion de plazo vs reduccion de cuota antes de aplicar.</CardDescription>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-warm"
                aria-label="Cerrar abono"
              >
                x
              </button>
            </CardHeader>
            <CardContent className="grid min-h-0 gap-4 overflow-y-auto">
              <div className="grid gap-3 sm:grid-cols-2">
                <Preview
                  title="Reducir plazo"
                  value={comparison ? `${comparison.reduceTerm.newTermMonths} meses` : "-"}
                  savings={comparison ? comparison.reduceTerm.interestSavingsCents : 0}
                />
                <Preview
                  title="Reducir cuota"
                  value={comparison ? formatMoneyCOP(comparison.reducePayment.newMonthlyPaymentCents) : "-"}
                  savings={comparison ? comparison.reducePayment.interestSavingsCents : 0}
                />
              </div>

              <form action={applyExtraPaymentAction} className="grid gap-4">
                <input type="hidden" name="creditId" value={creditId} />
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Valor del abono">
                    <CurrencyInput name="amount" value={amount} onValueChange={setAmount} />
                  </Field>
                  <DatePickerField name="paymentDate" label="Fecha" value={paymentDate} onValueChange={setPaymentDate} required />
                  <Field label="Estrategia">
                    <Select
                      name="strategy"
                      value={strategy}
                      onChange={(event) =>
                        setStrategy(event.target.value as "applied_reduce_term" | "applied_reduce_payment")
                      }
                    >
                      <option value="applied_reduce_term">Reducir plazo</option>
                      <option value="applied_reduce_payment">Reducir cuota</option>
                    </Select>
                  </Field>
                </div>
                <Field label="Notas">
                  <Textarea name="notes" placeholder="Contexto del abono registrado" />
                </Field>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="w-full sm:w-auto">
                    Cancelar
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto">Aplicar abono</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}

function Preview({ title, value, savings }: { title: string; value: string; savings: number }) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <p className="text-sm text-muted">{title}</p>
      <p className="mt-1 text-xl font-semibold tabular">{value}</p>
      <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">
        Ahorro estimado: {formatMoneyCOP(savings)}
      </p>
    </div>
  );
}
