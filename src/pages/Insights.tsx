import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "../components/app/AppShell";
import { Alert } from "../components/ui/Alert";
import { getCommunities, getWeakLinks, getOverview } from "../api/insights";
import type { CommunityStat, WeakLink, InsightsOverview } from "../api/insights";
import { ApiError } from "../api/http";
import { getToken } from "../lib/session";

const money = (n: number) => {
  if (n >= 1e9) return `RWF ${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `RWF ${(n / 1e6).toFixed(0)}M`;
  return `RWF ${Math.round(n).toLocaleString("en-US")}`;
};
const pct = (x: number) => `${Math.round(x * 100)}%`;

const OUTCOME_COLOR: Record<string, string> = {
  Repaid: "bg-emerald-500",
  Active: "bg-brand",
  "In arrears 90+": "bg-amber-500",
  "Written off": "bg-red-500",
};

export default function Insights() {
  const navigate = useNavigate();
  const [ov, setOv] = useState<InsightsOverview | null>(null);
  const [wl, setWl] = useState<WeakLink[]>([]);
  const [comm, setComm] = useState<CommunityStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    Promise.all([getOverview(token), getWeakLinks(token), getCommunities(token)])
      .then(([o, s, c]) => {
        setOv(o);
        setWl(s);
        setComm(c);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Something went wrong."))
      .finally(() => setLoading(false));
  }, [navigate]);

  const maxRate = comm.length ? Math.max(...comm.map((c) => c.default_rate)) : 1;
  const outcomeTotal = ov ? Object.values(ov.outcomes).reduce((a, b) => a + b, 0) : 0;

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-ink">Insights</h1>
      <p className="mt-1 text-sm text-slate">
        Key numbers from the loan book and the guarantor network: the size of the portfolio,
        how loans have ended, the money at risk, and where the network concentrates risk.
      </p>

      {loading && <p className="mt-6 text-sm text-slate">Loading...</p>}
      {error && <div className="mt-6"><Alert tone="error">{error}</Alert></div>}

      {!loading && !error && ov && (
        <>
          {/* Portfolio at a glance */}
          <h2 className="mt-6 text-sm font-semibold text-ink">Portfolio at a glance</h2>
          <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Loans" value={ov.n_loans.toLocaleString()} sub={`${money(ov.total_disbursed)} disbursed`} />
            <Stat label="Bad-loan rate" value={pct(ov.bad_rate)} sub="written off or 90+ in arrears" tone="red" />
            <Stat label="Money at risk" value={money(ov.arrears_value)} sub={`${ov.n_arrears} loans in arrears`} tone="amber" />
            <Stat label="Written off" value={money(ov.written_off_value)} sub="lost to bad loans" tone="red" />
            <Stat label="Members" value={ov.n_members.toLocaleString()} sub={`across ${Object.keys(ov.branches).length} branches`} />
            <Stat label="Guarantors" value={ov.unique_guarantors.toLocaleString()} sub={`${ov.avg_guarantors.toFixed(1)} per loan on average`} />
            <Stat label="Over-committed guarantors" value={ov.over_committed.toLocaleString()} sub="backing 8+ loans each" tone="amber" />
            <Stat label="Loans with a written-off backer" value={pct(ov.pct_backed_by_defaulter)} sub={`${ov.loans_backed_by_defaulter.toLocaleString()} loans`} tone="red" />
          </div>

          {/* Outcomes + branches */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-line bg-white p-5">
              <h3 className="text-sm font-semibold text-ink">How loans have ended</h3>
              <div className="mt-3 flex h-3 overflow-hidden rounded-full">
                {Object.entries(ov.outcomes).map(([k, v]) => (
                  <div key={k} className={OUTCOME_COLOR[k] ?? "bg-slate-300"} style={{ width: `${(v / outcomeTotal) * 100}%` }} title={`${k}: ${v}`} />
                ))}
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {Object.entries(ov.outcomes).map(([k, v]) => (
                  <li key={k} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate">
                      <span className={"inline-block h-2.5 w-2.5 rounded-sm " + (OUTCOME_COLOR[k] ?? "bg-slate-300")} />
                      {k}
                    </span>
                    <span className="font-mono text-ink">{v} ({pct(v / outcomeTotal)})</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-line bg-white p-5">
              <h3 className="text-sm font-semibold text-ink">Loans by branch</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {Object.entries(ov.branches).sort((a, b) => b[1] - a[1]).map(([b, n]) => (
                  <li key={b} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-ink">{b}</span>
                    <span className="h-4 flex-1 rounded bg-slate-100">
                      <span className="block h-4 rounded bg-brand" style={{ width: `${(n / ov.n_loans) * 100}%` }} />
                    </span>
                    <span className="w-10 shrink-0 text-right font-mono text-slate">{n}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-slate">
                {ov.ever_defaulted.toLocaleString()} members written off before ·
                {" "}{ov.n_communities} guarantee communities · worst carries a {pct(ov.worst_community_rate)} write-off rate.
              </p>
            </section>
          </div>

          {/* Where the network concentrates risk */}
          <h2 className="mt-8 text-sm font-semibold text-ink">Where the network concentrates risk</h2>
          <div className="mt-2 grid gap-6 lg:grid-cols-2">
            {/* Weak links / single points of failure */}
            <section>
              <p className="mb-3 text-xs text-slate">
                Single points of failure: members backing many loans. If one fails, all their
                guarantees wobble at once. Exposure = the money riding on them.
              </p>
              <div className="overflow-hidden rounded-xl border border-line bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs text-slate">
                    <tr>
                      <th className="px-4 py-2 font-medium">Member</th>
                      <th className="px-4 py-2 font-medium">Loans backed</th>
                      <th className="px-4 py-2 font-medium">Exposure</th>
                      <th className="px-4 py-2 font-medium">High risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {wl.map((m) => (
                      <tr key={m.member_id}>
                        <td className="px-4 py-2">
                          <Link
                            to={`/member/${encodeURIComponent(m.uid ?? m.member_id)}`}
                            className={`font-mono hover:underline ${m.ever_defaulted ? "text-red-600" : "text-brand"}`}
                          >
                            {m.member_id}
                          </Link>
                          {m.ever_defaulted && (
                            <span className="ml-2 rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-600">
                              written off
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 font-mono text-ink">{m.loans_backed}</td>
                        <td className="px-4 py-2 font-mono text-ink">{money(m.exposure)}</td>
                        <td className="px-4 py-2 font-mono text-ink">
                          {m.high_risk > 0 ? <span className="text-red-600">{m.high_risk}</span> : m.high_risk}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Communities */}
            <section>
              <p className="mb-3 text-xs text-slate">
                Guarantee communities ranked by their past write-off rate.
              </p>
              <div className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4">
                {comm.map((c) => (
                  <div key={c.community_id} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 font-mono text-xs text-ink">{c.community_id}</span>
                    <div className="h-4 flex-1 rounded bg-slate-100">
                      <div className="h-4 rounded bg-accent" style={{ width: `${(c.default_rate / maxRate) * 100}%` }} />
                    </div>
                    <span className="w-20 shrink-0 text-right text-xs text-slate">
                      {Math.round(c.default_rate * 100)}% · {c.size}
                    </span>
                  </div>
                ))}
                <p className="mt-1 text-[11px] text-slate">bar = default rate · right = rate% and community size</p>
              </div>
            </section>
          </div>
        </>
      )}
    </AppShell>
  );
}

function Stat({ label, value, sub, tone }:
  { label: string; value: string; sub?: string; tone?: "red" | "amber" }) {
  const valueColor = tone === "red" ? "text-red-600" : tone === "amber" ? "text-amber-600" : "text-ink";
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <div className="text-xs text-slate">{label}</div>
      <div className={"mt-1 text-2xl font-bold " + valueColor}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate">{sub}</div>}
    </div>
  );
}
