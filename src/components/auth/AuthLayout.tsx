import type { ReactNode } from "react";
import { Logo } from "../brand/Logo";
import { CheckIcon } from "../icons";

type AuthLayoutProps = {
  /** Headline on the blue brand panel. */
  panelHeading: string;
  /** Supporting sentence under the headline. */
  panelSub: string;
  /** Short selling points, each with a check bullet. */
  points?: string[];
  /** The form card. */
  children: ReactNode;
};

/**
 * Split-screen auth shell: brand story on the left (hidden on small screens),
 * the form on the right. Shared by SignIn and SignUp so they stay consistent.
 */
export function AuthLayout({
  panelHeading,
  panelSub,
  points = [],
  children,
}: AuthLayoutProps) {
  return (
    <div className="grid min-h-full lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-900 via-brand to-brand-600 p-10 lg:flex lg:flex-col">
        {/* faint network decoration */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.13]"
          viewBox="0 0 400 500"
          fill="none"
          stroke="white"
          strokeWidth={1.2}
          aria-hidden="true"
        >
          <path d="M60 80 L180 140 L300 90 M180 140 L150 280 L320 230 M150 280 L80 380 L250 410 M300 90 L340 200 L320 230" />
          {[
            [60, 80],
            [180, 140],
            [300, 90],
            [150, 280],
            [320, 230],
            [80, 380],
            [250, 410],
            [340, 200],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 8 : 5} fill="white" />
          ))}
        </svg>

        <Logo theme="dark" />

        <div className="relative mt-auto max-w-md">
          <h2 className="text-3xl font-bold leading-tight text-white">
            {panelHeading}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-white/75">
            {panelSub}
          </p>

          {points.length > 0 && (
            <ul className="mt-7 space-y-3">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm text-white/90">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-white text-[13px]">
                    <CheckIcon />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="relative mt-10 text-xs text-white/50">
          A prototype for a student project. The numbers and screens are just examples.
        </p>
      </aside>

      {/* Form area */}
      <main className="flex flex-col justify-center bg-slate-50 px-6 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          {/* logo for small screens, where the panel is hidden */}
          <div className="mb-8 lg:hidden">
            <Logo theme="light" />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
