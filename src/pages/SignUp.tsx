import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout";
import { TextField } from "../components/ui/TextField";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { Checkbox } from "../components/ui/Checkbox";
import { UserIcon, MailIcon, LockIcon } from "../components/icons";

const ROLES = [
  { value: "loan_officer", label: "Loan officer" },
  { value: "credit_staff", label: "Credit staff" },
  { value: "branch_manager", label: "Branch manager" },
];

export default function SignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(ROLES[0].value);
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!consent) return;
    setSubmitting(true);
    // TODO: create the account against the backend, then redirect to sign in.
    // e.g. await api("/auth/register", { method: "POST", body: JSON.stringify({ fullName, email, role, password }) })
    setSubmitting(false);
  }

  return (
    <AuthLayout
      panelHeading="Built for the people who make the lending call."
      panelSub="Loan officers and credit staff get a network-aware risk score with the reasons behind it, drawn from the SACCO's own loan and guarantor records."
      points={[
        "One view of the borrower and their guarantor network",
        "Flags for defaulted, over-committed, and high-default backers",
        "Member data stays confidential and on the SACCO's terms",
      ]}
    >
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-ink">Create your account</h1>
        <p className="mt-1 text-sm text-slate">
          Set up access for the risk decision-support tool.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField
          label="Full name"
          autoComplete="name"
          placeholder="e.g. Beatrice Uwase"
          icon={<UserIcon />}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <TextField
          label="Work email"
          type="email"
          autoComplete="email"
          placeholder="you@umwalimusacco.rw"
          icon={<MailIcon />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Select
          label="Role"
          options={ROLES}
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />

        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          icon={<LockIcon />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          hint="Use 8 or more characters with a mix of letters and numbers."
          required
        />

        <Checkbox
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          label={
            <>
              I understand member loan and guarantor data is confidential and
              will only be used for risk decision support.
            </>
          }
        />

        <Button type="submit" variant="primary" block disabled={!consent || submitting}>
          {submitting ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-slate">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
