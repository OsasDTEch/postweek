import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Brand from "./Brand";

function SunIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

const NAV_LINKS = [
  { to: "/dashboard",   label: "Dashboard"   },
  { to: "/x-threads",   label: "X Threads"   },
  { to: "/video-ideas", label: "Video ideas" },
  { to: "/onboarding",  label: "My profile"  },
];

export default function Navbar() {
  const { user, logout }       = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate               = useNavigate();
  const location               = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  function handleLogout() { logout(); navigate("/login"); }

  return (
    <header className="sticky top-0 z-40
                       border-b border-gray-200/60 dark:border-gray-800/60
                       bg-white/90 dark:bg-[#0D0F13]/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-[1120px] items-center justify-between px-4 py-3">

        {/* Brand */}
        <Link to="/dashboard" className="hover:opacity-85 transition-opacity" aria-label="PostWeek home">
          <Brand />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden sm:flex items-center gap-0.5">
          {NAV_LINKS.map(({ to, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition min-h-[40px] flex items-center
                  ${active
                    ? "text-cobalt-600 dark:text-cobalt-400 bg-cobalt-50/60 dark:bg-cobalt-900/30"
                    : "text-ink/55 dark:text-[#9AA3B0] hover:text-ink dark:hover:text-[#F1F3F6] hover:bg-black/5 dark:hover:bg-white/5"}`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Desktop right controls */}
        <div className="hidden sm:flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 min-h-[40px] min-w-[40px] flex items-center justify-center
                       text-ink/35 dark:text-[#9AA3B0]/60
                       hover:bg-black/5 dark:hover:bg-white/5
                       hover:text-ink dark:hover:text-[#F1F3F6] transition"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          <span className="font-mono text-mono-xs text-ink/25 dark:text-[#9AA3B0]/40 truncate max-w-[140px] px-1">
            {user.email}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-ink/45 dark:text-[#9AA3B0]/60
                       hover:text-ink dark:hover:text-[#F1F3F6] transition
                       px-2 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5
                       min-h-[40px]"
          >
            Sign out
          </button>
        </div>

        {/* Mobile controls */}
        <div className="sm:hidden flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 min-h-[40px] min-w-[40px] flex items-center justify-center
                       text-ink/40 dark:text-[#9AA3B0]/60
                       hover:bg-black/5 dark:hover:bg-white/5 transition"
            aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="rounded-lg p-2 min-h-[40px] min-w-[40px] flex items-center justify-center
                       text-ink/55 dark:text-[#9AA3B0] hover:bg-black/5 dark:hover:bg-white/5 transition"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen
              ? <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              : <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            }
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-100 dark:border-gray-800
                        bg-white dark:bg-[#0D0F13] px-4 pb-4 pt-2 space-y-1">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition min-h-[44px] flex items-center
                ${location.pathname === to
                  ? "text-cobalt-600 dark:text-cobalt-400 bg-cobalt-50/60 dark:bg-cobalt-900/30"
                  : "text-ink/60 dark:text-[#9AA3B0] hover:bg-black/5 dark:hover:bg-white/5"}`}
            >
              {label}
            </Link>
          ))}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800
                          flex items-center justify-between">
            <span className="font-mono text-mono-xs text-ink/25 dark:text-[#9AA3B0]/40 truncate">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-ink/50 dark:text-[#9AA3B0]/60
                         hover:text-ink dark:hover:text-[#F1F3F6] transition px-2 py-2 min-h-[40px]"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
