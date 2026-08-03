import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../lib/api";
import { AxiosError } from "axios";

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
    setError("");
    setUnverified(false);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      if (err instanceof AxiosError) {
        const detail = err.response?.data?.detail ?? "Login failed";
        if (err.response?.status === 403 && detail.toLowerCase().includes("verified")) {
          setUnverified(true);
        } else {
          setError(detail);
        }
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#F7F8FA]">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gray-950 p-12">
        <span className="text-xl font-bold text-white">PostWeek</span>
        <div>
          <h2 className="text-3xl font-bold text-white leading-snug mb-4">
            LinkedIn. X. Video ideas.<br />
            <span className="text-brand-400">All in one place.</span>
          </h2>
          <p className="text-gray-400 text-base leading-relaxed max-w-sm">
            PostWeek generates content matched to your voice — not generic AI output.
            Paste a few past posts and watch it learn how you write.
          </p>
        </div>
        <p className="text-xs text-gray-600">
          PostWeek by Wisdom · omonswisdom.ict@gmail.com
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="mb-8 text-center lg:hidden">
            <span className="text-2xl font-bold text-brand-600">PostWeek</span>
            <p className="mt-1 text-sm text-gray-500">Write less. Post more.</p>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-sm text-gray-500 mb-8">Sign in to your account</p>

          {error && (
            <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {unverified && (
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <p className="font-semibold mb-1">Email not verified</p>
              <p className="mb-2">Check your inbox for the verification link.</p>
              <ResendButton email={email} />
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
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs font-medium text-brand-600 hover:text-brand-700">
                  Forgot password?
                </Link>
              </div>
              <input id="password" type="password" autoComplete="current-password" required
                className="input" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            No account?{" "}
            <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
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
    try {
      await authApi.resendVerification(email);
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) return <span className="text-green-700 font-semibold text-xs">Sent!</span>;
  return (
    <button onClick={resend} disabled={loading || !email}
      className="text-xs font-semibold text-amber-700 underline hover:text-amber-900">
      {loading ? "Sending…" : "Resend verification email"}
    </button>
  );
}
