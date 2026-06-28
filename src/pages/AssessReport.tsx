import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "../components/brand/Logo";
import { Button } from "../components/ui/Button";
import { ScoreGauge } from "../components/app/ScoreGauge";
import { getUser } from "../lib/session";
import type { AssessInput, AssessResult } from "../api/risk";

/** Print-friendly one-page report. Use the browser's "Save as PDF" to export. */
export default function AssessReport() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { result: AssessResult; input: AssessInput } | null;
  if (!state) return <Navigate to="/assess" replace />;

  const { result, input } = state;
  const user = getUser();
  const today = new Date().toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const rwf = (n?: number | null) =>
    n == null ? "not on file" : "RWF " + Math.round(n).toLocaleString("en-US");

  return (
    <div className="min-h-full bg-slate-100 py-8 print:bg-white print:py-0">
      {/* Controls (hidden when printing) */}
      <div className="mx-auto mb-4 flex max-w-3xl justify-end gap-3 px-6 print:hidden">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Back
        </Button>
        <Button variant="primary" onClick={() => window.print()}>
          Print / Save as PDF
        </Button>
      </div>

      {/* The report sheet */}
      <div className="mx-auto max-w-3xl bg-white p-10 shadow-sm print:max-w-none print:p-0 print:shadow-none">
        <div className="flex items-start justify-between border-b border-line pb-5">
          <Logo theme="light" />
          <div className="text-right text-xs text-slate">
            <div className="font-semibold text-ink">Loan risk report</div>
            <div>{today}</div>
            {user && <div>Prepared by {user.full_name}</div>}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-6">
          <ScoreGauge score={result.risk_score} band={result.band} />
          <div>
            <h1 className="text-xl font-bold text-ink">
              {result.band} risk &middot; {result.risk_score}/100
            </h1>
            <p className="mt-1 text-sm text-slate">
              {input.borrower_id ? `Borrower ${input.borrower_id} · ` : ""}
              {input.guarantor_ids.length} guarantor(s) &middot;{" "}
              {result.network.guarantors_with_prior_default} with a past default
            </p>
            <p className="mt-1 text-xs text-slate">
              Score source: {result.source === "model" ? "model" : "rule-based fallback"}
            </p>
          </div>
        </div>

        <h2 className="mt-7 text-sm font-semibold text-ink">Guarantor-network flags</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-ink">
          {result.flags.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>

        <h2 className="mt-6 text-sm font-semibold text-ink">Why this score</h2>
        <ul className="mt-2 space-y-1.5 text-sm">
          {result.reasons.length > 0 ? (
            result.reasons.map((r) => (
              <li key={r.label} className="text-ink">
                <span className="font-semibold">
                  {r.direction === "up" ? "Raises risk" : "Lowers risk"}:
                </span>{" "}
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
            <tr>
              <td className="py-1.5 text-slate">Amount</td>
              <td className="py-1.5 text-right font-mono text-ink">{rwf(input.amount)}</td>
            </tr>
            <tr>
              <td className="py-1.5 text-slate">Savings</td>
              <td className="py-1.5 text-right font-mono text-ink">{rwf(input.savings)}</td>
            </tr>
            <tr>
              <td className="py-1.5 text-slate">Salary</td>
              <td className="py-1.5 text-right font-mono text-ink">{rwf(input.salary)}</td>
            </tr>
            <tr>
              <td className="py-1.5 text-slate">Guarantors</td>
              <td className="py-1.5 text-right font-mono text-ink">
                {input.guarantor_ids.join(", ") || "none"}
              </td>
            </tr>
          </tbody>
        </table>

        <p className="mt-8 border-t border-line pt-4 text-xs text-slate">
          This report is decision support for the loan officer. It does not approve
          or decline the loan. The score's accuracy is limited by the available
          data, so it should be weighed with the network flags and the officer's
          own judgement. GuarantorLens prototype, Umwalimu SACCO.
        </p>
      </div>
    </div>
  );
}
