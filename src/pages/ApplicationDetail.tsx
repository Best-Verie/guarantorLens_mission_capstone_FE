import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppShell } from "../components/app/AppShell";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { ScoreGauge } from "../components/app/ScoreGauge";
import { ScoreDrivers } from "../components/app/ScoreDrivers";
import {
  getApplication, escalateApplication, addRecommendation,
} from "../api/applications";
import type { ApplicationOut } from "../api/applications";
import { assessRisk } from "../api/risk";
import type { AssessResult, ShapContribution } from "../api/risk";
import { ApiError } from "../api/http";
import { getToken, getUser } from "../lib/session";

const bandClass: Record<string, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-emerald-100 text-emerald-700",
};
const STATUS_LABEL: Record<string, string> = {
  assessed: "New", escalated: "Escalated", recommended: "Reviewed", closed: "Closed",
};

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const appId = Number(id);
  const user = getUser();
  const isOfficer = user?.role === "loan_officer";
  const [app, setApp] = useState<ApplicationOut | null>(null);
  const [drivers, setDrivers] = useState<ShapContribution[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // what-if state
  const [wfAmount, setWfAmount] = useState("");
  const [wfSavings, setWfSavings] = useState("");
  const [wfSalary, setWfSalary] = useState("");
  const [wfGuar, setWfGuar] = useState("");
  const [wf, setWf] = useState<AssessResult | null>(null);
  const [wfBusy, setWfBusy] = useState(false);

  // workflow state
  const [escNote, setEscNote] = useState("");
  const [recDecision, setRecDecision] = useState("approve");
  const [recNote, setRecNote] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    const token = getToken();
    if (!token) { navigate("/login", { replace: true }); return; }
    getApplication(appId, token)
      .then((a) => {
        setApp(a);
        setWfAmount(String(a.amount));
        setWfSavings(String(a.savings ?? 0));
        setWfSalary(a.salary != null ? String(a.salary) : "");
        setWfGuar(a.guarantor_ids.join(", "));
        // The model drivers (SHAP) are not stored on the application, so recompute
        // them from the saved inputs to show what pushed the score up or down.
        assessRisk({
          borrower_id: a.borrower_id || undefined,
          amount: a.amount,
          savings: a.savings ?? 0,
          salary: a.salary ?? null,
          guarantor_ids: a.guarantor_ids,
        }, token).then((res) => setDrivers(res.shap)).catch(() => {});
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Something went wrong."))
      .finally(() => setLoading(false));
  }
  useEffect(load, [appId, navigate]);

  const token = getToken() ?? "";
  const rwf = (n?: number | null) => (n == null ? "-" : "RWF " + Math.round(n).toLocaleString("en-US"));

  async function runWhatIf() {
    setWfBusy(true); setError(null);
    try {
      const res = await assessRisk({
        borrower_id: app?.borrower_id || undefined,
        amount: Number(wfAmount),
        savings: Number(wfSavings) || 0,
        salary: wfSalary.trim() ? Number(wfSalary) : null,
        guarantor_ids: wfGuar.split(",").map((s) => s.trim()).filter(Boolean),
      }, token);
      setWf(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not recalculate.");
    } finally {
      setWfBusy(false);
    }
  }

  async function doEscalate() {
    setBusy(true); setError(null);
    try { setApp(await escalateApplication(appId, escNote, token)); setEscNote(""); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Could not escalate."); }
    finally { setBusy(false); }
  }

  async function doRecommend() {
    setBusy(true); setError(null);
    try { setApp(await addRecommendation(appId, recDecision, recNote, token)); setRecNote(""); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Could not add recommendation."); }
    finally { setBusy(false); }
  }

  if (loading) return <AppShell><p className="text-sm text-slate">Loading...</p></AppShell>;
  if (error && !app) return <AppShell><Alert tone="error">{error}</Alert></AppShell>;
  if (!app) return null;

  const delta = wf && app.risk_score != null ? wf.risk_score - app.risk_score : null;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <button onClick={() => navigate("/applications")} className="text-sm text-brand hover:underline">
          &larr; Applications
        </button>

        <div className="mt-3 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">Application #{app.id}</h1>
            <p className="mt-1 text-sm text-slate">
              {app.borrower_name || app.borrower_id || "New applicant"}
              {app.branch ? ` · ${app.branch}` : ""} · by {app.created_by_name}
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {STATUS_LABEL[app.status] ?? app.status}
          </span>
        </div>
        <p className="mt-2 text-xs text-slate">
          New = just assessed · Escalated = sent to a credit manager · Reviewed = a recommendation was added.
        </p>

        {error && <div className="mt-4"><Alert tone="error">{error}</Alert></div>}

        {/* Result + what-if side by side */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Assessment result */}
          <section className="rounded-xl border border-line bg-white p-5">
            <div className="flex items-center gap-5">
              {app.risk_score != null && app.band && (
                <ScoreGauge score={app.risk_score} band={app.band} />
              )}
              <div>
                <h2 className="text-lg font-bold text-ink">{app.band} risk · {app.risk_score}/100</h2>
                <p className="mt-1 text-sm text-slate">
                  {app.guarantor_ids.length} guarantor(s) · loan {rwf(app.amount)} · savings {rwf(app.savings)}
                </p>
                <p className="mt-1 text-xs text-slate">Score source: {app.source === "model" ? "model" : "rule-based fallback"}</p>
              </div>
            </div>
            {app.flags.length > 0 && (
              <>
                <h3 className="mt-5 text-sm font-semibold text-ink">Flags</h3>
                <ul className="mt-1 list-disc pl-5 text-sm text-ink">
                  {app.flags.map((f) => <li key={f}>{f}</li>)}
                </ul>
              </>
            )}
          </section>

          {/* What-if card (highlighted, sits next to the result) */}
          <section className="rounded-xl border-2 border-accent/40 bg-accent-50/40 p-5">
            <h2 className="text-sm font-semibold text-ink">Simulate a change (what-if)</h2>
            <p className="mt-1 text-sm text-slate">
              Try a different loan or guarantors and see how the risk moves, without starting over.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-slate">Amount
                <input className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-ink" type="number"
                       value={wfAmount} onChange={(e) => setWfAmount(e.target.value)} /></label>
              <label className="text-sm text-slate">Savings
                <input className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-ink" type="number"
                       value={wfSavings} onChange={(e) => setWfSavings(e.target.value)} /></label>
              <label className="text-sm text-slate">Salary
                <input className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-ink" type="number"
                       value={wfSalary} onChange={(e) => setWfSalary(e.target.value)} /></label>
              <label className="text-sm text-slate">Guarantors (comma-separated IDs)
                <input className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 font-mono text-ink"
                       value={wfGuar} onChange={(e) => setWfGuar(e.target.value)} /></label>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Button variant="accent" onClick={runWhatIf} disabled={wfBusy}>
                {wfBusy ? "Recalculating..." : "Recalculate"}
              </Button>
              {wf && (
                <div className="text-sm">
                  <span className={"rounded px-2 py-0.5 text-xs font-medium " + (bandClass[wf.band] ?? "")}>
                    {wf.band}
                  </span>{" "}
                  <span className="font-mono text-ink">{wf.risk_score}/100</span>{" "}
                  {delta != null && (
                    <span className={delta < 0 ? "text-emerald-600" : delta > 0 ? "text-red-600" : "text-slate"}>
                      ({delta > 0 ? "+" : ""}{delta} vs {app.risk_score})
                    </span>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Model drivers (SHAP), when the model exposes them */}
        {drivers.length > 0 && (
          <section className="mt-6 rounded-xl border border-line bg-white p-5">
            <ScoreDrivers shap={drivers} />
          </section>
        )}

        {/* Why this score (full width) */}
        {app.reasons.length > 0 && (
          <section className="mt-6 rounded-xl border border-line bg-white p-5">
            <h3 className="text-sm font-semibold text-ink">Why this score (in plain language)</h3>
            <ul className="mt-1 space-y-1 text-sm">
              {app.reasons.map((r) => (
                <li key={r.label} className="text-ink">
                  <span className="font-semibold">{r.direction === "up" ? "Raises" : "Lowers"} risk:</span>{" "}
                  {r.label} ({r.kind}). {r.detail}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Escalation */}
        <section className="mt-6 rounded-xl border border-line bg-white p-5">
          <h2 className="text-sm font-semibold text-ink">Escalation</h2>
          {app.status === "escalated" ? (
            <p className="mt-1 text-sm text-amber-700">
              Escalated to a credit manager for review
              {app.escalation_note ? `: "${app.escalation_note}"` : ""}.
            </p>
          ) : isOfficer ? (
            <>
              <p className="mt-1 text-sm text-slate">
                Send this application to a credit manager to review.
              </p>
              <textarea className="mt-2 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink"
                        rows={2} placeholder="Why are you escalating? (optional)"
                        value={escNote} onChange={(e) => setEscNote(e.target.value)} />
              <Button variant="secondary" onClick={doEscalate} disabled={busy} className="mt-2">
                Escalate
              </Button>
            </>
          ) : (
            <p className="mt-1 text-sm text-slate">Not escalated.</p>
          )}
        </section>

        {/* Recommendations */}
        <section className="mt-6 rounded-xl border border-line bg-white p-5">
          <h2 className="text-sm font-semibold text-ink">Recommendations</h2>
          <p className="mt-1 text-xs text-slate">A recommendation, not a binding decision. The SACCO decides outside the tool.</p>
          <ul className="mt-3 space-y-2">
            {app.recommendations.map((r) => (
              <li key={r.id} className="rounded-lg border border-line px-3 py-2 text-sm">
                <span className="font-semibold text-ink">{r.decision.replace("_", " ")}</span>
                <span className="text-slate"> · {r.author_name} ({r.author_role})</span>
                {r.note && <div className="text-ink">{r.note}</div>}
              </li>
            ))}
            {app.recommendations.length === 0 && <li className="text-sm text-slate">None yet.</li>}
          </ul>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <select className="rounded-lg border border-line px-3 py-2 text-sm text-ink"
                    value={recDecision} onChange={(e) => setRecDecision(e.target.value)}>
              <option value="approve">Approve</option>
              <option value="request_changes">Request changes</option>
              <option value="decline">Decline</option>
            </select>
            <input className="flex-1 rounded-lg border border-line px-3 py-2 text-sm text-ink"
                   placeholder="Add a note (e.g. add a guarantor with stronger savings)"
                   value={recNote} onChange={(e) => setRecNote(e.target.value)} />
            <Button variant="accent" onClick={doRecommend} disabled={busy}>Add</Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
