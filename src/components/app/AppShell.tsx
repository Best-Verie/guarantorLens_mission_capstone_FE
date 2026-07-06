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

/** Shared header and layout for signed-in pages. */
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
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-3">
          <Logo theme="light" showSub={false} />
          <nav className="flex gap-1">
            {nav.map((n) => {
              const active = pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium",
                    active ? "bg-brand-50 text-brand" : "text-slate hover:bg-slate-100"
                  )}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {user && <span className="hidden text-sm text-slate sm:inline">{user.full_name}</span>}
            <Button variant="secondary" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
