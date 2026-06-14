export const BAND_COLOR: Record<string, string> = {
  High: "#DC2626",
  Medium: "#F58220",
  Low: "#0E7C66",
};

/** Circular risk-score gauge, colored by band. */
export function ScoreGauge({ score, band }: { score: number; band: string }) {
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
