import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout";
import { TextField } from "../components/ui/TextField";
import { Button } from "../components/ui/Button";
import { MailIcon, CheckIcon } from "../components/icons";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    // TODO: request a reset link from the backend.
    // e.g. await api("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) })
    setSubmitting(false);
    setSent(true);
  }

  return (
    <AuthLayout
      panelHeading="Trouble signing in?"
      panelSub="Reset your password and you are back to assessing loans in a moment. For your security the link expires after a short while."
      points={[
        "We send a one-time link to your work email",
        "Your account stays locked until you set a new password",
        "Nothing about member data changes",
      ]}
    >
      {sent ? (
        <div>
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-accent-50 text-accent text-2xl">
            <CheckIcon />
          </div>
          <h1 className="text-2xl font-bold text-ink">Check your inbox</h1>
          <p className="mt-2 text-sm text-slate">
            If <span className="font-semibold text-ink">{email}</span> matches an
            account, we have sent a link to reset your password. It can take a
            minute to arrive.
          </p>

          <div className="mt-7 flex flex-col gap-3">
            <Button variant="secondary" block onClick={() => setSent(false)}>
              Use a different email
            </Button>
            <Link
              to="/login"
              className="text-center text-sm font-semibold text-brand hover:underline"
            >
              Back to sign in
            </Link>
          </div>

          <p className="mt-7 text-xs text-slate">
            Did not get it? Check your spam folder, or{" "}
            <button
              type="button"
              onClick={() => setSent(false)}
              className="font-semibold text-brand hover:underline"
            >
              try again
            </button>
            .
          </p>
        </div>
      ) : (
        <>
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-ink">Reset your password</h1>
            <p className="mt-1 text-sm text-slate">
              Enter the work email on your account and we will send a reset link.
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

            <Button type="submit" variant="primary" block disabled={submitting}>
              {submitting ? "Sending link..." : "Send reset link"}
            </Button>
          </form>

          <p className="mt-7 text-center text-sm text-slate">
            Remembered it?{" "}
            <Link to="/login" className="font-semibold text-brand hover:underline">
              Back to sign in
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
