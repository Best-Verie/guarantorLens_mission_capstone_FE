import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

type Tone = "error" | "success" | "info";

const tones: Record<Tone, string> = {
  error: "bg-red-50 text-red-700 ring-1 ring-red-200",
  success: "bg-green-50 text-green-700 ring-1 ring-green-200",
  info: "bg-brand-50 text-brand-800 ring-1 ring-brand-100",
};

export function Alert({ tone = "error", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div role="alert" className={cn("rounded-lg px-3.5 py-2.5 text-sm", tones[tone])}>
      {children}
    </div>
  );
}
