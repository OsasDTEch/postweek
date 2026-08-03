import { useState } from "react";
import { postsApi } from "../lib/api";
import type { Post } from "../types";
import { AxiosError } from "axios";
import clsx from "clsx";

const PILLAR_LABELS: Record<string, string> = {
  personal_story: "Personal story",
  opinion: "Opinion",
  how_to: "How-to",
  engagement_question: "Question",
  behind_the_scenes: "Behind the scenes",
};

const PILLAR_COLORS: Record<string, string> = {
  personal_story: "bg-purple-100 text-purple-700",
  opinion: "bg-orange-100 text-orange-700",
  how_to: "bg-green-100 text-green-700",
  engagement_question: "bg-blue-100 text-blue-700",
  behind_the_scenes: "bg-pink-100 text-pink-700",
};

interface PostCardProps {
  post: Post;
  onUpdate: (post: Post) => void;
}

export default function PostCard({ post, onUpdate }: PostCardProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.edited_body ?? post.body);
  const [regenOpen, setRegenOpen] = useState(false);
  const [steeringNote, setSteeringNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const displayBody = post.edited_body ?? post.body;
  const isCopied = post.status === "copied";

  // ---- Save inline edit ----
  async function handleSaveEdit() {
    if (editText.trim() === displayBody) {
      setEditing(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await postsApi.edit(post.id, editText.trim());
      onUpdate(data);
      setEditing(false);
    } catch {
      setError("Failed to save edit");
    } finally {
      setLoading(false);
    }
  }

  // ---- Regenerate ----
  async function handleRegen() {
    setLoading(true);
    setError("");
    try {
      const { data } = await postsApi.regenerate(post.id, steeringNote || undefined);
      onUpdate(data);
      setRegenOpen(false);
      setSteeringNote("");
      setEditText(data.edited_body ?? data.body);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 402) {
        setError("Upgrade to regenerate more posts.");
      } else {
        setError("Regeneration failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  // ---- Copy & mark done ----
  async function handleCopy() {
    const text = post.edited_body ?? post.body;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    try {
      const { data } = await postsApi.markCopied(post.id);
      onUpdate(data);
    } catch {
      // non-critical
    }
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className={clsx(
        "card p-6 transition",
        isCopied && "opacity-60 border-green-200"
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              "rounded-full px-2.5 py-0.5 text-xs font-medium",
              PILLAR_COLORS[post.pillar] ?? "bg-gray-100 text-gray-600"
            )}
          >
            {PILLAR_LABELS[post.pillar] ?? post.pillar}
          </span>
          <span className="text-xs text-gray-400 font-medium">{post.suggested_day}</span>
        </div>

        {isCopied && (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600">
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Copied
          </span>
        )}
      </div>

      {/* Post body — view or edit */}
      {editing ? (
        <div className="space-y-3">
          <textarea
            rows={8}
            className="input resize-none text-sm leading-relaxed"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={loading}
              className="btn-primary text-xs px-3 py-1.5"
            >
              {loading ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setEditText(displayBody);
              }}
              className="btn-ghost text-xs px-3 py-1.5"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p
          className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap cursor-text"
          onClick={() => {
            if (!isCopied) {
              setEditing(true);
              setEditText(displayBody);
            }
          }}
          title={isCopied ? undefined : "Click to edit"}
        >
          {displayBody}
        </p>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}

      {/* Regenerate panel */}
      {regenOpen && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
          <label className="label text-xs">Steering note (optional)</label>
          <input
            type="text"
            className="input text-sm"
            placeholder="e.g. make it shorter, more personal, add a story"
            value={steeringNote}
            onChange={(e) => setSteeringNote(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={handleRegen}
              disabled={loading}
              className="btn-primary text-xs px-3 py-1.5"
            >
              {loading ? "Regenerating…" : "Regenerate"}
            </button>
            <button
              onClick={() => setRegenOpen(false)}
              className="btn-ghost text-xs px-3 py-1.5"
            >
              Cancel
            </button>
          </div>
          {error && (
            <p className="text-xs text-amber-600 mt-2">{error}</p>
          )}
        </div>
      )}

      {/* Action bar */}
      {!editing && !isCopied && (
        <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
          <button
            onClick={() => setRegenOpen((v) => !v)}
            disabled={loading}
            className="btn-ghost text-xs px-3 py-1.5"
            aria-label="Regenerate post"
          >
            Regenerate
          </button>
          <div className="flex-1" />
          <button
            onClick={handleCopy}
            disabled={loading}
            className="btn-primary text-xs px-3 py-1.5"
          >
            {copied ? "Copied!" : "Copy & mark done"}
          </button>
        </div>
      )}
    </div>
  );
}
