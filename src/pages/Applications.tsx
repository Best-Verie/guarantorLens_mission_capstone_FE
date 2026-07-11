import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "../components/app/AppShell";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { listApplications } from "../api/applications";
import type { ApplicationListItem } from "../api/applications";
import { ApiError } from "../api/http";
import { getToken, getUser } from "../lib/session";

const bandClass: Record<string, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-emerald-100 text-emerald-700",
};
const statusClass: Record<string, string> = {
  assessed: "bg-slate-100 text-slate-700",
  escalated: "bg-amber-100 text-amber-700",
  recommended: "bg-blue-100 text-blue-700",
  closed: "bg-emerald-100 text-emerald-700",
};
const STATUS_LABEL: Record<string, string> = {
  assessed: "New", escalated: "Escalated", recommended: "Reviewed", closed: "Closed",
};

export default function Applications() {
  const navigate = useNavigate();
  const user = getUser();
  const isManager = !!user && ["credit_manager", "admin"].includes(user.role);
  const [items, setItems] = useState<ApplicationListItem[]>([]);
  // Managers land on their review queue (escalated cases) first; officers see their own list.
  const [escalatedOnly, setEscalatedOnly] = useState(isManager);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    setLoading(true);
    listApplications(token, { escalated: escalatedOnly })
      .then(setItems)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Something went wrong."))
      .finally(() => setLoading(false));
  }, [navigate, escalatedOnly]);

  const rwf = (n: number) => "RWF " + Math.round(n).toLocaleString("en-US");

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Applications</h1>
          <p className="mt-1 text-sm text-slate">
            {isManager
              ? "All loan assessments. Switch to the escalation queue to review cases sent up by officers."
              : "Your loan assessments and their status."}
          </p>
        </div>
        <Link to="/assess">
          <Button variant="accent">New assessment</Button>
        </Link>
      </div>

      {isManager && (
        <div className="mt-4 inline-flex rounded-lg border border-line bg-white p-1 text-sm">
          <button
            className={"rounded-md px-4 py-1.5 font-medium " + (!escalatedOnly ? "bg-brand text-white" : "text-slate")}
            onClick={() => setEscalatedOnly(false)}
          >
            All
          </button>
          <button
            className={"rounded-md px-4 py-1.5 font-medium " + (escalatedOnly ? "bg-brand text-white" : "text-slate")}
            onClick={() => setEscalatedOnly(true)}
          >
            Escalation queue
          </button>
        </div>
      )}

      {loading && <p className="mt-6 text-sm text-slate">Loading...</p>}
      {error && <div className="mt-6"><Alert tone="error">{error}</Alert></div>}

      {!loading && !error && (
        <div className="mt-6 overflow-hidden rounded-xl border border-line bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate">
              <tr>
                <th className="px-4 py-2 font-medium">#</th>
                <th className="px-4 py-2 font-medium">Borrower</th>
                <th className="px-4 py-2 font-medium">Branch</th>
                <th className="px-4 py-2 font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Risk</th>
                <th className="px-4 py-2 font-medium">Status</th>
                {isManager && <th className="px-4 py-2 font-medium">Officer</th>}
                <th className="px-4 py-2 font-medium">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((a) => (
                <tr
                  key={a.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => navigate(`/applications/${a.id}`)}
                >
                  <td className="px-4 py-2 font-mono text-ink">{a.id}</td>
                  <td className="px-4 py-2 font-mono text-brand">{a.borrower || "new applicant"}</td>
                  <td className="px-4 py-2 text-slate">{a.branch}</td>
                  <td className="px-4 py-2 font-mono text-ink">{rwf(a.amount)}</td>
                  <td className="px-4 py-2">
                    {a.risk_score != null && (
                      <span className="font-mono text-ink">{a.risk_score}</span>
                    )}{" "}
                    {a.band && (
                      <span className={"rounded px-2 py-0.5 text-xs font-medium " + (bandClass[a.band] ?? "")}>
                        {a.band}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span className={"rounded px-2 py-0.5 text-xs font-medium " + (statusClass[a.status] ?? "")}>
                      {STATUS_LABEL[a.status] ?? a.status}
                    </span>
                  </td>
                  {isManager && <td className="px-4 py-2 text-slate">{a.created_by_name}</td>}
                  <td className="px-4 py-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/applications/${a.id}/report`); }}
                      className="rounded border border-line px-2 py-0.5 text-xs font-medium text-brand hover:bg-brand-50"
                    >
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={isManager ? 8 : 7} className="px-4 py-6 text-center text-sm text-slate">
                    No applications yet. Start with a new assessment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
