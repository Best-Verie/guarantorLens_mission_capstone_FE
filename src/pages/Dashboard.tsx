import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/app/AppShell";
import { Button } from "../components/ui/Button";
import { getUser, getToken } from "../lib/session";
import { getEarlyWarning } from "../api/insights";
import type { EarlyWarningItem } from "../api/insights";
import { getApplicationStats } from "../api/applications";
import type { ApplicationStats } from "../api/applications";

const bandClass: Record<string, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-emerald-100 text-emerald-700",
};

const STEPS = [
  {
    n: "1",
    title: "Assess a loan",
    body: "Score a borrower using their finances and their guarantor network. Every score comes with the reasons behind it.",
  },
  {
    n: "2",
    title: "Escalate & recommend",
    body: "Officers send tricky cases to a credit manager, who adds a recommendation. The tool advises; the SACCO decides.",
  },
  {
    n: "3",
    title: "Monitor the portfolio",
    body: "See active loans predicted to go bad before they fall 90 days late, so you can act early.",
  },
];

/** Signed-in landing: explains the tool, then shows a live early-warning snapshot. */
export default function Dashboard() {
  const user = getUser();
  const [items, setItems] = useState<EarlyWarningItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [stats, setStats] = useState<ApplicationStats | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    getEarlyWarning(token).then(setItems).catch(() => setFailed(true));
    getApplicationStats(token).then(setStats).catch(() => {});
  }, []);

  const highCount = items ? items.filter((i) => i.band === "High").length : 0;

  return (
    <AppShell>
      {/* What the tool is */}
      <section className="rounded-2xl border border-line bg-white p-8">
        <p className="text-sm font-semibold text-accent">
          Welcome{user ? `, ${user.full_name.split(" ")[0]}` : ""}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ink">
          GuarantorLens helps you judge loan risk, with the reasons behind it.
        </h1>
        <p className="mt-3 max-w-2xl text-slate">
          It scores a loan using both the borrower's finances and the strength of their
          guarantor network, explains every score in plain language, and flags loans to
          watch before they go bad. It is decision support for Umwalimu SACCO officers,
          not an automatic approve-or-decline.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/assess">
            <Button variant="accent">Assess a loan</Button>
          </Link>
          <Link to="/monitoring">
            <Button variant="secondary">See loans to watch</Button>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.n} className="rounded-xl border border-line bg-white p-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand">
              {s.n}
            </div>
            <h2 className="mt-3 text-base font-semibold text-ink">{s.title}</h2>
            <p className="mt-1 text-sm text-slate">{s.body}</p>
          </div>
        ))}
      </div>

      {/* Live snapshot */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-line bg-white p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">Loans to watch now</h2>
            <Link to="/monitoring" className="text-sm font-medium text-brand hover:underline">
              View all
            </Link>
          </div>
          <p className="mt-1 text-sm text-slate">
            Active loans not yet late, ranked by predicted risk.
          </p>

          {items === null && !failed && <p className="mt-4 text-sm text-slate">Loading...</p>}
          {failed && (
            <p className="mt-4 text-sm text-slate">Early warning is unavailable right now.</p>
          )}

          {items && (
            <>
              <div className="mt-4 flex gap-8">
                <div>
                  <div className="text-2xl font-bold text-red-600">{highCount}</div>
                  <div className="text-xs text-slate">high risk</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-ink">{items.length}</div>
                  <div className="text-xs text-slate">active loans scored</div>
                </div>
              </div>
              <ul className="mt-4 divide-y divide-line">
                {items.slice(0, 5).map((it) => (
                  <li key={it.loan_key} className="flex items-center justify-between py-2 text-sm">
                    <Link
                      to={`/member/${encodeURIComponent(it.borrower_uid ?? it.borrower)}`}
                      className="font-mono text-brand hover:underline"
                    >
                      {it.borrower}
                    </Link>
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-ink">{it.risk_score}/100</span>
                      <span className={"rounded px-2 py-0.5 text-xs font-medium " + (bandClass[it.band] ?? "text-slate")}>
                        {it.band}
                      </span>
                    </span>
                  </li>
                ))}
                {items.length === 0 && <li className="py-2 text-sm text-slate">No active loans to score.</li>}
              </ul>
            </>
          )}
        </div>

        <div className="rounded-xl border border-line bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">Your applications</h2>
            <Link to="/applications" className="text-sm font-medium text-brand hover:underline">
              View all
            </Link>
          </div>
          <p className="mt-1 text-sm text-slate">Assessments you have saved and the escalation queue.</p>
          {stats && (
            <div className="mt-4 flex gap-8">
              <div>
                <div className="text-2xl font-bold text-ink">{stats.my_open}</div>
                <div className="text-xs text-slate">my open</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600">{stats.escalated}</div>
                <div className="text-xs text-slate">escalated</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
