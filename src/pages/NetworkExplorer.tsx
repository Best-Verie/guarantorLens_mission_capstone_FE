import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppShell } from "../components/app/AppShell";
import { TextField } from "../components/ui/TextField";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { UserIcon } from "../components/icons";
import { getNetwork } from "../api/network";
import type { NetworkView } from "../api/network";
import type { NetNode } from "../api/member";
import { ApiError } from "../api/http";
import { getToken } from "../lib/session";

const COLOR: Record<string, string> = {
  self: "#173C8E",
  backer: "#64748b",
  backed: "#F58220",
};

function Graph({ data }: { data: NetworkView }) {
  const navigate = useNavigate();
  const W = 720;
  const H = 540;
  const cx = W / 2;
  const cy = H / 2;
  const R = Math.min(cx, cy) - 60;

  const others = data.nodes.filter((n) => n.id !== data.center);
  const pos: Record<string, { x: number; y: number }> = {
    [data.center]: { x: cx, y: cy },
  };
  others.forEach((n, i) => {
    const a = (2 * Math.PI * i) / Math.max(others.length, 1) - Math.PI / 2;
    pos[n.id] = { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });

  const radius = (n: NetNode) => 9 + Math.min(11, n.loans_backed);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {data.edges.map((e, i) => {
        const a = pos[e.source];
        const b = pos[e.target];
        if (!a || !b) return null;
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#cbd5e1" strokeWidth="1.3" />;
      })}
      {data.nodes.map((n) => {
        const p = pos[n.id];
        if (!p) return null;
        const r = radius(n);
        return (
          <g
            key={n.id}
            className={n.id === data.center ? "" : "cursor-pointer"}
            onClick={() =>
              n.id !== data.center && navigate(`/network?member=${encodeURIComponent(n.id)}`)
            }
          >
            {n.ever_defaulted && (
              <circle cx={p.x} cy={p.y} r={r + 3} fill="none" stroke="#DC2626" strokeWidth="2" />
            )}
            <circle cx={p.x} cy={p.y} r={r} fill={COLOR[n.role] ?? "#94a3b8"} />
            <text x={p.x} y={p.y - r - 5} textAnchor="middle" fontSize="10" fill="#475569">
              {n.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function NetworkExplorer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const center = searchParams.get("member") ?? "Gasabo-314";

  const [input, setInput] = useState(center);
  const [data, setData] = useState<NetworkView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    setInput(center);
    setLoading(true);
    setError(null);
    setData(null);
    getNetwork(center, token)
      .then(setData)
      .catch((err) =>
        setError(
          err instanceof ApiError
            ? err.status === 404
              ? `No member found with ID "${center}".`
              : err.message
            : "Something went wrong."
        )
      )
      .finally(() => setLoading(false));
  }, [center, navigate]);

  function go(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = input.trim();
    if (v) navigate(`/network?member=${encodeURIComponent(v)}`);
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-ink">Network explorer</h1>
      <p className="mt-1 text-sm text-slate">
        The guarantee network around a member. Click any node to recenter on it.
      </p>

      <form onSubmit={go} className="mt-5 flex items-end gap-2">
        <div className="w-72">
          <TextField
            label="Center on member"
            placeholder="e.g. Gasabo-314"
            icon={<UserIcon />}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <Button type="submit" variant="primary">
          Show
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: COLOR.self }} />
          Center
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: COLOR.backer }} />
          Backs the center
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: COLOR.backed }} />
          Backed by the center
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full border-2 border-red-600" />
          Has defaulted
        </span>
        <span>Larger node = backs more loans</span>
      </div>

      <div className="mt-4 rounded-xl border border-line bg-white p-4">
        {loading && <p className="text-sm text-slate">Loading...</p>}
        {error && <Alert tone="error">{error}</Alert>}
        {data && data.nodes.length <= 1 && (
          <p className="text-sm text-slate">
            This member has no guarantee connections in the data.
          </p>
        )}
        {data && data.nodes.length > 1 && <Graph data={data} />}
      </div>
    </AppShell>
  );
}
