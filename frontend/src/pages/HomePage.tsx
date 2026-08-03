import { Link } from "react-router-dom";

const FEATURES = [
  {
    title: "LinkedIn posts",
    desc: "Five drafts a week, written in your voice. We learn your style from your past posts and match it, not a generic AI tone.",
    detail: "Personal story · Opinion · How-to · Question · Behind the scenes",
  },
  {
    title: "X threads",
    desc: "One click converts any LinkedIn post into a punchy X thread. Hook-first, 280 chars per tweet, 3 to 6 tweets.",
    detail: "Repurpose in seconds, not hours",
  },
  {
    title: "Video ideas",
    desc: "Live trend research via search, combined with your past titles and niche. Seven ready-to-film briefs with title, hook, and angle.",
    detail: "YouTube · TikTok · Reels · Shorts",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Set up your profile",
    desc: "Your role, audience, topics, and what you want to be known for. Add a few past posts so we learn how you actually write.",
  },
  {
    number: "02",
    title: "Choose your platform",
    desc: "LinkedIn posts for the week, X threads repurposed from them, or video ideas pulled from live trending topics in your niche.",
  },
  {
    number: "03",
    title: "Edit, copy, publish",
    desc: "Every output is a draft, not a final product. Edit inline, regenerate with a note, then copy and post. You stay in control.",
  },
];

const PILLARS = [
  "LinkedIn posts",
  "X threads",
  "Video ideas",
  "Trend research",
  "Voice matching",
  "Repurposing",
];

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold tracking-tight text-brand-600">PostWeek</span>
          <nav className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pb-20 pt-24 text-center">
        <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-brand-500">
          Content engine for creators and professionals
        </p>
        <h1 className="text-5xl font-bold leading-[1.1] tracking-tight text-gray-900 sm:text-6xl">
          Write less.
          <br />
          <span className="text-brand-600">Post more.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-500">
          PostWeek generates LinkedIn posts, X threads, and video ideas,
          all matched to your voice and informed by what is trending right now.
        </p>

        {/* Platform icons */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <div className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600">
            <LinkedInIcon className="h-4 w-4 text-blue-600" />
            LinkedIn
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600">
            <XIcon className="h-3.5 w-3.5 text-gray-900" />
            X
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600">
            <VideoIcon className="h-4 w-4 text-red-500" />
            Video
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/register"
            className="w-full rounded-xl bg-brand-600 px-8 py-3.5 text-sm font-semibold text-white shadow transition hover:bg-brand-700 sm:w-auto"
          >
            Start for free
          </Link>
          <Link
            to="/login"
            className="w-full rounded-xl border border-gray-200 bg-white px-8 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 sm:w-auto"
          >
            Sign in
          </Link>
        </div>
        <p className="mt-5 text-xs text-gray-400">Free to use. No credit card required.</p>
      </section>

      {/* What it does */}
      <section className="border-y border-gray-100 bg-gray-50 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-10 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">
            Three tools, one platform
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            {FEATURES.map(({ title, desc, detail }) => (
              <div key={title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-2 text-base font-semibold text-gray-900">{title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-gray-500">{desc}</p>
                <p className="text-xs font-medium text-brand-600">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature pills */}
      <section className="py-10">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex flex-wrap justify-center gap-2.5">
            {PILLARS.map((label) => (
              <span
                key={label}
                className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-600 shadow-sm"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-brand-500">
          How it works
        </p>
        <h2 className="mb-14 text-center text-3xl font-bold tracking-tight text-gray-900">
          Profile to published in minutes
        </h2>
        <div className="grid gap-12 sm:grid-cols-3">
          {STEPS.map(({ number, title, desc }) => (
            <div key={number}>
              <p className="mb-3 text-4xl font-black text-gray-100">{number}</p>
              <h3 className="mb-2 text-base font-semibold text-gray-900">{title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Voice callout */}
      <section className="bg-gray-950 py-20">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-brand-400">
            Why it works
          </p>
          <h2 className="mb-5 text-3xl font-bold leading-snug tracking-tight text-white">
            Everything sounds like you wrote it.
          </h2>
          <p className="mx-auto max-w-lg text-base leading-relaxed text-gray-400">
            Paste a few posts or video titles you have already published.
            PostWeek maps your sentence length, vocabulary, and structure
            and applies that fingerprint to every LinkedIn post, X thread,
            and video brief it generates. No generic AI voice. No em-dash drama.
            Just your style, across every platform.
          </p>
          <Link
            to="/register"
            className="mt-10 inline-flex items-center justify-center rounded-xl bg-brand-600 px-8 py-3.5 text-sm font-semibold text-white shadow transition hover:bg-brand-500"
          >
            Try it free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-6 text-xs text-gray-400 sm:flex-row">
          <span>
            &copy; {new Date().getFullYear()} PostWeek by{" "}
            <span className="font-semibold text-gray-600">Wisdom</span>
          </span>
          <a href="mailto:omonswisdom.ict@gmail.com" className="transition hover:text-brand-600">
            omonswisdom.ict@gmail.com
          </a>
        </div>
      </footer>
    </div>
  );
}
