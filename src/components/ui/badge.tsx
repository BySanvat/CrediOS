import { cn } from "@/lib/utils/cn";

const toneClass = {
  neutral: "bg-surface-warm text-muted",
  green: "bg-pastel-green text-emerald-900 dark:text-emerald-100",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  red: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200",
  teal: "bg-pastel-blue text-sky-950 dark:text-sky-100",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof toneClass }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        toneClass[tone],
        className,
      )}
      {...props}
    />
  );
}
