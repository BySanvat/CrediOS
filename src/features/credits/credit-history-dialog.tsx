"use client";

import { useState } from "react";
import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMoneyCOP } from "@/domain/finance";

type PaymentRow = {
  id: string;
  payment_date: string;
  amount_cents: number;
  method?: string | null;
  notes?: string | null;
};

type ExtraPaymentRow = {
  id: string;
  payment_date: string;
  amount_cents: number;
  strategy?: string | null;
  interest_savings_cents?: number | null;
};

export function CreditHistoryDialog({
  title,
  type,
  rows,
}: {
  title: string;
  type: "payments" | "extra";
  rows: PaymentRow[] | ExtraPaymentRow[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)} className="w-full">
        {title}
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/25 px-3 py-3 backdrop-blur-sm sm:items-center">
          <div className="soft-enter flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-[1.5rem] border border-border bg-surface-modal shadow-[var(--shadow-soft)]">
            <div className="flex items-start justify-between gap-4 border-b border-border p-5">
              <div>
                <p className="text-sm font-semibold text-accent">Historial</p>
                <h2 className="mt-1 text-xl font-semibold">{title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-warm"
                aria-label="Cerrar historial"
              >
                <AppIcon name="close" />
              </button>
            </div>

            <div className="min-h-0 overflow-y-auto p-5">
              {rows.length ? (
                <div className="grid gap-3">
                  {rows.map((row) => (
                    <div key={row.id} className="rounded-[1.1rem] border border-border bg-card p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{row.payment_date}</p>
                        <p className="font-semibold tabular">{formatMoneyCOP(row.amount_cents)}</p>
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        {type === "payments"
                          ? `${(row as PaymentRow).method || "Sin metodo"} - ${(row as PaymentRow).notes || "Sin notas"}`
                          : `${(row as ExtraPaymentRow).strategy || "Abono"} - ahorro estimado ${formatMoneyCOP(
                              (row as ExtraPaymentRow).interest_savings_cents ?? 0,
                            )}`}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={type === "payments" ? "Sin pagos" : "Sin abonos"}
                  text={type === "payments" ? "Registra pagos para ver historial." : "Aplica abonos para comparar estrategias."}
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
