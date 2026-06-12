import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

type Variant = "primary" | "secondary" | "accent";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  block?: boolean;
  children: ReactNode;
};

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-800 focus-visible:outline-brand",
  accent:
    "bg-accent text-white hover:bg-accent-600 focus-visible:outline-accent",
  secondary:
    "bg-white text-ink ring-1 ring-line hover:bg-slate-50 focus-visible:outline-brand",
};

export function Button({
  variant = "primary",
  block = false,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold",
        "transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-60",
        block && "w-full",
        variants[variant],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
