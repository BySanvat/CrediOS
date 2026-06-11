"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyInput, RateInput } from "@/components/ui/financial-input";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { calculateLoanSummary, formatMoneyCOP, moneyToCents, type RateType } from "@/domain/finance";
import { saveSimulationAction } from "@/server/actions/simulations.actions";

const initialState = {
  name: "Simulacion de credito",
  productType: "fixed_installment_credit",
  amount: "10000000",
  rateValue: "2",
  rateType: "monthly_effective" as RateType,
  termMonths: "24",
  startDate: new Date().toISOString().slice(0, 10),
  monthlyFee: "0",
  monthlyInsurance: "0",
  upfrontFee: "0",
  notes: "",
};

export function SimulatorClient() {
  const [values, setValues] = useState(initialState);

  const summary = useMemo(() => {
    try {
      return calculateLoanSummary({
        principalCents: moneyToCents(values.amount),
        rateValue: values.rateValue,
        rateType: values.rateType,
        termMonths: Number(values.termMonths),
        startDate: values.startDate,
        monthlyFeeCents: moneyToCents(values.monthlyFee),
        monthlyInsuranceCents: moneyToCents(values.monthlyInsurance),
        upfrontFeeCents: moneyToCents(values.upfrontFee),
      });
    } catch {
      return null;
    }
  }, [values]);

  function update(name: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Datos de simulacion
          </CardTitle>
          <CardDescription>
            Calcula cuota, intereses y costo total. Guardar es una accion explicita.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveSimulationAction} className="grid gap-4">
            <input type="hidden" name="productType" value={values.productType} />
            <Field label="Nombre">
              <Input name="name" value={values.name} onChange={(event) => update("name", event.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Monto">
                <CurrencyInput
                  name="amount"
                  value={values.amount}
                  onValueChange={(value) => update("amount", value)}
                />
              </Field>
              <Field label="Plazo en meses">
                <Input
                  name="termMonths"
                  type="number"
                  min={1}
                  max={600}
                  value={values.termMonths}
                  onChange={(event) => update("termMonths", event.target.value)}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tasa">
                <RateInput
                  name="rateValue"
                  value={values.rateValue}
                  onValueChange={(value) => update("rateValue", value)}
                />
              </Field>
              <Field label="Tipo de tasa">
                <Select
                  name="rateType"
                  value={values.rateType}
                  onChange={(event) => update("rateType", event.target.value as RateType)}
                >
                  <option value="monthly_effective">Mensual efectiva</option>
                  <option value="effective_annual">Efectiva anual</option>
                  <option value="nominal_annual">Nominal anual</option>
                </Select>
              </Field>
            </div>
            <Field label="Fecha de inicio">
              <Input
                name="startDate"
                type="date"
                value={values.startDate}
                onChange={(event) => update("startDate", event.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Cargo mensual">
                <CurrencyInput
                  name="monthlyFee"
                  value={values.monthlyFee}
                  onValueChange={(value) => update("monthlyFee", value)}
                />
              </Field>
              <Field label="Seguro mensual">
                <CurrencyInput
                  name="monthlyInsurance"
                  value={values.monthlyInsurance}
                  onValueChange={(value) => update("monthlyInsurance", value)}
                />
              </Field>
              <Field label="Cargo inicial">
                <CurrencyInput
                  name="upfrontFee"
                  value={values.upfrontFee}
                  onValueChange={(value) => update("upfrontFee", value)}
                />
              </Field>
            </div>
            <Field label="Notas">
              <Textarea
                name="notes"
                value={values.notes}
                onChange={(event) => update("notes", event.target.value)}
                placeholder="Supuestos, entidad externa o contexto de la simulacion"
              />
            </Field>
            <Button type="submit">
              Guardar simulacion
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
            <CardDescription>Valores estimados con redondeo a centavos.</CardDescription>
          </CardHeader>
          <CardContent>
            {summary ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Metric label="Cuota base" value={formatMoneyCOP(summary.baseMonthlyPaymentCents)} />
                <Metric label="Cuota total" value={formatMoneyCOP(summary.totalMonthlyPaymentCents)} />
                <Metric label="Intereses" value={formatMoneyCOP(summary.totalInterestCents)} />
                <Metric label="Costos" value={formatMoneyCOP(summary.totalFeesCents)} />
                <Metric label="Total pagado" value={formatMoneyCOP(summary.totalPaidCents)} />
                <Metric label="Fecha final" value={summary.finalPaymentDate} />
              </div>
            ) : (
              <p className="text-sm text-muted">Completa los datos para ver el resultado.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tabla de amortizacion</CardTitle>
            <CardDescription>Primeras cuotas del escenario calculado.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="text-xs uppercase text-muted">
                <tr>
                  <th className="py-2">#</th>
                  <th>Fecha</th>
                  <th>Capital</th>
                  <th>Interes</th>
                  <th>Cargos</th>
                  <th>Total</th>
                  <th>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {(summary?.schedule.slice(0, 12) ?? []).map((row) => (
                  <tr key={row.installmentNumber} className="border-t border-border">
                    <td className="py-2 tabular">{row.installmentNumber}</td>
                    <td>{row.dueDate}</td>
                    <td className="tabular">{formatMoneyCOP(row.principalCents)}</td>
                    <td className="tabular">{formatMoneyCOP(row.interestCents)}</td>
                    <td className="tabular">{formatMoneyCOP(row.feesCents)}</td>
                    <td className="tabular font-medium">{formatMoneyCOP(row.totalCents)}</td>
                    <td className="tabular">{formatMoneyCOP(row.remainingBalanceCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular">{value}</p>
    </div>
  );
}
