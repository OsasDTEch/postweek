import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { profileApi, samplesApi } from "../lib/api";
import type { Profile, StyleSample } from "../types";
import { AxiosError } from "axios";
import { useAuth } from "../context/AuthContext";

const TONE_PRESETS = [
  { value: "casual",       label: "Casual",       desc: "Conversational, like texting a smart friend" },
  { value: "professional", label: "Professional",  desc: "Polished and confident, structured paragraphs" },
  { value: "contrarian",   label: "Contrarian",    desc: "Challenges norms, takes clear stances, punchy" },
  { value: "storyteller",  label: "Storyteller",   desc: "Narrative hooks, builds tension, ends with a lesson" },
] as const;

const FIELDS = [
  { f: "name",      label: "Your name",                         ph: "Alex Chen"                                        },
  { f: "role",      label: "Role or title",                     ph: "Freelance AI developer"                           },
  { f: "offering",  label: "What you do or sell",               ph: "I build voice agents and RAG pipelines for startups" },
  { f: "audience",  label: "Target audience",                   ph: "Early-stage founders and technical teams"          },
  { f: "topics",    label: "3–5 topics you are credible on",    ph: "AI agents, FastAPI, LangGraph, voice systems"      },
  { f: "known_for", label: "One thing you want to be known for", ph: "Shipping production AI systems that actually work" },
] as const;

type Step = 1 | 2;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { setProfileComplete } = useAuth();
  const [step,      setStep]      = useState<Step>(1);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const [form,      setForm]      = useState({ name: "", role: "", offering: "", audience: "", topics: "", known_for: "" });
  const [samples,   setSamples]   = useState<StyleSample[]>([]);
  const [newSample, setNewSample] = useState("");
  const [tonePreset, setTonePreset] = useState<string>("professional");
  const [voiceMode,  setVoiceMode]  = useState<"samples" | "preset">("samples");

  useEffect(() => {
    profileApi.get().then(({ data }) => {
      setForm({
        name:      data.name      ?? "",
        role:      data.role      ?? "",
        offering:  data.offering  ?? "",
        audience:  data.audience  ?? "",
        topics:    data.topics    ?? "",
        known_for: data.known_for ?? "",
      });
      if (data.tone_preset) { setTonePreset(data.tone_preset); setVoiceMode("preset"); }
    });
    samplesApi.list().then(({ data }) => setSamples(data));
  }, []);

  async function addSample() {
    const content = newSample.trim();
    if (!content || samples.length >= 3) return;
    try {
      const { data } = await samplesApi.add(content);
      setSamples(p => [...p, data]); setNewSample("");
    } catch { setError("Failed to save sample"); }
  }

  async function removeSample(id: string) {
    await samplesApi.delete(id);
    setSamples(p => p.filter(s => s.id !== id));
  }

  async function handleFinish() {
    setError(""); setSaving(true);
    try {
      await profileApi.update({
        ...form,
        tone_preset: voiceMode === "preset" ? (tonePreset as Profile["tone_preset"]) : null,
      });
      setProfileComplete(true);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof AxiosError ? err.response?.data?.detail ?? "Save failed" : "Save failed");
    } finally { setSaving(false); }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">

      {/* ── Progress indicator ── */}
      <div className="flex items-center gap-3 mb-10">
        {([1, 2] as Step[]).map(s => (
          <div key={s} className="flex items-center gap-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full
                            font-mono text-mono-sm font-semibold transition
                            ${step >= s
                              ? "bg-cobalt-500 text-white"
                              : "bg-gray-100 dark:bg-gray-800 text-ink/30 dark:text-[#9AA3B0]/40"}`}>
              {step > s
                ? <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                : s}
            </div>
            {s < 2 && <div className="h-px w-8 bg-gray-200 dark:bg-gray-700" />}
          </div>
        ))}
        <span className="ml-2 text-sm text-ink/50 dark:text-[#9AA3B0]">
          {step === 1 ? "About you" : "Your voice"}
        </span>
      </div>

      {error && <div className="mb-5 banner-error">{error}</div>}

      {/* ── Step 1: About you ── */}
      {step === 1 && (
        <div className="card p-8 space-y-5">
          <div>
            <h1 className="display text-3xl text-ink dark:text-[#F1F3F6]">About you</h1>
            <p className="mt-1 text-sm text-ink/50 dark:text-[#9AA3B0]">
              This shapes every post. Be specific.
            </p>
          </div>
          {FIELDS.map(({ f, label, ph }) => (
            <div key={f}>
              <label className="label">{label}</label>
              <input
                type="text"
                className="input"
                placeholder={ph}
                value={form[f as keyof typeof form]}
                onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))}
              />
            </div>
          ))}
          <button
            className="btn-primary w-full mt-2"
            onClick={() => setStep(2)}
            disabled={!form.name.trim() && !form.role.trim()}
          >
            Continue
          </button>
        </div>
      )}

      {/* ── Step 2: Your voice ── */}
      {step === 2 && (
        <div className="card p-8 space-y-6">
          <div>
            <h1 className="display text-3xl text-ink dark:text-[#F1F3F6]">Your voice</h1>
            <p className="mt-1 text-sm text-ink/50 dark:text-[#9AA3B0]">
              Paste past posts so the engine learns how you write, or pick a tone preset.
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 gap-1
                          bg-gray-50 dark:bg-gray-900">
            {(["samples", "preset"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setVoiceMode(mode)}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition
                  ${voiceMode === mode
                    ? "bg-cobalt-500 text-white shadow-sm"
                    : "text-ink/50 dark:text-[#9AA3B0] hover:text-ink dark:hover:text-[#F1F3F6]"}`}
              >
                {mode === "samples" ? "Paste my posts" : "Use a preset"}
              </button>
            ))}
          </div>

          {/* Voice samples */}
          {voiceMode === "samples" && (
            <div className="space-y-4">
              {samples.map((s, i) => (
                <div key={s.id}
                  className="relative rounded-xl border border-gray-200 dark:border-gray-700
                             bg-gray-50 dark:bg-gray-900 p-4">
                  <p className="section-label mb-1">Sample {i + 1}</p>
                  <p className="text-sm text-ink/70 dark:text-[#9AA3B0] whitespace-pre-wrap line-clamp-4">
                    {s.content}
                  </p>
                  <button
                    onClick={() => removeSample(s.id)}
                    className="absolute right-3 top-3 text-ink/20 dark:text-[#9AA3B0]/30
                               hover:text-editorred transition min-h-[40px] min-w-[40px]
                               flex items-center justify-center"
                    aria-label="Remove sample"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              {samples.length < 3 && (
                <div className="space-y-2">
                  <label className="label">
                    Paste a LinkedIn post{" "}
                    <span className="font-normal text-ink/30 dark:text-[#9AA3B0]/40">
                      ({samples.length}/3)
                    </span>
                  </label>
                  <textarea
                    rows={5}
                    className="input resize-none"
                    placeholder="Paste a real post you have written…"
                    value={newSample}
                    onChange={e => setNewSample(e.target.value)}
                  />
                  <button
                    onClick={addSample}
                    disabled={!newSample.trim()}
                    className="btn-secondary w-full"
                  >
                    Add this post
                  </button>
                </div>
              )}
              {samples.length === 0 && (
                <p className="section-label">
                  No samples yet. You can skip and use a preset.
                </p>
              )}
            </div>
          )}

          {/* Tone preset grid */}
          {voiceMode === "preset" && (
            <div className="grid gap-3">
              {TONE_PRESETS.map(({ value, label, desc }) => (
                <button
                  key={value}
                  onClick={() => setTonePreset(value)}
                  className={`rounded-xl border-2 p-4 text-left transition
                    ${tonePreset === value
                      ? "border-cobalt-500 bg-cobalt-50/50 dark:bg-cobalt-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}
                >
                  <p className="font-sans text-sm font-semibold text-ink dark:text-[#F1F3F6]">{label}</p>
                  <p className="font-sans text-xs text-ink/50 dark:text-[#9AA3B0] mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button className="btn-ghost" onClick={() => setStep(1)}>Back</button>
            <button className="btn-primary flex-1" onClick={handleFinish} disabled={saving}>
              {saving ? "Saving…" : "Finish setup"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
