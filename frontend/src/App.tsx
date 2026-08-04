import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import XThreadsPage from "./pages/XThreadsPage";
import VideoIdeasPage from "./pages/VideoIdeasPage";
import Navbar from "./components/Navbar";

/**
 * Shows a spinner while auth state is being rehydrated from localStorage.
 * Without this, the wildcard route sees user=null before the token check
 * finishes and immediately redirects to /login on every hard refresh.
 */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, profileComplete } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // New user — redirect to onboarding unless they're already heading there
  if (!profileComplete && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

/**
 * Redirects already-logged-in users away from guest-only pages (login, register).
 * Also waits for loading to finish before deciding.
 */
function GuestOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Don't render routes until auth state is known — prevents wildcard from
  // firing a premature redirect while localStorage is being checked.
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  // Home page has its own nav — don't show the app Navbar there
  const showNavbar = user && location.pathname !== "/";

  return (
    <div className="min-h-screen flex flex-col bg-canvas dark:bg-[#0D0F13] transition-colors duration-200">
      {showNavbar && <Navbar />}
      <main className="flex-1">
        <Routes>
          {/* Landing page */}
          <Route path="/" element={<HomePage />} />

          {/* Guest-only — redirect to dashboard if already logged in */}
          <Route path="/login"           element={<GuestOnly><LoginPage /></GuestOnly>} />
          <Route path="/register"        element={<GuestOnly><RegisterPage /></GuestOnly>} />
          <Route path="/forgot-password" element={<GuestOnly><ForgotPasswordPage /></GuestOnly>} />
          <Route path="/reset-password"  element={<GuestOnly><ResetPasswordPage /></GuestOnly>} />

          {/* Public — email link pages, accessible by anyone at any auth state */}
          <Route path="/verify-email"    element={<VerifyEmailPage />} />

          {/* Protected */}
          <Route path="/onboarding"   element={<RequireAuth><OnboardingPage /></RequireAuth>} />
          <Route path="/dashboard"    element={<RequireAuth><DashboardPage /></RequireAuth>} />
          <Route path="/x-threads"    element={<RequireAuth><XThreadsPage /></RequireAuth>} />
          <Route path="/video-ideas"  element={<RequireAuth><VideoIdeasPage /></RequireAuth>} />

          {/* Catch-all — user is known at this point (loading is false) */}
          <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
        </Routes>
      </main>
    </div>
  );
}
