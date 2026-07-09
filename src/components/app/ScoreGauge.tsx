export const BAND_COLOR: Record<string, string> = {
  High: "#DC2626",
  Medium: "#F58220",
  Low: "#0E7C66",
};

// The score is aligned to the band (Low 0-39, Medium 40-69, High 70-100), so the ring can fill
// by the score itself. For the rare flag-raised case (band bumped above the model's own score)
// we floor the fill to the band, so a "High" ring never looks half-empty.
const BAND_FLOOR: Record<string, number> = { Low: 0, Medium: 40, High: 70 };

/** Risk gauge: ring fills to the score; the big label is the band, the number sits underneath. */
export function ScoreGauge({ score, band }: { score: number; band: string }) {
  const color = BAND_COLOR[band] ?? "#173C8E";
  const fill = Math.max(score, BAND_FLOOR[band] ?? 0);
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
        {score}/100
      </text>
    </svg>
  );
}
