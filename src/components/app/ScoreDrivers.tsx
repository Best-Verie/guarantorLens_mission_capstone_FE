import type { ShapContribution } from "../../api/risk";
import { cn } from "../../lib/cn";

/** Horizontal bars of the model's top per-feature contributions (native tree SHAP).
 *  Red raises the risk, green lowers it; bar length is the relative magnitude. */
export function ScoreDrivers({ shap }: { shap: ShapContribution[] }) {
  if (!shap || shap.length === 0) return null;
  const max = Math.max(1, ...shap.map((s) => Math.abs(s.value)));
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink">What's driving the score</h3>
      <p className="mt-1 text-xs text-slate">
        The factors the model weighed most for this loan, largest first. Red raises the
        risk, green lowers it.
      </p>
      <ul className="mt-3 space-y-2">
        {shap.map((s) => {
          const up = s.direction === "up";
          const network = s.kind === "network" || s.feature.startsWith("g_") || s.feature === "n_guarantors";
          const pct = Math.round((Math.abs(s.value) / max) * 100);
          return (
            <li key={s.feature} className="flex items-center gap-3 text-sm">
              <span
                className={cn("w-4 shrink-0 text-center font-bold", up ? "text-red-600" : "text-green-700")}
                title={up ? "Raises risk" : "Lowers risk"}
              >
                {up ? "↑" : "↓"}
              </span>
              <span className="w-40 shrink-0 truncate text-ink" title={s.label}>
                {s.label}
                {network && <span className="ml-1 text-[10px] font-semibold uppercase text-accent-600">Network</span>}
              </span>
              <span className="relative h-2 flex-1 rounded bg-slate-100">
                <span
                  className={cn("absolute inset-y-0 left-0 rounded", up ? "bg-red-400" : "bg-green-500")}
                  style={{ width: `${Math.max(4, pct)}%` }}
                />
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
