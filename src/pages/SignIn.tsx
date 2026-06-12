import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout";
import { TextField } from "../components/ui/TextField";
import { Button } from "../components/ui/Button";
import { Checkbox } from "../components/ui/Checkbox";
import { Alert } from "../components/ui/Alert";
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon } from "../components/icons";
import { login } from "../api/auth";
import { ApiError } from "../api/http";
import { saveSession } from "../lib/session";

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await login({ email, password });
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
      panelHeading="An Overview of who backs every loan."
      panelSub="Sign in to check how risky a loan looks. You get a simple score and clear reasons, using the SACCO's own records."
      points={[
        "A risk score with the reasons behind it",
        "View loans that are falling behind",
        "Help to decide, never an automatic yes or no",
      ]}
    >
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-ink">Sign in</h1>
        <p className="mt-1 text-sm text-slate">
          Welcome back. Sign in with your work account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}

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

        <TextField
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Enter your password"
          icon={<LockIcon />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate text-[18px] hover:bg-slate-100"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          }
        />

        <div className="flex items-center justify-between">
          <Checkbox label="Remember me" defaultChecked />
          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-brand hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="primary" block disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-slate">
        New to GuarantorLens?{" "}
        <Link to="/signup" className="font-semibold text-brand hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
