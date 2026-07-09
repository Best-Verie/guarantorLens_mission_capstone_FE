export const BAND_COLOR: Record<string, string> = {
  High: "#DC2626",
  Medium: "#F58220",
  Low: "#0E7C66",
};

// The ring shows the RISK LEVEL (band), so a High case looks high even when the model's
// own probability is low (e.g. a well-covered borrower whose guarantors trip a flag).
const BAND_FILL: Record<string, number> = { Low: 30, Medium: 65, High: 92 };

/** Risk gauge: ring + label show the band; the model's raw score is shown small underneath. */
export function ScoreGauge({ score, band }: { score: number; band: string }) {
  const color = BAND_COLOR[band] ?? "#173C8E";
  const fill = BAND_FILL[band] ?? score;
  const r = 70;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - fill / 100);
  return (
    <svg viewBox="0 0 180 180" className="h-44 w-44">
      <circle cx="90" cy="90" r={r} fill="none" stroke="#e2e8f0" strokeWidth="14" />
      <circle
        cx="90" cy="90" r={r} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 90 90)"
      />
      <text x="90" y="86" textAnchor="middle" fill={color} fontSize="30" fontWeight="700">
        {band}
      </text>
      <text x="90" y="108" textAnchor="middle" fill="#64748b" fontSize="13" fontWeight="500">
        model {score}/100
      </text>
    </svg>
  );
}
