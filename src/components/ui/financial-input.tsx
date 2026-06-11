"use client";

import { useState } from "react";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/utils/cn";
import { formatThousands, normalizeRateInput } from "@/lib/utils/number-format";

type CurrencyInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "defaultValue" | "onChange"
> & {
  value?: string | number;
  defaultValue?: string | number;
  onValueChange?: (value: string) => void;
};

export function CurrencyInput({
  value,
  defaultValue,
  onValueChange,
  className,
  ...props
}: CurrencyInputProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(formatThousands(defaultValue ?? ""));
  const displayValue = isControlled ? formatThousands(value ?? "") : internal;

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatThousands(event.target.value);
    if (!isControlled) {
      setInternal(formatted);
    }
    onValueChange?.(formatted);
  }

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      className={cn("tabular", className)}
    />
  );
}

type RateInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "defaultValue" | "onChange"
> & {
  value?: string | number;
  defaultValue?: string | number;
  onValueChange?: (value: string) => void;
};

export function RateInput({
  value,
  defaultValue,
  onValueChange,
  className,
  ...props
}: RateInputProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(normalizeRateInput(defaultValue ?? ""));
  const displayValue = isControlled ? normalizeRateInput(value ?? "") : internal;

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const normalized = normalizeRateInput(event.target.value);
    if (!isControlled) {
      setInternal(normalized);
    }
    onValueChange?.(normalized);
  }

  return (
    <div className={cn("relative", className)}>
      <Input
        {...props}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        className="w-full pr-10 tabular"
      />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-muted">
        %
      </span>
    </div>
  );
}
