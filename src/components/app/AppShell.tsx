import { useState } from "react";
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
  credit_staff: "Credit staff",
  loan_officer: "Credit staff",   // legacy alias, same tier
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

  // On phones the sidebar is an off-canvas drawer toggled from the top bar.
  const [menuOpen, setMenuOpen] = useState(false);

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
      {/* Backdrop behind the open drawer on mobile */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-screen w-60 shrink-0 flex-col border-r border-line bg-white",
          "transition-transform duration-200 lg:sticky lg:top-0 lg:translate-x-0",
          menuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-5 py-5">
          <Logo theme="light" showSub={false} />
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 pt-2">
          <div className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Menu
          </div>
          {nav.map((n) => {
            const active = pathname === n.to || pathname.startsWith(n.to + "/");
            return (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium",
                  active ? "bg-brand-50 text-brand" : "text-slate hover:bg-slate-100 hover:text-ink"
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        {/* Sign out pinned to the bottom of the sidebar */}
        <div className="border-t border-line px-3 py-4">
          <Button variant="secondary" onClick={signOut} className="w-full">
            Sign out
          </Button>
          <Link
            to="/legal"
            onClick={() => setMenuOpen(false)}
            className="mt-3 block text-center text-xs text-slate hover:text-ink hover:underline"
          >
            Terms &amp; Privacy
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar: menu toggle (mobile) + signed-in identity */}
        <header className="sticky top-0 z-10 flex h-16 items-center border-b border-line bg-white px-4 sm:px-8">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="mr-3 rounded-lg p-2 text-slate hover:bg-slate-100 lg:hidden"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
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
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
