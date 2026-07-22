import { useState } from "react";
import { ScoreGauge } from "./ScoreGauge";
import { ScoreDrivers } from "./ScoreDrivers";
import { ReasonList, type ReasonItem } from "./ReasonList";
import type { ShapContribution } from "../../api/risk";
import { cn } from "../../lib/cn";

export type RiskStoryProps = {
  score: number;
  band: "Low" | "Medium" | "High";
  raisedByFlags: boolean;
  lead?: string;                 // officer summary shown as the headline (falls back to the top factor)
  reasons: ReasonItem[];
  shap: ShapContribution[];
  flags: string[];
  recommendations: string[];
  unusual?: boolean;
  isManager: boolean;
  source?: "model" | "heuristic";
};

/**
 * The result laid out as a plain "risk story": verdict and one-line reason first, then the two or
 * three things that raise vs reduce the risk, the network flags, and one next step. The technical
 * evidence (SHAP driver bars + the full factor list) is tucked behind a toggle so the front-line
 * officer sees the decision, not the machinery. Same data underneath, just ordered by what matters.
 */
export function RiskStoryCard(props: RiskStoryProps) {
  const { score, band, raisedByFlags, lead, reasons, shap, flags, recommendations, unusual, isManager, source } = props;
  const [open, setOpen] = useState(false);

  // The "Risk level raised..." entry is a meta-note, not a factor, so keep it out of the chips.
  const factors = reasons.filter((r) => !r.label.startsWith("Risk level raised"));
  const up = factors.filter((r) => r.direction === "up").slice(0, 3);
  const down = factors.filter((r) => r.direction === "down").slice(0, 3);
  const derived = band !== "Low" ? up[0]?.text : down[0]?.text;
  const notableFlags = flags.filter((f) => !f.startsWith("No notable"));
  const nextStep = recommendations[0];
  const bandTone = band === "High" ? "text-red-600" : band === "Medium" ? "text-amber-600" : "text-emerald-700";

  return (
    <section className="rounded-xl border border-line bg-white p-6">
      {/* Verdict + one-line reason */}
      <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
        <ScoreGauge score={score} band={band} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h2 className={cn("text-xl font-bold", bandTone)}>{band} risk</h2>
            {raisedByFlags && (
              <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
                raised by guarantor flags
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-ink">
            {lead ? (
              lead
            ) : derived ? (
              <>
                <span className="text-slate">Mainly because </span>
                {derived}
              </>
            ) : (
              "No single factor stands out strongly either way."
            )}
          </p>
        </div>
      </div>

      {/* What raises vs reduces the risk */}
      {(up.length > 0 || down.length > 0) && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <ChipCol title="What raises the risk" arrow="↑" tone="up" items={up} />
          <ChipCol title="What reduces the risk" arrow="↓" tone="down" items={down} />
        </div>
      )}

      {/* Guarantor-network flags (the tool's core signal, kept in plain sight) */}
      {notableFlags.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate">Guarantor-network flags</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {notableFlags.map((f) => (
              <span key={f} className="rounded-lg bg-accent-50 px-2.5 py-1 text-xs font-medium text-accent-600">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* One suggested next step */}
      {nextStep && (
        <div className="mt-5 flex items-start gap-2.5 rounded-lg bg-brand-50 px-4 py-3">
          <span className="mt-0.5 text-brand">&rarr;</span>
          <div>
            <p className="text-sm font-semibold text-brand-800">Suggested next step</p>
            <p className="mt-0.5 text-sm text-ink">{nextStep}</p>
          </div>
        </div>
      )}

      {/* Unusual-application check, in plain words. Always shown (when the check ran) so the
          officer can see it happened — a clear "nothing unusual" is as useful as a flag. */}
      {unusual === true && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3">
          <p className="text-sm font-medium text-amber-700">Worth a closer look</p>
          <p className="mt-0.5 text-sm text-ink">
            This application does not look like a typical one for the branch. In the past, loans that
            stood out like this went unpaid more often, so give it a second look before you decide.
            It is a heads-up, not a verdict.
          </p>
        </div>
      )}
      {unusual === false && (
        <div className="mt-4 rounded-lg border border-line bg-slate-50 px-4 py-3">
          <p className="text-sm font-medium text-ink">Nothing unusual</p>
          <p className="mt-0.5 text-sm text-slate">
            This application looks like a typical one for the branch, so there is no extra flag here.
          </p>
        </div>
      )}

      {/* Progressive disclosure: the technical evidence, on demand */}
      {(shap.length > 0 || factors.length > 0) && (
        <>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-brand-100 bg-brand-50 py-2.5 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
          >
            <span className={cn("transition-transform", open && "rotate-180")}>&#9662;</span>
            {open ? "Hide the technical drivers" : "Show the technical drivers"}
          </button>
          {open && (
            <div className="mt-4 space-y-5">
              {isManager && shap.length > 0 && <ScoreDrivers shap={shap} />}
              {factors.length > 0 && <ReasonList band={band} items={factors} />}
            </div>
          )}
        </>
      )}

      {source && (
        <p className="mt-4 text-xs text-slate">
          Score source: {source === "model" ? "the model" : "rule-based fallback"}
        </p>
      )}
    </section>
  );
}

function ChipCol({
  title, arrow, tone, items,
}: { title: string; arrow: string; tone: "up" | "down"; items: ReasonItem[] }) {
  if (items.length === 0) {
    return (
      <div>
        <p className="text-xs font-medium text-slate">{arrow} {title}</p>
        <p className="mt-2 text-xs text-slate">Nothing notable.</p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-xs font-medium text-slate">{arrow} {title}</p>
      <div className="mt-2 flex flex-col gap-1.5">
        {items.map((i) => (
          <span
            key={i.key}
            title={i.text}
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-xs font-medium",
              tone === "up" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
            )}
          >
            {i.label}
            {i.kind === "network" && (
              <span className="ml-1 text-[9px] font-semibold uppercase tracking-wide text-accent-600">Net</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
