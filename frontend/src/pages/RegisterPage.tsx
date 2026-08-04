import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../lib/api";
import { AxiosError } from "axios";
import Brand from "../components/Brand";

export default function RegisterPage() {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const message = await register(email, password);
      setSuccessMessage(message);
    } catch (err) {
      if (err instanceof AxiosError) {
        const detail = err.response?.data?.detail;
        setError(Array.isArray(detail) ? detail.map((d: { msg: string }) => d.msg).join(", ") : detail ?? "Registration failed");
      } else { setError("Something went wrong"); }
    } finally { setLoading(false); }
  }

  if (successMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 bg-white dark:bg-[#0D0F13]">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-cobalt-50 dark:bg-cobalt-900/30">
            <svg className="h-7 w-7 text-cobalt-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="font-sans text-xl font-bold text-ink dark:text-[#F1F3F6] mb-2">Check your inbox</h1>
          <p className="text-sm text-ink/50 dark:text-[#9AA3B0] mb-6">{successMessage}</p>
          <p className="text-xs text-ink/30 dark:text-[#9AA3B0]/40">
            Did not get it?{" "}
            <ResendLink email={email} />
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#0D0F13]">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between bg-[#0D0F13] p-14">
        <Brand variant="light" size="lg" />
        <div>
          <h2 className="display text-5xl text-white leading-tight mb-5">
            Your content.<br />
            <span className="text-cobalt-400">Your voice.</span>
          </h2>
          <ul className="space-y-3">
            {[
              "LinkedIn posts written like you",
              "X threads, natively generated",
              "Video ideas from live trend research",
            ].map(t => (
              <li key={t} className="flex items-center gap-3 text-sm text-white/60">
                <svg className="h-4 w-4 text-cobalt-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="font-mono text-mono-xs text-white/20">Free to use. No credit card needed.</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 bg-white dark:bg-[#0D0F13]">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>

          <h1 className="font-sans text-2xl font-bold text-ink dark:text-[#F1F3F6] mb-1">Create your account</h1>
          <p className="font-sans text-sm text-ink/50 dark:text-[#9AA3B0] mb-8">Free, no credit card needed</p>

          {error && (
            <div className="mb-5 rounded-xl border border-editorred/20 bg-editorred/5 px-4 py-3 text-sm text-editorred">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input id="email" type="email" autoComplete="email" required className="input"
                value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <input id="password" type="password" autoComplete="new-password" required className="input"
                value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" />
            </div>
            <div>
              <label htmlFor="confirm" className="label">Confirm password</label>
              <input id="confirm" type="password" autoComplete="new-password" required className="input"
                value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? "Creating account…" : "Get started free"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink/50 dark:text-[#9AA3B0]">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-cobalt-500 dark:text-cobalt-400 hover:text-cobalt-700 transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function ResendLink({ email }: { email: string }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  async function resend() {
    setLoading(true);
    try { await authApi.resendVerification(email); setSent(true); }
    finally { setLoading(false); }
  }
  if (sent) return <span className="font-semibold text-cobalt-500">Sent!</span>;
  return (
    <button onClick={resend} disabled={loading}
      className="font-semibold text-cobalt-500 dark:text-cobalt-400 underline hover:text-cobalt-700 transition">
      {loading ? "Sending…" : "Resend verification email"}
    </button>
  );
}
