import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/app/AppShell";
import { Button } from "../components/ui/Button";
import { getUser, getToken } from "../lib/session";
import { getEarlyWarning } from "../api/insights";
import type { EarlyWarningItem } from "../api/insights";
import { getApplicationStats } from "../api/applications";
import type { ApplicationStats } from "../api/applications";

const ROLE_LABELS: Record<string, string> = {
  loan_officer: "Loan officer",
  credit_manager: "Credit manager",
  admin: "Admin",
};

const bandClass: Record<string, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-emerald-100 text-emerald-700",
};

/** Signed-in landing: quick actions plus a live early-warning snapshot. */
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
      <p className="text-sm font-semibold text-accent">You are signed in</p>
      <h1 className="mt-2 text-3xl font-bold text-ink">
        Welcome{user ? `, ${user.full_name.split(" ")[0]}` : ""}.
      </h1>
      {user && (
        <p className="mt-2 text-slate">
          {ROLE_LABELS[user.role] ?? user.role} &middot; {user.email}
        </p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Applications / escalation */}
        <div className="rounded-xl border border-line bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">Applications</h2>
            <Link to="/applications" className="text-sm font-medium text-brand hover:underline">View all</Link>
          </div>
          <p className="mt-1 text-sm text-slate">Your assessments and the escalation queue.</p>
          {stats && (
            <div className="mt-4 flex gap-6">
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

        {/* Assess */}
        <div className="rounded-xl border border-line bg-white p-6">
          <h2 className="text-base font-semibold text-ink">Assess a loan</h2>
          <p className="mt-1 text-sm text-slate">
            Score a loan using the borrower and their guarantor network, with the
            reasons behind the score.
          </p>
          <Link to="/assess" className="mt-4 inline-block">
            <Button variant="accent">Start an assessment</Button>
          </Link>
        </div>

        {/* Early warning snapshot */}
        <div className="rounded-xl border border-line bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">Early warning</h2>
            <Link to="/monitoring" className="text-sm font-medium text-brand hover:underline">
              View all
            </Link>
          </div>
          <p className="mt-1 text-sm text-slate">
            Active loans not yet late, ranked by predicted risk.
          </p>

          {items === null && !failed && (
            <p className="mt-4 text-sm text-slate">Loading...</p>
          )}
          {failed && (
            <p className="mt-4 text-sm text-slate">
              Early warning is unavailable right now.
            </p>
          )}

          {items && (
            <>
              <div className="mt-4 flex gap-6">
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
                {items.slice(0, 3).map((it) => (
                  <li key={it.loan_key} className="flex items-center justify-between py-2 text-sm">
                    <Link
                      to={`/member/${encodeURIComponent(it.borrower)}`}
                      className="font-mono text-brand hover:underline"
                    >
                      {it.borrower}
                    </Link>
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-ink">{it.risk_score}/100</span>
                      <span
                        className={
                          "rounded px-2 py-0.5 text-xs font-medium " +
                          (bandClass[it.band] ?? "text-slate")
                        }
                      >
                        {it.band}
                      </span>
                    </span>
                  </li>
                ))}
                {items.length === 0 && (
                  <li className="py-2 text-sm text-slate">No active loans to score.</li>
                )}
              </ul>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
