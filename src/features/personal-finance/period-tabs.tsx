import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { PersonalPeriod } from "@/domain/personal-finance";

const labels: Record<PersonalPeriod, string> = {
  month: "Mes",
  quarter: "Trimestre",
  year: "Anio",
};

export function PeriodTabs({ basePath, active }: { basePath: string; active: PersonalPeriod }) {
  return (
    <div className="inline-flex rounded-full border border-border bg-card p-1 shadow-sm">
      {(Object.keys(labels) as PersonalPeriod[]).map((period) => (
        <Link
          key={period}
          href={`${basePath}?period=${period}`}
          className={cn(
            "rounded-full px-3 py-2 text-sm font-medium transition",
            active === period ? "bg-accent text-accent-foreground" : "text-muted hover:bg-surface-warm hover:text-foreground",
          )}
        >
          {labels[period]}
        </Link>
      ))}
    </div>
  );
}
