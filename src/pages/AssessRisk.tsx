import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/app/AppShell";
import { TextField } from "../components/ui/TextField";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { UserIcon } from "../components/icons";
import type { AssessInput } from "../api/risk";
import { createApplication } from "../api/applications";
import { getExamples } from "../api/member";
import { ApiError } from "../api/http";
import { getToken } from "../lib/session";

export default function AssessRisk() {
  const navigate = useNavigate();

  // Borrower ID is optional: enter an existing member to pull their history,
  // or leave it blank for a brand-new applicant.
  const [borrowerId, setBorrowerId] = useState("");
  const [amount, setAmount] = useState("");
  const [savings, setSavings] = useState("");
  const [salary, setSalary] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [guarantors, setGuarantors] = useState<string[]>([]);
  const [guarantorInput, setGuarantorInput] = useState("");
  const [exampleId, setExampleId] = useState("");
  // Optional up-to-date guarantor details the officer can enter (id -> raw string fields).
  const [gOv, setGOv] = useState<Record<string, { savings?: string; salary?: string; loans_backed?: string }>>({});

  // Fetch a real member id only to show as an example placeholder. The form itself starts
  // empty, so the officer types the actual loan being assessed.
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    getExamples(token).then((e) => {
      if (e.member_ids[0]) setExampleId(e.member_ids[0]);
    }).catch(() => {});
  }, []);

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

  function buildOverrides(): Record<string, { savings?: number; salary?: number; loans_backed?: number }> | undefined {
    const out: Record<string, { savings?: number; salary?: number; loans_backed?: number }> = {};
    for (const id of guarantors) {
      const o = gOv[id];
      if (!o) continue;
      const entry: { savings?: number; salary?: number; loans_backed?: number } = {};
      if (o.savings?.trim()) entry.savings = Number(o.savings);
      if (o.salary?.trim()) entry.salary = Number(o.salary);
      if (o.loans_backed?.trim()) entry.loans_backed = Number(o.loans_backed);
      if (Object.keys(entry).length) out[id] = entry;
    }
    return Object.keys(out).length ? out : undefined;
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
      // Optional: a known member id pulls history; blank = new applicant (scored from entered details).
      borrower_id: borrowerId.trim() || undefined,
      amount: Number(amount),
      savings: Number(savings) || 0,
      salary: salary.trim() ? Number(salary) : null,
      interest_rate: interestRate.trim() ? Number(interestRate) : null,
      guarantor_ids: guarantors,
      guarantor_overrides: buildOverrides(),
    };
    if (!input.amount || input.amount <= 0) {
      setError("Enter a loan amount.");
      return;
    }
    if (guarantors.length === 0) {
      setError("Add at least one guarantor. Every loan must be guarantor-backed.");
      return;
    }
    setSubmitting(true);
    try {
      const app = await createApplication(input, token);   // assess + save as an application
      navigate(`/applications/${app.id}`);
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
          Score a loan from the borrower's details and their guarantor network. Enter an
          existing member ID to pull their history, or leave it blank for a new applicant.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          {error && <Alert tone="error">{error}</Alert>}

          <section className="rounded-xl border border-line bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-ink">Borrower and loan</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Borrower member ID"
                placeholder={exampleId ? `e.g. ${exampleId}` : "Member ID"}
                icon={<UserIcon />}
                value={borrowerId}
                onChange={(e) => setBorrowerId(e.target.value)}
                hint="Leave blank for a brand-new applicant."
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
              <TextField
                label="Interest rate (%)"
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                hint="The loan's rate, usually 13 or 14. A strong risk signal."
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
              The members who back this loan. Every loan must have at least one guarantor. Use
              member IDs that exist in the network{exampleId ? `, e.g. ${exampleId}` : ""}.
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
              {guarantors.map((g) => {
                const o = gOv[g] ?? {};
                const set = (k: "savings" | "salary" | "loans_backed", v: string) =>
                  setGOv((prev) => ({ ...prev, [g]: { ...prev[g], [k]: v } }));
                return (
                  <div key={g} className="rounded-lg border border-line px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-ink">{g}</span>
                      <button
                        type="button"
                        onClick={() => removeGuarantor(g)}
                        className="text-sm font-medium text-slate hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <input className="rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink" type="number"
                             placeholder="savings" value={o.savings ?? ""} onChange={(e) => set("savings", e.target.value)} />
                      <input className="rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink" type="number"
                             placeholder="salary" value={o.salary ?? ""} onChange={(e) => set("salary", e.target.value)} />
                      <input className="rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink" type="number"
                             placeholder="loans backed" value={o.loans_backed ?? ""} onChange={(e) => set("loans_backed", e.target.value)} />
                    </div>
                  </div>
                );
              })}
              {guarantors.length === 0 && (
                <p className="text-sm text-slate">No guarantors added yet.</p>
              )}
              {guarantors.length > 0 && (
                <p className="text-xs text-slate">
                  Optional: enter a guarantor's up-to-date savings, salary, or how many loans they back.
                  Leave blank to use the values on file.
                </p>
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
