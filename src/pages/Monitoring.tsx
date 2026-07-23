import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "../components/app/AppShell";
import { Alert } from "../components/ui/Alert";
import { getWatchlist, getEarlyWarning, getSurvival } from "../api/insights";
import type { WatchlistItem, EarlyWarningItem, Survival } from "../api/insights";
import { ApiError } from "../api/http";
import { getToken } from "../lib/session";

const bandClass: Record<string, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-emerald-100 text-emerald-700",
};

type Tab = "early" | "overdue";
const PAGE_SIZE = 15;

export default function Monitoring() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("early");
  const [page, setPage] = useState(1);
  const [early, setEarly] = useState<EarlyWarningItem[] | null>(null);
  const [watch, setWatch] = useState<WatchlistItem[] | null>(null);
  const [surv, setSurv] = useState<Survival | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { navigate("/login", { replace: true }); return; }
    getEarlyWarning(token).then(setEarly).catch((e) => setError(e instanceof ApiError ? e.message : "Something went wrong."));
    getWatchlist(token).then(setWatch).catch(() => {});
    getSurvival(token).then(setSurv).catch(() => {});
  }, [navigate]);

  function switchTab(t: Tab) { setTab(t); setPage(1); }
  const paged = <T,>(list: T[]) => list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const rwf = (n: number) => "RWF " + Math.round(n).toLocaleString("en-US");
  const tabClass = (active: boolean) =>
    "rounded-md px-4 py-1.5 text-sm font-medium transition " + (active ? "bg-brand text-white" : "text-slate hover:text-ink");

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-ink">Monitoring</h1>
      <p className="mt-1 text-sm text-slate">
        Active loans to keep an eye on: those predicted at risk before they go late, and those already overdue.
      </p>

      {surv && (() => {
        const s24 = (g: string) => Math.round((surv.summary.find((s) => s.group === g)?.s24 ?? 1) * 100);
        const all = s24("all"), large = s24("large");
        return (
          <section className="mt-5 rounded-xl border border-line bg-white p-5">
            <h2 className="text-sm font-semibold text-ink">How loans age over time</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate">
              A look at how long loans usually keep being paid before a few go bad — useful for spotting when
              problems tend to start.
            </p>
            <div className="mt-4 grid max-w-2xl gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-2xl font-semibold text-ink">{all}%</p>
                <p className="mt-0.5 text-xs text-slate">of all loans are still being paid on time at the 2-year mark</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-2xl font-semibold text-ink">{large}%</p>
                <p className="mt-0.5 text-xs text-slate">for the biggest loans — they start slipping soonest</p>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm text-ink">
              <span className="font-medium">What this means:</span> most loans stay healthy for years, and the ones
              that slip are usually the bigger loans, early in their life. Keep the closest eye on new large loans in
              their first months.
            </p>
            <p className="mt-1 text-xs text-slate">
              Based on a survival analysis.
            </p>
          </section>
        );
      })()}

      <div className="mt-5 inline-flex rounded-lg border border-line bg-white p-1">
        <button className={tabClass(tab === "early")} onClick={() => switchTab("early")}>
          Predicted risk {early ? `(${early.filter((i) => i.band === "High").length} high)` : ""}
        </button>
        <button className={tabClass(tab === "overdue")} onClick={() => switchTab("overdue")}>
          NPL {watch ? `(${watch.length})` : ""}
        </button>
      </div>

      {error && <div className="mt-6"><Alert tone="error">{error}</Alert></div>}

      {/* Early warning: predicted-risk, not yet late */}
      {tab === "early" && (
        <>
          <p className="mt-4 text-sm text-slate">
            Active loans <span className="font-medium">not yet late</span>, ranked by predicted risk. Act before 90 days.
          </p>
          {early === null && !error && <p className="mt-4 text-sm text-slate">Loading...</p>}
          {early && (
            <div className="mt-4 overflow-hidden rounded-xl border border-line bg-white">
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
                  {paged(early).map((it) => (
                    <tr key={it.loan_key}>
                      <td className="px-4 py-2 font-mono text-ink">{it.loan_key}</td>
                      <td className="px-4 py-2">
                        <Link to={`/member/${encodeURIComponent(it.borrower_uid ?? it.borrower)}`} className="font-mono text-brand hover:underline">{it.borrower}</Link>
                      </td>
                      <td className="px-4 py-2 text-slate">{it.branch}</td>
                      <td className="px-4 py-2 font-mono text-ink">{rwf(it.amount)}</td>
                      <td className="px-4 py-2 font-mono font-semibold text-ink">{it.risk_score}/100</td>
                      <td className="px-4 py-2">
                        <span className={"rounded px-2 py-0.5 text-xs font-medium " + (bandClass[it.band] ?? "")}>{it.band}</span>
                      </td>
                    </tr>
                  ))}
                  {early.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate">No active loans to score.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
          {early && <Pager page={page} total={early.length} onPage={setPage} />}
        </>
      )}

      {/* Watchlist: already 90+ days late */}
      {tab === "overdue" && (
        <>
          <p className="mt-4 text-sm text-slate">
            Active loans <span className="font-medium">already 90+ days in arrears</span>, most overdue first. Chase these now.
          </p>
          <p className="mt-1 text-xs text-slate">
            "Why at risk" is the strongest signal we can see for each loan: a guarantor-network flag first (a
            written-off or over-committed guarantor), otherwise the borrower's own history (an <span className="italic">earlier</span> loan
            that was written off) or the loan size. It explains what stands out, not why the loan fell behind.
          </p>
          {watch === null && <p className="mt-4 text-sm text-slate">Loading...</p>}
          {watch && (
            <div className="mt-4 overflow-hidden rounded-xl border border-line bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate">
                  <tr>
                    <th className="px-4 py-2 font-medium">Loan</th>
                    <th className="px-4 py-2 font-medium">Member</th>
                    <th className="px-4 py-2 font-medium">Branch</th>
                    <th className="px-4 py-2 font-medium">Amount</th>
                    <th className="px-4 py-2 font-medium">Days late</th>
                    <th className="px-4 py-2 font-medium">Why at risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {paged(watch).map((it) => (
                    <tr key={it.loan_key}>
                      <td className="px-4 py-2 font-mono text-ink">{it.loan_key}</td>
                      <td className="px-4 py-2">
                        <Link to={`/member/${encodeURIComponent(it.borrower_uid ?? it.borrower)}`} className="font-mono text-brand hover:underline">{it.borrower}</Link>
                      </td>
                      <td className="px-4 py-2 text-slate">{it.branch}</td>
                      <td className="px-4 py-2 font-mono text-ink">{rwf(it.amount)}</td>
                      <td className="px-4 py-2 font-mono font-semibold text-red-600">{it.days_in_arrears}</td>
                      <td className="px-4 py-2">
                        {it.backed_by_defaulter ? (
                          <span className="rounded bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-600">Backed by a written-off member</span>
                        ) : it.reason ? (
                          <span className="text-xs text-slate">{it.reason}</span>
                        ) : <span className="text-xs text-slate">-</span>}
                      </td>
                    </tr>
                  ))}
                  {watch.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate">Nothing overdue.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
          {watch && <Pager page={page} total={watch.length} onPage={setPage} />}
        </>
      )}
    </AppShell>
  );
}

function Pager({ page, total, onPage }: { page: number; total: number; onPage: (p: number) => void }) {
  if (total <= PAGE_SIZE) return null;
  const pages = Math.ceil(total / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(total, page * PAGE_SIZE);
  return (
    <div className="mt-3 flex items-center justify-between text-sm">
      <span className="text-slate">Showing {start}&ndash;{end} of {total}</span>
      <div className="flex items-center gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="rounded-lg border border-line px-3 py-1 text-ink hover:bg-slate-50 disabled:opacity-40"
        >
          Prev
        </button>
        <span className="px-1 text-slate">Page {page} / {pages}</span>
        <button
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="rounded-lg border border-line px-3 py-1 text-ink hover:bg-slate-50 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
