import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../lib/api";
import { AxiosError } from "axios";
import Brand from "../components/Brand";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [unverified, setUnverified] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setUnverified(false); setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      if (err instanceof AxiosError) {
        const detail = err.response?.data?.detail ?? "Login failed";
        if (err.response?.status === 403 && detail.toLowerCase().includes("verified")) {
          setUnverified(true);
        } else { setError(detail); }
      } else { setError("Something went wrong"); }
    } finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#0D0F13]">
      {/* Left — editorial panel */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between bg-[#0D0F13] p-14">
        <Brand variant="light" size="lg" />
        <div>
          <h2 className="display text-5xl text-white leading-tight mb-5">
            Back to the<br />writing room.
          </h2>
          <p className="font-sans text-base text-white/50 leading-relaxed max-w-sm">
            Your drafts are waiting. PostWeek writes in your voice so you spend time publishing, not writing.
          </p>
        </div>
        <p className="font-mono text-mono-xs text-white/20">by Wisdom</p>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 bg-white dark:bg-[#0D0F13]">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>

          <h1 className="font-sans text-2xl font-bold text-ink dark:text-[#F1F3F6] mb-1">Welcome back</h1>
          <p className="font-sans text-sm text-ink/50 dark:text-[#9AA3B0] mb-8">Sign in to your account</p>

          {error && (
            <div className="mb-5 rounded-xl border border-editorred/20 bg-editorred/5 px-4 py-3 text-sm text-editorred">{error}</div>
          )}

          {unverified && (
            <div className="mb-5 rounded-xl border border-highlighter/40 dark:border-highlighter-dark/30 bg-highlighter/15 dark:bg-highlighter-dark/10 px-4 py-3">
              <p className="text-sm font-semibold text-ink/80 dark:text-[#F1F3F6]/80 mb-1">Email not verified</p>
              <p className="text-xs text-ink/60 dark:text-[#9AA3B0] mb-2">Check your inbox for the verification link.</p>
              <ResendButton email={email} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input id="email" type="email" autoComplete="email" required className="input"
                value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs font-medium text-cobalt-500 dark:text-cobalt-400 hover:text-cobalt-700 transition">
                  Forgot password?
                </Link>
              </div>
              <input id="password" type="password" autoComplete="current-password" required className="input"
                value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink/50 dark:text-[#9AA3B0]">
            No account?{" "}
            <Link to="/register" className="font-semibold text-cobalt-500 dark:text-cobalt-400 hover:text-cobalt-700 transition">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function ResendButton({ email }: { email: string }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  async function resend() {
    setLoading(true);
    try { await authApi.resendVerification(email); setSent(true); }
    finally { setLoading(false); }
  }
  if (sent) return <span className="text-xs font-semibold text-green-600 dark:text-green-400">Sent!</span>;
  return (
    <button onClick={resend} disabled={loading || !email}
      className="text-xs font-semibold text-ink/60 dark:text-[#9AA3B0] underline hover:text-ink dark:hover:text-[#F1F3F6] transition">
      {loading ? "Sending…" : "Resend verification email"}
    </button>
  );
}
