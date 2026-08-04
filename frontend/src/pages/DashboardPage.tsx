import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { postsApi, profileApi, samplesApi, weeksApi } from "../lib/api";
import type { Platform, Post, Week, WeekSummary } from "../types";
import { AxiosError } from "axios";
import LinkedInPreview from "../components/LinkedInPreview";
import XThreadPreview from "../components/XThreadPreview";
import { useAuth } from "../context/AuthContext";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TWEET_SEP = "\n---\n";

const TONE_PRESETS = [
  { value: "casual",       label: "Casual" },
  { value: "professional", label: "Professional" },
  { value: "contrarian",   label: "Contrarian" },
  { value: "storyteller",  label: "Storyteller" },
];

function parseTweets(body: string): string[] {
  return body.split(TWEET_SEP).map(t => t.trim()).filter(Boolean);
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({
  generating, week, canNextWeek, tonePreset, voiceMode,
  onGenerate, onToneChange,
}: {
  generating: boolean;
  week: Week | null;
  canNextWeek: boolean;
  tonePreset: string | null;
  voiceMode: "samples" | "preset" | null;
  onGenerate: () => void;
  onToneChange: (tone: string) => void;
}) {
  return (
    <aside className="w-44 shrink-0 flex flex-col gap-5 pt-0.5">
      {/* Voice mode badge */}
      {voiceMode === "preset" && (
        <div className="rounded-xl border px-3 py-2.5 space-y-2"
          style={{ borderColor: "rgba(255,233,119,0.5)", backgroundColor: "rgba(255,233,119,0.12)" }}>
          <p className="font-mono text-[0.5625rem] font-semibold uppercase tracking-wider text-ink/50 dark:text-[#9AA3B0]/60">
            Tone preset
          </p>
          <select
            className="w-full rounded-md border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-[#15181E] text-xs font-medium text-ink dark:text-[#F1F3F6]
                       py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-cobalt-500/40"
            value={tonePreset ?? "professional"}
            onChange={(e) => onToneChange(e.target.value)}
          >
            {TONE_PRESETS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <Link to="/onboarding"
            className="block text-[0.6875rem] text-cobalt-600 dark:text-cobalt-400 hover:underline font-medium">
            Add writing samples →
          </Link>
        </div>
      )}

      {/* Generate button */}
      {(!week || canNextWeek) && (
        <div>
          <button
            onClick={onGenerate}
            disabled={generating}
            className="btn-primary w-full gap-2 py-3"
          >
            {generating ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Generating…
              </>
            ) : week ? (
              "Generate next week"
            ) : (
              "Generate my week"
            )}
          </button>
          {!week && (
            <p className="mt-2 font-mono text-mono-xs text-ink/30 dark:text-[#9AA3B0]/40 text-center">
              5 posts · 5 days
            </p>
          )}
        </div>
      )}

      {/* Navigation links to other tools */}
      <div className="mt-auto pt-4 border-t border-gray-200/60 dark:border-gray-800/60 space-y-1">
        <Link to="/x-threads"
          className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium
                     text-ink/50 dark:text-[#9AA3B0]/70 hover:text-ink dark:hover:text-[#F1F3F6]
                     hover:bg-black/5 dark:hover:bg-white/5 transition">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 shrink-0">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          X Threads
        </Link>
        <Link to="/video-ideas"
          className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium
                     text-ink/50 dark:text-[#9AA3B0]/70 hover:text-ink dark:hover:text-[#F1F3F6]
                     hover:bg-black/5 dark:hover:bg-white/5 transition">
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Video ideas
        </Link>
      </div>
    </aside>
  );
}

// ── Day column skeleton ───────────────────────────────────────────────────────
function DayColumnSkeleton({ day }: { day: string }) {
  return (
    <div className="day-column">
      <p className="day-header">{day}</p>
      <div className="preview-card overflow-hidden animate-pulse">
        <div className="p-4 flex gap-3">
          <div className="skeleton-avatar" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="skeleton-line w-24" />
            <div className="skeleton-line w-36" />
          </div>
        </div>
        <div className="px-4 pb-4 space-y-2">
          <div className="skeleton-line w-full" />
          <div className="skeleton-line w-5/6" />
          <div className="skeleton-line w-4/6" />
          <div className="skeleton-line w-3/4" />
        </div>
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-between">
          <div className="skeleton-line w-12 h-3" />
          <div className="skeleton-line w-24 h-3" />
        </div>
      </div>
    </div>
  );
}

// ── X thread skeleton ─────────────────────────────────────────────────────────
function XColumnSkeleton({ day }: { day: string }) {
  return (
    <div className="day-column">
      <p className="day-header">{day}</p>
      <div className="preview-card overflow-hidden animate-pulse">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex gap-3">
          <div className="skeleton h-[18px] w-[18px] rounded" />
          <div className="skeleton-line w-16 h-3 mt-0.5" />
        </div>
        <div className="px-4 pt-4 pb-2 flex gap-3">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="h-9 w-9 rounded-full skeleton" />
            <div className="w-px h-8 skeleton" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="skeleton-line w-28" />
            <div className="skeleton-line w-full" />
            <div className="skeleton-line w-5/6" />
          </div>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <div className="skeleton-line w-24 h-3" />
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function DashboardPage() {
  useAuth();
  const [week,        setWeek]        = useState<Week | null>(null);
  const [allWeeks,    setAllWeeks]    = useState<WeekSummary[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [generating,  setGenerating]  = useState(false);
  const [error,       setError]       = useState("");
  const [activeTab,   setActiveTab]   = useState<Platform>("linkedin");
  const [repurposing, setRepurposing] = useState<Record<string, boolean>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [voiceMode,   setVoiceMode]   = useState<"samples" | "preset" | null>(null);
  const [tonePreset,  setTonePreset]  = useState<string | null>(null);
  const [profileName, setProfileName] = useState("You");

  const load = useCallback(async () => {
    const [wRes, listRes, sampRes, profRes] = await Promise.allSettled([
      weeksApi.latest(), weeksApi.list(), samplesApi.list(), profileApi.get(),
    ]);
    if (wRes.status    === "fulfilled") setWeek(wRes.value.data);
    if (listRes.status === "fulfilled") setAllWeeks(listRes.value.data);
    if (sampRes.status === "fulfilled")
      setVoiceMode(sampRes.value.data.length > 0 ? "samples" : "preset");
    if (profRes.status === "fulfilled") {
      const p = profRes.value.data;
      setTonePreset(p.tone_preset ?? "professional");
      if (p.name) setProfileName(p.name.trim());
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleGenerate() {
    setError(""); setGenerating(true);
    try {
      const { data } = await weeksApi.generate();
      setWeek(data); setAllWeeks(prev => [data, ...prev]); setActiveTab("linkedin");
    } catch (err) {
      setError(err instanceof AxiosError
        ? err.response?.data?.detail ?? "Generation failed"
        : "Something went wrong");
    } finally { setGenerating(false); }
  }

  async function loadWeek(id: string) {
    const { data } = await weeksApi.get(id);
    setWeek(data); setActiveTab("linkedin"); setShowHistory(false);
  }

  function updatePost(updated: Post) {
    setWeek(prev =>
      prev ? { ...prev, posts: prev.posts.map(p => p.id === updated.id ? updated : p) } : prev
    );
  }

  async function handleEdit(post: Post, text: string)  {
    const { data } = await postsApi.edit(post.id, text); updatePost(data);
  }
  async function handleCopy(post: Post) {
    await navigator.clipboard.writeText(post.edited_body ?? post.body);
    const { data } = await postsApi.markCopied(post.id); updatePost(data);
  }
  async function handleRegen(post: Post, note?: string) {
    const { data } = await postsApi.regenerate(post.id, note); updatePost(data);
  }
  async function handleRepurpose(postId: string) {
    setRepurposing(p => ({ ...p, [postId]: true }));
    try {
      const { data } = await postsApi.repurpose(postId);
      setWeek(prev => prev ? { ...prev, posts: [...prev.posts, data as unknown as Post] } : prev);
      setActiveTab("x");
    } finally { setRepurposing(p => ({ ...p, [postId]: false })); }
  }
  async function handleXEdit(post: Post, tweets: string[]) {
    const { data } = await postsApi.edit(post.id, tweets.join(TWEET_SEP)); updatePost(data);
  }
  async function handleXCopy(post: Post) {
    await navigator.clipboard.writeText(parseTweets(post.edited_body ?? post.body).join("\n\n"));
    const { data } = await postsApi.markCopied(post.id); updatePost(data);
  }

  const liPosts = (week?.posts.filter(p => p.platform === "linkedin") ?? [])
    .sort((a, b) => DAYS.indexOf(a.suggested_day) - DAYS.indexOf(b.suggested_day));
  const xPosts = (week?.posts.filter(p => p.platform === "x") ?? [])
    .sort((a, b) => DAYS.indexOf(a.suggested_day) - DAYS.indexOf(b.suggested_day));

  const copied    = liPosts.filter(p => p.status === "copied").length;
  const weekAge   = week ? Date.now() - new Date(week.created_at).getTime() : 0;
  const weekOld   = weekAge > 6 * 24 * 60 * 60 * 1000;
  const canNextWeek = !!(week && (copied >= 3 || weekOld));

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-cobalt-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="mx-auto max-w-[1120px] px-4 py-8">

      {/* ── Page header ── */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          {!week ? (
            <h1 className="display text-4xl md:text-5xl text-ink dark:text-[#F1F3F6] leading-tight">
              Your week is unwritten.
            </h1>
          ) : (
            <h1 className="display text-3xl text-ink dark:text-[#F1F3F6]">
              {profileName !== "You" ? `${profileName.trimEnd()}'s week` : "Your week"}
            </h1>
          )}
          {week && (
            <p className="mt-1.5 font-mono text-mono-sm text-ink/40 dark:text-[#9AA3B0]/60 flex items-center gap-2 flex-wrap">
              <span className="highlight-mark">{copied}/5 copied</span>
              <span>·</span>
              <span>{week.model_used ?? "AI"}</span>
              {weekOld && <span className="text-amber-500">· Ready for next week</span>}
            </p>
          )}
        </div>

        {/* History dropdown */}
        {allWeeks.length > 1 && (
          <div className="relative shrink-0">
            <button onClick={() => setShowHistory(v => !v)}
              className="btn-secondary text-sm gap-1.5">
              History
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            {showHistory && (
              <div className="absolute right-0 top-full mt-1 z-50 w-56 card shadow-lg overflow-hidden">
                {allWeeks.map((w, i) => (
                  <button key={w.id} onClick={() => loadWeek(w.id)}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition
                      hover:bg-gray-50 dark:hover:bg-gray-800/60
                      border-b border-gray-50 dark:border-gray-800/60 last:border-0
                      ${w.id === week?.id
                        ? "text-cobalt-600 dark:text-cobalt-400 bg-cobalt-50/50 dark:bg-cobalt-900/20"
                        : "text-ink/80 dark:text-[#F1F3F6]/70"}`}>
                    {i === 0 ? "This week" : `Week ${allWeeks.length - i}`}
                    <span className="ml-2 font-mono text-mono-xs text-ink/30 dark:text-[#9AA3B0]/40">
                      {new Date(w.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 banner-error">{error}</div>
      )}

      {/* ── Empty state ── */}
      {!week && !generating && (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <p className="text-sm text-ink/40 dark:text-[#9AA3B0]/60 max-w-xs mb-8">
            Set up your profile, then generate. Five posts, five days, your voice.
          </p>
          <button onClick={handleGenerate} disabled={generating}
            className="btn-primary px-8 py-3 text-base">
            Generate my week
          </button>
        </div>
      )}

      {/* ── Main layout: sidebar + week rail ── */}
      {(week || generating) && (
        <div className="flex gap-8">

          {/* Sidebar */}
          <div className="hidden lg:block">
            <Sidebar
              generating={generating}
              week={week}
              canNextWeek={canNextWeek}
              tonePreset={tonePreset}
              voiceMode={voiceMode}
              onGenerate={handleGenerate}
              onToneChange={setTonePreset}
            />
          </div>

          {/* Main content area */}
          <div className="flex-1 min-w-0">

            {/* Platform tabs */}
            <div className="mb-6 flex gap-1 border-b border-gray-200 dark:border-gray-800">
              {([
                { id: "linkedin" as Platform, label: "LinkedIn", count: liPosts.length },
                { id: "x"        as Platform, label: "X Threads", count: xPosts.length },
              ]).map(({ id, label, count }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`relative pb-3 px-1 text-sm font-semibold transition mr-6 ${
                    activeTab === id
                      ? "text-cobalt-600 dark:text-cobalt-400"
                      : "text-ink/40 dark:text-[#9AA3B0]/60 hover:text-ink/70 dark:hover:text-[#9AA3B0]"
                  }`}>
                  {label}
                  {count > 0 && (
                    <span className={`ml-1.5 font-mono text-mono-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === id
                        ? "bg-cobalt-50 dark:bg-cobalt-900/40 text-cobalt-600 dark:text-cobalt-400"
                        : "bg-gray-100 dark:bg-gray-800 text-ink/40 dark:text-[#9AA3B0]/60"
                    }`}>{count}</span>
                  )}
                  {activeTab === id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cobalt-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Mobile generate button */}
            {(!week || canNextWeek) && (
              <div className="lg:hidden mb-6">
                <button onClick={handleGenerate} disabled={generating} className="btn-primary w-full gap-2">
                  {generating
                    ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Generating…</>
                    : week ? "Generate next week" : "Generate my week"}
                </button>
              </div>
            )}

            {/* Generating skeletons */}
            {generating && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                {DAYS.map(day =>
                  activeTab === "linkedin"
                    ? <DayColumnSkeleton key={day} day={day} />
                    : <XColumnSkeleton  key={day} day={day} />
                )}
              </div>
            )}

            {/* ── LinkedIn week rail ── */}
            {week && !generating && activeTab === "linkedin" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                {DAYS.map(day => {
                  const post   = liPosts.find(p => p.suggested_day === day);
                  const xPost  = post ? xPosts.find(x =>
                    x.pillar === post.pillar && x.suggested_day === post.suggested_day
                  ) : null;

                  return (
                    <div key={day} className="day-column">
                      <p className="day-header">{day}</p>
                      {post ? (
                        <>
                          <LinkedInPreview
                            name={profileName}
                            headline="Founder · PostWeek"
                            body={post.edited_body ?? post.body}
                            pillar={post.pillar}
                            suggestedDay={post.suggested_day}
                            status={post.status}
                            compact={true}
                            onEdit={(text) => handleEdit(post, text)}
                            onCopy={() => handleCopy(post)}
                            onRegen={(note) => handleRegen(post, note)}
                          />
                          {/* Repurpose to X nudge */}
                          <div className="mt-1.5 flex justify-end">
                            {!xPost ? (
                              <button
                                onClick={() => handleRepurpose(post.id)}
                                disabled={repurposing[post.id]}
                                className="flex items-center gap-1.5 text-xs font-medium
                                           text-ink/35 dark:text-[#9AA3B0]/50
                                           hover:text-ink/60 dark:hover:text-[#9AA3B0]
                                           transition disabled:opacity-40 min-h-[40px] px-1"
                              >
                                {repurposing[post.id]
                                  ? <><span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />Converting…</>
                                  : <>
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 shrink-0">
                                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                    Repurpose as X thread
                                  </>
                                }
                              </button>
                            ) : (
                              <button
                                onClick={() => setActiveTab("x")}
                                className="flex items-center gap-1.5 text-xs font-medium
                                           text-green-600 dark:text-green-400
                                           hover:text-green-700 transition min-h-[40px] px-1"
                              >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 shrink-0">
                                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                                X thread ready
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="preview-card p-4 flex items-center justify-center min-h-[140px]">
                          <p className="font-mono text-mono-xs text-ink/20 dark:text-[#9AA3B0]/30 text-center">
                            No post<br />for {day}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── X Threads week rail ── */}
            {week && !generating && activeTab === "x" && (
              <>
                {xPosts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <p className="text-sm text-ink/40 dark:text-[#9AA3B0]/60 max-w-xs mb-4">
                      Go to LinkedIn tab and tap "Repurpose as X thread" on any post.
                    </p>
                    <button onClick={() => setActiveTab("linkedin")}
                      className="btn-secondary text-sm">
                      View LinkedIn posts
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                    {DAYS.map(day => {
                      const post = xPosts.find(p => p.suggested_day === day);
                      return (
                        <div key={day} className="day-column">
                          <p className="day-header">{day}</p>
                          {post ? (
                            <XThreadPreview
                              tweets={parseTweets(post.edited_body ?? post.body)}
                              suggestedDay={post.suggested_day}
                              status={post.status}
                              compact={true}
                              onCopyAll={() => handleXCopy(post)}
                              onEdit={(tweets) => handleXEdit(post, tweets)}
                              onRegen={async () => {
                                const { data } = await postsApi.reRepurpose(post.id);
                                updatePost(data as unknown as Post);
                              }}
                            />
                          ) : (
                            <div className="preview-card p-4 flex items-center justify-center min-h-[140px]">
                              <p className="font-mono text-mono-xs text-ink/20 dark:text-[#9AA3B0]/30 text-center">
                                Not repurposed
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
