"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
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
    <Card>
      <CardHeader>
        <CardTitle>Abono extraordinario</CardTitle>
        <CardDescription>Compara reduccion de plazo vs reduccion de cuota antes de aplicar.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
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
              <Input name="amount" value={amount} onChange={(event) => setAmount(event.target.value)} />
            </Field>
            <Field label="Fecha">
              <Input
                name="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(event) => setPaymentDate(event.target.value)}
              />
            </Field>
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
          <Button type="submit">Aplicar abono</Button>
        </form>
      </CardContent>
    </Card>
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
