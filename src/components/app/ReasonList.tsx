import { cn } from "../../lib/cn";

export type ReasonItem = {
  key: string;
  label: string;
  direction: "up" | "down";
  kind?: "individual" | "network";
  text: string;
};

/**
 * Plain-language reasons, restructured so a non-expert immediately sees WHY:
 *  - a one-line bottom line naming the decisive factor (in the verdict's direction), then
 *  - the reasons grouped into "raising the risk" vs "reducing the risk", each ranked.
 * A flat mixed list (some up, some down) hides the story; this makes it obvious.
 */
export function ReasonList({ items, band }: { items: ReasonItem[]; band?: string }) {
  if (!items.length) return null;
  const up = items.filter((i) => i.direction === "up");
  const down = items.filter((i) => i.direction === "down");
  const riskFirst = band === "High" || band === "Medium";
  const lead = riskFirst ? up[0] ?? down[0] : down[0] ?? up[0];

  const Row = ({ i }: { i: ReasonItem }) => (
    <li className="flex gap-2.5">
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold",
          i.direction === "up" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"
        )}
      >
        {i.direction === "up" ? "↑" : "↓"}
      </span>
      <span className="text-ink">
        <span className="font-semibold">{i.label}</span>
        {i.kind === "network" && (
          <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-accent-600">Network</span>
        )}
        {" — "}
        {i.text}
      </span>
    </li>
  );

  const Group = ({ title, color, list }: { title: string; color: string; list: ReasonItem[] }) =>
    list.length === 0 ? null : (
      <div className="mb-4 last:mb-0">
        <h4 className={cn("text-xs font-semibold uppercase tracking-wide", color)}>{title}</h4>
        <ul className="mt-2 space-y-2.5 text-sm">
          {list.map((i) => (
            <Row key={i.key} i={i} />
          ))}
        </ul>
      </div>
    );

  return (
    <div>
      {lead && (
        <p className="mb-4 rounded-lg border border-line bg-slate-50 px-4 py-3 text-sm text-ink">
          <span className="font-semibold">Bottom line{band ? ` (${band} risk)` : ""}: </span>
          {lead.text}
        </p>
      )}
      <Group title="What's raising the risk" color="text-red-600" list={up} />
      <Group title="What's reducing the risk" color="text-green-700" list={down} />
    </div>
  );
}
