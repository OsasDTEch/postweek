import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { postsApi, profileApi, samplesApi, weeksApi } from "../lib/api";
import type { Platform, Post, Week, WeekSummary } from "../types";
import { AxiosError } from "axios";
import PostCard from "../components/PostCard";
import XPostCard from "../components/XPostCard";
import GenerateButton from "../components/GenerateButton";

type PlatformTab = Platform;

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function formatWeekDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function DashboardPage() {
  const [week, setWeek] = useState<Week | null>(null);
  const [allWeeks, setAllWeeks] = useState<WeekSummary[]>([]);
  const [loadingWeek, setLoadingWeek] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<PlatformTab>("linkedin");
  const [repurposing, setRepurposing] = useState<Record<string, boolean>>({});
  const [showHistory, setShowHistory] = useState(false);
  // Voice mode — null = still loading, "samples" = has past posts, "preset" = tone only
  const [voiceMode, setVoiceMode] = useState<"samples" | "preset" | null>(null);
  const [tonePreset, setTonePreset] = useState<string | null>(null);

  const loadLatest = useCallback(async () => {
    try {
      const [weekRes, listRes, samplesRes, profileRes] = await Promise.allSettled([
        weeksApi.latest(),
        weeksApi.list(),
        samplesApi.list(),
        profileApi.get(),
      ]);
      if (weekRes.status === "fulfilled") setWeek(weekRes.value.data);
      if (listRes.status === "fulfilled") setAllWeeks(listRes.value.data);
      if (samplesRes.status === "fulfilled") {
        const hasSamples = samplesRes.value.data.length > 0;
        setVoiceMode(hasSamples ? "samples" : "preset");
      }
      if (profileRes.status === "fulfilled") {
        setTonePreset(profileRes.value.data.tone_preset ?? "professional");
      }
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status !== 404) {
        // non-404 errors don't wipe state
      }
    } finally {
      setLoadingWeek(false);
    }
  }, []);

  useEffect(() => { loadLatest(); }, [loadLatest]);

  async function loadWeek(id: string) {
    try {
      const { data } = await weeksApi.get(id);
      setWeek(data);
      setActiveTab("linkedin");
      setShowHistory(false);
    } catch { /* silent */ }
  }

  async function handleGenerate() {
    setError("");
    setGenerating(true);
    try {
      const { data } = await weeksApi.generate();
      setWeek(data);
      setAllWeeks((prev) => [data, ...prev]);
      setActiveTab("linkedin");
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.detail ?? "Generation failed. Please try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setGenerating(false);
    }
  }

  function handlePostUpdate(updated: Post) {
    setWeek((prev) =>
      prev ? { ...prev, posts: prev.posts.map((p) => (p.id === updated.id ? updated : p)) } : prev
    );
  }

  function handleXPostAdded(xPost: Post) {
    setWeek((prev) => prev ? { ...prev, posts: [...prev.posts, xPost] } : prev);
  }

  async function handleRepurpose(linkedInPostId: string) {
    setRepurposing((prev) => ({ ...prev, [linkedInPostId]: true }));
    setError("");
    try {
      const { data } = await postsApi.repurpose(linkedInPostId);
      handleXPostAdded(data as unknown as Post);
      setActiveTab("x");
    } catch (err) {
      setError(err instanceof AxiosError ? err.response?.data?.detail ?? "Repurpose failed" : "Repurpose failed");
    } finally {
      setRepurposing((prev) => ({ ...prev, [linkedInPostId]: false }));
    }
  }

  const linkedInPosts = week?.posts
    .filter((p) => p.platform === "linkedin")
    .sort((a, b) => {
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      return days.indexOf(a.suggested_day) - days.indexOf(b.suggested_day);
    }) ?? [];

  const xPosts = week?.posts
    .filter((p) => p.platform === "x")
    .sort((a, b) => {
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      return days.indexOf(a.suggested_day) - days.indexOf(b.suggested_day);
    }) ?? [];

  const copiedLinkedIn = linkedInPosts.filter((p) => p.status === "copied").length;
  const weekAgeMs = week ? Date.now() - new Date(week.created_at).getTime() : 0;
  const weekIsOld = weekAgeMs > 6 * 24 * 60 * 60 * 1000;
  const showNextWeek = week && (copiedLinkedIn >= 3 || weekIsOld);

  if (loadingWeek) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="page-title">This week's posts</h1>
            {/* Week history picker */}
            {allWeeks.length > 1 && (
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
                  <div className="absolute left-0 top-full mt-1 z-50 w-64 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                    <p className="px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                      Past weeks
                    </p>
                    <div className="max-h-64 overflow-y-auto">
                      {allWeeks.map((w, idx) => (
                        <button
                          key={w.id}
                          onClick={() => loadWeek(w.id)}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition border-b border-gray-50 last:border-0 ${
                            w.id === week?.id ? "bg-brand-50 text-brand-700 font-medium" : "text-gray-700"
                          }`}
                        >
                          <span className="font-medium">{idx === 0 ? "This week" : `Week ${allWeeks.length - idx}`}</span>
                          <span className="ml-2 text-gray-400 text-xs">{formatWeekDate(w.created_at)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {week && (
            <p className="mt-1 text-sm text-gray-500">
              {copiedLinkedIn}/5 copied · <span className="font-medium">{week.model_used ?? "AI"}</span>
              {weekIsOld && <span className="ml-2 text-amber-600 font-medium">· Ready for next week</span>}
            </p>
          )}
        </div>

        {(!week || showNextWeek) && (
          <GenerateButton
            loading={generating}
            label={week ? "Generate next week" : "Generate my week"}
            onClick={handleGenerate}
            className="shrink-0"
          />
        )}
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Voice mode indicator — shown when user has no style samples */}
      {voiceMode === "preset" && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800">
              Writing in <span className="capitalize">{tonePreset ?? "professional"}</span> tone
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Posts are generated using a preset tone, not your personal writing style.{" "}
              <Link to="/onboarding" className="font-semibold underline hover:text-amber-900">
                Add past posts
              </Link>{" "}
              to get output that sounds more like you.
            </p>
          </div>
        </div>
      )}

      {/* Platform tabs */}
      {week && !generating && (
        <div className="mb-6 flex rounded-xl border border-gray-200 bg-gray-50 p-1 gap-1">
          <button
            onClick={() => setActiveTab("linkedin")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition ${
              activeTab === "linkedin" ? "bg-white text-brand-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            LinkedIn
            {linkedInPosts.length > 0 && (
              <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-xs font-semibold text-brand-700">
                {linkedInPosts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("x")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition ${
              activeTab === "x" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <XIcon className="h-3.5 w-3.5" />
            X Threads
            {xPosts.length > 0 && (
              <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-xs font-semibold text-gray-700">
                {xPosts.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Empty state */}
      {!week && !generating && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
          <h2 className="text-base font-semibold text-gray-800 mb-2">No posts yet</h2>
          <p className="text-sm text-gray-500 max-w-xs mb-6">
            Generate your first week of posts — LinkedIn, X, and video ideas — all matched to your voice.
          </p>
          <GenerateButton loading={generating} label="Generate my week" onClick={handleGenerate} />
        </div>
      )}

      {/* Generating skeleton */}
      {generating && (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card h-44 animate-pulse bg-gray-100" />
          ))}
        </div>
      )}

      {/* LinkedIn tab */}
      {week && !generating && activeTab === "linkedin" && (
        <div className="space-y-4">
          {linkedInPosts.map((post) => {
            const hasX = xPosts.some((x) => x.pillar === post.pillar && x.suggested_day === post.suggested_day);
            return (
              <div key={post.id}>
                <PostCard post={post} onUpdate={handlePostUpdate} />
                <div className="mt-1 flex justify-end">
                  {!hasX ? (
                    <button
                      onClick={() => handleRepurpose(post.id)}
                      disabled={repurposing[post.id]}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition disabled:opacity-50"
                    >
                      {repurposing[post.id] ? (
                        <><span className="h-3 w-3 animate-spin rounded-full border border-gray-400 border-t-transparent" />Converting…</>
                      ) : (
                        <><XIcon className="h-3 w-3" />Repurpose as X thread</>
                      )}
                    </button>
                  ) : (
                    <button onClick={() => setActiveTab("x")}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 transition">
                      <XIcon className="h-3 w-3" />X thread ready
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* X tab */}
      {week && !generating && activeTab === "x" && (
        <div className="space-y-4">
          {xPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <XIcon className="h-5 w-5 text-gray-500" />
              </div>
              <h2 className="text-sm font-semibold text-gray-800 mb-1">No X threads yet</h2>
              <p className="text-sm text-gray-500 max-w-xs mb-4">Go to LinkedIn tab and click "Repurpose as X thread".</p>
              <button onClick={() => setActiveTab("linkedin")} className="btn-secondary text-xs px-4 py-2">
                View LinkedIn posts
              </button>
            </div>
          ) : (
            xPosts.map((post) => (
              <XPostCard key={post.id} post={post} onUpdate={handlePostUpdate} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
