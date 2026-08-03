import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../lib/api";
import { AxiosError } from "axios";

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
    if (password !== confirm) { setError("Passwords don't match"); return; }

    setLoading(true);
    try {
      const message = await register(email, password);
      setSuccessMessage(message);
    } catch (err) {
      if (err instanceof AxiosError) {
        if (!err.response) {
          setError("Cannot reach the server. Make sure the backend is running.");
        } else {
          const detail = err.response.data?.detail;
          setError(Array.isArray(detail)
            ? detail.map((d: { msg: string }) => d.msg).join(", ")
            : detail ?? `Server error ${err.response.status}`);
        }
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }

  if (successMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 bg-[#F7F8FA]">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Check your inbox</h1>
          <p className="text-sm text-gray-500 mb-6">{successMessage}</p>
          <p className="text-xs text-gray-400">
            Didn't get it?{" "}
            <ResendLink email={email} />
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F7F8FA]">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gray-950 p-12">
        <span className="text-xl font-bold text-white">PostWeek</span>
        <div>
          <h2 className="text-3xl font-bold text-white leading-snug mb-4">
            Your content.<br />
            <span className="text-brand-400">Your voice. Every week.</span>
          </h2>
          <ul className="space-y-3 text-sm text-gray-400">
            {["LinkedIn posts written like you", "X threads repurposed in one click", "Video ideas from live trend research"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <svg className="h-4 w-4 text-brand-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-gray-600">Free to use · No credit card needed</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:hidden">
            <span className="text-2xl font-bold text-brand-600">PostWeek</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h1>
          <p className="text-sm text-gray-500 mb-8">Free — no credit card needed</p>

          {error && (
            <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input id="email" type="email" autoComplete="email" required
                className="input" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" />
            </div>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <input id="password" type="password" autoComplete="new-password" required
                className="input" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters" />
            </div>
            <div>
              <label htmlFor="confirm" className="label">Confirm password</label>
              <input id="confirm" type="password" autoComplete="new-password" required
                className="input" value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? "Creating account…" : "Get started free"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
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
    try {
      await authApi.resendVerification(email);
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) return <span className="text-green-600 font-semibold">Sent!</span>;
  return (
    <button onClick={resend} disabled={loading}
      className="font-semibold text-brand-600 hover:text-brand-700 underline">
      {loading ? "Sending…" : "Resend verification email"}
    </button>
  );
}
