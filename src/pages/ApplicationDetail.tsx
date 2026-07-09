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

function shapChangeDrivers(before: ShapContribution[], after: ShapContribution[]) {
  const beforeMap = new Map(before.map((s) => [s.feature, s]));
  return after
    .map((next) => {
      const prev = beforeMap.get(next.feature);
      const previous = prev?.value ?? 0;
      const delta = next.value - previous;
      return { ...next, previous, delta };
    })
    .filter((s) => Math.abs(s.delta) > 0.0001)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 5);
}

function listDiff(before: string[], after: string[]) {
  const b = new Set(before);
  const a = new Set(after);
  return {
    added: after.filter((x) => !b.has(x)),
    removed: before.filter((x) => !a.has(x)),
  };
}

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const appId = Number(id);
  const user = getUser();
  const isOfficer = user?.role === "loan_officer";
  const [app, setApp] = useState<ApplicationOut | null>(null);
  const [drivers, setDrivers] = useState<ShapContribution[]>([]);
  const [brief, setBrief] = useState("");
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // what-if state
  const [wfAmount, setWfAmount] = useState("");
  const [wfSavings, setWfSavings] = useState("");
  const [wfSalary, setWfSalary] = useState("");
  const [wfGuar, setWfGuar] = useState("");
  // per-guarantor attribute overrides: id -> { savings?, salary?, loans_backed? } as raw strings
  const [wfOv, setWfOv] = useState<Record<string, { savings?: string; salary?: string; loans_backed?: string }>>({});
  const [wf, setWf] = useState<AssessResult | null>(null);
  const [wfBusy, setWfBusy] = useState(false);
  const [explainTab, setExplainTab] = useState<"drivers" | "plain" | "todo">("drivers");

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
        // Prefill the what-if editor with any guarantor overrides saved at assessment time.
        if (a.guarantor_overrides) {
          const seed: Record<string, { savings?: string; salary?: string; loans_backed?: string }> = {};
          for (const [id, o] of Object.entries(a.guarantor_overrides)) {
            seed[id] = {
              savings: o.savings != null ? String(o.savings) : undefined,
              salary: o.salary != null ? String(o.salary) : undefined,
              loans_backed: o.loans_backed != null ? String(o.loans_backed) : undefined,
            };
          }
          setWfOv(seed);
        }
        // The model drivers (SHAP) are not stored on the application, so recompute them from the
        // saved inputs (including any overrides) so the drivers/brief match the stored score.
        assessRisk({
          borrower_id: a.borrower_id || undefined,
          amount: a.amount,
          savings: a.savings ?? 0,
          salary: a.salary ?? null,
          interest_rate: a.interest_rate ?? 13,
          guarantor_ids: a.guarantor_ids,
          guarantor_overrides: a.guarantor_overrides ?? undefined,
        }, token).then((res) => { setDrivers(res.shap); setRecommendations(res.recommendations); setBrief(res.brief ?? ""); }).catch(() => {});
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Something went wrong."))
      .finally(() => setLoading(false));
  }
  useEffect(load, [appId, navigate]);

  const token = getToken() ?? "";
  const rwf = (n?: number | null) => (n == null ? "-" : "RWF " + Math.round(n).toLocaleString("en-US"));

  function buildOverrides(ids: string[]) {
    const out: Record<string, { savings?: number; salary?: number; loans_backed?: number }> = {};
    for (const id of ids) {
      const o = wfOv[id];
      if (!o) continue;
      const entry: { savings?: number; salary?: number; loans_backed?: number } = {};
      if (o.savings?.trim()) entry.savings = Number(o.savings);
      if (o.salary?.trim()) entry.salary = Number(o.salary);
      if (o.loans_backed?.trim()) entry.loans_backed = Number(o.loans_backed);
      if (Object.keys(entry).length) out[id] = entry;
    }
    return Object.keys(out).length ? out : undefined;
  }

  async function runWhatIf() {
    setWfBusy(true); setError(null);
    try {
      const ids = wfGuar.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await assessRisk({
        borrower_id: app?.borrower_id || undefined,
        amount: Number(wfAmount),
        savings: Number(wfSavings) || 0,
        salary: wfSalary.trim() ? Number(wfSalary) : null,
        interest_rate: app?.interest_rate ?? 13,
        guarantor_ids: ids,
        guarantor_overrides: buildOverrides(ids),
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
  const whatIfDrivers = wf ? shapChangeDrivers(drivers, wf.shap) : [];
  const whatIfGuarantors = wf ? listDiff(app.guarantor_ids, wfGuar.split(",").map((s) => s.trim()).filter(Boolean)) : { added: [], removed: [] };
  const newFlags = wf ? wf.flags.filter((f) => !app.flags.includes(f)) : [];
  const clearedFlags = wf ? app.flags.filter((f) => !wf.flags.includes(f)) : [];

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

        {brief && (
          <div className="mt-4 rounded-lg border-l-4 border-brand bg-brand-50/60 px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-brand">Officer brief</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink">{brief}</p>
          </div>
        )}

        {/* Result + what-if side by side */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Assessment result */}
          <section className="rounded-xl border border-line bg-white p-5">
            <div className="flex items-center gap-5">
              {app.risk_score != null && app.band && (
                <ScoreGauge score={app.risk_score} band={app.band} />
              )}
              <div>
                <h2 className="text-lg font-bold text-ink">{app.band} risk</h2>
                {app.reasons.some((r) => r.label.startsWith("Risk level raised")) && (
                  <p className="mt-0.5 text-xs font-medium text-red-600">
                    Raised to {app.band} by guarantor flags (model score {app.risk_score}/100)
                  </p>
                )}
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
              Try a different loan, different guarantors, or adjust a guarantor's own savings, salary,
              or how many loans they back, and see how the risk moves, without starting over.
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

            {/* Per-guarantor attribute overrides */}
            {wfGuar.split(",").map((s) => s.trim()).filter(Boolean).length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate">Adjust guarantor details</p>
                <p className="mb-2 text-xs text-slate">Leave blank to use their real values.</p>
                <div className="space-y-2">
                  {wfGuar.split(",").map((s) => s.trim()).filter(Boolean).map((id) => {
                    const o = wfOv[id] ?? {};
                    const set = (k: "savings" | "salary" | "loans_backed", v: string) =>
                      setWfOv((prev) => ({ ...prev, [id]: { ...prev[id], [k]: v } }));
                    return (
                      <div key={id} className="rounded-lg border border-line bg-white p-2.5">
                        <div className="mb-1.5 font-mono text-xs text-brand">{id}</div>
                        <div className="grid grid-cols-3 gap-2">
                          {(["savings", "salary", "loans_backed"] as const).map((k) => (
                            <label key={k} className="block">
                              <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-slate">
                                {k === "loans_backed" ? "Loans" : k}
                              </span>
                              <input className="w-full rounded border border-line bg-white px-2 py-1 text-sm text-ink"
                                     type="number" value={o[k] ?? ""} onChange={(e) => set(k, e.target.value)} />
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
            {wf && (
              <div className="mt-4 rounded-lg border border-accent/30 bg-white p-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate">What changed the score</h3>
                <ul className="mt-2 space-y-1 text-sm text-ink">
                  {Number(wfAmount) !== app.amount && (
                    <li>
                      Amount changed from <span className="font-medium">{rwf(app.amount)}</span> to{" "}
                      <span className="font-medium">{rwf(Number(wfAmount))}</span>.
                    </li>
                  )}
                  {whatIfGuarantors.added.length > 0 && (
                    <li>
                      Added guarantor(s): <span className="font-mono">{whatIfGuarantors.added.join(", ")}</span>.
                    </li>
                  )}
                  {whatIfGuarantors.removed.length > 0 && (
                    <li>
                      Removed guarantor(s): <span className="font-mono">{whatIfGuarantors.removed.join(", ")}</span>.
                    </li>
                  )}
                  {newFlags.slice(0, 3).map((f) => (
                    <li key={`new-${f}`} className="text-red-700">New warning: {f}</li>
                  ))}
                  {clearedFlags.slice(0, 3).map((f) => (
                    <li key={`cleared-${f}`} className="text-emerald-700">Cleared warning: {f}</li>
                  ))}
                  {whatIfDrivers.map((d) => {
                    const up = d.delta > 0;
                    const network = d.kind === "network" || d.feature.startsWith("g_") || d.feature === "n_guarantors";
                    return (
                      <li key={d.feature}>
                        <span className={up ? "text-red-700" : "text-emerald-700"}>
                          {up ? "More risk from " : "Less risk from "}
                        </span>
                        {d.label}
                        {network && <span className="ml-1 text-[10px] font-semibold uppercase text-accent-600">Network</span>}
                      </li>
                    );
                  })}
                  {whatIfDrivers.length === 0 && newFlags.length === 0 && clearedFlags.length === 0 &&
                    whatIfGuarantors.added.length === 0 && whatIfGuarantors.removed.length === 0 &&
                    Number(wfAmount) === app.amount && (
                      <li className="text-slate">No major model driver changed; the score moved only slightly.</li>
                    )}
                </ul>
                {wf.recommendations.length > 0 && (
                  <>
                    <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate">Suggestions</h3>
                    <ul className="mt-1 space-y-1 text-sm text-ink">
                      {wf.recommendations.slice(0, 3).map((r) => (
                        <li key={r} className="flex gap-2"><span className="text-accent-600">&rarr;</span><span>{r}</span></li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Consolidated explanation: Drivers / In plain language / What to do */}
        {(() => {
          const available = [
            drivers.length > 0 ? "drivers" : null,
            app.reasons.length > 0 ? "plain" : null,
            recommendations.length > 0 ? "todo" : null,
          ].filter(Boolean) as ("drivers" | "plain" | "todo")[];
          if (available.length === 0) return null;
          const active = available.includes(explainTab) ? explainTab : available[0];
          const TAB_LABEL = { drivers: "Drivers", plain: "In plain language", todo: "What to do" } as const;
          return (
            <section className="mt-6 rounded-xl border border-line bg-white p-5">
              <div className="mb-4 inline-flex rounded-lg border border-line bg-slate-50 p-0.5">
                {available.map((t) => (
                  <button
                    key={t}
                    onClick={() => setExplainTab(t)}
                    className={
                      "rounded-md px-3 py-1.5 text-sm font-medium transition " +
                      (active === t ? "bg-white text-ink shadow-sm" : "text-slate hover:text-ink")
                    }
                  >
                    {TAB_LABEL[t]}
                  </button>
                ))}
              </div>

              {active === "drivers" && <ScoreDrivers shap={drivers} />}

              {active === "plain" && (
                <ul className="space-y-2.5 text-sm">
                  {app.reasons.map((r) => (
                    <li key={r.label} className="flex gap-2.5">
                      <span
                        className={
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold " +
                          (r.direction === "up" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700")
                        }
                      >
                        {r.direction === "up" ? "↑" : "↓"}
                      </span>
                      <span className="text-ink">
                        <span className="font-semibold">{r.label}</span> ({r.kind}). {r.detail}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {active === "todo" && (
                <>
                  <ul className="space-y-1.5 text-sm text-ink">
                    {recommendations.map((r) => (
                      <li key={r} className="flex gap-2">
                        <span className="text-accent-600">&rarr;</span><span>{r}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-slate">Suggestions to help you decide, not a decision.</p>
                </>
              )}
            </section>
          );
        })()}

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
