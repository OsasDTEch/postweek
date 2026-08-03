import { useCallback, useEffect, useState } from "react";
import { xThreadsApi } from "../lib/api";
import type { XProfile, XThreadItem, XThreadsBatch } from "../types";
import { AxiosError } from "axios";

const FORMAT_STYLES: Record<string, { badge: string; strip: string }> = {
  opinion:       { badge: "bg-orange-50 text-orange-600",  strip: "bg-orange-500" },
  tips:          { badge: "bg-green-50 text-green-600",    strip: "bg-green-500" },
  story:         { badge: "bg-violet-50 text-violet-600",  strip: "bg-violet-500" },
  hot_take:      { badge: "bg-red-50 text-red-600",        strip: "bg-red-500" },
  thread_essay:  { badge: "bg-blue-50 text-blue-600",      strip: "bg-blue-500" },
  qa:            { badge: "bg-amber-50 text-amber-600",    strip: "bg-amber-500" },
};

const FORMAT_LABELS: Record<string, string> = {
  opinion: "Opinion", tips: "Tips", story: "Story",
  hot_take: "Hot take", thread_essay: "Thread essay", qa: "Q&A",
};

const TONES = ["conversational", "punchy", "educational", "provocative"];
const FORMATS = ["opinion", "tips", "story", "hot_take", "thread_essay", "qa"];

function CharCount({ text }: { text: string }) {
  const len = text.length;
  return (
    <span className={`text-xs tabular-nums ${len > 280 ? "text-red-500 font-semibold" : "text-gray-400"}`}>
      {len}/280
    </span>
  );
}

// ---- Thread Card ----
function ThreadCard({ thread, onUpdate }: { thread: XThreadItem; onUpdate: (t: XThreadItem) => void }) {
  const [editing, setEditing] = useState(false);
  const [editTweets, setEditTweets] = useState<string[]>(thread.tweets);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [allCopied, setAllCopied] = useState(false);
  const fmt = FORMAT_STYLES[thread.format] ?? { badge: "bg-gray-50 text-gray-500", strip: "bg-gray-400" };
  const isCopied = thread.status === "copied";

  async function handleSave() {
    setLoading(true);
    try {
      const { data } = await xThreadsApi.edit(thread.id, editTweets.filter(Boolean));
      onUpdate(data as unknown as XThreadItem);
      setEditing(false);
    } finally { setLoading(false); }
  }

  async function handleCopyTweet(text: string, idx: number) {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1800);
  }

  async function handleCopyAll() {
    await navigator.clipboard.writeText(thread.tweets.join("\n\n"));
    setAllCopied(true);
    const { data } = await xThreadsApi.copy(thread.id);
    onUpdate(data as unknown as XThreadItem);
    setTimeout(() => setAllCopied(false), 2000);
  }

  return (
    <div className={`card-hover overflow-hidden ${isCopied ? "opacity-60" : ""}`}>
      <div className={`h-1 w-full ${fmt.strip}`} />
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${fmt.badge}`}>
              {FORMAT_LABELS[thread.format] ?? thread.format}
            </span>
            {isCopied && (
              <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                Copied
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">{thread.tweets.length} tweets</span>
        </div>

        {/* Topic */}
        <p className="text-sm font-semibold text-gray-800 mb-4 dark:text-gray-200">{thread.topic}</p>

        {/* Tweet list — edit or view */}
        {editing ? (
          <div className="space-y-3 mb-4">
            {editTweets.map((tw, idx) => (
              <div key={idx}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-400">Tweet {idx + 1}</span>
                  <CharCount text={tw} />
                </div>
                <textarea rows={3} className="input resize-none text-sm"
                  value={tw} onChange={(e) => { const n = [...editTweets]; n[idx] = e.target.value; setEditTweets(n); }} />
              </div>
            ))}
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={loading} className="btn-primary text-xs px-3 py-1.5">{loading ? "Saving…" : "Save"}</button>
              <button onClick={() => { setEditing(false); setEditTweets(thread.tweets); }} className="btn-ghost text-xs px-3 py-1.5">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {thread.tweets.map((tw, idx) => (
              <div key={idx} className="group relative rounded-xl border border-gray-100 bg-gray-50 p-3 dark:bg-gray-800 dark:border-gray-700">
                {idx < thread.tweets.length - 1 && <div className="absolute left-5 top-full h-3 w-px bg-gray-200 dark:bg-gray-700" />}
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-800 leading-relaxed flex-1 whitespace-pre-wrap dark:text-gray-200">{tw}</p>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <CharCount text={tw} />
                    <button onClick={() => handleCopyTweet(tw, idx)}
                      className="text-xs text-gray-400 hover:text-brand-600 transition opacity-0 group-hover:opacity-100">
                      {copiedIdx === idx ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trend source */}
        {thread.trend_context && !thread.trend_context.startsWith("Evergreen") && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:bg-gray-800 dark:border-gray-700">
            <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            <p className="text-xs text-gray-500 line-clamp-2">{thread.trend_context}</p>
          </div>
        )}

        {/* Actions */}
        {!editing && !isCopied && (
          <div className="flex items-center gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
            <button onClick={() => { setEditing(true); setEditTweets(thread.tweets); }} className="btn-ghost text-xs px-3 py-1.5">Edit tweets</button>
            <div className="flex-1" />
            <button onClick={handleCopyAll} className="btn-primary text-xs px-3 py-1.5">
              {allCopied ? "Copied!" : "Copy all and done"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Profile Form ----
function ProfileForm({ profile, onSave }: { profile: XProfile; onSave: (p: XProfile) => void }) {
  const [form, setForm] = useState<XProfile>(profile);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const update = (f: keyof XProfile, v: string) => setForm((p) => ({ ...p, [f]: v }));

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
      <div className="border-b border-gray-100 pb-4 dark:border-gray-800">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">X profile</h2>
        <p className="mt-1 text-sm text-gray-500">The more specific, the better the threads.</p>
      </div>
      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">X handle (optional)</label>
          <input type="text" className="input" placeholder="@yourhandle"
            value={form.handle ?? ""} onChange={(e) => update("handle", e.target.value)} />
        </div>
        <div>
          <label className="label">Tone</label>
          <select className="input" value={form.tone ?? "conversational"} onChange={(e) => update("tone", e.target.value)}>
            {TONES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Niche (be specific)</label>
        <input type="text" className="input" placeholder="AI tools for developers, SaaS growth, freelance design"
          value={form.niche ?? ""} onChange={(e) => update("niche", e.target.value)} />
      </div>

      <div>
        <label className="label">Target audience</label>
        <input type="text" className="input" placeholder="Junior developers, early-stage founders, freelancers"
          value={form.target_audience ?? ""} onChange={(e) => update("target_audience", e.target.value)} />
      </div>

      <div>
        <label className="label">Preferred thread formats</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {FORMATS.map((f) => {
            const active = (form.preferred_formats ?? "").includes(f);
            return (
              <button key={f} type="button"
                onClick={() => {
                  const current = (form.preferred_formats ?? "").split(",").map(s => s.trim()).filter(Boolean);
                  const next = active ? current.filter(x => x !== f) : [...current, f];
                  update("preferred_formats", next.join(", "));
                }}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition ${active ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900" : "border-gray-200 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-400"}`}>
                {FORMAT_LABELS[f] ?? f}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="label">Past tweets (one per line — style reference)</label>
        <textarea rows={5} className="input resize-none text-sm"
          placeholder={"Here is what nobody tells you about shipping fast.\nMost developers optimize for the wrong thing.\nI tested 10 AI tools this week. Here is what I actually use."}
          value={form.past_tweets ?? ""} onChange={(e) => update("past_tweets", e.target.value)} />
      </div>

      <button onClick={handleSave} disabled={saving || !form.niche?.trim()} className="btn-primary w-full">
        {saving ? "Saving…" : "Save profile"}
      </button>
    </div>
  );
}

// ---- Main Page ----
export default function XThreadsPage() {
  const [profile, setProfile] = useState<XProfile | null>(null);
  const [batch, setBatch] = useState<XThreadsBatch | null>(null);
  const [batches, setBatches] = useState<{ batch_id: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const loadData = useCallback(async () => {
    const [pRes, bRes, listRes] = await Promise.allSettled([
      xThreadsApi.getProfile(),
      xThreadsApi.latest(),
      xThreadsApi.listBatches(),
    ]);
    if (pRes.status === "fulfilled") {
      setProfile(pRes.value.data as XProfile);
      if (!(pRes.value.data as XProfile).niche) setShowProfileForm(true);
    }
    if (bRes.status === "fulfilled") setBatch(bRes.value.data as XThreadsBatch);
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
      setBatches((prev) => [{ batch_id: b.batch_id, created_at: new Date().toISOString() }, ...prev]);
      setShowProfileForm(false);
    } catch (err) {
      setError(err instanceof AxiosError ? err.response?.data?.detail ?? "Generation failed" : "Something went wrong");
    } finally { setGenerating(false); }
  }

  async function loadBatch(batchId: string) {
    const { data } = await xThreadsApi.getBatch(batchId);
    setBatch(data as XThreadsBatch);
    setShowHistory(false);
  }

  async function deleteBatch(batchId: string) {
    await xThreadsApi.deleteBatch(batchId);
    setBatches((prev) => prev.filter((b) => b.batch_id !== batchId));
    if (batch?.batch_id === batchId) {
      const rem = batches.filter((b) => b.batch_id !== batchId);
      rem.length > 0 ? await loadBatch(rem[0].batch_id) : setBatch(null);
    }
  }

  function handleThreadUpdate(updated: XThreadItem) {
    setBatch((prev) => prev ? { ...prev, threads: prev.threads.map((t) => t.id === updated.id ? updated : t) } : prev);
  }

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
    </div>
  );

  const activeThreads = batch?.threads ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="page-title">X Threads</h1>
            {batches.length > 1 && (
              <div className="relative">
                <button onClick={() => setShowHistory((v) => !v)}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">
                  History
                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                </button>
                {showHistory && (
                  <div className="absolute left-0 top-full mt-1 z-50 w-64 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden dark:bg-gray-900 dark:border-gray-700">
                    <div className="max-h-64 overflow-y-auto">
                      {batches.map((b, idx) => (
                        <div key={b.batch_id} className={`flex items-center justify-between px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition dark:border-gray-800 dark:hover:bg-gray-800 ${b.batch_id === batch?.batch_id ? "bg-brand-50 dark:bg-brand-950" : ""}`}>
                          <button onClick={() => loadBatch(b.batch_id)} className="flex-1 text-left">
                            <span className={`text-sm font-medium ${b.batch_id === batch?.batch_id ? "text-brand-700 dark:text-brand-300" : "text-gray-700 dark:text-gray-300"}`}>
                              {idx === 0 ? "Latest" : `Batch ${batches.length - idx}`}
                            </span>
                            <span className="ml-2 text-xs text-gray-400">{new Date(b.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                          </button>
                          {idx !== 0 && <button onClick={() => deleteBatch(b.batch_id)} className="ml-2 text-xs text-gray-400 hover:text-red-500 transition">Delete</button>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">Native threads written in your voice. Trend-aware and ready to post.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShowProfileForm((v) => !v)} className="btn-secondary text-sm">
            {showProfileForm ? "Hide profile" : "Edit profile"}
          </button>
          {profile?.niche && (
            <button onClick={handleGenerate} disabled={generating} className="btn-primary text-sm">
              {generating ? (<><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Generating…</>) : "Generate threads"}
            </button>
          )}
        </div>
      </div>

      {error && <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100">{error}</div>}

      {showProfileForm && profile && (
        <div className="mb-8">
          <ProfileForm profile={profile} onSave={(p) => { setProfile(p); if (p.niche) setShowProfileForm(false); }} />
        </div>
      )}

      {generating && (
        <div>
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-gray-900 bg-gray-950 px-5 py-4">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent shrink-0" />
            <p className="text-sm font-medium text-white">Researching trends and writing threads…</p>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="h-1 bg-gray-100 animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-3 w-16 rounded bg-gray-100 animate-pulse" />
                  <div className="h-4 w-3/4 rounded bg-gray-100 animate-pulse" />
                  <div className="h-20 rounded-xl bg-gray-100 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!generating && !profile?.niche && !showProfileForm && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Set up your X profile first</h2>
          <p className="text-sm text-gray-500 max-w-xs mb-6">Add your niche and tone so threads are written for your audience.</p>
          <button onClick={() => setShowProfileForm(true)} className="btn-primary">Set up profile</button>
        </div>
      )}

      {!generating && profile?.niche && !batch && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">No threads yet</h2>
          <p className="text-sm text-gray-500 max-w-xs mb-6">Hit Generate to get 5 native X threads based on live trends in your niche.</p>
          <button onClick={handleGenerate} className="btn-primary">Generate threads</button>
        </div>
      )}

      {!generating && activeThreads.length > 0 && (
        <>
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900 dark:text-gray-100">{activeThreads.length}</span> threads
              {batch?.model_used && <> · <span className="font-medium">{batch.model_used}</span></>}
            </p>
            <button onClick={handleGenerate} disabled={generating} className="text-xs font-medium text-brand-600 hover:text-brand-700 transition">Refresh</button>
          </div>
          <div className="space-y-4">
            {activeThreads.map((t) => <ThreadCard key={t.id} thread={t} onUpdate={handleThreadUpdate} />)}
          </div>
        </>
      )}
    </div>
  );
}
