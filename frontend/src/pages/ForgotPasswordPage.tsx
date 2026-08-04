import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../lib/api";
import { AxiosError } from "axios";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try { await authApi.forgotPassword(email); setSubmitted(true); }
    catch (err) {
      setError(err instanceof AxiosError ? err.response?.data?.detail ?? "Something went wrong" : "Something went wrong");
    } finally { setLoading(false); }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 bg-white dark:bg-[#0D0F13]">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-cobalt-50 dark:bg-cobalt-900/30">
            <svg className="h-7 w-7 text-cobalt-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="font-sans text-xl font-bold text-ink dark:text-[#F1F3F6] mb-2">Check your email</h1>
          <p className="text-sm text-ink/50 dark:text-[#9AA3B0] mb-6">
            If an account with <strong className="text-ink dark:text-[#F1F3F6]">{email}</strong> exists, a reset link has been sent. It expires in 30 minutes.
          </p>
          <Link to="/login" className="btn-primary inline-flex">Back to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 bg-white dark:bg-[#0D0F13]">
      <div className="w-full max-w-sm">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/40 dark:text-[#9AA3B0]/60 hover:text-ink dark:hover:text-[#F1F3F6] transition mb-8">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to sign in
        </Link>

        <h1 className="font-sans text-2xl font-bold text-ink dark:text-[#F1F3F6] mb-1">Forgot password?</h1>
        <p className="text-sm text-ink/50 dark:text-[#9AA3B0] mb-8">Enter your email and we will send a reset link.</p>

        {error && <div className="mb-5 rounded-xl border border-editorred/20 bg-editorred/5 px-4 py-3 text-sm text-editorred">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" type="email" autoComplete="email" required className="input"
              value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      </div>
    </div>
  );
}
