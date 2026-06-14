import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../components/app/AppShell";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { cn } from "../lib/cn";
import { getMember } from "../api/member";
import type { MemberProfile } from "../api/member";
import { ApiError } from "../api/http";
import { getToken } from "../lib/session";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <div className="text-xs font-medium text-slate">{label}</div>
      <div className="mt-1 text-2xl font-bold text-ink">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-slate">{hint}</div>}
    </div>
  );
}

export default function Member() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState<MemberProfile | null>(null);
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
      .then(setMember)
      .catch((err) =>
        setError(
          err instanceof ApiError
            ? err.status === 404
              ? `No member found with ID "${id}".`
              : err.message
            : "Something went wrong."
        )
      )
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const rwf = (n?: number | null) =>
    n == null ? "not on file" : "RWF " + Math.round(n).toLocaleString("en-US");

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-ink">{id}</h1>
          <p className="mt-1 text-sm text-slate">Member profile and place in the network</p>
        </div>
        <Button variant="secondary" onClick={() => navigate("/members")}>
          Look up another
        </Button>
      </div>

      {loading && <p className="text-sm text-slate">Loading...</p>}
      {error && <Alert tone="error">{error}</Alert>}

      {member && (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand">
              {member.branch} branch
            </span>
            {member.ever_defaulted ? (
              <span className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                Has defaulted before{member.default_date ? ` (${member.default_date})` : ""}
              </span>
            ) : (
              <span className="rounded-lg bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                No past default
              </span>
            )}
          </div>

          <section className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-ink">Profile</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Stat label="Savings" value={rwf(member.savings)} />
              <Stat label="Salary" value={rwf(member.salary)} hint="As of disbursement, if on file" />
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-ink">Place in the network</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat
                label="Loans backed"
                value={String(member.loans_backed)}
                hint="Loans this member guarantees"
              />
              <Stat
                label="Total connections"
                value={String(member.total_connections)}
                hint="Links in the guarantee graph"
              />
              <Stat
                label="Community default rate"
                value={`${Math.round(member.community_default_rate * 100)}%`}
                hint="Past defaults in their group"
              />
            </div>
          </section>

          <p
            className={cn(
              "mt-6 rounded-lg px-4 py-3 text-sm",
              "bg-brand-50 text-brand-800"
            )}
          >
            Loan history, who backs this member, and the network graph appear here
            once the loans data is loaded.
          </p>
        </>
      )}
    </AppShell>
  );
}
