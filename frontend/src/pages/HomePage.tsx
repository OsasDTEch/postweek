import { Link } from "react-router-dom";

const FEATURES = [
  { title: "LinkedIn posts", desc: "Five drafts per week, matched to your sentence rhythm and vocabulary from past posts.", detail: "Personal story · Opinion · How-to · Question · Behind the scenes" },
  { title: "X threads", desc: "Native threads written for X from scratch, not repurposed LinkedIn posts. Hook-first, trend-aware.", detail: "Opinion · Hot take · Tips · Story · Q and A" },
  { title: "Video ideas", desc: "Seven ready-to-film briefs generated from live trend research in your niche.", detail: "YouTube · TikTok · Reels · Shorts" },
];

const STEPS = [
  { n: "01", title: "Set up your profile", desc: "Role, audience, topics. Add past posts so the engine learns exactly how you write." },
  { n: "02", title: "Choose your platform", desc: "LinkedIn for the week, X threads from scratch, or video briefs from live search." },
  { n: "03", title: "Review and publish", desc: "Everything is a draft. Edit inline, rewrite with a note, copy and post. You stay in control." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-canvas dark:bg-[#0D0F13] text-ink dark:text-[#F1F3F6]">

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-gray-200/50 dark:border-gray-800/50 bg-canvas/80 dark:bg-[#0D0F13]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between px-6 py-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-cobalt-500 shrink-0">
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                <path d="M5 4h5.5C12.4 4 14 5.6 14 7.5S12.4 11 10.5 11H7v5H5V4z" fill="white"/>
                <path d="M7 6v3h3.5c.83 0 1.5-.67 1.5-1.5S11.33 6 10.5 6H7z" fill="#2E5BFF"/>
              </svg>
            </span>
            <span className="leading-none">
              <span className="text-[1.0625rem] font-normal tracking-tight text-ink dark:text-[#F1F3F6]"
                    style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic" }}>Post</span>
              <span className="font-mono text-[0.875rem] font-semibold text-cobalt-500 dark:text-cobalt-400 tracking-tight">Week</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/login" className="font-sans text-sm font-medium text-ink/60 dark:text-[#9AA3B0] hover:text-ink dark:hover:text-[#F1F3F6] transition px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
              Sign in
            </Link>
            <Link to="/register" className="btn-primary text-sm">Get started free</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-[1120px] px-6 pt-28 pb-24">
        <p className="section-label mb-5">Content engine for founders and creators</p>
        <h1 className="display text-6xl md:text-7xl leading-[1.0] tracking-tight max-w-3xl mb-7">
          Write less.<br />Post more.
        </h1>
        <p className="font-sans text-lg text-ink/55 dark:text-[#9AA3B0] max-w-lg leading-relaxed mb-10">
          PostWeek generates LinkedIn posts, X threads, and video ideas matched to your voice and informed by what is trending right now.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/register" className="btn-primary text-base px-8 py-3">Get started free</Link>
          <Link to="/login" className="btn-secondary text-base px-8 py-3">Sign in</Link>
        </div>
        <p className="mt-5 font-mono text-mono-xs text-ink/30 dark:text-[#9AA3B0]/40">Free to use. No credit card required.</p>
      </section>

      {/* Three tools */}
      <section className="border-y border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-[#15181E] py-20">
        <div className="mx-auto max-w-[1120px] px-6">
          <p className="section-label mb-10 text-center">Three tools, one platform</p>
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map(({ title, desc, detail }) => (
              <div key={title} className="rounded-2xl border border-gray-200/80 dark:border-gray-700/60 bg-canvas dark:bg-[#0D0F13] p-7">
                <h3 className="font-sans text-base font-semibold text-ink dark:text-[#F1F3F6] mb-3">{title}</h3>
                <p className="font-sans text-sm text-ink/55 dark:text-[#9AA3B0] leading-relaxed mb-4">{desc}</p>
                <p className="font-mono text-mono-xs text-cobalt-500 dark:text-cobalt-400">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-[1120px] px-6 py-24">
        <p className="section-label mb-3 text-center">How it works</p>
        <h2 className="display text-4xl text-center text-ink dark:text-[#F1F3F6] mb-16">Profile to published in minutes</h2>
        <div className="grid gap-12 md:grid-cols-3">
          {STEPS.map(({ n, title, desc }) => (
            <div key={n}>
              <p className="font-mono text-[2.5rem] font-medium text-ink/8 dark:text-[#F1F3F6]/8 mb-3 leading-none">{n}</p>
              <h3 className="font-sans text-base font-semibold text-ink dark:text-[#F1F3F6] mb-2">{title}</h3>
              <p className="font-sans text-sm text-ink/55 dark:text-[#9AA3B0] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Voice callout */}
      <section className="bg-[#0D0F13] py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <p className="section-label text-white/30 mb-5">The difference</p>
          <h2 className="display text-4xl text-white leading-snug mb-6">
            Posts that read like<br />you wrote them.
          </h2>
          <p className="font-sans text-base text-white/50 leading-relaxed max-w-md mx-auto mb-10">
            Paste a few posts you have written before. PostWeek maps your sentence length, word choices, and structure, then applies that fingerprint to every draft it generates.
          </p>
          <Link to="/register" className="btn-primary inline-flex text-base px-8 py-3">Try it free</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200/60 dark:border-gray-800/60 py-8">
        <div className="mx-auto flex max-w-[1120px] flex-col sm:flex-row items-center justify-between gap-3 px-6">
          <span className="font-mono text-mono-xs text-ink/30 dark:text-[#9AA3B0]/40">
            {new Date().getFullYear()} PostWeek by <span className="text-ink/50 dark:text-[#9AA3B0]/60 font-medium">Wisdom</span>
          </span>
          <a href="mailto:omonswisdom.ict@gmail.com" className="font-mono text-mono-xs text-ink/30 dark:text-[#9AA3B0]/40 hover:text-cobalt-500 dark:hover:text-cobalt-400 transition">
            omonswisdom.ict@gmail.com
          </a>
        </div>
      </footer>
    </div>
  );
}
