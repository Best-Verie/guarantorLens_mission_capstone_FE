import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "../components/app/AppShell";
import { Alert } from "../components/ui/Alert";
import { getCommunities, getSuperGuarantors } from "../api/insights";
import type { CommunityStat, SuperGuarantor } from "../api/insights";
import { ApiError } from "../api/http";
import { getToken } from "../lib/session";

export default function Insights() {
  const navigate = useNavigate();
  const [sg, setSg] = useState<SuperGuarantor[]>([]);
  const [comm, setComm] = useState<CommunityStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    Promise.all([getSuperGuarantors(token), getCommunities(token)])
      .then(([s, c]) => {
        setSg(s);
        setComm(c);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Something went wrong."))
      .finally(() => setLoading(false));
  }, [navigate]);

  const maxRate = comm.length ? Math.max(...comm.map((c) => c.default_rate)) : 1;

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-ink">Insights</h1>
      <p className="mt-1 text-sm text-slate">
        Portfolio views from the guarantor network: the members who would expose the
        most loans if they fail, and the communities that carry the most default history.
      </p>

      {loading && <p className="mt-6 text-sm text-slate">Loading...</p>}
      {error && <div className="mt-6"><Alert tone="error">{error}</Alert></div>}

      {!loading && !error && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Super-guarantors */}
          <section>
            <h2 className="mb-2 text-sm font-semibold text-ink">Super-guarantors</h2>
            <p className="mb-3 text-xs text-slate">
              Members backing the most loans. Red = has defaulted themselves.
            </p>
            <div className="overflow-hidden rounded-xl border border-line bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate">
                  <tr>
                    <th className="px-4 py-2 font-medium">Member</th>
                    <th className="px-4 py-2 font-medium">Loans backed</th>
                    <th className="px-4 py-2 font-medium">Of those, bad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {sg.map((m) => (
                    <tr key={m.member_id}>
                      <td className="px-4 py-2">
                        <Link
                          to={`/member/${encodeURIComponent(m.member_id)}`}
                          className={`font-mono hover:underline ${m.ever_defaulted ? "text-red-600" : "text-brand"}`}
                        >
                          {m.member_id}
                        </Link>
                        {m.ever_defaulted && (
                          <span className="ml-2 rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-600">
                            defaulted
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 font-mono text-ink">{m.loans_backed}</td>
                      <td className="px-4 py-2 font-mono text-ink">{m.bad_loans_backed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Communities */}
          <section>
            <h2 className="mb-2 text-sm font-semibold text-ink">High-default communities</h2>
            <p className="mb-3 text-xs text-slate">
              Guarantee communities ranked by their past default rate.
            </p>
            <div className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4">
              {comm.map((c) => (
                <div key={c.community_id} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 font-mono text-xs text-ink">{c.community_id}</span>
                  <div className="h-4 flex-1 rounded bg-slate-100">
                    <div
                      className="h-4 rounded bg-accent"
                      style={{ width: `${(c.default_rate / maxRate) * 100}%` }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right text-xs text-slate">
                    {Math.round(c.default_rate * 100)}% · {c.size}
                  </span>
                </div>
              ))}
              <p className="mt-1 text-[11px] text-slate">bar = default rate · right = rate% and community size</p>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
