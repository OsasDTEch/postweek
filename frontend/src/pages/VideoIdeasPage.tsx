import { useCallback, useEffect, useState } from "react";
import { videoApi } from "../lib/api";
import { AxiosError } from "axios";

// ── Types ─────────────────────────────────────────────────────────────────────
interface VideoProfile {
  channel_name: string | null; channel_type: string | null; niche: string | null;
  target_audience: string | null; content_style: string | null; past_titles: string | null;
}
interface VideoIdea {
  id: string; title: string; hook: string; angle: string; format: string;
  trend_context: string | null; status: string;
}
interface VideoIdeasBatch { batch_id: string; ideas: VideoIdea[]; model_used?: string; }

const CHANNEL_TYPES = [
  { value: "youtube",          label: "YouTube"         },
  { value: "tiktok",           label: "TikTok"          },
  { value: "instagram_reels",  label: "Instagram Reels" },
  { value: "shorts",           label: "Shorts"          },
  { value: "podcast",          label: "Podcast"         },
];

// Format colour map — strip on storyboard frame
const FORMAT_ACCENT: Record<string, { bg: string; text: string; frame: string }> = {
  tutorial:   { bg: "bg-blue-50  dark:bg-blue-900/20",  text: "text-blue-600  dark:text-blue-400",  frame: "from-blue-900/80"   },
  opinion:    { bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-600 dark:text-orange-400", frame: "from-orange-900/80" },
  story:      { bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-600 dark:text-violet-400", frame: "from-violet-900/80"},
  list:       { bg: "bg-green-50 dark:bg-green-900/20",  text: "text-green-600  dark:text-green-400",  frame: "from-green-900/80"  },
  experiment: { bg: "bg-amber-50 dark:bg-amber-900/20",  text: "text-amber-600  dark:text-amber-400",  frame: "from-amber-900/80"  },
  review:     { bg: "bg-pink-50  dark:bg-pink-900/20",   text: "text-pink-600   dark:text-pink-400",   frame: "from-pink-900/80"   },
  reaction:   { bg: "bg-red-50   dark:bg-red-900/20",    text: "text-red-600    dark:text-red-400",    frame: "from-red-900/80"    },
};
const DEFAULT_ACCENT = { bg: "bg-gray-50 dark:bg-gray-800", text: "text-gray-500 dark:text-gray-400", frame: "from-gray-900/80" };

// Shot-list beats from the angle field: split on newlines or numbered items
function parseBeats(angle: string): string[] {
  const lines = angle.split(/\n|\.\s+(?=\d)/).map(l => l.trim()).filter(Boolean);
  return lines.length > 1 ? lines : angle.split(". ").map(l => l.trim()).filter(Boolean);
}

// ── Storyboard card ───────────────────────────────────────────────────────────
function StoryboardCard({ idea, onDismiss }: { idea: VideoIdea; onDismiss: (id: string) => void }) {
  const [copied, setCopied] = useState(false);
  if (idea.status === "dismissed") return null;

  const accent = FORMAT_ACCENT[idea.format] ?? DEFAULT_ACCENT;
  const beats  = parseBeats(idea.angle);

  async function copy() {
    await navigator.clipboard.writeText(
      `Title: ${idea.title}\n\nHook: ${idea.hook}\n\nAngle: ${idea.angle}\n\nFormat: ${idea.format}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="card-hover overflow-hidden">
      {/* ── 16:9 storyboard frame ── */}
      <div className="storyboard-frame">
        {/* Subtle noise / film-grain via a pattern overlay */}
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")" }} />

        {/* Shot-list grid overlay (rule-of-thirds guide lines) */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "33.333% 33.333%" }} />

        {/* Camera icon centred */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="h-10 w-10 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>

        {/* Hook caption — bottom of frame */}
        <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t ${accent.frame} to-transparent pt-8 pb-3 px-4`}>
          <p className="font-sans text-[0.8125rem] font-semibold text-white leading-snug line-clamp-2">
            {idea.hook}
          </p>
          <p className="font-mono text-[0.5625rem] text-white/50 uppercase tracking-wider mt-0.5">Hook</p>
        </div>

        {/* Format badge — top left */}
        <div className="absolute top-3 left-3">
          <span className={`font-mono text-[0.5625rem] font-semibold uppercase tracking-wider
                           px-2 py-0.5 rounded-full bg-black/40 text-white/80 backdrop-blur-sm`}>
            {idea.format.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* ── Card body ── */}
      <div className="p-5">
        {/* Title */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <h3 className="font-sans text-[0.9375rem] font-semibold text-ink dark:text-[#F1F3F6]
                         leading-snug flex-1">
            {idea.title}
          </h3>
          <button onClick={() => onDismiss(idea.id)}
            className="text-xs text-ink/25 dark:text-[#9AA3B0]/40
                       hover:text-ink/50 dark:hover:text-[#9AA3B0] transition shrink-0 min-h-[40px] px-1">
            Dismiss
          </button>
        </div>

        {/* Shot list */}
        <div className="mb-4">
          <p className="section-label mb-2">Shot list</p>
          <ol className="space-y-1.5">
            {beats.slice(0, 5).map((beat, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="font-mono text-[0.625rem] font-semibold text-ink/25 dark:text-[#9AA3B0]/40
                                 shrink-0 mt-0.5 w-4 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-[0.8125rem] text-ink/70 dark:text-[#9AA3B0] leading-snug">{beat}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Trend context */}
        {idea.trend_context && !idea.trend_context.startsWith("Evergreen") && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-gray-100
                          dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 px-3 py-2.5">
            <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cobalt-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p className="font-mono text-mono-xs text-ink/40 dark:text-[#9AA3B0]/50 leading-relaxed line-clamp-2">
              {idea.trend_context}
            </p>
          </div>
        )}
        {idea.trend_context?.startsWith("Evergreen") && (
          <div className="mb-4">
            <span className="font-mono text-mono-xs text-ink/30 dark:text-[#9AA3B0]/40
                             bg-gray-100 dark:bg-gray-800 rounded-full px-2.5 py-1">
              Evergreen topic
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end border-t border-gray-100 dark:border-gray-800 pt-4">
          <button onClick={copy} className="btn-secondary text-xs px-3 py-1.5">
            {copied
              ? <span className="text-cobalt-500 dark:text-cobalt-400 font-semibold">Copied</span>
              : "Copy brief"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Profile form ──────────────────────────────────────────────────────────────
function ProfileForm({ profile, onSave }: { profile: VideoProfile; onSave: (p: VideoProfile) => void }) {
  const [form,   setForm]   = useState<VideoProfile>(profile);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const u = (f: keyof VideoProfile, v: string) => setForm(p => ({ ...p, [f]: v }));

  async function save() {
    setSaving(true); setError("");
    try {
      const { data } = await videoApi.updateProfile(form as unknown as Record<string, string | null>);
      onSave(data as VideoProfile);
    } catch { setError("Failed to save profile"); }
    finally { setSaving(false); }
  }

  return (
    <div className="card p-8 space-y-5">
      <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
        <h2 className="font-sans text-base font-bold text-ink dark:text-[#F1F3F6]">Channel profile</h2>
        <p className="mt-1 text-sm text-ink/50 dark:text-[#9AA3B0]">More specific means better ideas.</p>
      </div>
      {error && <div className="banner-error">{error}</div>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Channel name</label>
          <input type="text" className="input" placeholder="Build With Rico"
            value={form.channel_name ?? ""} onChange={e => u("channel_name", e.target.value)} />
        </div>
        <div>
          <label className="label">Platform</label>
          <select className="input" value={form.channel_type ?? "youtube"}
            onChange={e => u("channel_type", e.target.value)}>
            {CHANNEL_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Niche</label>
        <input type="text" className="input"
          placeholder="AI tools for developers, SaaS growth, freelance design"
          value={form.niche ?? ""} onChange={e => u("niche", e.target.value)} />
      </div>
      <div>
        <label className="label">Target audience</label>
        <input type="text" className="input" placeholder="Junior developers, early-stage founders"
          value={form.target_audience ?? ""} onChange={e => u("target_audience", e.target.value)} />
      </div>
      <div>
        <label className="label">Content style</label>
        <input type="text" className="input" placeholder="Tutorial, talking head, screen share"
          value={form.content_style ?? ""} onChange={e => u("content_style", e.target.value)} />
      </div>
      <div>
        <label className="label">
          Past video titles{" "}
          <span className="font-normal text-ink/30 dark:text-[#9AA3B0]/40">(one per line)</span>
        </label>
        <textarea rows={5} className="input resize-none text-sm"
          placeholder={"I built an AI agent in 30 minutes\nPython automation that saves me 3 hours a week"}
          value={form.past_titles ?? ""} onChange={e => u("past_titles", e.target.value)} />
      </div>
      <button onClick={save} disabled={saving || !form.niche?.trim()} className="btn-primary w-full">
        {saving ? "Saving…" : "Save profile"}
      </button>
    </div>
  );
}

// ── Generating skeleton ───────────────────────────────────────────────────────
function GeneratingSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-xl border border-cobalt-200/40 dark:border-cobalt-800/30
                      bg-cobalt-50/30 dark:bg-cobalt-900/10 px-5 py-4">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-cobalt-500 border-t-transparent shrink-0" />
        <p className="text-sm font-medium text-cobalt-700 dark:text-cobalt-300">
          Searching for trending topics in your niche…
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="card overflow-hidden animate-pulse">
            {/* 16:9 frame skeleton */}
            <div className="skeleton w-full" style={{ aspectRatio: "16/9" }} />
            <div className="p-5 space-y-3">
              <div className="skeleton-line w-3/4 h-4" />
              <div className="space-y-1.5">
                <div className="skeleton-line w-16 h-2" />
                <div className="skeleton-line w-full h-3" />
                <div className="skeleton-line w-5/6 h-3" />
                <div className="skeleton-line w-4/6 h-3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function VideoIdeasPage() {
  const [profile,         setProfile]         = useState<VideoProfile | null>(null);
  const [batch,           setBatch]           = useState<VideoIdeasBatch | null>(null);
  const [batches,         setBatches]         = useState<{ batch_id: string; created_at: string }[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [generating,      setGenerating]      = useState(false);
  const [error,           setError]           = useState("");
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showHistory,     setShowHistory]     = useState(false);

  const loadData = useCallback(async () => {
    const [pRes, bRes, lRes] = await Promise.allSettled([
      videoApi.getProfile(), videoApi.latestIdeas(), videoApi.listBatches(),
    ]);
    if (pRes.status === "fulfilled") {
      setProfile(pRes.value.data as VideoProfile);
      if (!(pRes.value.data as VideoProfile).niche) setShowProfileForm(true);
    }
    if (bRes.status === "fulfilled") setBatch(bRes.value.data as VideoIdeasBatch);
    if (lRes.status === "fulfilled") setBatches(lRes.value.data as { batch_id: string; created_at: string }[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleGenerate() {
    setError(""); setGenerating(true);
    try {
      const { data } = await videoApi.generateIdeas();
      setBatch(data as VideoIdeasBatch);
      setBatches(prev => [{ batch_id: (data as VideoIdeasBatch).batch_id, created_at: new Date().toISOString() }, ...prev]);
      setShowProfileForm(false);
    } catch (err) {
      setError(err instanceof AxiosError
        ? err.response?.data?.detail ?? "Generation failed"
        : "Something went wrong");
    } finally { setGenerating(false); }
  }

  async function loadBatch(id: string) {
    const { data } = await videoApi.getBatch(id); setBatch(data as VideoIdeasBatch); setShowHistory(false);
  }

  async function deleteBatch(id: string) {
    await videoApi.deleteBatch(id); setBatches(p => p.filter(b => b.batch_id !== id));
    if (batch?.batch_id === id) {
      const rem = batches.filter(b => b.batch_id !== id);
      rem.length ? await loadBatch(rem[0].batch_id) : setBatch(null);
    }
  }

  async function handleDismiss(id: string) {
    await videoApi.dismissIdea(id);
    setBatch(p => p ? { ...p, ideas: p.ideas.map(i => i.id === id ? { ...i, status: "dismissed" } : i) } : p);
  }

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-cobalt-500 border-t-transparent" />
    </div>
  );

  const activeIdeas = batch?.ideas.filter(i => i.status !== "dismissed") ?? [];

  return (
    <div className="mx-auto max-w-[1120px] px-4 py-10">

      {/* ── Page header ── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="display text-3xl text-ink dark:text-[#F1F3F6]">Video ideas</h1>
            {batches.length > 1 && (
              <div className="relative">
                <button onClick={() => setShowHistory(v => !v)}
                  className="btn-secondary text-xs gap-1 px-3 py-1.5">
                  History
                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
                {showHistory && (
                  <div className="absolute left-0 top-full mt-1 z-50 w-60 card shadow-lg overflow-hidden">
                    {batches.map((b, i) => (
                      <div key={b.batch_id}
                        className={`flex items-center justify-between px-4 py-2.5
                          border-b border-gray-50 dark:border-gray-800/60 last:border-0
                          hover:bg-gray-50 dark:hover:bg-gray-800/60 transition
                          ${b.batch_id === batch?.batch_id ? "bg-cobalt-50/50 dark:bg-cobalt-900/20" : ""}`}>
                        <button onClick={() => loadBatch(b.batch_id)}
                          className="flex-1 text-left text-sm font-medium text-ink/80 dark:text-[#F1F3F6]/70 min-h-[40px] flex items-center gap-2">
                          {i === 0 ? "Latest" : `Batch ${batches.length - i}`}
                          <span className="font-mono text-mono-xs text-ink/30 dark:text-[#9AA3B0]/40">
                            {new Date(b.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          </span>
                        </button>
                        {i !== 0 && (
                          <button onClick={() => deleteBatch(b.batch_id)}
                            className="text-xs text-ink/25 dark:text-[#9AA3B0]/40 hover:text-editorred transition ml-2 min-h-[40px] px-1">
                            Delete
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="mt-1 text-sm text-ink/50 dark:text-[#9AA3B0]">
            Live trend research. Seven ready-to-film briefs.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShowProfileForm(v => !v)} className="btn-secondary text-sm">
            {showProfileForm ? "Hide profile" : "Edit profile"}
          </button>
          {profile?.niche && (
            <button onClick={handleGenerate} disabled={generating} className="btn-primary text-sm">
              {generating
                ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Searching…</>
                : "Generate ideas"}
            </button>
          )}
        </div>
      </div>

      {error && <div className="mb-6 banner-error">{error}</div>}

      {/* Incomplete profile nudge */}
      {profile?.niche && (!profile.target_audience || !profile.past_titles) && !showProfileForm && (
        <div className="mb-6 banner-info px-4 py-3.5 flex items-start gap-3">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-cobalt-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-cobalt-700 dark:text-cobalt-300">Profile could be more specific</p>
            <p className="text-xs text-ink/55 dark:text-[#9AA3B0] mt-0.5">
              {!profile.target_audience && !profile.past_titles
                ? "Add target audience and past titles for better ideas."
                : !profile.target_audience
                  ? "Add your target audience."
                  : "Add past titles to match your style."}
              {" "}
              <button onClick={() => setShowProfileForm(true)}
                className="text-cobalt-600 dark:text-cobalt-400 font-semibold underline hover:text-cobalt-700 transition">
                Update profile
              </button>
            </p>
          </div>
        </div>
      )}

      {showProfileForm && profile && (
        <div className="mb-8">
          <ProfileForm profile={profile} onSave={p => { setProfile(p); if (p.niche) setShowProfileForm(false); }} />
        </div>
      )}

      {generating && <GeneratingSkeleton />}

      {/* Empty — no niche */}
      {!generating && !profile?.niche && !showProfileForm && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2
                        border-dashed border-gray-200 dark:border-gray-800 py-24 text-center">
          <h2 className="display text-2xl text-ink dark:text-[#F1F3F6] mb-2">Set up your channel first</h2>
          <p className="text-sm text-ink/50 dark:text-[#9AA3B0] max-w-xs mb-6">
            Add your niche so we can find trends that apply to you.
          </p>
          <button onClick={() => setShowProfileForm(true)} className="btn-primary">Set up profile</button>
        </div>
      )}

      {/* Empty — niche set, no batch */}
      {!generating && profile?.niche && !batch && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2
                        border-dashed border-gray-200 dark:border-gray-800 py-24 text-center">
          <h2 className="display text-2xl text-ink dark:text-[#F1F3F6] mb-2">No ideas yet</h2>
          <p className="text-sm text-ink/50 dark:text-[#9AA3B0] max-w-xs mb-6">
            Hit Generate to search live trends and get 7 video briefs tailored to your niche.
          </p>
          <button onClick={handleGenerate} className="btn-primary">Generate ideas</button>
        </div>
      )}

      {/* Ideas grid */}
      {!generating && activeIdeas.length > 0 && (
        <>
          <div className="mb-5 flex items-center justify-between">
            <p className="font-mono text-mono-sm text-ink/40 dark:text-[#9AA3B0]/50">
              <span className="font-semibold text-ink/70 dark:text-[#F1F3F6]/70">{activeIdeas.length}</span> ideas
              {batch?.model_used && <> · <span>{batch.model_used}</span></>}
            </p>
            <button onClick={handleGenerate} disabled={generating}
              className="text-xs font-medium text-cobalt-500 dark:text-cobalt-400
                         hover:text-cobalt-700 dark:hover:text-cobalt-300 transition">
              Refresh
            </button>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activeIdeas.map(idea => (
              <StoryboardCard key={idea.id} idea={idea} onDismiss={handleDismiss} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
