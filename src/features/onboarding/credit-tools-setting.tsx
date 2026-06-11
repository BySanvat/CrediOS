"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { CREDIT_TOOLS_COOKIE } from "@/lib/credit-tools";

const maxAge = 60 * 60 * 24 * 365;

function persistCreditTools(enabled: boolean) {
  document.cookie = `${CREDIT_TOOLS_COOKIE}=${enabled ? "true" : "false"}; path=/; max-age=${maxAge}; SameSite=Lax`;
  window.localStorage.setItem("credios-credit-tools-enabled", enabled ? "true" : "false");
}

export function CreditToolsSetting({ initialEnabled }: { initialEnabled: boolean }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);

  function save(next: boolean) {
    setEnabled(next);
    persistCreditTools(next);
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-[1.35rem] border border-border bg-background p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <AppIcon name="credit" />
          </span>
          <div>
            <p className="font-medium">Creditos, clientes y cartera</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Si usas CrediOS solo para finanzas personales, puedes mantener estas herramientas ocultas y activarlas cuando las necesites.
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant={enabled ? "primary" : "secondary"} onClick={() => save(true)}>
          Activar cartera
        </Button>
        <Button type="button" variant={!enabled ? "primary" : "secondary"} onClick={() => save(false)}>
          Ocultar cartera
        </Button>
      </div>
    </div>
  );
}
