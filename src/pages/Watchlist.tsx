import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "../components/app/AppShell";
import { Alert } from "../components/ui/Alert";
import { getWatchlist } from "../api/insights";
import type { WatchlistItem } from "../api/insights";
import { ApiError } from "../api/http";
import { getToken } from "../lib/session";

export default function Watchlist() {
  const navigate = useNavigate();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    getWatchlist(token)
      .then(setItems)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Something went wrong."))
      .finally(() => setLoading(false));
  }, [navigate]);

  const rwf = (n: number) => "RWF " + Math.round(n).toLocaleString("en-US");
  const backedCount = items.filter((i) => i.backed_by_defaulter).length;

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-ink">NPL</h1>
      <p className="mt-1 text-sm text-slate">
        Active loans that are 90 or more days in arrears, most overdue first. These
        are caught before write-off, not after.
      </p>

      {loading && <p className="mt-6 text-sm text-slate">Loading...</p>}
      {error && <div className="mt-6"><Alert tone="error">{error}</Alert></div>}

      {!loading && !error && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-white p-5">
              <div className="text-xs font-medium text-slate">Loans at risk</div>
              <div className="mt-1 text-2xl font-bold text-ink">{items.length}</div>
              <div className="text-xs text-slate">90+ days in arrears</div>
            </div>
            <div className="rounded-xl border border-line bg-white p-5">
              <div className="text-xs font-medium text-slate">Backed by a written-off member</div>
              <div className="mt-1 text-2xl font-bold text-ink">{backedCount}</div>
              <div className="text-xs text-slate">of the at-risk loans</div>
            </div>
            <div className="rounded-xl border border-line bg-white p-5">
              <div className="text-xs font-medium text-slate">Most overdue</div>
              <div className="mt-1 text-2xl font-bold text-ink">
                {items.length ? `${items[0].days_in_arrears} days` : "-"}
              </div>
              <div className="text-xs text-slate">top of the list</div>
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
                  <th className="px-4 py-2 font-medium">Days in arrears</th>
                  <th className="px-4 py-2 font-medium">Flag</th>
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
                    <td className="px-4 py-2 font-mono font-semibold text-red-600">
                      {it.days_in_arrears}
                    </td>
                    <td className="px-4 py-2">
                      {it.backed_by_defaulter ? (
                        <span className="rounded bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-600">
                          Backed by a written-off member
                        </span>
                      ) : (
                        <span className="text-xs text-slate">-</span>
                      )}
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
