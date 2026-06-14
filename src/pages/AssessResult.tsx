import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { AppShell } from "../components/app/AppShell";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/cn";
import type { AssessInput, AssessResult, Reason } from "../api/risk";

const BAND_COLOR: Record<string, string> = {
  High: "#DC2626",
  Medium: "#F58220",
  Low: "#0E7C66",
};

function Gauge({ score, band }: { score: number; band: string }) {
  const color = BAND_COLOR[band] ?? "#173C8E";
  const r = 70;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <svg viewBox="0 0 180 180" className="h-44 w-44">
      <circle cx="90" cy="90" r={r} fill="none" stroke="#e2e8f0" strokeWidth="14" />
      <circle
        cx="90"
        cy="90"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 90 90)"
      />
      <text x="90" y="88" textAnchor="middle" fill="#0f172a" fontSize="42" fontWeight="700">
        {score}
      </text>
      <text x="90" y="112" textAnchor="middle" fill={color} fontSize="15" fontWeight="600">
        {band}
      </text>
    </svg>
  );
}

function ReasonRow({ r }: { r: Reason }) {
  const up = r.direction === "up";
  return (
    <li className="flex gap-3 py-2.5">
      <span
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold",
          up ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"
        )}
        title={up ? "Raises risk" : "Lowers risk"}
      >
        {up ? "↑" : "↓"}
      </span>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">{r.label}</span>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[11px] font-medium",
              r.kind === "network" ? "bg-accent-50 text-accent-600" : "bg-brand-50 text-brand"
            )}
          >
            {r.kind === "network" ? "Network" : "Individual"}
          </span>
        </div>
        <p className="text-sm text-slate">{r.detail}</p>
      </div>
    </li>
  );
}

export default function AssessResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { result: AssessResult; input: AssessInput } | null;

  // Reached directly without running an assessment.
  if (!state) return <Navigate to="/assess" replace />;

  const { result, input } = state;
  const rwf = (n?: number | null) =>
    n == null ? "not on file" : "RWF " + Math.round(n).toLocaleString("en-US");

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Assessment result</h1>
          <p className="mt-1 text-sm text-slate">
            {input.borrower_id ? `Borrower ${input.borrower_id} · ` : ""}
            {input.guarantor_ids.length} guarantor(s)
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate("/assess")}>
          New assessment
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Score */}
        <section className="flex flex-col items-center rounded-xl border border-line bg-white p-6">
          <Gauge score={result.risk_score} band={result.band} />
          <p className="mt-3 text-center text-sm text-slate">
            Risk score out of 100
          </p>
          <span className="mt-1 text-xs text-slate">
            Source: {result.source === "model" ? "model" : "rule-based fallback"}
          </span>
        </section>

        {/* Reasons + flags */}
        <section className="rounded-xl border border-line bg-white p-6 lg:col-span-2">
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

          <h2 className="mt-6 text-sm font-semibold text-ink">Why this score</h2>
          <ul className="mt-1 divide-y divide-line">
            {result.reasons.length > 0 ? (
              result.reasons.map((r) => <ReasonRow key={r.label} r={r} />)
            ) : (
              <li className="py-2.5 text-sm text-slate">No strong factors either way.</li>
            )}
          </ul>
        </section>
      </div>

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
            <dt className="text-slate">Guarantors who defaulted before</dt>
            <dd className="font-mono text-ink">
              {result.network.guarantors_with_prior_default} of {result.network.n_guarantors}
            </dd>
          </div>
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
