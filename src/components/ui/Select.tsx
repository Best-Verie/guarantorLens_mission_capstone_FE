import type { SelectHTMLAttributes } from "react";
import { useId } from "react";
import { cn } from "../../lib/cn";

type Option = { value: string; label: string };

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: Option[];
  hint?: string;
};

export function Select({
  label,
  options,
  hint,
  id,
  className,
  ...rest
}: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-ink">
        {label}
      </label>
      <select
        id={selectId}
        className={cn(
          "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink",
          "focus:border-brand focus:outline-2 focus:outline-offset-0 focus:outline-brand/30",
          className
        )}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <p className="text-xs text-slate">{hint}</p>}
    </div>
  );
}
