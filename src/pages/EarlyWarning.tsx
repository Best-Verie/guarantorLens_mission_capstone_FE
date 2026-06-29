import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "../components/app/AppShell";
import { Alert } from "../components/ui/Alert";
import { getEarlyWarning } from "../api/insights";
import type { EarlyWarningItem } from "../api/insights";
import { ApiError } from "../api/http";
import { getToken } from "../lib/session";

const bandClass: Record<string, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-emerald-100 text-emerald-700",
};

export default function EarlyWarning() {
  const navigate = useNavigate();
  const [items, setItems] = useState<EarlyWarningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    getEarlyWarning(token)
      .then(setItems)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Something went wrong."))
      .finally(() => setLoading(false));
  }, [navigate]);

  const rwf = (n: number) => "RWF " + Math.round(n).toLocaleString("en-US");
  const highCount = items.filter((i) => i.band === "High").length;

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-ink">Early warning</h1>
      <p className="mt-1 text-sm text-slate">
        Active loans that are not yet late, scored by the model and ranked by predicted
        risk. This is the predictive view: catch trouble before a loan hits 90 days, unlike
        the watchlist which shows loans already in arrears.
      </p>

      {loading && <p className="mt-6 text-sm text-slate">Loading...</p>}
      {error && <div className="mt-6"><Alert tone="error">{error}</Alert></div>}

      {!loading && !error && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-white p-5">
              <div className="text-xs font-medium text-slate">Active loans scored</div>
              <div className="mt-1 text-2xl font-bold text-ink">{items.length}</div>
              <div className="text-xs text-slate">not yet 90 days late</div>
            </div>
            <div className="rounded-xl border border-line bg-white p-5">
              <div className="text-xs font-medium text-slate">High risk</div>
              <div className="mt-1 text-2xl font-bold text-ink">{highCount}</div>
              <div className="text-xs text-slate">flagged for review</div>
            </div>
            <div className="rounded-xl border border-line bg-white p-5">
              <div className="text-xs font-medium text-slate">Top predicted risk</div>
              <div className="mt-1 text-2xl font-bold text-ink">
                {items.length ? `${items[0].risk_score}/100` : "-"}
              </div>
              <div className="text-xs text-slate">highest on the list</div>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-line bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate">
                <tr>
                  <th className="px-4 py-2 font-medium">Loan</th>
                  <th className="px-4 py-2 font-medium">Member</th>
                  <th className="px-4 py-2 font-medium">Branch</th>
                  <th className="px-4 py-2 font-medium">Amount</th>
                  <th className="px-4 py-2 font-medium">Predicted risk</th>
                  <th className="px-4 py-2 font-medium">Band</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((it) => (
                  <tr key={it.loan_key}>
                    <td className="px-4 py-2 font-mono text-ink">{it.loan_key}</td>
                    <td className="px-4 py-2">
                      <Link
                        to={`/member/${encodeURIComponent(it.borrower)}`}
                        className="font-mono text-brand hover:underline"
                      >
                        {it.borrower}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-slate">{it.branch}</td>
                    <td className="px-4 py-2 font-mono text-ink">{rwf(it.amount)}</td>
                    <td className="px-4 py-2 font-mono font-semibold text-ink">
                      {it.risk_score}/100
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          "rounded px-2 py-0.5 text-xs font-medium " +
                          (bandClass[it.band] ?? "text-slate")
                        }
                      >
                        {it.band}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AppShell>
  );
}
