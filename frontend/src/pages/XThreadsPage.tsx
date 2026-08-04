import { useCallback, useEffect, useState } from "react";
import { xThreadsApi } from "../lib/api";
import type { XProfile, XThreadItem, XThreadsBatch } from "../types";
import { AxiosError } from "axios";
import XThreadPreview from "../components/XThreadPreview";

// ── Constants ─────────────────────────────────────────────────────────────────
const TONES   = ["conversational", "punchy", "educational", "provocative"];
const FORMATS = ["opinion", "tips", "story", "hot_take", "thread_essay", "qa"];
const FORMAT_LABELS: Record<string, string> = {
  opinion: "Opinion", tips: "Tips", story: "Story",
  hot_take: "Hot take", thread_essay: "Thread essay", qa: "Q&A",
};

// ── Profile form ──────────────────────────────────────────────────────────────
function ProfileForm({ profile, onSave }: { profile: XProfile; onSave: (p: XProfile) => void }) {
  const [form,   setForm]   = useState<XProfile>(profile);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const update = (f: keyof XProfile, v: string) => setForm(p => ({ ...p, [f]: v }));

  async function handleSave() {
    setSaving(true); setError("");
    try {
      const { data } = await xThreadsApi.updateProfile(form as unknown as Record<string, string | null>);
      onSave(data as XProfile);
    } catch { setError("Failed to save profile"); }
    finally { setSaving(false); }
  }

  return (
    <div className="card p-8 space-y-5">
      <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
        <h2 className="font-sans text-base font-bold text-ink dark:text-[#F1F3F6]">X profile</h2>
        <p className="mt-1 text-sm text-ink/50 dark:text-[#9AA3B0]">
          The more specific, the better the threads.
        </p>
      </div>

      {error && <div className="banner-error">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">X handle (optional)</label>
          <input type="text" className="input" placeholder="@yourhandle"
            value={form.handle ?? ""} onChange={e => update("handle", e.target.value)} />
        </div>
        <div>
          <label className="label">Tone</label>
          <select className="input" value={form.tone ?? "conversational"}
            onChange={e => update("tone", e.target.value)}>
            {TONES.map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Niche (be specific)</label>
        <input type="text" className="input"
          placeholder="AI tools for developers, SaaS growth, freelance design"
          value={form.niche ?? ""} onChange={e => update("niche", e.target.value)} />
      </div>

      <div>
        <label className="label">Target audience</label>
        <input type="text" className="input"
          placeholder="Junior developers, early-stage founders, freelancers"
          value={form.target_audience ?? ""} onChange={e => update("target_audience", e.target.value)} />
      </div>

      <div>
        <label className="label">Preferred thread formats</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {FORMATS.map(f => {
            const active = (form.preferred_formats ?? "").includes(f);
            return (
              <button key={f} type="button"
                onClick={() => {
                  const cur  = (form.preferred_formats ?? "").split(",").map(s => s.trim()).filter(Boolean);
                  const next = active ? cur.filter(x => x !== f) : [...cur, f];
                  update("preferred_formats", next.join(", "));
                }}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition min-h-[32px]
                  ${active
                    ? "bg-cobalt-500 text-white border-cobalt-500"
                    : "border-gray-200 dark:border-gray-700 text-ink/60 dark:text-[#9AA3B0] hover:border-cobalt-300 dark:hover:border-cobalt-700"
                  }`}>
                {FORMAT_LABELS[f] ?? f}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="label">
          Past tweets{" "}
          <span className="font-normal text-ink/30 dark:text-[#9AA3B0]/40">(one per line — style reference)</span>
        </label>
        <textarea rows={5} className="input resize-none text-sm"
          placeholder={"Here is what nobody tells you about shipping fast.\nMost developers optimize for the wrong thing.\nI tested 10 AI tools this week. Here is what I actually use."}
          value={form.past_tweets ?? ""} onChange={e => update("past_tweets", e.target.value)} />
      </div>

      <button onClick={handleSave} disabled={saving || !form.niche?.trim()} className="btn-primary w-full">
        {saving ? "Saving…" : "Save profile"}
      </button>
    </div>
  );
}

// ── Generating skeleton ───────────────────────────────────────────────────────
function GeneratingSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-xl border border-[#0F1419]/10 dark:border-[#F1F3F6]/10
                      bg-[#0F1419] dark:bg-[#15181E] px-5 py-4">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent shrink-0" />
        <p className="text-sm font-medium text-white">Researching trends and writing threads…</p>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="preview-card overflow-hidden animate-pulse">
          {/* X header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex gap-3 items-center">
            <div className="skeleton h-[18px] w-[18px] rounded" />
            <div className="skeleton-line w-20 h-3" />
          </div>
          {/* Tweet rows */}
          <div className="px-4 pt-4 pb-2 space-y-5">
            {[1, 2].map(j => (
              <div key={j} className="flex gap-3">
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="skeleton h-9 w-9 rounded-full" />
                  {j === 1 && <div className="w-px h-8 skeleton" />}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="skeleton-line w-32 h-3" />
                  <div className="skeleton-line w-full h-3" />
                  <div className="skeleton-line w-5/6 h-3" />
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
            <div className="skeleton-line w-28 h-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function XThreadsPage() {
  const [profile,         setProfile]         = useState<XProfile | null>(null);
  const [batch,           setBatch]           = useState<XThreadsBatch | null>(null);
  const [batches,         setBatches]         = useState<{ batch_id: string; created_at: string }[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [generating,      setGenerating]      = useState(false);
  const [error,           setError]           = useState("");
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showHistory,     setShowHistory]     = useState(false);

  const loadData = useCallback(async () => {
    const [pRes, bRes, listRes] = await Promise.allSettled([
      xThreadsApi.getProfile(), xThreadsApi.latest(), xThreadsApi.listBatches(),
    ]);
    if (pRes.status    === "fulfilled") {
      setProfile(pRes.value.data as XProfile);
      if (!(pRes.value.data as XProfile).niche) setShowProfileForm(true);
    }
    if (bRes.status    === "fulfilled") setBatch(bRes.value.data as XThreadsBatch);
    if (listRes.status === "fulfilled") setBatches(listRes.value.data as { batch_id: string; created_at: string }[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleGenerate() {
    setError(""); setGenerating(true);
    try {
      const { data } = await xThreadsApi.generate();
      const b = data as XThreadsBatch;
      setBatch(b);
      setBatches(prev => [{ batch_id: b.batch_id, created_at: new Date().toISOString() }, ...prev]);
      setShowProfileForm(false);
    } catch (err) {
      setError(err instanceof AxiosError
        ? err.response?.data?.detail ?? "Generation failed"
        : "Something went wrong");
    } finally { setGenerating(false); }
  }

  async function loadBatch(batchId: string) {
    const { data } = await xThreadsApi.getBatch(batchId);
    setBatch(data as XThreadsBatch); setShowHistory(false);
  }

  async function deleteBatch(batchId: string) {
    await xThreadsApi.deleteBatch(batchId);
    setBatches(prev => prev.filter(b => b.batch_id !== batchId));
    if (batch?.batch_id === batchId) {
      const rem = batches.filter(b => b.batch_id !== batchId);
      rem.length > 0 ? await loadBatch(rem[0].batch_id) : setBatch(null);
    }
  }

  function handleThreadUpdate(updated: XThreadItem) {
    setBatch(prev =>
      prev ? { ...prev, threads: prev.threads.map(t => t.id === updated.id ? updated : t) } : prev
    );
  }

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-cobalt-500 border-t-transparent" />
    </div>
  );

  const activeThreads = batch?.threads ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">

      {/* ── Page header ── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="display text-3xl text-ink dark:text-[#F1F3F6]">X Threads</h1>
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
                  <div className="absolute left-0 top-full mt-1 z-50 w-64 card shadow-lg overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      {batches.map((b, idx) => (
                        <div key={b.batch_id}
                          className={`flex items-center justify-between px-4 py-2.5
                            border-b border-gray-50 dark:border-gray-800/60 last:border-0
                            hover:bg-gray-50 dark:hover:bg-gray-800/60 transition
                            ${b.batch_id === batch?.batch_id
                              ? "bg-cobalt-50/50 dark:bg-cobalt-900/20"
                              : ""}`}>
                          <button onClick={() => loadBatch(b.batch_id)} className="flex-1 text-left min-h-[40px] flex items-center gap-2">
                            <span className={`text-sm font-medium ${b.batch_id === batch?.batch_id
                              ? "text-cobalt-600 dark:text-cobalt-400"
                              : "text-ink/80 dark:text-[#F1F3F6]/70"}`}>
                              {idx === 0 ? "Latest" : `Batch ${batches.length - idx}`}
                            </span>
                            <span className="font-mono text-mono-xs text-ink/30 dark:text-[#9AA3B0]/40">
                              {new Date(b.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                            </span>
                          </button>
                          {idx !== 0 && (
                            <button onClick={() => deleteBatch(b.batch_id)}
                              className="ml-2 text-xs text-ink/25 dark:text-[#9AA3B0]/40
                                         hover:text-editorred transition min-h-[40px] px-1">
                              Delete
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="mt-1 text-sm text-ink/50 dark:text-[#9AA3B0]">
            Native threads in your voice. Trend-aware and ready to post.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShowProfileForm(v => !v)} className="btn-secondary text-sm">
            {showProfileForm ? "Hide profile" : "Edit profile"}
          </button>
          {profile?.niche && (
            <button onClick={handleGenerate} disabled={generating} className="btn-primary text-sm">
              {generating
                ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Generating…</>
                : "Generate threads"}
            </button>
          )}
        </div>
      </div>

      {error && <div className="mb-6 banner-error">{error}</div>}

      {/* Profile form */}
      {showProfileForm && profile && (
        <div className="mb-8">
          <ProfileForm profile={profile} onSave={p => { setProfile(p); if (p.niche) setShowProfileForm(false); }} />
        </div>
      )}

      {/* Generating */}
      {generating && <GeneratingSkeleton />}

      {/* Empty — no profile niche */}
      {!generating && !profile?.niche && !showProfileForm && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2
                        border-dashed border-gray-200 dark:border-gray-800 py-24 text-center">
          <h2 className="display text-2xl text-ink dark:text-[#F1F3F6] mb-2">Set up your X profile</h2>
          <p className="text-sm text-ink/50 dark:text-[#9AA3B0] max-w-xs mb-6">
            Add your niche and tone so threads are written for your audience.
          </p>
          <button onClick={() => setShowProfileForm(true)} className="btn-primary">Set up profile</button>
        </div>
      )}

      {/* Empty — profile exists, no batches */}
      {!generating && profile?.niche && !batch && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2
                        border-dashed border-gray-200 dark:border-gray-800 py-24 text-center">
          <h2 className="display text-2xl text-ink dark:text-[#F1F3F6] mb-2">No threads yet</h2>
          <p className="text-sm text-ink/50 dark:text-[#9AA3B0] max-w-xs mb-6">
            Generate to get 5 native X threads based on live trends in your niche.
          </p>
          <button onClick={handleGenerate} className="btn-primary">Generate threads</button>
        </div>
      )}

      {/* Thread list */}
      {!generating && activeThreads.length > 0 && (
        <>
          <div className="mb-5 flex items-center justify-between">
            <p className="font-mono text-mono-sm text-ink/40 dark:text-[#9AA3B0]/50">
              <span className="font-semibold text-ink/70 dark:text-[#F1F3F6]/70">
                {activeThreads.length}
              </span> threads
              {batch?.model_used && <> · <span>{batch.model_used}</span></>}
            </p>
            <button onClick={handleGenerate} disabled={generating}
              className="text-xs font-medium text-cobalt-500 dark:text-cobalt-400
                         hover:text-cobalt-700 dark:hover:text-cobalt-300 transition">
              Refresh
            </button>
          </div>
          <div className="space-y-5">
            {activeThreads.map(thread => (
              <XThreadPreview
                key={thread.id}
                tweets={thread.tweets}
                topic={thread.topic}
                format={thread.format}
                status={thread.status}
                onCopyAll={async () => {
                  await navigator.clipboard.writeText(thread.tweets.join("\n\n"));
                  const { data } = await xThreadsApi.copy(thread.id);
                  handleThreadUpdate(data as unknown as XThreadItem);
                }}
                onEdit={async (tweets) => {
                  const { data } = await xThreadsApi.edit(thread.id, tweets.filter(Boolean));
                  handleThreadUpdate(data as unknown as XThreadItem);
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
