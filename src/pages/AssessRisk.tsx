import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/app/AppShell";
import { TextField } from "../components/ui/TextField";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { UserIcon } from "../components/icons";
import { assessRisk } from "../api/risk";
import type { AssessInput } from "../api/risk";
import { ApiError } from "../api/http";
import { getToken } from "../lib/session";

export default function AssessRisk() {
  const navigate = useNavigate();

  // Pre-filled with the Gasabo-Loan0001 example so the demo is one click.
  const [borrowerId, setBorrowerId] = useState("Gasabo-335");
  const [amount, setAmount] = useState("1323000");
  const [savings, setSavings] = useState("32036");
  const [salary, setSalary] = useState("91617");
  const [guarantors, setGuarantors] = useState<string[]>(["Gasabo-189", "Gasabo-664", "Gasabo-366"]);
  const [guarantorInput, setGuarantorInput] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addGuarantor() {
    const id = guarantorInput.trim();
    if (!id) return;
    if (guarantors.length >= 8) {
      setError("A loan can have at most 8 guarantors.");
      return;
    }
    if (!guarantors.includes(id)) setGuarantors([...guarantors, id]);
    setGuarantorInput("");
  }

  function removeGuarantor(id: string) {
    setGuarantors(guarantors.filter((g) => g !== id));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const token = getToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    const input: AssessInput = {
      borrower_id: borrowerId.trim() || undefined,
      amount: Number(amount),
      savings: Number(savings) || 0,
      salary: salary.trim() ? Number(salary) : null,
      guarantor_ids: guarantors,
    };
    if (!input.amount || input.amount <= 0) {
      setError("Enter a loan amount.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await assessRisk(input, token);
      navigate("/assess/result", { state: { result, input } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-ink">Assess a loan</h1>
        <p className="mt-1 text-sm text-slate">
          Enter the loan and the members who guarantee it. The score uses both the
          borrower's details and their guarantor network.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          {error && <Alert tone="error">{error}</Alert>}

          <section className="rounded-xl border border-line bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-ink">Borrower and loan</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Borrower member ID"
                placeholder="e.g. Gasabo-335"
                icon={<UserIcon />}
                value={borrowerId}
                onChange={(e) => setBorrowerId(e.target.value)}
              />
              <TextField
                label="Disbursement amount (RWF)"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <TextField
                label="Savings balance (RWF)"
                type="number"
                value={savings}
                onChange={(e) => setSavings(e.target.value)}
                hint="Used for the loan-to-savings check."
              />
              <TextField
                label="Monthly salary (RWF)"
                type="number"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                hint="Leave blank if not on file."
              />
            </div>
          </section>

          <section className="rounded-xl border border-line bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">Guarantors</h2>
              <span className="rounded-full bg-accent-50 px-2.5 py-0.5 text-xs font-semibold text-accent-600">
                {guarantors.length} of 8
              </span>
            </div>
            <p className="mb-3 text-sm text-slate">
              The members who back this loan. Use IDs that exist in the network,
              e.g. Gasabo-189.
            </p>

            <div className="flex gap-2">
              <input
                className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-brand focus:outline-2 focus:outline-brand/30"
                placeholder="Add guarantor by member ID"
                value={guarantorInput}
                onChange={(e) => setGuarantorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addGuarantor();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={addGuarantor}>
                Add
              </Button>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              {guarantors.map((g) => (
                <div
                  key={g}
                  className="flex items-center justify-between rounded-lg border border-line px-3 py-2"
                >
                  <span className="font-mono text-sm text-ink">{g}</span>
                  <button
                    type="button"
                    onClick={() => removeGuarantor(g)}
                    className="text-sm font-medium text-slate hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {guarantors.length === 0 && (
                <p className="text-sm text-slate">No guarantors added yet.</p>
              )}
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => navigate("/dashboard")}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" disabled={submitting}>
              {submitting ? "Scoring..." : "Run assessment"}
            </Button>
          </div>
        </form>

        <p className="mt-5 text-xs text-slate">
          The result is guidance for the officer, not an automatic approval.
        </p>
      </div>
    </AppShell>
  );
}
