import { cn } from "../../lib/cn";
import { BrandMark } from "./BrandMark";

type LogoProps = {
  /** "dark" for the blue brand panel, "light" for the form area. */
  theme?: "dark" | "light";
  /** Show the "Umwalimu SACCO" subtitle. */
  showSub?: boolean;
};

export function Logo({ theme = "light", showSub = true }: LogoProps) {
  const onDark = theme === "dark";
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm",
          onDark ? "bg-white/15 ring-1 ring-white/25" : "bg-brand"
        )}
      >
        <BrandMark className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <div
          className={cn(
            "text-[17px] font-bold tracking-tight",
            onDark ? "text-white" : "text-ink"
          )}
        >
          Guarantor<span className="text-accent">Lens</span>
        </div>
        {showSub && (
          <div className={cn("text-xs", onDark ? "text-white/60" : "text-slate")}>
            Umwalimu SACCO
          </div>
        )}
      </div>
    </div>
  );
}
