import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout";
import { TextField } from "../components/ui/TextField";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { LockIcon, EyeIcon, EyeOffIcon, CheckIcon } from "../components/icons";
import { resetPassword } from "../api/auth";
import { ApiError } from "../api/http";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mismatch = confirm.length > 0 && confirm !== password;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) {
      setError("This reset link is missing its token. Request a new link.");
      return;
    }
    if (password.length < 8 || mismatch) return;
    setError(null);
    setSubmitting(true);
    try {
      await resetPassword({ token, newPassword: password });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const toggle = (
    <button
      type="button"
      onClick={() => setShow((s) => !s)}
      className="flex h-7 w-7 items-center justify-center rounded-md text-slate text-[18px] hover:bg-slate-100"
      aria-label={show ? "Hide password" : "Show password"}
    >
      {show ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  );

  return (
    <AuthLayout
      panelHeading="Set a new password."
      panelSub="Pick a strong password you do not use anywhere else. Once you save it, you can sign in right away."
      points={[
        "Use at least 8 characters",
        "Mix letters and numbers",
        "The link works only once",
      ]}
    >
      {done ? (
        <div>
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-accent-50 text-accent text-2xl">
            <CheckIcon />
          </div>
          <h1 className="text-2xl font-bold text-ink">Password updated</h1>
          <p className="mt-2 text-sm text-slate">
            Your password is changed. You can sign in with your new password now.
          </p>
          <div className="mt-7">
            <Link to="/login">
              <Button variant="primary" block>
                Go to sign in
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-ink">Choose a new password</h1>
            <p className="mt-1 text-sm text-slate">
              Set the password for your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <Alert tone="error">{error}</Alert>}
            {!token && (
              <Alert tone="info">
                Open this page using the link in your reset email. That link is
                what lets you set a new password.
              </Alert>
            )}

            <TextField
              label="New password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              icon={<LockIcon />}
              trailing={toggle}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              hint="Use at least 8 characters, with letters and numbers."
              required
            />

            <TextField
              label="Confirm new password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              icon={<LockIcon />}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            {mismatch && (
              <p className="-mt-2 text-xs font-medium text-red-600">
                The two passwords are not the same.
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              block
              disabled={submitting || password.length < 8 || mismatch}
            >
              {submitting ? "Saving..." : "Save new password"}
            </Button>
          </form>

          <p className="mt-7 text-center text-sm text-slate">
            <Link to="/login" className="font-semibold text-brand hover:underline">
              Back to sign in
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
