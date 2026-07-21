import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AppShell } from "../components/app/AppShell";
import { Button } from "../components/ui/Button";
import { ScoreGauge } from "../components/app/ScoreGauge";
import { ScoreDrivers } from "../components/app/ScoreDrivers";
import { SuggestionsTable } from "../components/app/SuggestionsTable";
import { ReasonList } from "../components/app/ReasonList";
import { cn } from "../lib/cn";
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
    n == null ? "not on file" : "RWF " + Math.round(n).toLocaleString("en-US");

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

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Score */}
        <section className="flex flex-col items-center rounded-xl border border-line bg-white p-6">
          <ScoreGauge score={result.risk_score} band={result.band} />
          {result.reasons.some((r) => r.label.startsWith("Risk level raised")) ? (
            <p className="mt-3 text-center text-xs font-medium text-red-600">
              Raised to {result.band} by guarantor flags (model score {result.risk_score}/100)
            </p>
          ) : (
            <p className="mt-3 text-center text-sm text-slate">Risk level from the model</p>
          )}
          <span className="mt-1 text-xs text-slate">
            Source: {result.source === "model" ? "model" : "rule-based fallback"}
          </span>
        </section>

        {/* Reasons + flags */}
        <section className="rounded-xl border border-line bg-white p-6 lg:col-span-2">
          {result.brief && (
            <div className="mb-5 rounded-lg border-l-4 border-brand bg-brand-50/60 px-4 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-brand">Officer brief</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink">{result.brief}</p>
            </div>
          )}
          <h2 className="text-sm font-semibold text-ink">Guarantor-network flags</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {result.flags.map((f) => {
              const notable = !f.startsWith("No notable");
              return (
                <span
                  key={f}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-medium",
                    notable ? "bg-accent-50 text-accent-600" : "bg-slate-100 text-slate"
                  )}
                >
                  {f}
                </span>
              );
            })}
          </div>

          {(result.unusual?.unusual || result.segment) && (
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-line pt-4 text-xs">
              {result.unusual?.unusual && (
                <span
                  className="rounded-lg bg-amber-50 px-2.5 py-1 font-medium text-amber-700"
                  title="Isolation Forest: this application's profile is unusual for the book. Unusual applications default about 3x more often on average, so it is worth a closer look."
                >
                  Unusual application
                </span>
              )}
              {result.segment && (
                <span className="text-slate">
                  Borrower segment: <span className="font-medium text-ink">{result.segment.description}</span>
                  {result.segment.segment_write_off_rate != null && (
                    <> &middot; this segment's write-off rate {(result.segment.segment_write_off_rate * 100).toFixed(1)}%</>
                  )}
                </span>
              )}
              {result.unusual?.unusual && (
                <span className="basis-full text-slate">
                  "Unusual" means this profile is atypical for the book (from an anomaly model). Applications
                  flagged this way default about 3x more often, so take a closer look. It is a prompt, not a verdict.
                </span>
              )}
            </div>
          )}

          {isManager && result.shap.length > 0 && <div className="mt-6"><ScoreDrivers shap={result.shap} /></div>}

          <h2 className="mt-6 text-sm font-semibold text-ink">
            {result.shap.length > 0 ? "In plain language" : "Why this score"}
          </h2>
          <div className="mt-2">
            {result.reasons.length > 0 ? (
              <ReasonList
                band={result.band}
                items={result.reasons.map((r) => ({
                  key: r.label, label: r.label, direction: r.direction, kind: r.kind, text: r.detail,
                }))}
              />
            ) : (
              <p className="py-2.5 text-sm text-slate">No strong factors either way.</p>
            )}
          </div>

          {result.recommendations.length > 0 && (
            <>
              <h2 className="mt-6 text-sm font-semibold text-ink">What you could do</h2>
              <ul className="mt-2 space-y-1.5 text-sm text-ink">
                {result.recommendations.map((r) => (
                  <li key={r} className="flex gap-2">
                    <span className="text-accent-600">&rarr;</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-slate">Suggestions to help you decide, not a decision.</p>
            </>
          )}
        </section>
      </div>

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
