import { cn } from "@/lib/utils/cn";

const toneClass = {
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  red: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200",
  teal: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-200",
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
