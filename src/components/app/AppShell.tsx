import type { ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "../brand/Logo";
import { Button } from "../ui/Button";
import { cn } from "../../lib/cn";
import { clearSession, getUser } from "../../lib/session";

// Loan officers and credit managers work the loan book.
const STAFF_NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/assess", label: "Assess risk" },
  { to: "/applications", label: "Applications" },
  { to: "/members", label: "Members" },
  { to: "/monitoring", label: "Monitoring" },
  { to: "/insights", label: "Insights" },
];
// Admins are IT: they only manage users and the model, nothing in the loan book.
const ADMIN_NAV = [
  { to: "/admin", label: "Admin console" },
];

const ROLE_LABELS: Record<string, string> = {
  loan_officer: "Loan officer",
  credit_manager: "Credit manager",
  admin: "Admin",
};

/** Shared layout for signed-in pages: fixed left sidebar for navigation, plus a top
 *  bar that carries the signed-in user's name, role, and sign-out. */
export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = getUser();
  const nav = user?.role === "admin" ? ADMIN_NAV : STAFF_NAV;

  function signOut() {
    clearSession();
    navigate("/login", { replace: true });
  }

  // Admins only ever see the admin console; keep them out of the loan-book pages.
  if (user?.role === "admin" && !pathname.startsWith("/admin")) {
    return <Navigate to="/admin" replace />;
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
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar: signed-in identity + sign out */}
        <header className="sticky top-0 z-10 flex h-16 items-center border-b border-line bg-white px-8">
          <div className="ml-auto flex items-center gap-4">
            {user && (
              <div className="text-right leading-tight">
                <div className="text-sm font-semibold text-ink">{user.full_name}</div>
                <div className="text-xs text-slate">{ROLE_LABELS[user.role] ?? user.role}</div>
              </div>
            )}
            {user && (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand">
                {user.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
              </span>
            )}
            <Button variant="secondary" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-8 py-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
