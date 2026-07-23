import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AppShell } from "../components/app/AppShell";
import { Button } from "../components/ui/Button";
import { RiskStoryCard } from "../components/app/RiskStoryCard";
import { SuggestionsTable } from "../components/app/SuggestionsTable";
import { suggestGuarantors } from "../api/risk";
import type { AssessInput, AssessResult, SuggestResult } from "../api/risk";
import { getToken, getUser } from "../lib/session";

export default function AssessResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { result: AssessResult; input: AssessInput } | null;

  // Reached directly without running an assessment.
  if (!state) return <Navigate to="/assess" replace />;

  const { result, input } = state;
  // The SHAP driver bars are the technical evidence layer: show them to credit managers, not front-line staff.
  const role = getUser()?.role;
  const isManager = role === "credit_manager" || role === "admin";
  const rwf = (n?: number | null) =>
    n == null ? "-" : "RWF " + Math.round(n).toLocaleString("en-US");

  // For a Medium/High loan, ask the advisor how to make it more bankable.
  const [suggest, setSuggest] = useState<SuggestResult | null>(null);
  useEffect(() => {
    const token = getToken();
    if (!token || result.band === "Low") return;
    suggestGuarantors(input, token).then(setSuggest).catch(() => {});
  }, [input, result.band]);

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Assessment result</h1>
          <p className="mt-1 text-sm text-slate">
            {input.borrower_id && (
              <>
                Borrower{" "}
                <Link
                  to={`/member/${encodeURIComponent(result.uids[input.borrower_id] ?? input.borrower_id)}`}
                  className="font-mono text-brand hover:underline"
                >
                  {input.borrower_id}
                </Link>{" "}
                &middot;{" "}
              </>
            )}
            {input.guarantor_ids.length} guarantor(s)
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate("/assess/report", { state: { result, input } })}
          >
            Download Report
          </Button>
          <Button variant="secondary" onClick={() => navigate("/assess")}>
            New assessment
          </Button>
        </div>
      </div>

      <RiskStoryCard
        score={result.risk_score}
        band={result.band}
        raisedByFlags={result.reasons.some((r) => r.label.startsWith("Risk level raised"))}
        lead={result.brief}
        reasons={result.reasons.map((r) => ({
          key: r.label, label: r.label, direction: r.direction, kind: r.kind, text: r.detail,
        }))}
        shap={result.shap}
        flags={result.flags}
        recommendations={result.recommendations}
        unusual={result.unusual?.unusual}
        isManager={isManager}
        source={result.source}
      />

      {/* Guarantor fix-it advisor (Medium/High loans) */}
      {suggest && suggest.suggestions.length > 0 && (
        <section className="mt-5 rounded-xl border-2 border-emerald-200 bg-emerald-50/40 p-6">
          <h2 className="text-sm font-semibold text-ink">Fix-it advisor</h2>
          <p className="mt-1 text-sm text-slate">
            The current guarantee scores <span className="font-semibold">{suggest.current.band} {suggest.current.score}/100</span>.
            {suggest.weakest_current && <> The weakest current backer is <span className="font-mono">{suggest.weakest_current}</span>.</>}
            {" "}A single change would lower the risk
            {suggest.branch && <> (only guarantors from the borrower's branch, <span className="font-medium">{suggest.branch}</span>, are suggested)</>}:
          </p>
          <SuggestionsTable suggestions={suggest.suggestions} />
          <p className="mt-2 text-xs text-slate">Real members from the book, re-scored by the model. A suggestion to help you decide, not a decision.</p>
        </section>
      )}

      {/* Loan summary */}
      <section className="mt-5 rounded-xl border border-line bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold text-ink">Loan summary</h2>
        <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between border-b border-line py-1">
            <dt className="text-slate">Amount</dt>
            <dd className="font-mono text-ink">{rwf(input.amount)}</dd>
          </div>
          <div className="flex justify-between border-b border-line py-1">
            <dt className="text-slate">Savings</dt>
            <dd className="font-mono text-ink">{rwf(input.savings)}</dd>
          </div>
          <div className="flex justify-between border-b border-line py-1">
            <dt className="text-slate">Salary</dt>
            <dd className="font-mono text-ink">{rwf(input.salary)}</dd>
          </div>
          <div className="flex justify-between border-b border-line py-1">
            <dt className="text-slate">Guarantors written off before</dt>
            <dd className="font-mono text-ink">
              {result.network.guarantors_with_prior_default} of {result.network.n_guarantors}
            </dd>
          </div>
          {input.guarantor_ids.length > 0 && (
            <div className="flex flex-col gap-1 border-b border-line py-1 sm:col-span-2">
              <dt className="text-slate">Guarantors</dt>
              <dd className="flex flex-wrap gap-2">
                {input.guarantor_ids.map((g) => (
                  <Link
                    key={g}
                    to={`/member/${encodeURIComponent(result.uids[g] ?? g)}`}
                    className="font-mono text-brand hover:underline"
                  >
                    {g}
                  </Link>
                ))}
              </dd>
            </div>
          )}
        </dl>
      </section>

      <p className="mt-5 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
        This is guidance to help the officer decide. It does not approve or decline
        the loan. The score's accuracy is limited by the data, so weigh it with the
        flags and your own judgement.
      </p>
    </AppShell>
  );
}
