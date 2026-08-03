import { useState } from "react";
import { postsApi } from "../lib/api";
import type { Post, XPost } from "../types";
import { AxiosError } from "axios";
import clsx from "clsx";

const PILLAR_LABELS: Record<string, string> = {
  personal_story: "Personal story",
  opinion: "Opinion",
  how_to: "How-to",
  engagement_question: "Question",
  behind_the_scenes: "Behind the scenes",
};

const TWEET_SEPARATOR = "\n---\n";

function parseTweets(post: Post): string[] {
  const body = post.edited_body ?? post.body;
  // If it's an XPost with pre-split tweets from backend, use those
  if ("tweets" in post && Array.isArray((post as XPost).tweets)) {
    return (post as XPost).tweets;
  }
  return body.split(TWEET_SEPARATOR).map((t) => t.trim()).filter(Boolean);
}

function CharCount({ text }: { text: string }) {
  const len = text.length;
  const over = len > 280;
  return (
    <span className={clsx("text-xs tabular-nums", over ? "text-red-500 font-semibold" : "text-gray-400")}>
      {len}/280
    </span>
  );
}

interface XPostCardProps {
  post: Post;
  onUpdate: (post: Post) => void;
  /** Called when the card requests deletion (e.g. user dismisses the X version) */
  onDismiss?: (postId: string) => void;
}

export default function XPostCard({ post, onUpdate, onDismiss }: XPostCardProps) {
  const tweets = parseTweets(post);
  const [editTweets, setEditTweets] = useState<string[]>(tweets);
  const [editing, setEditing] = useState(false);
  const [reRepurposing, setReRepurposing] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [allCopied, setAllCopied] = useState(false);
  const [error, setError] = useState("");

  const isCopied = post.status === "copied";

  // ---- Save edits ----
  async function handleSaveEdit() {
    const joined = editTweets.map((t) => t.trim()).filter(Boolean).join(TWEET_SEPARATOR);
    try {
      const { data } = await postsApi.edit(post.id, joined);
      onUpdate(data);
      setEditing(false);
    } catch {
      setError("Failed to save edits");
    }
  }

  // ---- Re-repurpose ----
  async function handleReRepurpose() {
    setReRepurposing(true);
    setError("");
    try {
      const { data } = await postsApi.reRepurpose(post.id);
      onUpdate(data as unknown as Post);
      setEditTweets(parseTweets(data as unknown as Post));
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? err.response?.data?.detail ?? "Regeneration failed"
          : "Regeneration failed"
      );
    } finally {
      setReRepurposing(false);
    }
  }

  // ---- Copy single tweet ----
  async function handleCopyTweet(text: string, idx: number) {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1800);
  }

  // ---- Copy all + mark done ----
  async function handleCopyAll() {
    const allText = tweets.join("\n\n");
    await navigator.clipboard.writeText(allText);
    setAllCopied(true);
    try {
      const { data } = await postsApi.markCopied(post.id);
      onUpdate(data);
    } catch {
      // non-critical
    }
    setTimeout(() => setAllCopied(false), 2000);
  }

  return (
    <div className={clsx("card p-6 transition border-l-4 border-l-gray-900", isCopied && "opacity-60")}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {/* X logo mark */}
          <span className="flex h-5 w-5 items-center justify-center rounded bg-gray-900">
            <svg viewBox="0 0 24 24" fill="white" className="h-3 w-3" aria-label="X">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </span>
          <span className={clsx(
            "rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600"
          )}>
            {PILLAR_LABELS[post.pillar] ?? post.pillar}
          </span>
          <span className="text-xs text-gray-400 font-medium">{post.suggested_day}</span>
          <span className="text-xs text-gray-400">{tweets.length} tweets</span>
        </div>

        <div className="flex items-center gap-2">
          {isCopied && (
            <span className="flex items-center gap-1 text-xs font-medium text-green-600">
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Copied
            </span>
          )}
          {onDismiss && (
            <button
              onClick={() => onDismiss(post.id)}
              className="text-xs text-gray-400 hover:text-gray-600 transition"
              aria-label="Dismiss X thread"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>

      {/* Thread view */}
      {editing ? (
        <div className="space-y-3">
          {editTweets.map((tweet, idx) => (
            <div key={idx} className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-400">Tweet {idx + 1}</span>
                <CharCount text={tweet} />
              </div>
              <textarea
                rows={3}
                className="input resize-none text-sm leading-relaxed"
                value={tweet}
                onChange={(e) => {
                  const next = [...editTweets];
                  next[idx] = e.target.value;
                  setEditTweets(next);
                }}
              />
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <button onClick={handleSaveEdit} className="btn-primary text-xs px-3 py-1.5">
              Save
            </button>
            <button
              onClick={() => { setEditing(false); setEditTweets(tweets); }}
              className="btn-ghost text-xs px-3 py-1.5"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {tweets.map((tweet, idx) => (
            <div key={idx} className="group relative rounded-xl border border-gray-100 bg-gray-50 p-3">
              {/* Thread connector line */}
              {idx < tweets.length - 1 && (
                <div className="absolute left-5 top-full h-3 w-px bg-gray-200" />
              )}
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-gray-800 leading-relaxed flex-1 whitespace-pre-wrap">
                  {tweet}
                </p>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <CharCount text={tweet} />
                  <button
                    onClick={() => handleCopyTweet(tweet, idx)}
                    className="text-xs text-gray-400 hover:text-brand-600 transition opacity-0 group-hover:opacity-100"
                    aria-label={`Copy tweet ${idx + 1}`}
                  >
                    {copiedIdx === idx ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {/* Action bar */}
      {!editing && !isCopied && (
        <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
          <button
            onClick={() => setEditing(true)}
            className="btn-ghost text-xs px-3 py-1.5"
          >
            Edit tweets
          </button>
          <button
            onClick={handleReRepurpose}
            disabled={reRepurposing}
            className="btn-ghost text-xs px-3 py-1.5"
          >
            {reRepurposing ? "Regenerating…" : "↺ Regenerate"}
          </button>
          <div className="flex-1" />
          <button
            onClick={handleCopyAll}
            className="btn-primary text-xs px-3 py-1.5"
          >
            {allCopied ? "Copied!" : "Copy all & done"}
          </button>
        </div>
      )}
    </div>
  );
}
