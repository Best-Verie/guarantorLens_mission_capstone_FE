import type { InputHTMLAttributes, ReactNode } from "react";
import { useId } from "react";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
};

export function Checkbox({ label, id, ...rest }: CheckboxProps) {
  const autoId = useId();
  const boxId = id ?? autoId;
  return (
    <label htmlFor={boxId} className="flex cursor-pointer items-start gap-2.5">
      <input
        id={boxId}
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-line text-brand accent-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        {...rest}
      />
      <span className="text-sm text-slate">{label}</span>
    </label>
  );
}
