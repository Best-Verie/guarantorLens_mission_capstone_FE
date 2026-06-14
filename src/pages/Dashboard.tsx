import { Link } from "react-router-dom";
import { AppShell } from "../components/app/AppShell";
import { Button } from "../components/ui/Button";
import { getUser } from "../lib/session";

const ROLE_LABELS: Record<string, string> = {
  loan_officer: "Loan officer",
  credit_staff: "Credit staff",
  branch_manager: "Branch manager",
};

/**
 * Signed-in landing. The portfolio dashboard (stats, watchlist, network) replaces
 * this later; for now it confirms sign-in and links to the working assessment.
 */
export default function Dashboard() {
  const user = getUser();

  return (
    <AppShell>
      <p className="text-sm font-semibold text-accent">You are signed in</p>
      <h1 className="mt-2 text-3xl font-bold text-ink">
        Welcome{user ? `, ${user.full_name.split(" ")[0]}` : ""}.
      </h1>
      {user && (
        <p className="mt-2 text-slate">
          {ROLE_LABELS[user.role] ?? user.role} &middot; {user.email}
        </p>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-white p-6">
          <h2 className="text-base font-semibold text-ink">Assess a loan</h2>
          <p className="mt-1 text-sm text-slate">
            Score a loan using the borrower and their guarantor network, with the
            reasons behind the score.
          </p>
          <Link to="/assess" className="mt-4 inline-block">
            <Button variant="accent">Start an assessment</Button>
          </Link>
        </div>

        <div className="rounded-xl border border-line bg-white p-6">
          <h2 className="text-base font-semibold text-ink">Coming next</h2>
          <p className="mt-1 text-sm text-slate">
            The portfolio dashboard, watch list of loans in arrears, and network
            views will appear here behind this sign-in.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
