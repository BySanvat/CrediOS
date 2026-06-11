import Link from "next/link";
import { cloneElement, isValidElement } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
  href?: string;
};

const variants = {
  primary: "bg-accent text-accent-foreground shadow-sm hover:opacity-90",
  secondary: "border border-border bg-card text-foreground shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800",
  ghost: "text-foreground hover:bg-slate-100 dark:hover:bg-slate-800",
  danger: "bg-rose-600 text-white shadow-sm hover:bg-rose-700",
};

const sizes = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  asChild,
  href,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );

  if (asChild && href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  if (asChild && isValidElement<{ className?: string }>(children)) {
    return cloneElement(children, {
      className: cn(classes, children.props.className),
    });
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
