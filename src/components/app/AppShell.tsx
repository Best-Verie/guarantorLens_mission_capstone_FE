import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "../brand/Logo";
import { Button } from "../ui/Button";
import { cn } from "../../lib/cn";
import { clearSession, getUser } from "../../lib/session";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/assess", label: "Assess risk" },
  { to: "/applications", label: "Applications" },
  { to: "/members", label: "Members" },
  { to: "/monitoring", label: "Monitoring" },
  { to: "/insights", label: "Insights" },
];

const ROLE_LABELS: Record<string, string> = {
  loan_officer: "Loan officer",
  credit_manager: "Credit manager",
  admin: "Admin",
};

/** Shared layout for signed-in pages: fixed left sidebar + scrolling content. */
export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = getUser();
  // Admins get an extra nav entry for the admin console.
  const nav = user?.role === "admin" ? [...NAV, { to: "/admin", label: "Admin" }] : NAV;

  function signOut() {
    clearSession();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-line bg-white">
        <div className="px-5 py-5">
          <Logo theme="light" showSub={false} />
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {nav.map((n) => {
            const active = pathname === n.to || pathname.startsWith(n.to + "/");
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium",
                  active ? "bg-brand-50 text-brand" : "text-slate hover:bg-slate-100 hover:text-ink"
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line px-4 py-4">
          {user && (
            <div className="mb-3">
              <div className="truncate text-sm font-semibold text-ink">{user.full_name}</div>
              <div className="text-xs text-slate">{ROLE_LABELS[user.role] ?? user.role}</div>
            </div>
          )}
          <Button variant="secondary" onClick={signOut} className="w-full">
            Sign out
          </Button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-8 py-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
