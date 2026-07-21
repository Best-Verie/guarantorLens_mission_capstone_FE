import type { Survival, SurvivalPoint } from "../../api/insights";

/**
 * Compact Kaplan-Meier survival curve (pure SVG, no chart library). Shows the share of loans still
 * performing as months on book pass, overall and by loan-size tier. Larger loans dip soonest.
 */
export function SurvivalChart({ data }: { data: Survival }) {
  const series = [
    { key: "all loans", pts: data.overall, color: "#111827" },
    { key: "small", pts: data.by_tier.small, color: "#2ecc71" },
    { key: "medium", pts: data.by_tier.medium, color: "#f39c12" },
    { key: "large", pts: data.by_tier.large, color: "#c0392b" },
  ].filter((s) => s.pts.length);

  const all = series.flatMap((s) => s.pts);
  if (!all.length) return null;
  const months = all.map((p) => p.month);
  const xMin = Math.min(...months), xMax = Math.max(...months);
  const yMin = Math.min(0.9, ...all.map((p) => p.survival));   // floor for visibility
  const W = 640, H = 280, mL = 52, mR = 112, mT = 12, mB = 36;
  const x = (m: number) => mL + ((m - xMin) / (xMax - xMin || 1)) * (W - mL - mR);
  const y = (s: number) => mT + (1 - (s - yMin) / (1 - yMin || 1)) * (H - mT - mB);

  const step = (pts: SurvivalPoint[]) => {
    if (!pts.length) return "";
    let d = `M ${x(pts[0].month).toFixed(1)} ${y(pts[0].survival).toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${x(pts[i].month).toFixed(1)} ${y(pts[i - 1].survival).toFixed(1)}`;
      d += ` L ${x(pts[i].month).toFixed(1)} ${y(pts[i].survival).toFixed(1)}`;
    }
    return d;
  };

  const yTicks = [yMin, (yMin + 1) / 2, 1];
  const xTicks = [xMin, Math.round((xMin + xMax) / 2), xMax];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Loan survival curve">
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={mL} y1={y(t)} x2={W - mR} y2={y(t)} stroke="#eee" strokeWidth={1} />
          <text x={mL - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#94a3b8">{(t * 100).toFixed(0)}%</text>
        </g>
      ))}
      {xTicks.map((t, i) => (
        <text key={i} x={x(t)} y={H - mB + 20} textAnchor="middle" fontSize={11} fill="#94a3b8">{t}</text>
      ))}
      <text x={(mL + W - mR) / 2} y={H - 4} textAnchor="middle" fontSize={11} fill="#64748b">months on book</text>
      {series.map((s) => (
        <path key={s.key} d={step(s.pts)} fill="none" stroke={s.color} strokeWidth={s.key === "all loans" ? 2.4 : 1.6} />
      ))}
      {series.map((s, i) => (
        <g key={s.key} transform={`translate(${W - mR + 12}, ${mT + 8 + i * 20})`}>
          <line x1={0} y1={0} x2={16} y2={0} stroke={s.color} strokeWidth={s.key === "all loans" ? 2.4 : 1.6} />
          <text x={22} y={4} fontSize={11} fill="#334155">{s.key}</text>
        </g>
      ))}
    </svg>
  );
}
