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
    setError("");
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      const msg =
        err instanceof AxiosError
          ? err.response?.data?.detail ?? "Something went wrong"
          : "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">📩</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Check your email</h1>
          <p className="text-sm text-gray-500 mb-6">
            If an account with <strong>{email}</strong> exists, a password reset link has been
            sent. It expires in 30 minutes.
          </p>
          <Link to="/login" className="btn-primary inline-flex">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-2xl font-bold text-brand-600">PostWeek</span>
        </div>

        <div className="card p-8">
          <h1 className="mb-2 text-xl font-semibold text-gray-900">Forgot password?</h1>
          <p className="mb-6 text-sm text-gray-500">
            Enter your email and we'll send a reset link.
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
