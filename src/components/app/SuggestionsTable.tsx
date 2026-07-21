import { cn } from "../../lib/cn";

export type GuarantorSuggestion = {
  action: "swap" | "add";
  remove?: string | null;
  add: string;
  new_score: number;
  new_band: "Low" | "Medium" | "High";
  delta: number;
  add_savings?: number | null;
  add_loans_backed: number;
  add_branch?: string | null;
};

const BAND_CLS: Record<string, string> = {
  Low: "bg-emerald-100 text-emerald-800",
  Medium: "bg-amber-100 text-amber-800",
  High: "bg-red-100 text-red-800",
};
const rwf = (n?: number | null) => (n == null ? "—" : "RWF " + Math.round(n).toLocaleString());

/**
 * Fix-it advisor suggestions as a table: one row per candidate guarantor, one column per
 * attribute (change, guarantor, savings, backs, branch, resulting score, effect on risk).
 * Reused by AssessResult and ApplicationDetail so the two stay consistent.
 */
export function SuggestionsTable({ suggestions }: { suggestions: GuarantorSuggestion[] }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-emerald-200">
      <table className="w-full text-sm">
        <thead className="bg-emerald-50 text-left text-xs text-slate">
          <tr>
            <th className="px-4 py-2 font-medium">Change</th>
            <th className="px-4 py-2 font-medium">Guarantor</th>
            <th className="px-4 py-2 font-medium text-right">Savings</th>
            <th className="px-4 py-2 font-medium text-right">Backs</th>
            <th className="px-4 py-2 font-medium">Branch</th>
            <th className="px-4 py-2 font-medium">New score</th>
            <th className="px-4 py-2 font-medium text-right">Effect</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-emerald-100 bg-white">
          {suggestions.map((s, i) => (
            <tr key={i}>
              <td className="px-4 py-2 text-slate">
                {s.action === "swap" ? (
                  <>Swap out <span className="font-mono text-red-600">{s.remove}</span></>
                ) : (
                  "Add"
                )}
              </td>
              <td className="px-4 py-2 font-mono text-brand">{s.add}</td>
              <td className="px-4 py-2 text-right font-mono text-ink">{rwf(s.add_savings)}</td>
              <td className="px-4 py-2 text-right text-ink">{s.add_loans_backed}</td>
              <td className="px-4 py-2 text-slate">{s.add_branch ?? "—"}</td>
              <td className="px-4 py-2">
                <span className={cn("rounded px-2 py-0.5 text-xs font-medium", BAND_CLS[s.new_band] ?? "")}>
                  {s.new_band} {s.new_score}/100
                </span>
              </td>
              <td className="px-4 py-2 text-right text-xs font-semibold text-emerald-700">{s.delta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
