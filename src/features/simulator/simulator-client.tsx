"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { CurrencyInput, RateInput } from "@/components/ui/financial-input";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { calculateLoanSummary, formatMoneyCOP, moneyToCents, type LoanSummary, type RateType } from "@/domain/finance";
import { saveSimulationStateAction } from "@/server/actions/simulations.actions";

type Charge = {
  id: string;
  type: "monthly_insurance" | "upfront_fee" | "other";
  name: string;
  mode: "fixed" | "percentage_balance";
  frequency: "monthly" | "upfront";
  value: string;
};

type ChargeDraft = Omit<Charge, "id"> & { id?: string };

const initialState = {
  name: "Simulacion de credito",
  productType: "fixed_installment_credit",
  amount: "10000000",
  rateValue: "2",
  rateType: "monthly_effective" as RateType,
  termMonths: "24",
  startDate: new Date().toISOString().slice(0, 10),
  notes: "",
};

const emptyCharge: ChargeDraft = {
  type: "monthly_insurance",
  name: "Seguro mensual",
  mode: "fixed",
  frequency: "monthly",
  value: "0",
};

export function SimulatorClient() {
  const [values, setValues] = useState(initialState);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [chargeOpen, setChargeOpen] = useState(false);
  const [chargeDraft, setChargeDraft] = useState<ChargeDraft>(emptyCharge);
  const [resultOpen, setResultOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [saveState, saveFormAction, savePending] = useActionState(saveSimulationStateAction, { ok: false });

  const derivedCharges = useMemo(() => deriveCharges(values.amount, charges), [charges, values.amount]);

  const summary = useMemo(() => {
    try {
      return calculateLoanSummary({
        principalCents: moneyToCents(values.amount),
        rateValue: values.rateValue,
        rateType: values.rateType,
        termMonths: Number(values.termMonths),
        startDate: values.startDate,
        monthlyFeeCents: derivedCharges.monthlyFeeCents,
        monthlyInsuranceCents: derivedCharges.monthlyInsuranceCents,
        upfrontFeeCents: derivedCharges.upfrontFeeCents,
      });
    } catch {
      return null;
    }
  }, [derivedCharges, values]);

  function update(name: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function openChargeModal(charge?: Charge) {
    setChargeDraft(
      charge ?? {
        ...emptyCharge,
        id: undefined,
      },
    );
    setChargeOpen(true);
  }

  function saveCharge() {
    const normalized: Charge = {
      id: chargeDraft.id ?? crypto.randomUUID(),
      type: chargeDraft.type,
      name: chargeDraft.name.trim() || chargeNameFor(chargeDraft.type),
      mode: chargeDraft.type === "other" ? chargeDraft.mode : "fixed",
      frequency: chargeDraft.type === "upfront_fee" ? "upfront" : chargeDraft.frequency,
      value: chargeDraft.value || "0",
    };

    setCharges((current) => {
      if (chargeDraft.id) {
        return current.map((charge) => (charge.id === chargeDraft.id ? normalized : charge));
      }
      return [...current, normalized];
    });
    setChargeOpen(false);
  }

  function removeCharge(id: string) {
    setCharges((current) => current.filter((charge) => charge.id !== id));
  }

  function openResult() {
    if (summary) setResultOpen(true);
  }

  function printSimulation() {
    if (!summary) return;
    const printable = buildPrintableSimulation(values, charges, derivedCharges, summary);
    const popup = window.open("", "_blank");
    if (!popup) {
      window.print();
      return;
    }
    popup.document.write(printable);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  async function shareSimulation() {
    if (!summary) return;
    const text = [
      `CrediOS by Sanvat - ${values.name}`,
      `Monto: ${formatMoneyCOP(moneyToCents(values.amount))}`,
      `Cuota estimada: ${formatMoneyCOP(summary.totalMonthlyPaymentCents)}`,
      `Plazo: ${values.termMonths} meses`,
      `Total pagado: ${formatMoneyCOP(summary.totalPaidCents)}`,
    ].join("\n");

    try {
      if (navigator.share) {
        await navigator.share({ title: values.name, text });
        setShareMessage("Resumen compartido.");
        return;
      }
      await navigator.clipboard.writeText(text);
      setShareMessage("Resumen copiado al portapapeles.");
    } catch {
      setShareMessage("No se pudo compartir. Puedes exportar el PDF e intentarlo de nuevo.");
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Datos de simulacion</CardTitle>
          <CardDescription>Calcula cuota, intereses y costo total. El resultado se abre al simular.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Field label="Nombre">
            <Input name="name" value={values.name} onChange={(event) => update("name", event.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Field label="Monto">
              <CurrencyInput
                name="amount"
                value={values.amount}
                onValueChange={(value) => update("amount", value)}
                className="min-w-0 overflow-x-auto whitespace-nowrap"
              />
            </Field>
            <Field label="Plazo">
              <Input
                name="termMonths"
                type="number"
                min={1}
                max={600}
                placeholder="Meses"
                value={values.termMonths}
                onChange={(event) => update("termMonths", event.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
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

          <DatePickerField
            name="startDate"
            label="Fecha"
            value={values.startDate}
            onValueChange={(value) => update("startDate", value)}
            required
          />

          <section className="grid gap-3 rounded-[1.4rem] border border-border bg-background p-4 dark:bg-surface-elevated">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Cargos</p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Agrega seguros, cargos iniciales u otros costos sin saturar el formulario.
                </p>
              </div>
              <Button type="button" variant="secondary" onClick={() => openChargeModal()} className="w-full sm:w-auto">
                <AppIcon name="plus" />
                Anadir cargo
              </Button>
            </div>

            {charges.length ? (
              <div className="grid gap-2">
                {charges.map((charge) => (
                  <div
                    key={charge.id}
                    className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{charge.name}</p>
                      <p className="mt-1 text-xs text-muted">
                        {chargeLabel(charge)} - {charge.mode === "percentage_balance" ? `${charge.value}% del saldo` : charge.value}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => openChargeModal(charge)}>
                        Editar
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeCharge(charge.id)}>
                        Borrar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted">
                Sin cargos adicionales. Puedes simular solo capital, tasa y plazo.
              </p>
            )}
          </section>

          <Field label="Notas">
            <Textarea
              name="notes"
              value={values.notes}
              onChange={(event) => update("notes", event.target.value)}
              placeholder="Supuestos, entidad externa o contexto de la simulacion"
            />
          </Field>

          <Button type="button" onClick={openResult} disabled={!summary}>
            Simular
          </Button>
        </CardContent>
      </Card>

      {chargeOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/25 px-3 py-3 backdrop-blur-sm sm:items-center">
          <div className="soft-enter w-full max-w-lg overflow-hidden rounded-[1.5rem] border border-border bg-surface-modal shadow-[var(--shadow-soft)]">
            <div className="flex items-start justify-between gap-3 border-b border-border p-5">
              <div>
                <p className="text-sm font-semibold text-accent">Nuevo cargo</p>
                <h2 className="mt-1 text-xl font-semibold">Configura un costo adicional</h2>
              </div>
              <button
                type="button"
                onClick={() => setChargeOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-warm"
                aria-label="Cerrar cargo"
              >
                <AppIcon name="close" />
              </button>
            </div>
            <div className="grid max-h-[72vh] gap-4 overflow-y-auto p-5">
              <Field label="Tipo">
                <Select
                  value={chargeDraft.type}
                  onChange={(event) => {
                    const nextType = event.target.value as Charge["type"];
                    setChargeDraft((current) => ({
                      ...current,
                      type: nextType,
                      name: current.name === chargeNameFor(current.type) ? chargeNameFor(nextType) : current.name,
                      frequency: nextType === "upfront_fee" ? "upfront" : "monthly",
                    }));
                  }}
                >
                  <option value="monthly_insurance">Seguro mensual</option>
                  <option value="upfront_fee">Cargo inicial</option>
                  <option value="other">Otro</option>
                </Select>
              </Field>
              <Field label="Nombre">
                <Input
                  value={chargeDraft.name}
                  onChange={(event) => setChargeDraft((current) => ({ ...current, name: event.target.value }))}
                />
              </Field>
              {chargeDraft.type === "other" ? (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Modalidad">
                    <Select
                      value={chargeDraft.mode}
                      onChange={(event) =>
                        setChargeDraft((current) => ({ ...current, mode: event.target.value as Charge["mode"] }))
                      }
                    >
                      <option value="fixed">Valor fijo</option>
                      <option value="percentage_balance">Porcentaje del saldo</option>
                    </Select>
                  </Field>
                  <Field label="Aplicacion">
                    <Select
                      value={chargeDraft.frequency}
                      onChange={(event) =>
                        setChargeDraft((current) => ({ ...current, frequency: event.target.value as Charge["frequency"] }))
                      }
                    >
                      <option value="monthly">Mensual</option>
                      <option value="upfront">Unica inicial</option>
                    </Select>
                  </Field>
                </div>
              ) : null}
              <Field label={chargeDraft.mode === "percentage_balance" ? "Porcentaje" : "Valor"}>
                {chargeDraft.mode === "percentage_balance" ? (
                  <RateInput
                    value={chargeDraft.value}
                    onValueChange={(value) => setChargeDraft((current) => ({ ...current, value }))}
                  />
                ) : (
                  <CurrencyInput
                    value={chargeDraft.value}
                    onValueChange={(value) => setChargeDraft((current) => ({ ...current, value }))}
                  />
                )}
              </Field>
            </div>
            <div className="flex flex-col gap-2 border-t border-border bg-card p-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setChargeOpen(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button type="button" onClick={saveCharge} className="w-full sm:w-auto">
                Guardar cargo
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {resultOpen && summary ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/25 px-2 py-2 backdrop-blur-sm sm:items-center sm:px-4">
          <div className="soft-enter flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[1.5rem] border border-border bg-surface-modal shadow-[var(--shadow-soft)]">
            <div className="flex items-start justify-between gap-3 border-b border-border p-4 sm:p-5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-accent">Resultado de simulacion</p>
                <h2 className="mt-1 truncate text-xl font-semibold sm:text-2xl">{values.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setResultOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-warm"
                aria-label="Cerrar resultado"
              >
                <AppIcon name="close" />
              </button>
            </div>

            <div className="grid min-h-0 gap-5 overflow-y-auto p-4 sm:p-5">
              <div className="rounded-[2rem] border border-border bg-[radial-gradient(circle_at_top_right,var(--pastel-blue),transparent_34%),linear-gradient(135deg,var(--accent-soft),var(--card)_72%)] p-6 shadow-[var(--shadow-soft)] sm:p-8 dark:bg-[radial-gradient(circle_at_top_right,var(--pastel-blue),transparent_34%),linear-gradient(135deg,var(--accent-soft),var(--surface-modal)_72%)]">
                <p className="text-sm font-medium text-muted">Cuota total estimada</p>
                <p className="mt-2 text-5xl font-semibold tracking-normal text-foreground tabular sm:text-6xl">
                  {formatMoneyCOP(summary.totalMonthlyPaymentCents)}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted">
                  Incluye capital, intereses y cargos configurados.
                </p>
                <PaymentComposition summary={summary} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <Metric label="Cuota base" value={formatMoneyCOP(summary.baseMonthlyPaymentCents)} />
                <Metric label="Intereses" value={formatMoneyCOP(summary.totalInterestCents)} />
                <Metric label="Costos" value={formatMoneyCOP(summary.totalFeesCents)} />
                <Metric label="Total pagado" value={formatMoneyCOP(summary.totalPaidCents)} />
                <Metric label="Fecha final" value={summary.finalPaymentDate} />
              </div>

              <section className="grid gap-3">
                <div>
                  <h3 className="text-lg font-semibold">Tabla de amortizacion</h3>
                  <p className="text-sm text-muted">Primeras cuotas del escenario calculado.</p>
                </div>
                <div className="overflow-x-auto rounded-[1.2rem] border border-border">
                  <table className="w-full min-w-[720px] border-separate border-spacing-y-1 p-2 text-left text-sm">
                    <thead className="text-xs uppercase text-muted">
                      <tr>
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">Fecha</th>
                        <th className="px-3 py-2">Capital</th>
                        <th className="px-3 py-2">Interes</th>
                        <th className="px-3 py-2">Cargos</th>
                        <th className="px-3 py-2">Total</th>
                        <th className="px-3 py-2">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.schedule.slice(0, 24).map((row) => (
                        <tr key={row.installmentNumber} className="odd:bg-card even:bg-accent-soft/45 dark:odd:bg-surface-elevated dark:even:bg-accent-soft/20">
                          <td className="rounded-l-2xl px-3 py-3 tabular">{row.installmentNumber}</td>
                          <td className="px-3 py-3">{row.dueDate}</td>
                          <td className="px-3 py-3 tabular">{formatMoneyCOP(row.principalCents)}</td>
                          <td className="px-3 py-3 tabular">{formatMoneyCOP(row.interestCents)}</td>
                          <td className="px-3 py-3 tabular">{formatMoneyCOP(row.feesCents)}</td>
                          <td className="px-3 py-3 tabular font-medium">{formatMoneyCOP(row.totalCents)}</td>
                          <td className="rounded-r-2xl px-3 py-3 tabular">{formatMoneyCOP(row.remainingBalanceCents)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {shareMessage ? (
                <p className="rounded-2xl border border-border bg-surface-warm px-4 py-3 text-sm text-muted">
                  {shareMessage}
                </p>
              ) : null}

              {saveState.error ? (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-100">
                  {saveState.error}
                </p>
              ) : null}
              {saveState.ok ? (
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-100">
                  Simulacion guardada. Puedes verla en Simulaciones guardadas.
                </p>
              ) : null}
            </div>

            <div className="grid gap-2 border-t border-border bg-card p-4 sm:flex sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={printSimulation} className="w-full sm:w-auto">
                Exportar PDF
              </Button>
              <Button type="button" variant="secondary" onClick={shareSimulation} className="w-full sm:w-auto">
                Compartir
              </Button>
              <form action={saveFormAction} className="contents">
                <SimulationHiddenFields values={values} derivedCharges={derivedCharges} charges={charges} />
                <Button type="submit" disabled={savePending} className="w-full sm:w-auto">
                  {savePending ? <AppIcon name="spinner" /> : null}
                  {savePending ? "Guardando..." : "Guardar simulacion"}
                </Button>
              </form>
              {saveState.ok ? (
                <Button asChild variant="ghost" className="w-full sm:w-auto">
                  <Link href="/simulaciones">Ver guardadas</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function deriveCharges(amount: string, charges: Charge[]) {
  let principalCents = 0;
  try {
    principalCents = moneyToCents(amount);
  } catch {
    principalCents = 0;
  }

  return charges.reduce(
    (totals, charge) => {
      const chargeCents =
        charge.mode === "percentage_balance"
          ? Math.round((principalCents * Number(charge.value || 0)) / 100)
          : safeMoneyToCents(charge.value);

      if (charge.type === "monthly_insurance") {
        totals.monthlyInsuranceCents += chargeCents;
      } else if (charge.type === "upfront_fee") {
        totals.upfrontFeeCents += chargeCents;
      } else if (charge.frequency === "upfront") {
        totals.upfrontFeeCents += chargeCents;
      } else {
        totals.monthlyFeeCents += chargeCents;
      }
      return totals;
    },
    { monthlyFeeCents: 0, monthlyInsuranceCents: 0, upfrontFeeCents: 0 },
  );
}

function safeMoneyToCents(value: string) {
  try {
    return moneyToCents(value);
  } catch {
    return 0;
  }
}

function chargeNameFor(type: Charge["type"]) {
  if (type === "monthly_insurance") return "Seguro mensual";
  if (type === "upfront_fee") return "Cargo inicial";
  return "Otro cargo";
}

function chargeLabel(charge: Charge) {
  if (charge.type === "monthly_insurance") return "Seguro mensual";
  if (charge.type === "upfront_fee") return "Cargo inicial";
  return charge.frequency === "monthly" ? "Otro mensual" : "Otro inicial";
}

function centsToInput(cents: number) {
  return String(Math.round(cents / 100));
}

function SimulationHiddenFields({
  values,
  derivedCharges,
  charges,
}: {
  values: typeof initialState;
  derivedCharges: ReturnType<typeof deriveCharges>;
  charges: Charge[];
}) {
  const chargeNotes = charges.length
    ? `\nCargos: ${charges.map((charge) => `${charge.name} (${chargeLabel(charge)}: ${charge.value})`).join("; ")}`
    : "";

  return (
    <>
      <input type="hidden" name="productType" value={values.productType} />
      <input type="hidden" name="name" value={values.name} />
      <input type="hidden" name="amount" value={values.amount} />
      <input type="hidden" name="rateValue" value={values.rateValue} />
      <input type="hidden" name="rateType" value={values.rateType} />
      <input type="hidden" name="termMonths" value={values.termMonths} />
      <input type="hidden" name="startDate" value={values.startDate} />
      <input type="hidden" name="monthlyFee" value={centsToInput(derivedCharges.monthlyFeeCents)} />
      <input type="hidden" name="monthlyInsurance" value={centsToInput(derivedCharges.monthlyInsuranceCents)} />
      <input type="hidden" name="upfrontFee" value={centsToInput(derivedCharges.upfrontFeeCents)} />
      <input type="hidden" name="notes" value={`${values.notes}${chargeNotes}`} />
    </>
  );
}

function PaymentComposition({
  summary,
}: {
  summary: {
    schedule: Array<{ principalCents: number; interestCents: number; feesCents: number; totalCents: number }>;
    totalMonthlyPaymentCents: number;
  };
}) {
  const first = summary.schedule[0];
  const total = Math.max(1, first?.totalCents ?? summary.totalMonthlyPaymentCents);
  const fees = first?.feesCents ?? 0;
  const parts = [
    { label: "Capital", value: first?.principalCents ?? 0, className: "bg-pastel-blue" },
    { label: "Intereses", value: first?.interestCents ?? 0, className: "bg-pastel-pink" },
    { label: "Seguros y cargos", value: fees, className: "bg-pastel-yellow" },
  ].filter((item) => item.value > 0);

  return (
    <div className="mt-5 grid gap-3">
      <div className="flex h-5 overflow-hidden rounded-full bg-background/70 ring-1 ring-border dark:bg-background/50">
        {parts.map((part) => (
          <span key={part.label} className={part.className} style={{ width: `${Math.max(6, (part.value / total) * 100)}%` }} />
        ))}
      </div>
      <div className="grid gap-2 text-xs text-muted sm:grid-cols-3">
        {parts.map((part) => (
          <div key={part.label} className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${part.className}`} />
            <span>{part.label}: {formatMoneyCOP(part.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4 dark:bg-surface-elevated">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular">{value}</p>
    </div>
  );
}

function buildPrintableSimulation(
  values: typeof initialState,
  charges: Charge[],
  derivedCharges: ReturnType<typeof deriveCharges>,
  summary: LoanSummary,
) {
  const rows = summary.schedule
    .map(
      (row) => `
        <tr>
          <td>${row.installmentNumber}</td>
          <td>${row.dueDate}</td>
          <td>${formatMoneyCOP(row.principalCents)}</td>
          <td>${formatMoneyCOP(row.interestCents)}</td>
          <td>${formatMoneyCOP(row.feesCents)}</td>
          <td>${formatMoneyCOP(row.totalCents)}</td>
          <td>${formatMoneyCOP(row.remainingBalanceCents)}</td>
        </tr>`,
    )
    .join("");
  const chargeRows = charges.length
    ? charges.map((charge) => `<li>${escapeHtml(charge.name)} - ${chargeLabel(charge)} - ${escapeHtml(charge.value)}</li>`).join("")
    : "<li>Sin cargos adicionales</li>";

  return `<!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(values.name)}</title>
        <style>
          body{font-family:Inter,Arial,sans-serif;background:#FCFBF7;color:#171615;margin:0;padding:32px}
          .wrap{max-width:980px;margin:0 auto}
          .brand{color:#4F8F59;font-weight:700;font-size:14px}
          h1{font-size:34px;margin:8px 0 6px}
          .hero{border:1px solid #ECE7E2;border-radius:28px;background:#fff;padding:28px;margin:24px 0;box-shadow:0 18px 60px rgba(23,22,21,.08)}
          .quote{font-size:44px;font-weight:750;margin:8px 0}
          .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
          .box{border:1px solid #ECE7E2;border-radius:18px;background:#fff;padding:14px}
          .label{font-size:12px;color:#6F6965}
          .value{font-size:18px;font-weight:700;margin-top:4px}
          table{width:100%;border-collapse:separate;border-spacing:0 6px;margin-top:18px;font-size:12px}
          th{text-align:left;color:#6F6965;padding:8px}
          td{background:#fff;padding:10px 8px}
          tr:nth-child(even) td{background:#EDF8EF}
          td:first-child{border-radius:12px 0 0 12px}
          td:last-child{border-radius:0 12px 12px 0}
          @media print{body{padding:12px}.hero,.box{box-shadow:none}.grid{grid-template-columns:repeat(2,1fr)}}
        </style>
      </head>
      <body>
        <main class="wrap">
          <p class="brand">CrediOS by Sanvat</p>
          <h1>${escapeHtml(values.name)}</h1>
          <p>Simulacion generada para organizar y comparar escenarios financieros.</p>
          <section class="hero">
            <p class="label">Cuota total estimada</p>
            <p class="quote">${formatMoneyCOP(summary.totalMonthlyPaymentCents)}</p>
            <p>Monto ${formatMoneyCOP(moneyToCents(values.amount))} · ${values.termMonths} meses · ${values.rateValue}%</p>
          </section>
          <section class="grid">
            <div class="box"><p class="label">Intereses</p><p class="value">${formatMoneyCOP(summary.totalInterestCents)}</p></div>
            <div class="box"><p class="label">Costos</p><p class="value">${formatMoneyCOP(summary.totalFeesCents)}</p></div>
            <div class="box"><p class="label">Total pagado</p><p class="value">${formatMoneyCOP(summary.totalPaidCents)}</p></div>
            <div class="box"><p class="label">Fecha final</p><p class="value">${summary.finalPaymentDate}</p></div>
          </section>
          <section class="box" style="margin-top:16px">
            <p class="label">Cargos configurados</p>
            <ul>${chargeRows}</ul>
            <p class="label">Cargos mensuales: ${formatMoneyCOP(derivedCharges.monthlyFeeCents + derivedCharges.monthlyInsuranceCents)} · Cargos iniciales: ${formatMoneyCOP(derivedCharges.upfrontFeeCents)}</p>
          </section>
          <table>
            <thead><tr><th>#</th><th>Fecha</th><th>Capital</th><th>Interes</th><th>Cargos</th><th>Total</th><th>Saldo</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </main>
      </body>
    </html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
