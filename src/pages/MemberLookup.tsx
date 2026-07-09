import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/app/AppShell";
import { Button } from "../components/ui/Button";
import { listMembers } from "../api/member";
import type { MemberRow } from "../api/member";
import { getToken } from "../lib/session";

const PAGE_SIZE = 25;
const rwf = (n?: number | null) => (n == null ? "-" : "RWF " + Math.round(n).toLocaleString("en-US"));

export default function MemberLookup() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [branch, setBranch] = useState("");
  const [sort, setSort] = useState("loans_backed");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<MemberRow[]>([]);
  const [total, setTotal] = useState(0);
  const [branches, setBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Reset to first page whenever a filter changes.
  useEffect(() => { setPage(1); }, [q, branch, sort, order]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    const t = setTimeout(() => {
      listMembers({ q, branch, sort, order, page, page_size: PAGE_SIZE }, token)
        .then((r) => { setRows(r.items); setTotal(r.total); setBranches(r.branches); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250); // debounce typing
    return () => clearTimeout(t);
  }, [q, branch, sort, order, page]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  function open(row: MemberRow) {
    navigate(`/member/${encodeURIComponent(row.uid ?? row.member_id)}`);
  }
  function toggleSort(key: string) {
    if (sort === key) setOrder(order === "desc" ? "asc" : "desc");
    else { setSort(key); setOrder(key === "member_id" ? "asc" : "desc"); }
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Members</h1>
        <p className="mt-1 text-sm text-slate">
          Browse or search the member directory. Click a member to see their profile, loans, and guarantor network.
        </p>
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by member ID..."
          className="w-full max-w-xs rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
        />
        <select
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
        >
          <option value="">All branches</option>
          {branches.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <span className="ml-auto text-sm text-slate">
          {loading ? "Loading..." : `${total.toLocaleString("en-US")} members`}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-slate">
              {[
                { key: "member_id", label: "Member ID" },
                { key: "branch", label: "Branch", nosort: true },
                { key: "savings", label: "Savings" },
                { key: "salary", label: "Salary" },
                { key: "loans_backed", label: "Loans backed" },
                { key: "status", label: "Status", nosort: true },
              ].map((c) => (
                <th key={c.key} className="px-4 py-3 font-medium">
                  {c.nosort ? (
                    c.label
                  ) : (
                    <button onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 hover:text-ink">
                      {c.label}
                      {sort === c.key && <span>{order === "desc" ? "↓" : "↑"}</span>}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr
                key={m.member_id}
                onClick={() => open(m)}
                className="cursor-pointer border-b border-line last:border-0 hover:bg-brand-50/50"
              >
                <td className="px-4 py-3 font-mono text-brand">{m.member_id}</td>
                <td className="px-4 py-3 text-slate">{m.branch ?? "-"}</td>
                <td className="px-4 py-3 font-mono text-ink">{rwf(m.savings)}</td>
                <td className="px-4 py-3 font-mono text-ink">{rwf(m.salary)}</td>
                <td className="px-4 py-3 text-ink">{m.loans_backed}</td>
                <td className="px-4 py-3">
                  {m.ever_defaulted ? (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">Defaulted before</span>
                  ) : (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Clean</span>
                  )}
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-slate">No members match your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-sm text-slate">
        <span>{from.toLocaleString("en-US")}–{to.toLocaleString("en-US")} of {total.toLocaleString("en-US")}</span>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            Previous
          </Button>
          <span className="px-1">Page {page} of {pages}</span>
          <Button variant="secondary" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages}>
            Next
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
