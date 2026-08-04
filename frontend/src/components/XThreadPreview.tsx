import { useState } from "react";
import ThreadModal from "./ThreadModal";

interface XThreadPreviewProps {
  tweets: string[];
  suggestedDay?: string;
  topic?: string;
  format?: string;
  status: string;
  /** compact=true collapses to hook tweet only — for 5-column week rail */
  compact?: boolean;
  onCopyAll: () => void;
  onEdit: (tweets: string[]) => void;
  onRegen?: () => void;
  regenLoading?: boolean;
}

const FORMAT_LABELS: Record<string, string> = {
  opinion:      "Opinion",
  tips:         "Tips",
  story:        "Story",
  hot_take:     "Hot take",
  thread_essay: "Essay",
  qa:           "Q&A",
};

// ── Full tweet card — used in expand mode and on XThreadsPage ─────────────────
function TweetCard({
  tweet, idx, total, editing, editValue, onChange, onCopyOne, copiedOne,
}: {
  tweet: string; idx: number; total: number;
  editing: boolean; editValue: string;
  onChange: (v: string) => void;
  onCopyOne: () => void; copiedOne: boolean;
}) {
  const len       = editValue.length;
  const overLimit = len > 280;
  const nearLimit = len > 260 && !overLimit;
  const safeText  = tweet.slice(0, 280);
  const overText  = tweet.slice(280);

  return (
    <div className="flex gap-2.5">
      <div className="flex flex-col items-center shrink-0">
        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
          <svg className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 13V9l5 3-5 3z"/>
          </svg>
        </div>
        {idx < total - 1 && <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 mt-1 min-h-[16px]" />}
      </div>

      <div className="flex-1 min-w-0 pb-4">
        <div className="flex items-center gap-1 mb-1 font-x min-w-0">
          <span className="text-[0.8125rem] font-bold text-[#0F1419] dark:text-[#F1F3F6] shrink-0">You</span>
          <span className="text-[0.75rem] text-[#536471] dark:text-[#9AA3B0] truncate">@yourhandle · 1h</span>
        </div>

        {editing ? (
          <div>
            <textarea
              rows={Math.max(2, Math.ceil(editValue.length / 55))}
              value={editValue}
              onChange={(e) => onChange(e.target.value)}
              className={`w-full text-[0.875rem] leading-[1.35] font-x bg-transparent
                          border-b-2 resize-none focus:outline-none py-0.5
                          text-[#0F1419] dark:text-[#F1F3F6]
                          ${overLimit ? "border-editorred" : "border-cobalt-300 dark:border-cobalt-800 focus:border-cobalt-500"}`}
            />
            {overLimit && (
              <p className="text-[0.625rem] text-editorred font-mono mt-0.5">{len - 280} over</p>
            )}
          </div>
        ) : (
          <p className="text-[0.875rem] leading-[1.35] text-[#0F1419] dark:text-[#F1F3F6] font-x whitespace-pre-wrap">
            {safeText}
            {overText && <span className="text-editorred underline decoration-editorred decoration-1">{overText}</span>}
          </p>
        )}

        <div className="flex items-center gap-3 mt-2">
          <button className="flex items-center gap-1 text-[#536471] dark:text-[#9AA3B0] hover:text-cobalt-500 transition"
            tabIndex={-1} aria-hidden="true">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="font-mono text-[0.625rem]">12</span>
          </button>
          <button className="flex items-center gap-1 text-[#536471] dark:text-[#9AA3B0] hover:text-green-500 transition"
            tabIndex={-1} aria-hidden="true">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="font-mono text-[0.625rem]">84</span>
          </button>
          <span className={`ml-auto font-mono text-[0.625rem] tabular-nums font-medium
            ${overLimit ? "text-editorred" : nearLimit ? "text-amber-500" : "text-[#536471]/50 dark:text-[#9AA3B0]/40"}`}>
            {editing ? len : tweet.length}/280
          </span>
          <button onClick={onCopyOne}
            className="text-[0.6875rem] font-semibold text-cobalt-500 hover:text-cobalt-700 transition">
            {copiedOne ? "✓" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function XThreadPreview({
  tweets, suggestedDay, topic, format, status, compact = false,
  onCopyAll, onEdit, onRegen, regenLoading,
}: XThreadPreviewProps) {
  const [editing,    setEditing]    = useState(false);
  const [editTweets, setEditTweets] = useState<string[]>(tweets);
  const [copiedIdx,  setCopiedIdx]  = useState<number | null>(null);
  const [showStamp,  setShowStamp]  = useState(false);
  const [expanded,   setExpanded]   = useState(false);
  const [modalOpen,  setModalOpen]  = useState(false);

  const isCopied    = status === "copied";
  const formatLabel = FORMAT_LABELS[format ?? ""] ?? format ?? null;
  const hookTweet   = tweets[0] ?? "";

  function handleCopyOne(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1800);
  }

  function handleCopyAll() {
    onCopyAll();
    setShowStamp(true);
    setTimeout(() => setShowStamp(false), 1800);
  }

  // ── Compact collapsed card ──────────────────────────────────────────────────
  // Renders ONLY when compact=true AND not yet expanded AND not editing.
  // Shows just the hook tweet + tweet count. Expand button reveals full card.
  const showCompact = compact && !expanded && !editing;

  if (showCompact) {
    return (
      <>
        <div className={`preview-card relative transition-opacity duration-150 ${isCopied ? "opacity-55" : ""}`}>
          {showStamp && <div className="stamp-badge">Copied</div>}

          {/* Compact X header */}
          <div className="px-3 pt-2.5 pb-2 flex items-center gap-1.5 border-b border-[#EFF3F4] dark:border-gray-800/60">
            <svg viewBox="0 0 24 24" fill="currentColor"
              className="h-3.5 w-3.5 text-[#0F1419] dark:text-[#F1F3F6] shrink-0">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span className="font-mono text-[0.625rem] font-semibold text-[#0F1419] dark:text-[#F1F3F6]">
              {tweets.length} tweets
            </span>
            {formatLabel && (
              <span className="font-mono text-[0.5625rem] font-semibold uppercase tracking-wider
                               px-1.5 py-0.5 rounded-full bg-[#EFF3F4] text-[#536471]
                               dark:bg-gray-800 dark:text-[#9AA3B0] ml-auto shrink-0">
                {formatLabel}
              </span>
            )}
          </div>

          {/* Hook tweet only */}
          <div className="px-3 pt-2 pb-2.5 font-x">
            <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
              <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0 flex items-center justify-center">
                <svg className="h-3 w-3 text-gray-500 dark:text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 13V9l5 3-5 3z"/>
                </svg>
              </div>
              <span className="text-[0.6875rem] font-bold text-[#0F1419] dark:text-[#F1F3F6] shrink-0">You</span>
              <span className="text-[0.5625rem] text-[#536471] dark:text-[#9AA3B0]">· 1h</span>
            </div>
            <p className="text-[0.8125rem] leading-[1.35] text-[#0F1419] dark:text-[#F1F3F6] line-clamp-5">
              {hookTweet}
            </p>
            {tweets.length > 1 && (
              <button onClick={() => setModalOpen(true)}
                className="mt-2 text-[0.625rem] font-semibold text-cobalt-500 dark:text-cobalt-400 hover:underline">
                +{tweets.length - 1} more
              </button>
            )}
          </div>

          {/* Compact actions */}
          {!isCopied ? (
            <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-gray-200/60 dark:border-gray-800/40 bg-gray-50/80 dark:bg-[#0D0F13]/60">
              <button onClick={handleCopyAll}
                className="w-full rounded-md py-1.5 text-xs font-semibold
                           bg-cobalt-500 text-white hover:bg-cobalt-600 transition active:scale-[0.98] text-center">
                Copy all
              </button>
              <button onClick={() => setModalOpen(true)}
                className="w-full rounded-md py-1.5 text-xs font-medium
                           text-ink/60 dark:text-[#9AA3B0]
                           bg-black/5 dark:bg-white/10
                           hover:bg-black/10 dark:hover:bg-white/15 transition text-center
                           border border-transparent dark:border-gray-700/50">
                Edit / expand
              </button>
            </div>
          ) : (
            <div className="px-3 py-2 border-t border-gray-200/60 dark:border-gray-800/40
                            flex items-center gap-1.5 bg-gray-50/80 dark:bg-[#0D0F13]/60">
              <svg className="h-3.5 w-3.5 text-green-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">Posted</span>
            </div>
          )}
        </div>

        {/* Modal — portal renders outside the card, into document.body */}
        {modalOpen && (
          <ThreadModal
            tweets={editTweets}
            topic={topic}
            format={format}
            isCopied={isCopied}
            onClose={() => setModalOpen(false)}
            onSave={(saved) => { onEdit(saved); setEditTweets(saved); setModalOpen(false); }}
            onRegen={onRegen}
            regenLoading={regenLoading}
            onCopyAll={() => { handleCopyAll(); setModalOpen(false); }}
          />
        )}
      </>
    );
  }

  // ── Full expanded card ──────────────────────────────────────────────────────
  return (
    <div className={`preview-card relative transition-opacity duration-150 ${isCopied ? "opacity-55" : ""}`}>
      {showStamp && <div className="stamp-badge">Copied</div>}

      {/* X platform header */}
      <div className="px-4 pt-3 pb-2.5 flex items-center justify-between border-b border-[#EFF3F4] dark:border-gray-800/60">
        <div className="flex items-center gap-2 min-w-0">
          <svg viewBox="0 0 24 24" fill="currentColor"
            className="h-[18px] w-[18px] text-[#0F1419] dark:text-[#F1F3F6] shrink-0">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span className="font-mono text-mono-xs font-semibold text-[#0F1419] dark:text-[#F1F3F6]">
            {tweets.length} tweet{tweets.length !== 1 ? "s" : ""}
          </span>
          {suggestedDay && <span className="section-label hidden sm:inline">{suggestedDay}</span>}
          {formatLabel && (
            <span className="font-mono text-[0.625rem] font-semibold uppercase tracking-wider
                             px-2 py-0.5 rounded-full bg-[#EFF3F4] text-[#536471]
                             dark:bg-gray-800 dark:text-[#9AA3B0]">
              {formatLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {compact && expanded && (
            <button onClick={() => setExpanded(false)}
              className="text-[0.6875rem] text-ink/40 dark:text-[#9AA3B0]/50 hover:text-ink/70 transition">
              Collapse
            </button>
          )}
          <span className="pillar-tag-active" style={{ fontSize: "0.6rem" }}>Thread</span>
        </div>
      </div>

      {topic && (
        <div className="px-4 pt-3 pb-0 font-x">
          <p className="text-[0.8125rem] font-semibold text-[#0F1419] dark:text-[#F1F3F6] leading-snug line-clamp-2">
            {topic}
          </p>
        </div>
      )}

      {/* Tweet chain */}
      <div className="px-4 pt-4 font-x">
        {(editing ? editTweets : tweets).map((tw, idx) => (
          <TweetCard
            key={idx} tweet={tw} idx={idx} total={tweets.length}
            editing={editing} editValue={editing ? editTweets[idx] : tw}
            onChange={(v) => { const n = [...editTweets]; n[idx] = v; setEditTweets(n); }}
            onCopyOne={() => handleCopyOne(tw, idx)}
            copiedOne={copiedIdx === idx}
          />
        ))}
      </div>

      {/* Action bar */}
      {!isCopied && (
        <div className="px-4 py-3 border-t border-gray-200/60 dark:border-gray-800/40
                        font-sans bg-gray-50/80 dark:bg-[#0D0F13]/60">
          {editing ? (
            <div className="flex gap-2">
              <button onClick={() => { onEdit(editTweets.filter(Boolean)); setEditing(false); }}
                className="btn-primary text-xs px-3 py-1.5">Save</button>
              <button onClick={() => { setEditing(false); setEditTweets(tweets); }}
                className="btn-ghost text-xs px-3 py-1.5">Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => setModalOpen(true)}
                className="btn-ghost text-xs px-3 py-1.5">Edit</button>
              {onRegen && (
                <button onClick={onRegen} disabled={regenLoading}
                  className="btn-ghost text-xs px-3 py-1.5">
                  {regenLoading ? "Rewriting…" : "Rewrite"}
                </button>
              )}
              <button onClick={handleCopyAll}
                className="btn-primary text-xs px-4 py-1.5 ml-auto">
                Copy all and done
              </button>
            </div>
          )}
        </div>
      )}

      {isCopied && (
        <div className="px-4 py-3 border-t border-gray-200/60 dark:border-gray-800/40
                        bg-gray-50/80 dark:bg-[#0D0F13]/60">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">Copied and done</span>
          </div>
        </div>
      )}

      {/* Modal for full card edit too */}
      {modalOpen && (
        <ThreadModal
          tweets={editTweets}
          topic={topic}
          format={format}
          isCopied={isCopied}
          onClose={() => setModalOpen(false)}
          onSave={(saved) => { onEdit(saved); setEditTweets(saved); setModalOpen(false); }}
          onRegen={onRegen}
          regenLoading={regenLoading}
          onCopyAll={() => { handleCopyAll(); setModalOpen(false); }}
        />
      )}
    </div>
  );
}
