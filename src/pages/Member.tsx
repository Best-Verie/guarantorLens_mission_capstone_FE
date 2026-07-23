import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../components/app/AppShell";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { cn } from "../lib/cn";
import { getMember } from "../api/member";
import type { MemberDetail, NetEdge, NetNode } from "../api/member";
import { getContagion } from "../api/insights";
import type { Contagion } from "../api/insights";
import { ApiError } from "../api/http";
import { getToken } from "../lib/session";

const bandChip: Record<string, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-emerald-100 text-emerald-700",
};

function Stat({ label, value, hint, muted }: { label: string; value: string; hint?: string; muted?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <div className="text-xs font-medium text-slate">{label}</div>
      <div className={cn("mt-1 font-bold", muted ? "text-lg font-medium text-slate-400" : "text-2xl text-ink")}>
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-slate">{hint}</div>}
    </div>
  );
}

function outcomeClass(outcome: string): string {
  if (outcome === "Repaid") return "bg-green-50 text-green-700";
  if (outcome === "Active") return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-600"; // Written off / At risk
}

function MemberChip({ id, uid }: { id: string; uid?: string }) {
  // Display the account number, but link with the opaque uid so URLs never carry it.
  return (
    <Link
      to={`/member/${encodeURIComponent(uid ?? id)}`}
      className="rounded-lg border border-line bg-white px-2.5 py-1 font-mono text-xs text-brand hover:bg-brand-50"
    >
      {id}
    </Link>
  );
}

function NetworkGraph({
  nodes,
  edges,
  center,
  uids,
}: {
  nodes: NetNode[];
  edges: NetEdge[];
  center: string;
  uids: Record<string, string>;
}) {
  const navigate = useNavigate();
  const backers = nodes.filter((n) => n.role === "backer").slice(0, 12);
  const backed = nodes.filter((n) => n.role === "backed").slice(0, 12);
  const W = 640;
  const H = Math.max(240, 60 + Math.max(backers.length, backed.length, 1) * 34);
  const cx = W / 2;
  const cy = H / 2;
  const lx = 95;
  const rx = W - 95;
  const yFor = (i: number, n: number) => (H / (n + 1)) * (i + 1);

  const pos: Record<string, { x: number; y: number }> = { [center]: { x: cx, y: cy } };
  backers.forEach((b, i) => (pos[b.id] = { x: lx, y: yFor(i, backers.length) }));
  backed.forEach((b, i) => (pos[b.id] = { x: rx, y: yFor(i, backed.length) }));

  const color = (role: string) =>
    role === "self" ? "#173C8E" : role === "backer" ? "#64748b" : "#F58220";
  const radius = (n: NetNode) => 9 + Math.min(10, n.loans_backed);
  const shown = nodes.filter((n) => pos[n.id]);

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-4 text-xs text-slate">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: "#64748b" }} />
          Backs this member
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: "#173C8E" }} />
          This member
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: "#F58220" }} />
          Backed by this member
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full border-2 border-red-600" />
          Written off
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {edges.map((e, i) => {
          const a = pos[e.source];
          const b = pos[e.target];
          if (!a || !b) return null;
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#cbd5e1" strokeWidth="1.5" />;
        })}
        {shown.map((n) => {
          const p = pos[n.id];
          const r = radius(n);
          return (
            <g
              key={n.id}
              className={n.id === center ? "" : "cursor-pointer"}
              onClick={() => n.id !== center && navigate(`/member/${encodeURIComponent(uids[n.id] ?? n.id)}`)}
            >
              {n.ever_defaulted && (
                <circle cx={p.x} cy={p.y} r={r + 3} fill="none" stroke="#DC2626" strokeWidth="2" />
              )}
              <circle cx={p.x} cy={p.y} r={r} fill={color(n.role)} />
              <text x={p.x} y={p.y - r - 5} textAnchor="middle" fontSize="10" fill="#475569">
                {n.id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function Member() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [contagion, setContagion] = useState<Contagion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    setLoading(true);
    setError(null);
    setMember(null);
    getMember(id, token)
      .then((data) => {
        setMember(data);
        // If we arrived by account number (typed lookup or old link), clean the URL to the uid.
        if (data.uid && id !== data.uid) navigate(`/member/${data.uid}`, { replace: true });
        setContagion(null);
        if (data.loans_backed > 0) {
          getContagion(data.uid ?? id, token).then(setContagion).catch(() => {});
        }
      })
      .catch((err) =>
        setError(
          err instanceof ApiError
            ? err.status === 404
              ? "No member found for that id."
              : err.message
            : "Something went wrong."
        )
      )
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const rwf = (n?: number | null) =>
    n == null ? "-" : "RWF " + Math.round(n).toLocaleString("en-US");

  // Per-backer attributes (loans backed, ever-defaulted) come from the ego-network nodes.
  const nodeById: Record<string, NetNode> = {};
  (member?.network.nodes ?? []).forEach((n) => { nodeById[n.id] = n; });
  // Only show the Amount column for guarantees when at least one loan actually has an amount on file.
  const showGuaranteeAmount = (member?.guarantees_given ?? []).some((g) => g.amount != null && g.amount > 0);

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-ink">{member?.member_id ?? "Member"}</h1>
          <p className="mt-1 text-sm text-slate">Member profile, loans, and network</p>
        </div>
        <Button variant="secondary" onClick={() => navigate("/members")}>
          Look up another
        </Button>
      </div>

      {loading && <p className="text-sm text-slate">Loading...</p>}
      {error && <Alert tone="error">{error}</Alert>}

      {member && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand">
              {member.branch} branch
            </span>
            {member.ever_defaulted ? (
              <span className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                Written off before{member.default_date ? ` (${member.default_date})` : ""}
              </span>
            ) : (
              <span className="rounded-lg bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                No past write-off
              </span>
            )}
          </div>

          <section className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-ink">Profile and place in the network</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Savings" value={rwf(member.savings)} muted={member.savings == null} />
              <Stat label="Salary" value={rwf(member.salary)} muted={member.salary == null} />
              <Stat label="Loans backed" value={String(member.loans_backed)} hint="Loans this member guarantees" />
              <Stat
                label="Community write-off rate"
                value={`${Math.round(member.community_default_rate * 100)}%`}
                hint="Write-offs in their guarantee community (portfolio ~2%)"
              />
            </div>
          </section>

          {/* Risk contagion: what is exposed if this member (as guarantor) fails */}
          {contagion && contagion.loans_backed > 0 && (
            <section className="mb-6">
              <h2 className="mb-2 text-sm font-semibold text-ink">If this member fails, what is exposed?</h2>
              <div className="rounded-xl border border-line bg-white p-5">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Stat label="Loans backed" value={String(contagion.loans_backed)} hint="Guarantees they carry" />
                  <Stat label="Total exposure" value={rwf(contagion.exposure)} hint="Sum of those loans" />
                  <Stat label="High risk" value={String(contagion.high_risk)} hint="Of the backed loans" />
                  <Stat label="Medium risk" value={String(contagion.medium_risk)} hint="Of the backed loans" />
                </div>
                <p className="mt-3 text-xs text-slate">
                  This is the ripple behind the network: if {member.member_id} could not cover their guarantees,
                  these {contagion.loans_backed} loans would lose a backer at once.
                </p>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-wide text-slate">
                      <tr>
                        <th className="py-2 pr-4 font-medium">Borrower</th>
                        <th className="py-2 pr-4 font-medium">Amount</th>
                        <th className="py-2 font-medium">Current risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contagion.loans.map((ln) => (
                        <tr key={ln.loan_key} className="border-t border-line">
                          <td className="py-2 pr-4">
                            <MemberChip id={ln.borrower} uid={ln.borrower_uid ?? undefined} />
                          </td>
                          <td className="py-2 pr-4 font-mono text-ink">{rwf(ln.amount)}</td>
                          <td className="py-2">
                            <span className={cn("rounded px-2 py-0.5 text-xs font-medium", bandChip[ln.band] ?? "")}>
                              {ln.band}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* Loans as borrower */}
          <section className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-ink">
              Loans taken ({member.loans.length})
            </h2>
            {member.loans.length === 0 ? (
              <p className="text-sm text-slate">This member has not taken a loan in the data.</p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-line bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs text-slate">
                    <tr>
                      <th className="px-4 py-2 font-medium">Loan</th>
                      <th className="px-4 py-2 font-medium">Amount</th>
                      <th className="px-4 py-2 font-medium">Date</th>
                      <th className="px-4 py-2 font-medium">Outcome</th>
                      <th className="px-4 py-2 font-medium">Guarantors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {member.loans.map((ln) => (
                      <tr key={ln.loan_key}>
                        <td className="px-4 py-2 font-mono text-ink">{ln.loan_key}</td>
                        <td className="px-4 py-2 font-mono text-ink">{rwf(ln.amount)}</td>
                        <td className="px-4 py-2 text-slate">{ln.disb_date ?? "-"}</td>
                        <td className="px-4 py-2">
                          <span className={cn("rounded px-2 py-0.5 text-xs font-medium", outcomeClass(ln.outcome))}>
                            {ln.outcome}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex flex-wrap gap-1.5">
                            {ln.guarantors.map((g) => (
                              <MemberChip key={g} id={g} uid={member.uids[g]} />
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Backed by (who guarantees this member's loans) */}
          <section className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-ink">
              Backed by ({member.backers.length})
            </h2>
            {member.backers.length === 0 ? (
              <p className="text-sm text-slate">No one guarantees this member's loans.</p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-line bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs text-slate">
                    <tr>
                      <th className="px-4 py-2 font-medium">Guarantor</th>
                      <th className="px-4 py-2 font-medium text-right">Loans backed</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {member.backers.map((b) => {
                      const n = nodeById[b];
                      return (
                        <tr key={b}>
                          <td className="px-4 py-2"><MemberChip id={b} uid={member.uids[b]} /></td>
                          <td className="px-4 py-2 text-right text-ink">{n ? n.loans_backed : "—"}</td>
                          <td className="px-4 py-2">
                            <span className={cn("rounded px-2 py-0.5 text-xs font-medium",
                              n?.ever_defaulted ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700")}>
                              {n?.ever_defaulted ? "Written off" : "Clean"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Guarantees given (loans this member backs) - as a table */}
          <section className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-ink">
              Guarantees given ({member.guarantees_given.length})
            </h2>
            {member.guarantees_given.length === 0 ? (
              <p className="text-sm text-slate">This member does not guarantee anyone.</p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-line bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs text-slate">
                    <tr>
                      <th className="px-4 py-2 font-medium">Borrower</th>
                      {showGuaranteeAmount && <th className="px-4 py-2 font-medium">Amount</th>}
                      <th className="px-4 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {member.guarantees_given.map((g) => (
                      <tr key={g.loan_key}>
                        <td className="px-4 py-2"><MemberChip id={g.borrower} uid={member.uids[g.borrower]} /></td>
                        {showGuaranteeAmount && <td className="px-4 py-2 font-mono text-ink">{rwf(g.amount)}</td>}
                        <td className="px-4 py-2">
                          <span className={cn("rounded px-2 py-0.5 text-xs font-medium", outcomeClass(g.outcome))}>
                            {g.outcome}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Network */}
          <section>
            <h2 className="mb-2 text-sm font-semibold text-ink">Guarantor network</h2>
            <div className="rounded-xl border border-line bg-white p-5">
              <NetworkGraph
                nodes={member.network.nodes}
                edges={member.network.edges}
                center={member.member_id}
                uids={member.uids}
              />
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}
