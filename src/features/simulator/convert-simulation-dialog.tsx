"use client";

import { useState } from "react";
import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { convertSimulationToCreditAction } from "@/server/actions/simulations.actions";

type ClientOption = {
  id: string;
  full_name: string;
};

type CreditPurpose = "personal" | "third_party" | "profitable_placement";

const purposeCopy: Record<CreditPurpose, { title: string; text: string }> = {
  personal: {
    title: "Credito personal",
    text: "Para deudas propias. Al pagarlo puede afectar Mis finanzas como egreso.",
  },
  third_party: {
    title: "Credito a tercero",
    text: "Para controlar dinero administrado a otra persona, con impacto financiero opcional.",
  },
  profitable_placement: {
    title: "Colocacion rentable",
    text: "Para medir capital, recuperacion e intereses como resumen de negocio.",
  },
};

export function ConvertSimulationDialog({
  simulationId,
  clients,
}: {
  simulationId: string;
  clients: ClientOption[];
}) {
  const [open, setOpen] = useState(false);
  const [purpose, setPurpose] = useState<CreditPurpose>("personal");

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="self-end">
        Convertir
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/25 px-3 py-3 backdrop-blur-sm sm:items-center">
          <div className="soft-enter flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[1.5rem] border border-border bg-surface-modal shadow-[var(--shadow-soft)]">
            <div className="flex items-start justify-between gap-4 border-b border-border p-5">
              <div>
                <p className="text-sm font-semibold text-accent">Guardar como credito</p>
                <h2 className="mt-1 text-xl font-semibold">Como quieres clasificarlo?</h2>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Esta decision define si el credito afecta Mis finanzas o solo funciona como control.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-warm"
                aria-label="Cerrar conversion"
              >
                <AppIcon name="close" />
              </button>
            </div>

            <form action={convertSimulationToCreditAction} className="grid min-h-0 gap-4 overflow-y-auto p-5">
              <input type="hidden" name="id" value={simulationId} />
              <input type="hidden" name="creditPurpose" value={purpose} />

              <div className="grid gap-3 sm:grid-cols-3">
                {(Object.keys(purposeCopy) as CreditPurpose[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPurpose(item)}
                    className={`rounded-[1.2rem] border p-4 text-left transition ${
                      purpose === item
                        ? "border-accent bg-accent-soft text-accent-foreground"
                        : "border-border bg-card hover:bg-surface-warm"
                    }`}
                  >
                    <p className="font-semibold">{purposeCopy[item].title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted">{purposeCopy[item].text}</p>
                  </button>
                ))}
              </div>

              <Field label="Asignar cliente opcional">
                <Select name="clientId" defaultValue="">
                  <option value="">Personal / sin cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.full_name}
                    </option>
                  ))}
                </Select>
              </Field>

              {purpose === "third_party" ? (
                <div className="grid gap-3 rounded-[1.2rem] border border-border bg-background p-4 dark:bg-surface-elevated">
                  <label className="flex items-start gap-3 text-sm">
                    <input name="countPaymentsAsIncome" type="checkbox" className="mt-1 h-4 w-4 accent-[var(--accent)]" />
                    <span>
                      <span className="font-semibold">Contar pagos recibidos como ingreso</span>
                      <span className="block text-muted">Si no marcas esto, el credito queda solo como control de cartera.</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 text-sm">
                    <input name="countInterestAsProfit" type="checkbox" className="mt-1 h-4 w-4 accent-[var(--accent)]" />
                    <span>
                      <span className="font-semibold">Contar intereses como ganancia</span>
                      <span className="block text-muted">Usa esta opcion solo si quieres medir utilidad del credito.</span>
                    </span>
                  </label>
                </div>
              ) : null}

              <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  Guardar credito
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
