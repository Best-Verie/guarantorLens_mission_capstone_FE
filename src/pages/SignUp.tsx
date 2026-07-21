import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout";
import { TextField } from "../components/ui/TextField";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { Checkbox } from "../components/ui/Checkbox";
import { Alert } from "../components/ui/Alert";
import { UserIcon, MailIcon, LockIcon } from "../components/icons";
import { register } from "../api/auth";
import type { Role } from "../api/auth";
import { ApiError } from "../api/http";
import { saveSession } from "../lib/session";

const ROLES: { value: Role; label: string }[] = [
  { value: "credit_staff", label: "Credit staff" },
  { value: "credit_manager", label: "Credit manager" },
  { value: "admin", label: "Admin" },
];

export default function SignUp() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>(ROLES[0].value);
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!consent) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await register({ fullName, email, role, password });
      saveSession(res.access_token, res.user);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      panelHeading="Made for the people who decide on loans."
      panelSub="Loan officers and staff get a simple risk score with clear reasons, built from the SACCO's own loan and guarantor records."
      points={[
        "See the borrower and the people who back them in one place",
        "Clear warnings when a guarantor looks risky",
        "Member data stays private and with the SACCO",
      ]}
    >
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-ink">Create your account</h1>
        <p className="mt-1 text-sm text-slate">
          Set up your access to the tool.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}

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
          onChange={(e) => setRole(e.target.value as Role)}
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
          hint="Use at least 8 characters, with letters and numbers."
          required
        />

        <Checkbox
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          label={
            <>
              I understand that loan and member data is private, and I will only
              use it to help decide on loans.
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
