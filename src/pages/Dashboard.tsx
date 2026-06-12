import { Navigate, useNavigate } from "react-router-dom";
import { Logo } from "../components/brand/Logo";
import { Button } from "../components/ui/Button";
import { clearSession, getToken, getUser } from "../lib/session";

const ROLE_LABELS: Record<string, string> = {
  loan_officer: "Loan officer",
  credit_staff: "Credit staff",
  branch_manager: "Branch manager",
};

/**
 * Placeholder landing for a signed-in user. It confirms the auth flow works
 * end to end; the real portfolio dashboard replaces this later.
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const token = getToken();
  const user = getUser();

  // Not signed in -> back to login.
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  function signOut() {
    clearSession();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-full bg-slate-50">
      <header className="flex items-center justify-between border-b border-line bg-white px-6 py-4">
        <Logo theme="light" />
        <Button variant="secondary" onClick={signOut}>
          Sign out
        </Button>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-sm font-semibold text-accent">You are signed in</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">
          Welcome, {user.full_name.split(" ")[0]}.
        </h1>
        <p className="mt-2 text-slate">
          {ROLE_LABELS[user.role] ?? user.role} &middot; {user.email}
        </p>

        <div className="mt-8 rounded-xl border border-line bg-white p-6">
          <p className="text-sm text-slate">
            Authentication is working. The portfolio dashboard, risk assessment,
            watchlist, and network views come next and will live behind this
            sign-in.
          </p>
        </div>
      </main>
    </div>
  );
}
