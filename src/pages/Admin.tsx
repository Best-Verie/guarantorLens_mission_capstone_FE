import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { AppShell } from "../components/app/AppShell";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import {
  listUsers, setUserRole, deleteUser, getModelCard, getActivity, uploadModel, clearApplications,
} from "../api/admin";
import type { AdminUser, ModelCard, ActivityStats } from "../api/admin";
import type { Role } from "../api/auth";
import { ApiError } from "../api/http";
import { getToken, getUser } from "../lib/session";

const ROLE_LABELS: Record<string, string> = {
  loan_officer: "Loan officer",
  credit_manager: "Credit manager",
  admin: "Admin",
};
const ROLE_OPTIONS: Role[] = ["loan_officer", "credit_manager", "admin"];
type Tab = "users" | "model" | "activity";

export default function Admin() {
  const me = getUser();
  const token = getToken() ?? "";
  const [tab, setTab] = useState<Tab>("users");

  // Admin-only page. Non-admins are bounced to the dashboard.
  if (me && me.role !== "admin") return <Navigate to="/dashboard" replace />;

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-ink">Admin</h1>
      <p className="mt-1 text-sm text-slate">
        Manage who can use the tool, see the deployed model, and deploy a retrained one.
      </p>

      <div className="mt-4 inline-flex rounded-lg border border-line bg-white p-1 text-sm">
        {(["users", "model", "activity"] as Tab[]).map((t) => (
          <button
            key={t}
            className={"rounded-md px-4 py-1.5 font-medium capitalize " +
              (tab === t ? "bg-brand text-white" : "text-slate")}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "users" && <UsersTab token={token} meId={me?.id} />}
        {tab === "model" && <ModelTab token={token} />}
        {tab === "activity" && <ActivityTab token={token} />}
      </div>
    </AppShell>
  );
}

/* ---------------- Users ---------------- */
function UsersTab({ token, meId }: { token: string; meId?: number }) {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  function load() {
    listUsers(token)
      .then(setUsers)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Could not load users."));
  }
  useEffect(load, [token]);

  async function changeRole(u: AdminUser, role: Role) {
    setBusy(u.id); setError(null); setNote(null);
    try {
      const updated = await setUserRole(u.id, role, token);
      setUsers((list) => (list ?? []).map((x) => (x.id === u.id ? { ...x, role: updated.role } : x)));
      setNote(`${u.full_name} is now ${ROLE_LABELS[role]}.`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not change role.");
    } finally { setBusy(null); }
  }

  async function remove(u: AdminUser) {
    if (!window.confirm(`Remove ${u.full_name}? Their assessments will be reassigned to you.`)) return;
    setBusy(u.id); setError(null); setNote(null);
    try {
      const res = await deleteUser(u.id, token);
      setUsers((list) => (list ?? []).filter((x) => x.id !== u.id));
      setNote(res.message);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not remove user.");
    } finally { setBusy(null); }
  }

  if (error && !users) return <Alert tone="error">{error}</Alert>;
  if (!users) return <p className="text-sm text-slate">Loading...</p>;

  return (
    <>
      {error && <div className="mb-4"><Alert tone="error">{error}</Alert></div>}
      {note && <div className="mb-4"><Alert tone="success">{note}</Alert></div>}
      <div className="overflow-hidden rounded-xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Assessments</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => {
              const isMe = u.id === meId;
              return (
                <tr key={u.id}>
                  <td className="px-4 py-2 text-ink">
                    {u.full_name}{isMe && <span className="ml-1 text-xs text-slate">(you)</span>}
                  </td>
                  <td className="px-4 py-2 font-mono text-slate">{u.email}</td>
                  <td className="px-4 py-2">
                    <select
                      className="rounded-lg border border-line px-2 py-1 text-sm text-ink disabled:opacity-50"
                      value={u.role}
                      disabled={busy === u.id || isMe}
                      onChange={(e) => changeRole(u, e.target.value as Role)}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2 font-mono text-ink">{u.applications}</td>
                  <td className="px-4 py-2 text-right">
                    {!isMe && (
                      <button
                        className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                        disabled={busy === u.id}
                        onClick={() => remove(u)}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate">
        You cannot change your own role or remove your own account, and the last admin cannot be removed.
      </p>
    </>
  );
}

/* ---------------- Model ---------------- */
function ModelTab({ token }: { token: string }) {
  const [card, setCard] = useState<ModelCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [membersFile, setMembersFile] = useState<File | null>(null);
  const [loansFile, setLoansFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    getModelCard(token)
      .then(setCard)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Could not load the model card."));
  }
  useEffect(load, [token]);

  async function deploy() {
    if (!modelFile) return;
    setBusy(true); setError(null); setNote(null);
    try {
      const updated = await uploadModel(
        { model: modelFile, members: membersFile, loans: loansFile }, token);
      setCard(updated);
      setModelFile(null); setMembersFile(null); setLoansFile(null);
      setNote("New model deployed and now serving.");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not deploy the model.");
    } finally { setBusy(false); }
  }

  async function clearApps() {
    if (!window.confirm("Delete ALL saved applications and their recommendations? This cannot be undone.")) return;
    setBusy(true); setError(null); setNote(null);
    try {
      const res = await clearApplications(token);
      setNote(res.message);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not clear applications.");
    } finally { setBusy(false); }
  }

  if (error && !card) return <Alert tone="error">{error}</Alert>;
  if (!card) return <p className="text-sm text-slate">Loading...</p>;

  const metricEntries = Object.entries(card.metrics ?? {});

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Deployed model card */}
      <section className="rounded-xl border border-line bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Deployed model</h2>
          <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " +
            (card.source === "model" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
            {card.source === "model" ? "model bundle" : "heuristic fallback"}
          </span>
        </div>
        {card.source !== "model" && (
          <p className="mt-2 text-sm text-amber-700">
            No model bundle is loaded, so the API is scoring with the transparent rule-based
            fallback. Upload a bundle to restore model scoring.
          </p>
        )}
        <dl className="mt-4 space-y-2 text-sm">
          <Row k="Name" v={card.model_name ?? "(unnamed bundle)"} />
          <Row k="Trained" v={card.trained_at ?? "unknown"} />
          <Row k="Features" v={`${card.n_features}`} />
          <Row k="Members in table" v={card.n_members.toLocaleString()} />
          <Row k="Borrowers with loans" v={card.n_borrowers_with_loans.toLocaleString()} />
          <Row k="Bands" v={Object.entries(card.bands).map(([b, v]) => `${b} ${v}`).join(" · ") || "-"} />
        </dl>
        {metricEntries.length > 0 && (
          <>
            <h3 className="mt-4 text-xs font-semibold uppercase text-slate">Held-out metrics</h3>
            <div className="mt-1 flex flex-wrap gap-3 text-sm">
              {metricEntries.map(([k, v]) => (
                <span key={k} className="rounded-lg bg-slate-50 px-2 py-1">
                  <span className="text-slate">{k}: </span><span className="font-mono text-ink">{String(v)}</span>
                </span>
              ))}
            </div>
          </>
        )}
        {card.features.length > 0 && (
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-brand">Feature list ({card.features.length})</summary>
            <ul className="mt-2 flex flex-wrap gap-1">
              {card.features.map((f) => (
                <li key={f} className={"rounded px-2 py-0.5 text-xs font-mono " +
                  (card.network_features.includes(f) ? "bg-brand-50 text-brand" : "bg-slate-100 text-slate-700")}>
                  {f}
                </li>
              ))}
            </ul>
            {card.network_features.length > 0 && (
              <p className="mt-2 text-xs text-slate">Highlighted = guarantor-network features.</p>
            )}
          </details>
        )}
      </section>

      {/* Deploy a new model */}
      <section className="rounded-xl border-2 border-accent/40 bg-accent-50/40 p-5">
        <h2 className="text-base font-semibold text-ink">Deploy a retrained model</h2>
        <p className="mt-1 text-sm text-slate">
          Training happens offline in the notebook. Upload the exported bundle to make it live.
          The bundle is validated before it replaces the current one.
        </p>
        {error && <div className="mt-3"><Alert tone="error">{error}</Alert></div>}
        {note && <div className="mt-3"><Alert tone="success">{note}</Alert></div>}

        <div className="mt-4 space-y-3">
          <FileField label="Model bundle (.joblib) — required"
                     onChange={setModelFile} file={modelFile} accept=".joblib" />
          <FileField label="Members table (.json) — optional"
                     onChange={setMembersFile} file={membersFile} accept=".json" />
          <FileField label="Loans table (.json) — optional"
                     onChange={setLoansFile} file={loansFile} accept=".json" />
        </div>

        <Button variant="accent" className="mt-4" disabled={!modelFile || busy} onClick={deploy}>
          {busy ? "Deploying..." : "Validate & deploy"}
        </Button>
        <p className="mt-3 text-xs text-slate">
          This updates the running server immediately. On a free-tier host the filesystem
          resets on redeploy, so for a permanent change also commit the artifacts to the repo.
        </p>
      </section>

      {/* Maintenance: clear stale applications after a dataset swap */}
      <section className="rounded-xl border border-red-200 bg-red-50/40 p-5 lg:col-span-2">
        <h2 className="text-base font-semibold text-ink">Clear saved applications</h2>
        <p className="mt-1 text-sm text-slate">
          Applications live in the database, not in the model files. After you swap in a new
          dataset, the old applications still point at members that no longer exist. Clear them
          to start fresh. This does not touch users or the model.
        </p>
        <Button variant="secondary" className="mt-3 border-red-300 text-red-700" disabled={busy} onClick={clearApps}>
          Clear all applications
        </Button>
      </section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate">{k}</dt>
      <dd className="text-right font-medium text-ink">{v}</dd>
    </div>
  );
}

function FileField({ label, file, accept, onChange }:
  { label: string; file: File | null; accept: string; onChange: (f: File | null) => void }) {
  return (
    <label className="block text-sm text-slate">
      {label}
      <input
        type="file" accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="mt-1 block w-full text-sm text-ink file:mr-3 file:rounded-lg file:border-0
                   file:bg-brand file:px-3 file:py-1.5 file:text-white hover:file:bg-brand/90"
      />
      {file && <span className="mt-1 block text-xs text-slate">{file.name}</span>}
    </label>
  );
}

/* ---------------- Activity ---------------- */
function ActivityTab({ token }: { token: string }) {
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getActivity(token)
      .then(setStats)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Could not load activity."));
  }, [token]);

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!stats) return <p className="text-sm text-slate">Loading...</p>;

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <StatCard title="Users" total={stats.users_total} breakdown={stats.users_by_role} labels={ROLE_LABELS} />
      <StatCard title="Applications" total={stats.applications_total} breakdown={stats.applications_by_status} />
      <StatCard title="Applications by risk band" total={stats.applications_total}
                breakdown={stats.applications_by_band} hideTotal />
    </div>
  );
}

function StatCard({ title, total, breakdown, labels, hideTotal }:
  { title: string; total: number; breakdown: Record<string, number>;
    labels?: Record<string, string>; hideTotal?: boolean }) {
  const entries = Object.entries(breakdown);
  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {!hideTotal && <div className="mt-1 text-3xl font-bold text-ink">{total}</div>}
      <ul className="mt-3 space-y-1 text-sm">
        {entries.length === 0 && <li className="text-slate">None yet.</li>}
        {entries.map(([k, v]) => (
          <li key={k} className="flex justify-between">
            <span className="text-slate capitalize">{labels?.[k] ?? k}</span>
            <span className="font-mono text-ink">{v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
