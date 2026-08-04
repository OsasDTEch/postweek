/**
 * PostModal — full-width overlay for editing/rewriting a LinkedIn post.
 * Opens when the user clicks the post body or the Edit button in the compact week rail card.
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface PostModalProps {
  body: string;
  pillar: string;
  suggestedDay: string;
  name: string;
  headline: string;
  status: string;
  onClose: () => void;
  onSave: (text: string) => void;
  onRegen: (note?: string) => void;
  onCopy: () => void;
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

export default function PostModal({
  body, pillar, suggestedDay, name, headline, status,
  onClose, onSave, onRegen, onCopy, regenLoading, editLoading,
}: PostModalProps) {
  const [editing,      setEditing]      = useState(false);
  const [editText,     setEditText]     = useState(body);
  const [regenOpen,    setRegenOpen]    = useState(false);
  const [steeringNote, setSteeringNote] = useState("");
  const [expanded,     setExpanded]     = useState(false);
  const [showStamp,    setShowStamp]    = useState(false);

  const isCopied  = status === "copied";
  const initial   = name.trim().charAt(0).toUpperCase() || "Y";
  const needsFold = body.length > FOLD_LENGTH && !expanded;
  const displayBody = needsFold ? body.slice(0, FOLD_LENGTH) : body;

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { if (editing) setEditing(false); else onClose(); }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, editing]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function handleCopy() {
    onCopy();
    setShowStamp(true);
    setTimeout(() => setShowStamp(false), 1800);
  }

  function handleSave() {
    onSave(editText);
    setEditing(false);
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg max-h-[92vh] flex flex-col
                      rounded-2xl bg-white dark:bg-[#15181E]
                      shadow-[0_24px_64px_0_rgba(0,0,0,0.18)]
                      border border-gray-200/80 dark:border-gray-800 overflow-hidden">

        {/* Stamp badge */}
        {showStamp && (
          <div className="stamp-badge">Copied</div>
        )}

        {/* LinkedIn-style header */}
        <div className="px-5 pt-5 pb-4 font-linkedin border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-full bg-cobalt-100 dark:bg-cobalt-900/60
                            flex items-center justify-center shrink-0
                            ring-1 ring-black/5 dark:ring-white/5">
              <span className="text-cobalt-600 dark:text-cobalt-300 font-semibold text-sm leading-none">
                {initial}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[0.875rem] font-semibold text-[#000000E6] dark:text-[#F1F3F6] truncate">
                  {name}
                </span>
                <span className="text-[0.6875rem] text-[#0073B1] dark:text-cobalt-400 shrink-0">· 1st</span>
              </div>
              <p className="text-[0.75rem] text-[#00000099] dark:text-[#9AA3B0] leading-snug mt-0.5 line-clamp-1">
                {headline}
              </p>
              <p className="text-[0.6875rem] text-[#00000066] dark:text-[#9AA3B0]/60 mt-0.5">1h · 🌐</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full
                               font-mono text-[0.5625rem] font-semibold uppercase tracking-wider
                               text-ink/70 dark:text-[#F1F3F6]/70"
                style={{ backgroundColor: "rgba(255,233,119,0.45)" }}>
                {PILLAR_LABELS[pillar] ?? pillar}
              </span>
              <button onClick={onClose}
                className="rounded-lg p-1.5 text-ink/40 dark:text-[#9AA3B0]/60
                           hover:bg-black/5 dark:hover:bg-white/5
                           hover:text-ink dark:hover:text-[#F1F3F6] transition"
                aria-label="Close">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Post body — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 font-linkedin">
          {editing ? (
            <textarea
              rows={12}
              autoFocus
              className="w-full rounded-xl border border-cobalt-200 dark:border-cobalt-800
                         bg-cobalt-50/30 dark:bg-cobalt-900/20
                         text-[0.9375rem] text-[#000000E6] dark:text-[#F1F3F6] leading-[1.55] p-3
                         focus:outline-none focus:ring-2 focus:ring-cobalt-500/20 resize-none"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
            />
          ) : (
            <p className="text-[0.9375rem] text-[#000000E6] dark:text-[#F1F3F6] leading-[1.55]
                          whitespace-pre-wrap cursor-text select-text"
              onClick={() => { if (!isCopied) { setEditing(true); setEditText(body); } }}>
              {displayBody}
              {needsFold && (
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

        {/* LinkedIn decorative reaction strip */}
        {!editing && (
          <div className="px-5 pb-2 border-t border-[#0000000F] dark:border-gray-800/50 font-linkedin shrink-0">
            <div className="flex items-center gap-1 pt-2 pb-1">
              <div className="flex -space-x-1 mr-1">
                {["👍","❤️","💡"].map((e,i) => (
                  <span key={i} className="h-[18px] w-[18px] text-[0.6rem] flex items-center justify-center
                                           rounded-full bg-white dark:bg-[#15181E]
                                           ring-1 ring-[#0000001A] dark:ring-gray-700">{e}</span>
                ))}
              </div>
              <span className="text-[0.6875rem] text-[#00000099] dark:text-[#9AA3B0]">247</span>
              <span className="ml-auto text-[0.6875rem] text-[#00000099] dark:text-[#9AA3B0]">18 comments · 4 reposts</span>
            </div>
            <div className="flex border-t border-[#0000000F] dark:border-gray-800/50 pt-1">
              {[{icon:"👍",label:"Like"},{icon:"💬",label:"Comment"},{icon:"🔁",label:"Repost"},{icon:"📤",label:"Send"}].map(({icon,label}) => (
                <button key={label} tabIndex={-1} aria-hidden="true"
                  className="flex flex-1 items-center justify-center gap-1 py-1.5 rounded
                             text-[0.75rem] font-semibold text-[#00000066] dark:text-[#9AA3B0]/60
                             hover:bg-[#0000000A] dark:hover:bg-white/5 transition">
                  <span className="text-base leading-none">{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action footer */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0 font-sans
                        bg-gray-50/90 dark:bg-[#0D0F13]/70">

          {isCopied ? (
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-green-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">Copied and done</span>
            </div>

          ) : editing ? (
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={editLoading}
                className="btn-primary text-sm px-4 py-2">
                {editLoading ? "Saving…" : "Save"}
              </button>
              <button onClick={() => { setEditing(false); setEditText(body); }}
                className="btn-ghost text-sm px-3 py-2">Cancel</button>
            </div>

          ) : regenOpen ? (
            <div className="space-y-2">
              <input type="text" autoFocus
                className="input text-sm py-2"
                placeholder="shorter, add a number, more personal, more casual…"
                value={steeringNote}
                onChange={(e) => setSteeringNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onRegen(steeringNote || undefined);
                    setRegenOpen(false);
                    setSteeringNote("");
                  }
                  if (e.key === "Escape") setRegenOpen(false);
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { onRegen(steeringNote || undefined); setRegenOpen(false); setSteeringNote(""); }}
                  disabled={regenLoading}
                  className="btn-primary text-sm px-4 py-2">
                  {regenLoading ? "Rewriting…" : "Rewrite"}
                </button>
                <button onClick={() => setRegenOpen(false)} className="btn-ghost text-sm px-3 py-2">Cancel</button>
              </div>
            </div>

          ) : (
            <div className="flex items-center gap-2">
              <span className="font-mono text-mono-xs text-ink/30 dark:text-[#9AA3B0]/40">{suggestedDay}</span>
              <button onClick={() => { setEditing(true); setEditText(body); }}
                className="btn-ghost text-sm px-3 py-2 ml-auto">Edit</button>
              <button onClick={() => setRegenOpen(true)}
                className="btn-ghost text-sm px-3 py-2">Rewrite</button>
              <button onClick={handleCopy} className="btn-primary text-sm px-5 py-2">
                Copy and done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
