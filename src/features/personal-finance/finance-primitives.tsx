import { Card, CardContent } from "@/components/ui/card";
import { formatMoneyCOP } from "@/domain/finance";
import { cn } from "@/lib/utils/cn";

export function FinanceMetric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "income" | "expense";
}) {
  const mark = tone === "expense" ? "-" : tone === "income" ? "+" : "=";
  return (
    <Card className="soft-enter">
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 text-3xl font-semibold tabular tracking-normal">{formatMoneyCOP(value)}</p>
          </div>
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              tone === "income" && "bg-pastel-green",
              tone === "expense" && "bg-pastel-pink",
              tone === "neutral" && "bg-pastel-sand",
            )}
          >
            <span className="text-lg font-semibold">{mark}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProgressBar({ value, tone = "sand" }: { value: number; tone?: "sand" | "blue" | "pink" | "green" | "yellow" }) {
  const color = {
    sand: "bg-pastel-sand",
    blue: "bg-pastel-blue",
    pink: "bg-pastel-pink",
    green: "bg-pastel-green",
    yellow: "bg-pastel-yellow",
  }[tone];

  return (
    <div className="h-3 overflow-hidden rounded-full bg-surface-warm">
      <div className={cn("h-full rounded-full transition-all duration-200", color)} style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }} />
    </div>
  );
}
