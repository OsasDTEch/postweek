import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ThreadModalProps {
  tweets: string[];
  topic?: string;
  format?: string;
  onClose: () => void;
  onSave: (tweets: string[]) => void;
  onRegen?: () => void;
  onCopyAll: () => void;
  regenLoading?: boolean;
  isCopied: boolean;
}

const FORMAT_LABELS: Record<string, string> = {
  opinion: "Opinion", tips: "Tips", story: "Story",
  hot_take: "Hot take", thread_essay: "Essay", qa: "Q&A",
};

export default function ThreadModal({
  tweets, topic, format, onClose, onSave, onRegen, onCopyAll, regenLoading, isCopied,
}: ThreadModalProps) {
  const [editing,    setEditing]    = useState(false);
  const [editTweets, setEditTweets] = useState<string[]>(tweets);
  const [showStamp,  setShowStamp]  = useState(false);
  const formatLabel = FORMAT_LABELS[format ?? ""] ?? format ?? null;

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function handleCopyAll() {
    onCopyAll();
    setShowStamp(true);
    setTimeout(() => setShowStamp(false), 1800);
  }

  function handleSave() {
    onSave(editTweets.filter(t => t.trim()));
    setEditing(false);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog" aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] flex flex-col
                      rounded-2xl bg-white dark:bg-[#15181E]
                      shadow-[0_24px_64px_0_rgba(0,0,0,0.18)]
                      border border-gray-200/80 dark:border-gray-800 overflow-hidden">

        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4
                        border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <svg viewBox="0 0 24 24" fill="currentColor"
              className="h-4 w-4 text-[#0F1419] dark:text-[#F1F3F6] shrink-0">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <div className="min-w-0">
              {topic && (
                <p className="text-sm font-semibold text-ink dark:text-[#F1F3F6] truncate leading-tight">
                  {topic}
                </p>
              )}
              <p className="font-mono text-mono-xs text-ink/40 dark:text-[#9AA3B0]/60">
                {tweets.length} tweet{tweets.length !== 1 ? "s" : ""}
                {formatLabel && <> · {formatLabel}</>}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-ink/40 dark:text-[#9AA3B0]/60
                       hover:bg-black/5 dark:hover:bg-white/5
                       hover:text-ink dark:hover:text-[#F1F3F6] transition shrink-0"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tweet list — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 font-x space-y-0">
          {(editing ? editTweets : tweets).map((tw, idx) => {
            const len       = editTweets[idx]?.length ?? tw.length;
            const overLimit = len > 280;
            const nearLimit = len > 260 && !overLimit;

            return (
              <div key={idx} className="flex gap-3 pb-4">
                {/* Avatar + thread line */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-700
                                  flex items-center justify-center ring-1 ring-black/5 dark:ring-white/5">
                    <svg className="h-4 w-4 text-gray-500 dark:text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 13V9l5 3-5 3z"/>
                    </svg>
                  </div>
                  {idx < tweets.length - 1 && (
                    <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 mt-1 min-h-[12px]" />
                  )}
                </div>

                {/* Tweet content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[0.875rem] font-bold text-[#0F1419] dark:text-[#F1F3F6]">You</span>
                    <span className="text-[0.8125rem] text-[#536471] dark:text-[#9AA3B0]">@yourhandle · 1h</span>
                  </div>

                  {editing ? (
                    <div>
                      <textarea
                        rows={Math.max(3, Math.ceil(editTweets[idx].length / 52))}
                        value={editTweets[idx]}
                        onChange={(e) => {
                          const next = [...editTweets];
                          next[idx] = e.target.value;
                          setEditTweets(next);
                        }}
                        className={`w-full text-[0.9375rem] leading-[1.4] font-x bg-transparent
                                    border-b-2 resize-none focus:outline-none py-0.5
                                    text-[#0F1419] dark:text-[#F1F3F6]
                                    ${overLimit
                                      ? "border-editorred"
                                      : "border-cobalt-200 dark:border-cobalt-800 focus:border-cobalt-500"}`}
                      />
                      <div className="flex items-center justify-between mt-0.5">
                        {overLimit && (
                          <p className="text-[0.6875rem] text-editorred font-mono">{len - 280} over</p>
                        )}
                        <span className={`ml-auto font-mono text-[0.6875rem] tabular-nums
                          ${overLimit ? "text-editorred" : nearLimit ? "text-amber-500" : "text-[#536471]/50"}`}>
                          {len}/280
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[0.9375rem] leading-[1.4] text-[#0F1419] dark:text-[#F1F3F6] whitespace-pre-wrap">
                      {tw}
                    </p>
                  )}

                  {/* Decorative action row */}
                  {!editing && (
                    <div className="flex items-center gap-3 mt-2">
                      <button className="flex items-center gap-1 text-[#536471] dark:text-[#9AA3B0]"
                        tabIndex={-1} aria-hidden="true">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="font-mono text-[0.6875rem]">12</span>
                      </button>
                      <button className="flex items-center gap-1 text-[#536471] dark:text-[#9AA3B0]"
                        tabIndex={-1} aria-hidden="true">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="font-mono text-[0.6875rem]">84</span>
                      </button>
                      <button className="flex items-center gap-1 text-[#536471] dark:text-[#9AA3B0]"
                        tabIndex={-1} aria-hidden="true">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span className="font-mono text-[0.6875rem]">312</span>
                      </button>
                      <span className="ml-auto font-mono text-[0.6875rem] text-[#536471]/50 tabular-nums">
                        {tw.length}/280
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal footer / actions */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0
                        flex items-center gap-2 bg-gray-50/90 dark:bg-[#0D0F13]/70">

          {isCopied ? (
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">Copied and done</span>
            </div>
          ) : editing ? (
            <>
              <button onClick={handleSave} className="btn-primary text-sm px-4 py-2">Save</button>
              <button onClick={() => { setEditing(false); setEditTweets(tweets); }}
                className="btn-ghost text-sm px-3 py-2">Cancel</button>
            </>
          ) : (
            <>
              <button onClick={() => { setEditing(true); setEditTweets([...tweets]); }}
                className="btn-ghost text-sm px-3 py-2">Edit tweets</button>
              {onRegen && (
                <button onClick={onRegen} disabled={regenLoading}
                  className="btn-ghost text-sm px-3 py-2">
                  {regenLoading ? "Rewriting…" : "Rewrite"}
                </button>
              )}
              {showStamp ? (
                <span className="ml-auto font-sans text-sm font-bold text-green-600 dark:text-green-400">Copied!</span>
              ) : (
                <button onClick={handleCopyAll}
                  className="btn-primary text-sm px-5 py-2 ml-auto">
                  Copy all and done
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
