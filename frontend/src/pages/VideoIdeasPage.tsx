import { useCallback, useEffect, useState } from "react";
import { videoApi } from "../lib/api";
import { AxiosError } from "axios";

interface VideoProfile {
  channel_name: string | null;
  channel_type: string | null;
  niche: string | null;
  target_audience: string | null;
  content_style: string | null;
  past_titles: string | null;
}

interface VideoIdea {
  id: string;
  title: string;
  hook: string;
  angle: string;
  format: string;
  trend_context: string | null;
  status: string;
}

interface VideoIdeasBatch {
  batch_id: string;
  ideas: VideoIdea[];
  model_used?: string;
}

const CHANNEL_TYPES = [
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "instagram_reels", label: "Instagram Reels" },
  { value: "shorts", label: "YouTube Shorts" },
  { value: "podcast", label: "Podcast" },
];

const FORMAT_STYLES: Record<string, { badge: string; strip: string }> = {
  tutorial:   { badge: "bg-blue-50 text-blue-600",    strip: "bg-blue-500" },
  opinion:    { badge: "bg-orange-50 text-orange-600", strip: "bg-orange-500" },
  story:      { badge: "bg-violet-50 text-violet-600", strip: "bg-violet-500" },
  list:       { badge: "bg-green-50 text-green-600",   strip: "bg-green-500" },
  experiment: { badge: "bg-amber-50 text-amber-600",   strip: "bg-amber-500" },
  review:     { badge: "bg-pink-50 text-pink-600",     strip: "bg-pink-500" },
  reaction:   { badge: "bg-red-50 text-red-600",       strip: "bg-red-500" },
};

// ─── Idea Card ───────────────────────────────────────────────────────────────

function IdeaCard({ idea, onDismiss }: { idea: VideoIdea; onDismiss: (id: string) => void }) {
  const [copied, setCopied] = useState(false);
  const fmt = FORMAT_STYLES[idea.format] ?? { badge: "bg-gray-50 text-gray-500", strip: "bg-gray-300" };

  async function copyBrief() {
    const text = `Title: ${idea.title}\n\nHook: ${idea.hook}\n\nAngle: ${idea.angle}\n\nFormat: ${idea.format}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (idea.status === "dismissed") return null;

  return (
    <div className="card-hover overflow-hidden">
      {/* Coloured top strip by format */}
      <div className={`h-1 w-full ${fmt.strip}`} />

      <div className="p-6">
        {/* Format badge + dismiss */}
        <div className="flex items-center justify-between mb-4">
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${fmt.badge}`}>
            {idea.format}
          </span>
          <button
            onClick={() => onDismiss(idea.id)}
            className="text-xs text-gray-400 hover:text-gray-600 transition"
          >
            Dismiss
          </button>
        </div>

        {/* Title */}
        <h3 className="text-[15px] font-semibold text-gray-900 leading-snug mb-3">
          {idea.title}
        </h3>

        {/* Hook */}
        <div className="mb-4 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
          <p className="section-label mb-1.5">Hook</p>
          <p className="text-sm text-gray-700 leading-relaxed font-medium">{idea.hook}</p>
        </div>

        {/* Angle */}
        <p className="section-label mb-1.5">Angle</p>
        <p className="text-sm text-gray-600 leading-relaxed mb-5">{idea.angle}</p>

        {/* Trend source — only show if it's a real search result, not "Evergreen:" */}
        {idea.trend_context && !idea.trend_context.startsWith("Evergreen") && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
            <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{idea.trend_context}</p>
          </div>
        )}

        {/* Evergreen label */}
        {idea.trend_context && idea.trend_context.startsWith("Evergreen") && (
          <div className="mb-5">
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
              <span>Evergreen topic</span>
            </span>
          </div>
        )}

        {/* Action */}
        <div className="flex justify-end border-t border-gray-100 pt-4">
          <button onClick={copyBrief} className="btn-secondary text-xs px-3 py-2">
            {copied ? (
              <span className="text-green-600 font-semibold">Copied!</span>
            ) : (
              "Copy brief"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Form ─────────────────────────────────────────────────────────────

function ProfileForm({ profile, onSave }: { profile: VideoProfile; onSave: (p: VideoProfile) => void }) {
  const [form, setForm] = useState<VideoProfile>(profile);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(field: keyof VideoProfile, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const { data } = await videoApi.updateProfile(form as unknown as Record<string, string | null>);
      onSave(data as VideoProfile);
    } catch {
      setError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-8 space-y-5">
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-base font-semibold text-gray-900">Channel profile</h2>
        <p className="mt-1 text-sm text-gray-500">The more specific, the better the ideas.</p>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Channel name</label>
          <input type="text" className="input" placeholder="Build With Rico"
            value={form.channel_name ?? ""} onChange={(e) => update("channel_name", e.target.value)} />
        </div>
        <div>
          <label className="label">Platform</label>
          <select className="input" value={form.channel_type ?? "youtube"}
            onChange={(e) => update("channel_type", e.target.value)}>
            {CHANNEL_TYPES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Niche <span className="font-normal text-gray-400">— be specific</span></label>
        <input type="text" className="input" placeholder="AI tools for developers, Python automation, freelance design"
          value={form.niche ?? ""} onChange={(e) => update("niche", e.target.value)} />
      </div>

      <div>
        <label className="label">Target audience</label>
        <input type="text" className="input" placeholder="Junior developers learning AI, freelancers wanting more clients"
          value={form.target_audience ?? ""} onChange={(e) => update("target_audience", e.target.value)} />
      </div>

      <div>
        <label className="label">Content style</label>
        <input type="text" className="input" placeholder="Tutorial, talking head, screen share, vlogs"
          value={form.content_style ?? ""} onChange={(e) => update("content_style", e.target.value)} />
      </div>

      <div>
        <label className="label">Past video titles <span className="font-normal text-gray-400">— one per line</span></label>
        <textarea rows={5} className="input resize-none text-sm"
          placeholder={"I built an AI agent in 30 minutes\nPython automation that saves me 3 hours a week\nWhy I stopped using ChatGPT"}
          value={form.past_titles ?? ""} onChange={(e) => update("past_titles", e.target.value)} />
      </div>

      <button onClick={handleSave} disabled={saving || !form.niche?.trim()} className="btn-primary w-full">
        {saving ? "Saving…" : "Save profile"}
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VideoIdeasPage() {
  const [profile, setProfile] = useState<VideoProfile | null>(null);
  const [batch, setBatch] = useState<VideoIdeasBatch | null>(null);
  const [batches, setBatches] = useState<{ batch_id: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const loadData = useCallback(async () => {
    const [profileRes, ideasRes, batchesRes] = await Promise.allSettled([
      videoApi.getProfile(),
      videoApi.latestIdeas(),
      videoApi.listBatches(),
    ]);
    if (profileRes.status === "fulfilled") {
      setProfile(profileRes.value.data as VideoProfile);
      if (!(profileRes.value.data as VideoProfile).niche) setShowProfileForm(true);
    }
    if (ideasRes.status === "fulfilled") setBatch(ideasRes.value.data as VideoIdeasBatch);
    if (batchesRes.status === "fulfilled") setBatches(batchesRes.value.data as { batch_id: string; created_at: string }[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleGenerate() {
    setError("");
    setGenerating(true);
    try {
      const { data } = await videoApi.generateIdeas();
      setBatch(data as VideoIdeasBatch);
      setBatches((prev) => [{ batch_id: (data as VideoIdeasBatch).batch_id, created_at: new Date().toISOString() }, ...prev]);
      setShowProfileForm(false);
    } catch (err) {
      setError(err instanceof AxiosError ? err.response?.data?.detail ?? "Generation failed" : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  async function loadBatch(batchId: string) {
    try {
      const { data } = await videoApi.getBatch(batchId);
      setBatch(data as VideoIdeasBatch);
      setShowHistory(false);
    } catch { /* silent */ }
  }

  async function deleteBatch(batchId: string) {
    try {
      await videoApi.deleteBatch(batchId);
      setBatches((prev) => prev.filter((b) => b.batch_id !== batchId));
      if (batch?.batch_id === batchId) {
        // Load the next most recent batch
        const remaining = batches.filter((b) => b.batch_id !== batchId);
        if (remaining.length > 0) {
          await loadBatch(remaining[0].batch_id);
        } else {
          setBatch(null);
        }
      }
    } catch { /* silent */ }
  }

  async function handleDismiss(ideaId: string) {
    try {
      await videoApi.dismissIdea(ideaId);
      setBatch((prev) =>
        prev ? { ...prev, ideas: prev.ideas.map((i) => i.id === ideaId ? { ...i, status: "dismissed" } : i) } : prev
      );
    } catch { /* non-critical */ }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  const activeIdeas = batch?.ideas.filter((i) => i.status !== "dismissed") ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">

      {/* Page header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="page-title">Video ideas</h1>
            {batches.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowHistory((v) => !v)}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition shadow-sm"
                >
                  History
                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
                {showHistory && (
                  <div className="absolute left-0 top-full mt-1 z-50 w-72 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                    <p className="px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                      Past batches
                    </p>
                    <div className="max-h-64 overflow-y-auto">
                      {batches.map((b, idx) => (
                        <div key={b.batch_id} className={`flex items-center justify-between px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition ${b.batch_id === batch?.batch_id ? "bg-brand-50" : ""}`}>
                          <button onClick={() => loadBatch(b.batch_id)} className="flex-1 text-left">
                            <span className={`text-sm font-medium ${b.batch_id === batch?.batch_id ? "text-brand-700" : "text-gray-700"}`}>
                              {idx === 0 ? "Latest" : `Batch ${batches.length - idx}`}
                            </span>
                            <span className="ml-2 text-xs text-gray-400">
                              {new Date(b.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                            </span>
                          </button>
                          {idx !== 0 && (
                            <button
                              onClick={() => deleteBatch(b.batch_id)}
                              className="ml-2 text-xs text-gray-400 hover:text-red-500 transition"
                              title="Delete batch"
                            >
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
          <p className="mt-1 text-sm text-gray-500">
            Live trend research. Seven ready-to-film briefs, matched to your style.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShowProfileForm((v) => !v)} className="btn-secondary text-sm">
            {showProfileForm ? "Hide profile" : "Edit profile"}
          </button>
          {profile?.niche && (
            <button onClick={handleGenerate} disabled={generating} className="btn-primary text-sm">
              {generating ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Searching…
                </>
              ) : (
                "Generate ideas"
              )}
            </button>
          )}
        </div>
      </div>

      {error && <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100">{error}</div>}

      {/* Profile form */}
      {showProfileForm && profile && (
        <div className="mb-8">
          <ProfileForm profile={profile} onSave={(p) => { setProfile(p); if (p.niche) setShowProfileForm(false); }} />
        </div>
      )}

      {/* Generating state */}
      {generating && (
        <div>
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50 px-5 py-4">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent shrink-0" />
            <p className="text-sm font-medium text-brand-700">Searching for trending topics in your niche…</p>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="h-1 w-full bg-gray-100 animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-3 w-16 rounded bg-gray-100 animate-pulse" />
                  <div className="h-4 w-3/4 rounded bg-gray-100 animate-pulse" />
                  <div className="h-16 w-full rounded-xl bg-gray-100 animate-pulse" />
                  <div className="h-3 w-full rounded bg-gray-100 animate-pulse" />
                  <div className="h-3 w-2/3 rounded bg-gray-100 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty — no profile niche */}
      {!generating && !profile?.niche && !showProfileForm && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
            <svg className="h-6 w-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">Set up your channel first</h2>
          <p className="text-sm text-gray-500 max-w-xs mb-6">Add your niche so we can find trends that actually apply to you.</p>
          <button onClick={() => setShowProfileForm(true)} className="btn-primary">Set up profile</button>
        </div>
      )}

      {/* Empty — profile exists but no ideas yet */}
      {!generating && profile?.niche && !batch && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
          <h2 className="text-base font-semibold text-gray-900 mb-1">No ideas yet</h2>
          <p className="text-sm text-gray-500 max-w-xs mb-6">Hit Generate to search live trends and get 7 video briefs tailored to your niche.</p>
          <button onClick={handleGenerate} className="btn-primary">Generate ideas</button>
        </div>
      )}

      {/* Ideas */}
      {!generating && activeIdeas.length > 0 && (
        <>
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900">{activeIdeas.length}</span> ideas
              {batch?.model_used && (
                <> · <span className="font-medium">{batch.model_used}</span></>
              )}
            </p>
            <button onClick={handleGenerate} disabled={generating} className="text-xs font-medium text-brand-600 hover:text-brand-700 transition">
              Refresh ideas
            </button>
          </div>
          <div className="space-y-4">
            {activeIdeas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} onDismiss={handleDismiss} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
