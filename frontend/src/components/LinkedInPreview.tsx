import { useState } from "react";
import PostModal from "./PostModal";

interface LinkedInPreviewProps {
  name: string;
  headline: string;
  body: string;
  pillar: string;
  suggestedDay: string;
  status: string;
  /** compact=true renders a tighter card for the 5-column week rail */
  compact?: boolean;
  onEdit: (text: string) => void;
  onCopy: () => void;
  onRegen: (note?: string) => void;
  regenLoading?: boolean;
  editLoading?: boolean;
}

const PILLAR_LABELS: Record<string, string> = {
  personal_story:      "Personal story",
  opinion:             "Opinion",
  how_to:              "How-to",
  engagement_question: "Question",
  behind_the_scenes:   "Behind the scenes",
};

const FOLD_LENGTH = 280;

export default function LinkedInPreview({
  name, headline, body, pillar, suggestedDay, status,
  compact = false,
  onEdit, onCopy, onRegen, regenLoading, editLoading,
}: LinkedInPreviewProps) {
  // Full-card inline state (non-compact only)
  const [expanded,     setExpanded]     = useState(false);
  const [editing,      setEditing]      = useState(false);
  const [editText,     setEditText]     = useState(body);
  const [regenOpen,    setRegenOpen]    = useState(false);
  const [steeringNote, setSteeringNote] = useState("");
  const [showStamp,    setShowStamp]    = useState(false);
  // Modal (compact mode)
  const [modalOpen,    setModalOpen]    = useState(false);

  const isCopied    = status === "copied";
  const needsFold   = body.length > FOLD_LENGTH && !expanded;
  const displayBody = needsFold ? body.slice(0, FOLD_LENGTH) : body;
  const initial     = name.trim().charAt(0).toUpperCase() || "Y";
  const displayName = compact ? name.split(" ")[0] : name;

  function handleCopy() {
    onCopy();
    setShowStamp(true);
    setTimeout(() => setShowStamp(false), 1800);
  }

  function handleSave() {
    onEdit(editText);
    setEditing(false);
  }

  return (
    <>
      <div className={`preview-card relative transition-opacity duration-150 ${isCopied ? "opacity-55" : ""}`}>

        {showStamp && <div className="stamp-badge">Copied</div>}

        {/* ── Header ── */}
        {compact ? (
          <div className="px-3 pt-3 pb-2 font-linkedin">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 rounded-full bg-cobalt-100 dark:bg-cobalt-900/60
                              flex items-center justify-center shrink-0
                              ring-1 ring-black/5 dark:ring-white/5">
                <span className="text-cobalt-600 dark:text-cobalt-300 font-semibold text-[0.6875rem] leading-none">
                  {initial}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-[0.75rem] font-semibold text-[#000000E6] dark:text-[#F1F3F6] truncate leading-tight">
                    {displayName}
                  </span>
                  <span className="text-[0.625rem] text-[#0073B1] dark:text-cobalt-400 shrink-0">· 1st</span>
                </div>
                <p className="text-[0.625rem] text-[#00000066] dark:text-[#9AA3B0]/60 leading-none mt-0.5">1h · 🌐</p>
              </div>
            </div>
            <div className="mt-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full
                               font-mono text-[0.5625rem] font-semibold uppercase tracking-wider
                               text-ink/70 dark:text-[#F1F3F6]/70"
                style={{ backgroundColor: "rgba(255,233,119,0.45)" }}>
                {PILLAR_LABELS[pillar] ?? pillar}
              </span>
            </div>
          </div>
        ) : (
          <div className="px-4 pt-4 pb-3 font-linkedin">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-full bg-cobalt-100 dark:bg-cobalt-900/60
                              flex items-center justify-center shrink-0
                              ring-1 ring-black/5 dark:ring-white/5">
                <span className="text-cobalt-600 dark:text-cobalt-300 font-semibold text-base leading-none">
                  {initial}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[0.875rem] font-semibold text-[#000000E6] dark:text-[#F1F3F6] leading-tight truncate">
                    {name}
                  </span>
                  <span className="text-[0.6875rem] text-[#0073B1] dark:text-cobalt-400 font-medium shrink-0">· 1st</span>
                </div>
                <p className="text-[0.75rem] text-[#00000099] dark:text-[#9AA3B0] leading-snug mt-0.5 line-clamp-1">
                  {headline}
                </p>
                <p className="text-[0.6875rem] text-[#00000066] dark:text-[#9AA3B0]/60 mt-0.5">1h · 🌐</p>
              </div>
              <span className="pillar-tag-active shrink-0 text-[0.625rem] ml-1">
                {PILLAR_LABELS[pillar] ?? pillar}
              </span>
            </div>
          </div>
        )}

        {/* ── Post body ── */}
        <div className={`${compact ? "px-3 pb-2" : "px-4 pb-3"} font-linkedin`}>
          {!compact && editing ? (
            <textarea
              rows={8}
              autoFocus
              className="w-full rounded-lg border border-cobalt-200 dark:border-cobalt-800
                         bg-cobalt-50/30 dark:bg-cobalt-900/20
                         text-[0.875rem] text-[#000000E6] dark:text-[#F1F3F6] leading-[1.5] p-2.5
                         focus:outline-none focus:ring-2 focus:ring-cobalt-500/20 resize-none"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
            />
          ) : (
            <p
              className={`${compact ? "text-[0.8125rem] line-clamp-5" : "text-[0.875rem]"}
                         text-[#000000E6] dark:text-[#F1F3F6] leading-[1.45]
                         whitespace-pre-wrap cursor-text select-text`}
              onClick={() => {
                if (isCopied) return;
                if (compact) setModalOpen(true);
                else { setEditing(true); setEditText(body); }
              }}
              title={isCopied ? undefined : "Click to edit"}
            >
              {compact ? body : displayBody}
              {!compact && needsFold && (
                <>{" …"}
                  <button onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
                    className="text-[#0073B1] dark:text-cobalt-400 font-semibold ml-0.5 hover:underline">
                    see more
                  </button>
                </>
              )}
            </p>
          )}
        </div>

        {/* ── Decorative reactions — full card only ── */}
        {!compact && (
          <div className="px-4 pb-2 border-t border-[#0000000F] dark:border-gray-800/50 font-linkedin">
            <div className="flex items-center gap-1 pt-2 pb-1">
              <div className="flex -space-x-1 mr-1">
                {["👍","❤️","💡"].map((emoji, i) => (
                  <span key={i} className="h-[18px] w-[18px] text-[0.6rem] flex items-center justify-center
                                           rounded-full bg-white dark:bg-[#15181E]
                                           ring-1 ring-[#0000001A] dark:ring-gray-700">
                    {emoji}
                  </span>
                ))}
              </div>
              <span className="text-[0.6875rem] text-[#00000099] dark:text-[#9AA3B0]">247</span>
              <span className="ml-auto text-[0.6875rem] text-[#00000099] dark:text-[#9AA3B0]">18 comments · 4 reposts</span>
            </div>
            <div className="flex border-t border-[#0000000F] dark:border-gray-800/50 pt-1">
              {[{icon:"👍",label:"Like"},{icon:"💬",label:"Comment"},{icon:"🔁",label:"Repost"},{icon:"📤",label:"Send"}].map(({icon,label}) => (
                <button key={label}
                  className="flex flex-1 items-center justify-center gap-1 py-1.5 rounded
                             text-[0.75rem] font-semibold text-[#00000066] dark:text-[#9AA3B0]/60
                             hover:bg-[#0000000A] dark:hover:bg-white/5 transition"
                  tabIndex={-1} aria-hidden="true">
                  <span className="text-base leading-none">{icon}</span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Compact mini reactions ── */}
        {compact && !isCopied && (
          <div className="px-3 pb-1.5 flex items-center gap-2 border-t border-[#0000000F] dark:border-gray-800/40 pt-1.5 font-linkedin">
            <div className="flex -space-x-0.5">
              {["👍","❤️"].map((e,i) => (
                <span key={i} className="h-3.5 w-3.5 text-[0.5rem] flex items-center justify-center
                                         rounded-full bg-white dark:bg-[#15181E]
                                         ring-1 ring-[#0000001A] dark:ring-gray-700">{e}</span>
              ))}
            </div>
            <span className="text-[0.625rem] text-[#00000066] dark:text-[#9AA3B0]/50">247</span>
            <span className="ml-auto text-[0.625rem] text-[#00000066] dark:text-[#9AA3B0]/50">18 comments</span>
          </div>
        )}

        {/* ── Action bar ── */}
        <div className={`${compact ? "px-3 py-2" : "px-4 py-3"}
                        border-t border-gray-200/60 dark:border-gray-700/50 font-sans
                        bg-gray-50/80 dark:bg-[#0D0F13]/60`}>

          {isCopied ? (
            <div className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-green-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">Posted</span>
            </div>

          ) : compact ? (
            /* Compact: two full-width stacked buttons — Edit opens modal */
            <div className="space-y-1.5">
              <button onClick={handleCopy}
                className="w-full text-center rounded-md py-1.5 text-xs font-semibold
                           bg-cobalt-500 text-white hover:bg-cobalt-600 transition active:scale-[0.97]">
                Copy
              </button>
              <button onClick={() => setModalOpen(true)}
                className="w-full text-center rounded-md py-1.5 text-xs font-medium
                           text-ink/60 dark:text-[#9AA3B0]
                           bg-black/5 dark:bg-white/10
                           hover:bg-black/10 dark:hover:bg-white/15 transition
                           border border-transparent dark:border-gray-700/60">
                Edit / Rewrite
              </button>
            </div>

          ) : editing ? (
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={editLoading}
                className="btn-primary text-xs px-3 py-1.5">
                {editLoading ? "Saving…" : "Save"}
              </button>
              <button onClick={() => { setEditing(false); setEditText(body); }}
                className="btn-ghost text-xs px-3 py-1.5">
                Cancel
              </button>
            </div>

          ) : regenOpen ? (
            <div className="space-y-1.5">
              <input type="text" autoFocus
                className="input text-xs py-1"
                placeholder="shorter, add a number, more casual…"
                value={steeringNote}
                onChange={(e) => setSteeringNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { onRegen(steeringNote || undefined); setRegenOpen(false); setSteeringNote(""); }
                  if (e.key === "Escape") setRegenOpen(false);
                }}
              />
              <div className="flex gap-1.5">
                <button onClick={() => { onRegen(steeringNote || undefined); setRegenOpen(false); setSteeringNote(""); }}
                  disabled={regenLoading} className="btn-primary text-xs px-2.5 py-1">
                  {regenLoading ? "Rewriting…" : "Rewrite"}
                </button>
                <button onClick={() => setRegenOpen(false)} className="btn-ghost text-xs px-2 py-1">✕</button>
              </div>
            </div>

          ) : (
            <div className="flex items-center gap-2">
              <span className="mono-data text-mono-xs text-ink/30 dark:text-[#9AA3B0]/40">{suggestedDay}</span>
              <button onClick={() => setRegenOpen(true)} className="btn-ghost text-xs px-3 py-1.5 ml-auto">Rewrite</button>
              <button onClick={handleCopy} className="btn-primary text-xs px-4 py-1.5">Copy and done</button>
            </div>
          )}
        </div>
      </div>

      {/* Modal — only in compact mode, portal renders outside the narrow column */}
      {modalOpen && (
        <PostModal
          body={body}
          pillar={pillar}
          suggestedDay={suggestedDay}
          name={name}
          headline={headline}
          status={status}
          onClose={() => setModalOpen(false)}
          onSave={(text) => { onEdit(text); setModalOpen(false); }}
          onRegen={(note) => { onRegen(note); setModalOpen(false); }}
          onCopy={() => { handleCopy(); setModalOpen(false); }}
          regenLoading={regenLoading}
          editLoading={editLoading}
        />
      )}
    </>
  );
}
