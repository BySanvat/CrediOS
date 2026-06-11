"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { persistUsageMode } from "@/features/onboarding/user-intent-onboarding";
import { type UsageMode, usageModeCopy } from "@/lib/usage-mode";

export function UsageModeSetting({ initialMode }: { initialMode: UsageMode | null }) {
  const router = useRouter();
  const [mode, setMode] = useState<UsageMode>(initialMode ?? "portfolio");

  function save() {
    persistUsageMode(mode);
    router.refresh();
  }

  return (
    <div className="grid gap-3">
      <Select value={mode} onChange={(event) => setMode(event.target.value as UsageMode)}>
        <option value="personal">{usageModeCopy.personal.label}</option>
        <option value="portfolio">{usageModeCopy.portfolio.label}</option>
      </Select>
      <p className="text-sm leading-6 text-muted">{usageModeCopy[mode].description}</p>
      <Button type="button" variant="secondary" onClick={save} className="w-fit">
        Guardar preferencia de inicio
      </Button>
    </div>
  );
}
