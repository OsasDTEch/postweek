import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../lib/api";
import { AxiosError } from "axios";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 bg-white dark:bg-[#0D0F13]">
        <div className="text-center">
          <p className="text-editorred mb-4 text-sm">Invalid reset link.</p>
          <Link to="/forgot-password" className="btn-primary inline-flex">Request a new one</Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err instanceof AxiosError ? err.response?.data?.detail ?? "Reset failed" : "Something went wrong");
    } finally { setLoading(false); }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 bg-white dark:bg-[#0D0F13]">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20">
            <svg className="h-7 w-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="font-sans text-xl font-bold text-ink dark:text-[#F1F3F6] mb-2">Password updated</h1>
          <p className="text-sm text-ink/50 dark:text-[#9AA3B0]">Redirecting you to sign in…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 bg-white dark:bg-[#0D0F13]">
      <div className="w-full max-w-sm">
        <h1 className="font-sans text-2xl font-bold text-ink dark:text-[#F1F3F6] mb-1">Choose a new password</h1>
        <p className="text-sm text-ink/50 dark:text-[#9AA3B0] mb-8">Must be at least 8 characters.</p>

        {error && <div className="mb-5 rounded-xl border border-editorred/20 bg-editorred/5 px-4 py-3 text-sm text-editorred">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="label">New password</label>
            <input id="password" type="password" autoComplete="new-password" required className="input"
              value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" />
          </div>
          <div>
            <label htmlFor="confirm" className="label">Confirm new password</label>
            <input id="confirm" type="password" autoComplete="new-password" required className="input"
              value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
