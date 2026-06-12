import type { InputHTMLAttributes, ReactNode } from "react";
import { useId } from "react";
import { cn } from "../../lib/cn";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  /** Icon shown inside the left of the input. */
  icon?: ReactNode;
  /** Element shown inside the right of the input (e.g. a show-password toggle). */
  trailing?: ReactNode;
};

export function TextField({
  label,
  hint,
  icon,
  trailing,
  id,
  className,
  ...rest
}: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate text-[18px]">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink",
            "placeholder:text-slate/60",
            "focus:border-brand focus:outline-2 focus:outline-offset-0 focus:outline-brand/30",
            icon && "pl-10",
            trailing && "pr-10",
            className
          )}
          {...rest}
        />
        {trailing && (
          <span className="absolute inset-y-0 right-2 flex items-center">
            {trailing}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-slate">{hint}</p>}
    </div>
  );
}
