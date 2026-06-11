import { cn } from "@/lib/utils/cn";

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
      {hint ? <span className="text-xs font-normal text-muted">{hint}</span> : null}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-11 rounded-2xl border border-border bg-background px-3.5 text-sm outline-none transition duration-150 placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20",
        props.className,
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-24 rounded-2xl border border-border bg-background px-3.5 py-3 text-sm outline-none transition duration-150 placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20",
        props.className,
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block">
      <select
        {...props}
        className={cn(
          "h-11 w-full appearance-none rounded-2xl border border-border bg-background px-3.5 pr-10 text-sm shadow-sm outline-none transition duration-150 focus:border-accent focus:ring-2 focus:ring-accent/20",
          props.className,
        )}
      />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted">⌄</span>
    </span>
  );
}
