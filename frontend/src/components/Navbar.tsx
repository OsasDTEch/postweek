import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

function SunIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  if (!user) return null;

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/x-threads", label: "X Threads" },
    { to: "/video-ideas", label: "Video ideas" },
    { to: "/onboarding", label: "My profile" },
  ];

  const activeClass = "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300";
  const inactiveClass = "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100";

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <Link to="/dashboard" className="text-lg font-bold text-brand-600 tracking-tight dark:text-brand-400">
          PostWeek
        </Link>

        {/* Desktop nav links */}
        <div className="hidden sm:flex items-center gap-1">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                location.pathname === to ? activeClass : inactiveClass
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop right */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          <span className="text-sm text-gray-500 truncate max-w-[160px] dark:text-gray-400">{user.email}</span>
          <button onClick={handleLogout} className="btn-ghost text-sm px-3 py-1.5">
            Sign out
          </button>
        </div>

        {/* Mobile right — theme toggle + hamburger */}
        <div className="sm:hidden flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2 space-y-1 dark:border-gray-800 dark:bg-gray-950">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                location.pathname === to ? activeClass : inactiveClass
              }`}
            >
              {label}
            </Link>
          ))}
          <p className="px-3 py-2 text-xs text-gray-400 truncate dark:text-gray-600">{user.email}</p>
          <button
            onClick={handleLogout}
            className="w-full text-left rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
