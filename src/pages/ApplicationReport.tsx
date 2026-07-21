import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Logo } from "../components/brand/Logo";
import { Button } from "../components/ui/Button";
import { ScoreGauge } from "../components/app/ScoreGauge";
import { getApplication } from "../api/applications";
import type { ApplicationOut } from "../api/applications";
import { getToken, getUser } from "../lib/session";

/** Print-friendly one-page report for a saved application. Use the browser's "Save as PDF". */
export default function ApplicationReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();
  const [app, setApp] = useState<ApplicationOut | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { navigate("/login", { replace: true }); return; }
    getApplication(Number(id), token).then(setApp).catch(() => {});
  }, [id, navigate]);

  const rwf = (n?: number | null) => (n == null ? "not on file" : "RWF " + Math.round(n).toLocaleString("en-US"));
  const today = new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });

  if (!app) return <div className="p-10 text-sm text-slate">Loading report...</div>;

  return (
    <div className="min-h-full bg-slate-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-3xl justify-end gap-3 px-6 print:hidden">
        <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
        <Button variant="primary" onClick={() => window.print()}>Print / Save as PDF</Button>
      </div>

      <div className="mx-auto max-w-3xl bg-white p-10 shadow-sm print:max-w-none print:p-0 print:shadow-none">
        <div className="flex items-start justify-between border-b border-line pb-5">
          <Logo theme="light" />
          <div className="text-right text-xs text-slate">
            <div className="font-semibold text-ink">Loan application #{app.id}</div>
            <div>{today}</div>
            {user && <div>Prepared by {user.full_name}</div>}
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          Internal SACCO document, for the loan officer and credit manager. Do not share with the applicant:
          it contains guarantor details. The applicant receives a separate summary by email.
        </div>

        <div className="mt-6 flex items-center gap-6">
          {app.risk_score != null && app.band && <ScoreGauge score={app.risk_score} band={app.band} />}
          <div>
            <h1 className="text-xl font-bold text-ink">{app.band} risk &middot; {app.risk_score}/100</h1>
            <p className="mt-1 text-sm text-slate">
              {app.borrower_name || app.borrower_id || "New applicant"}
              {app.branch ? ` · ${app.branch}` : ""} · {app.guarantor_ids.length} guarantor(s)
            </p>
            <p className="mt-1 text-xs text-slate">Score source: {app.source === "model" ? "model" : "rule-based fallback"}</p>
          </div>
        </div>

        {app.flags.length > 0 && (
          <>
            <h2 className="mt-7 text-sm font-semibold text-ink">Guarantor-network flags</h2>
            <ul className="mt-2 list-disc pl-5 text-sm text-ink">
              {app.flags.map((f) => <li key={f}>{f}</li>)}
            </ul>
          </>
        )}

        <h2 className="mt-6 text-sm font-semibold text-ink">Why this score</h2>
        <ul className="mt-2 space-y-1.5 text-sm">
          {app.reasons.length > 0 ? (
            app.reasons.map((r) => (
              <li key={r.label} className="text-ink">
                <span className="font-semibold">{r.direction === "up" ? "Raises risk" : "Lowers risk"}:</span>{" "}
                {r.label} ({r.kind}). {r.detail}
              </li>
            ))
          ) : (
            <li className="text-slate">No strong factors either way.</li>
          )}
        </ul>

        <h2 className="mt-6 text-sm font-semibold text-ink">Loan summary</h2>
        <table className="mt-2 w-full text-sm">
          <tbody className="divide-y divide-line">
            <tr><td className="py-1.5 text-slate">Amount</td><td className="py-1.5 text-right font-mono text-ink">{rwf(app.amount)}</td></tr>
            <tr><td className="py-1.5 text-slate">Savings</td><td className="py-1.5 text-right font-mono text-ink">{rwf(app.savings)}</td></tr>
            <tr><td className="py-1.5 text-slate">Salary</td><td className="py-1.5 text-right font-mono text-ink">{rwf(app.salary)}</td></tr>
            <tr><td className="py-1.5 text-slate">Interest rate</td><td className="py-1.5 text-right font-mono text-ink">{app.interest_rate != null ? `${app.interest_rate}%` : "not on file"}</td></tr>
            <tr><td className="py-1.5 text-slate">Guarantors</td><td className="py-1.5 text-right font-mono text-ink">{app.guarantor_ids.join(", ") || "none"}</td></tr>
          </tbody>
        </table>

        {app.recommendations.length > 0 && (
          <>
            <h2 className="mt-6 text-sm font-semibold text-ink">Recommendations</h2>
            <ul className="mt-2 space-y-1 text-sm text-ink">
              {app.recommendations.map((r) => (
                <li key={r.id}>
                  <span className="font-semibold">{r.decision.replace("_", " ")}</span>
                  <span className="text-slate"> · {r.author_name} ({r.author_role})</span>
                  {r.note ? ` — ${r.note}` : ""}
                </li>
              ))}
            </ul>
          </>
        )}

        <p className="mt-8 border-t border-line pt-4 text-xs text-slate">
          This report is decision support for the loan officer. It does not approve or decline the
          loan. The score's accuracy is limited by the available data, so it should be weighed with
          the network flags and the officer's own judgement. GuarantorLens prototype, Umwalimu SACCO.
        </p>
      </div>
    </div>
  );
}
