import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout";
import { TextField } from "../components/ui/TextField";
import { Button } from "../components/ui/Button";
import { Checkbox } from "../components/ui/Checkbox";
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon } from "../components/icons";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    // TODO: authenticate against the backend, then redirect to the dashboard.
    // e.g. await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) })
    setSubmitting(false);
  }

  return (
    <AuthLayout
      panelHeading="See the guarantor network behind every loan."
      panelSub="Sign in to assess a loan with a network-aware risk score and the plain-language reasons behind it, drawn from the SACCO's own records."
      points={[
        "Risk score with the guarantor flags that drove it",
        "Watchlist of active loans slipping into arrears",
        "Decision support for officers, never an automatic approval",
      ]}
    >
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-ink">Sign in</h1>
        <p className="mt-1 text-sm text-slate">
          Welcome back. Enter your work account to continue.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
