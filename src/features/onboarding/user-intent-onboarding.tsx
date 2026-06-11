"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppIcon, type IconName } from "@/components/ui/app-icon";
import { AccentPreview, AccentSwatches, persistAccentColor } from "@/features/personalization/accent-color-picker";
import type { AccentColorId } from "@/lib/accent-theme";
import { USAGE_MODE_COOKIE, type UsageMode, usageModeCopy } from "@/lib/usage-mode";
import { cn } from "@/lib/utils/cn";

const storageKey = USAGE_MODE_COOKIE;
const maxAge = 60 * 60 * 24 * 365;

export function persistUsageMode(mode: UsageMode) {
  document.cookie = `${USAGE_MODE_COOKIE}=${mode}; path=/; max-age=${maxAge}; SameSite=Lax`;
  window.localStorage.setItem(storageKey, mode);
}

export function UserIntentOnboarding({
  initialMode,
  initialAccent,
}: {
  initialMode: UsageMode | null;
  initialAccent: AccentColorId | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(!initialMode || !initialAccent);
  const [step, setStep] = useState<"mode" | "accent">(!initialMode ? "mode" : "accent");
  const [accent, setAccent] = useState<AccentColorId>(initialAccent ?? "apple");
  const [saving, setSaving] = useState<UsageMode | null>(null);

  function selectMode(mode: UsageMode) {
    setSaving(mode);
    persistUsageMode(mode);
    setSaving(null);
    if (!initialAccent) {
      setStep("accent");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  function selectAccent(value: AccentColorId) {
    setAccent(value);
    document.documentElement.dataset.accent = value;
  }

  function finishAccent() {
    persistAccentColor(accent);
    setOpen(false);
    router.refresh();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/25 px-4 py-4 backdrop-blur-sm sm:items-center">
      <div className="soft-enter w-full max-w-2xl rounded-[1.6rem] border border-border bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pastel-sand text-foreground">
            <AppIcon name="home" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-accent">Primer ajuste</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal">
              {step === "mode" ? "Como quieres usar CrediOS?" : "Elige el estilo de tu CrediOS"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {step === "mode"
                ? "Esto solo ordena tu inicio y tus accesos rapidos. Todos los modulos seguiran disponibles."
                : "Puedes cambiar este color despues en Configuracion."}
            </p>
          </div>
        </div>

        {step === "mode" ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <IntentOption mode="personal" icon="wallet" saving={saving} onSelect={selectMode} />
            <IntentOption mode="portfolio" icon="briefcase" saving={saving} onSelect={selectMode} />
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            <AccentSwatches value={accent} onChange={selectAccent} />
            <AccentPreview value={accent} />
            <button
              type="button"
              onClick={finishAccent}
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:-translate-y-0.5 sm:w-fit"
            >
              Continuar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function IntentOption({
  mode,
  icon,
  saving,
  onSelect,
}: {
  mode: UsageMode;
  icon: IconName;
  saving: UsageMode | null;
  onSelect: (mode: UsageMode) => void;
}) {
  const copy = usageModeCopy[mode];

  return (
    <button
      type="button"
      disabled={Boolean(saving)}
      onClick={() => onSelect(mode)}
      className={cn(
        "group grid min-h-44 gap-4 rounded-[1.35rem] border border-border bg-background p-5 text-left transition duration-150 hover:-translate-y-0.5 hover:border-accent/60 hover:bg-surface-warm focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:pointer-events-none disabled:opacity-60",
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-card text-accent shadow-sm">
        {saving === mode ? <AppIcon name="spinner" /> : <AppIcon name={icon} className="h-5 w-5" />}
      </span>
      <span>
        <span className="block text-base font-semibold">{copy.label}</span>
        <span className="mt-2 block text-sm leading-6 text-muted">{copy.description}</span>
      </span>
    </button>
  );
}
