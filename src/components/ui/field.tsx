"use client";

import { Children, isValidElement, useEffect, useMemo, useRef, useState } from "react";

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
        "h-11 rounded-2xl border border-line bg-surface px-4 text-sm text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10 dark:bg-surface-elevated",
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
        "min-h-24 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10 dark:bg-surface-elevated",
        props.className,
      )}
    />
  );
}

type OptionItem = {
  value: string;
  label: string;
  disabled?: boolean;
};

function getOptionItems(children: React.ReactNode): OptionItem[] {
  return Children.toArray(children)
    .filter(isValidElement)
    .map((child) => {
      const props = child.props as {
        value?: string | number;
        children?: React.ReactNode;
        disabled?: boolean;
      };

      return {
        value: String(props.value ?? ""),
        label: Children.toArray(props.children).join(""),
        disabled: props.disabled,
      };
    });
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { children, className, name, value, defaultValue, onChange, required, disabled } = props;
  const options = useMemo(() => getOptionItems(children), [children]);
  const initialValue = String(value ?? defaultValue ?? options[0]?.value ?? "");
  const [internalValue, setInternalValue] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  const selectedValue = value !== undefined ? String(value) : internalValue;
  const selected = options.find((option) => option.value === selectedValue) ?? options[0];

  useEffect(() => {
    function closeOnOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function choose(nextValue: string) {
    if (value === undefined) {
      setInternalValue(nextValue);
    }

    setOpen(false);
    onChange?.({ target: { value: nextValue } } as React.ChangeEvent<HTMLSelectElement>);
  }

  return (
    <span ref={rootRef} className="relative block">
      {name ? <input type="hidden" name={name} value={selectedValue} required={required} /> : null}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 text-left text-sm text-foreground shadow-[0_10px_30px_rgba(15,23,42,0.04)] outline-none transition hover:border-accent/35 focus:border-accent focus:ring-4 focus:ring-accent/10 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-surface-elevated",
          className,
        )}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="min-w-0 truncate">{selected?.label ?? "Selecciona"}</span>
        <span className="text-xs text-muted" aria-hidden="true">
          v
        </span>
      </button>
      {open ? (
        <span
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-line bg-surface-modal p-1.5 text-sm shadow-[0_24px_80px_rgba(15,23,42,0.18)] dark:bg-surface-modal"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === selectedValue}
              disabled={option.disabled}
              className={cn(
                "flex w-full items-center rounded-xl px-3 py-2.5 text-left text-foreground transition hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50",
                option.value === selectedValue && "bg-accent-soft text-accent",
              )}
              onClick={() => choose(option.value)}
            >
              {option.label}
            </button>
          ))}
        </span>
      ) : null}
    </span>
  );
}
