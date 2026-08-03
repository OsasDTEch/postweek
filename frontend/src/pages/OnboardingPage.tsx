import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { profileApi, samplesApi } from "../lib/api";
import type { Profile, StyleSample } from "../types";
import { AxiosError } from "axios";

const TONE_PRESETS = [
  { value: "casual", label: "Casual", desc: "Conversational, like texting a smart friend" },
  { value: "professional", label: "Professional", desc: "Polished and confident, structured paragraphs" },
  { value: "contrarian", label: "Contrarian", desc: "Challenges norms, takes clear stances, punchy" },
  { value: "storyteller", label: "Storyteller", desc: "Narrative hooks, builds tension, ends with a lesson" },
] as const;

type Step = 1 | 2;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Step 1 — profile fields
  const [form, setForm] = useState({
    name: "",
    role: "",
    offering: "",
    audience: "",
    topics: "",
    known_for: "",
  });

  // Step 2 — voice
  const [samples, setSamples] = useState<StyleSample[]>([]);
  const [newSample, setNewSample] = useState("");
  const [tonePreset, setTonePreset] = useState<string>("professional");
  const [voiceMode, setVoiceMode] = useState<"samples" | "preset">("samples");

  // Load existing profile & samples
  useEffect(() => {
    profileApi.get().then(({ data }) => {
      setForm({
        name: data.name ?? "",
        role: data.role ?? "",
        offering: data.offering ?? "",
        audience: data.audience ?? "",
        topics: data.topics ?? "",
        known_for: data.known_for ?? "",
      });
      if (data.tone_preset) {
        setTonePreset(data.tone_preset);
        setVoiceMode("preset");
      }
    });
    samplesApi.list().then(({ data }) => setSamples(data));
  }, []);

  function updateForm(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function addSample() {
    const content = newSample.trim();
    if (!content) return;
    if (samples.length >= 3) return;
    try {
      const { data } = await samplesApi.add(content);
      setSamples((prev) => [...prev, data]);
      setNewSample("");
    } catch {
      setError("Failed to save sample");
    }
  }

  async function removeSample(id: string) {
    await samplesApi.delete(id);
    setSamples((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleFinish() {
    setError("");
    setSaving(true);
    try {
      await profileApi.update({
        ...form,
        tone_preset: voiceMode === "preset" ? (tonePreset as Profile["tone_preset"]) : null,
      });
      navigate("/dashboard");
    } catch (err) {
      const msg =
        err instanceof AxiosError ? err.response?.data?.detail ?? "Save failed" : "Save failed";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      {/* Progress */}
      <div className="mb-8 flex items-center gap-3">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition ${
                step >= s
                  ? "bg-brand-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {s}
            </div>
            {s < 2 && <div className="h-px w-8 bg-gray-300" />}
          </div>
        ))}
        <span className="ml-2 text-sm text-gray-500">
          {step === 1 ? "About you" : "Your voice"}
        </span>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* ---- Step 1: About you ---- */}
      {step === 1 && (
        <div className="card p-8 space-y-5">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">About you</h1>
            <p className="mt-1 text-sm text-gray-500">
              This shapes every post — be specific.
            </p>
          </div>

          {[
            { field: "name", label: "Your name", placeholder: "Alex Chen" },
            { field: "role", label: "Role / title", placeholder: "Freelance UX designer" },
            { field: "offering", label: "What you do or sell", placeholder: "I help SaaS startups reduce churn through better onboarding" },
            { field: "audience", label: "Target audience", placeholder: "Early-stage SaaS founders and product leads" },
            { field: "topics", label: "3–5 topics you're credible on", placeholder: "UX research, product strategy, B2B retention, remote work" },
            { field: "known_for", label: "One thing you want to be known for", placeholder: "Making complex UX problems simple and shipping fast" },
          ].map(({ field, label, placeholder }) => (
            <div key={field}>
              <label className="label">{label}</label>
              <input
                type="text"
                className="input"
                placeholder={placeholder}
                value={form[field as keyof typeof form]}
                onChange={(e) => updateForm(field as keyof typeof form, e.target.value)}
              />
            </div>
          ))}

          <button
            className="btn-primary w-full mt-2"
            onClick={() => setStep(2)}
          >
            Continue →
          </button>
        </div>
      )}

      {/* ---- Step 2: Voice ---- */}
      {step === 2 && (
        <div className="card p-8 space-y-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Your voice</h1>
            <p className="mt-1 text-sm text-gray-500">
              Paste past posts so AI matches how you actually write — or pick a tone preset.
            </p>
          </div>

          {/* Toggle */}
          <div className="flex rounded-lg border border-gray-200 p-1 gap-1">
            {(["samples", "preset"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setVoiceMode(mode)}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                  voiceMode === mode
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {mode === "samples" ? "Paste my posts" : "Use a preset"}
              </button>
            ))}
          </div>

          {voiceMode === "samples" ? (
            <div className="space-y-4">
              {samples.map((s, i) => (
                <div key={s.id} className="relative rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Sample {i + 1}</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-4">{s.content}</p>
                  <button
                    onClick={() => removeSample(s.id)}
                    className="absolute right-2 top-2 text-gray-400 hover:text-red-500 text-lg leading-none"
                    aria-label="Remove sample"
                  >
                    ×
                  </button>
                </div>
              ))}

              {samples.length < 3 && (
                <div className="space-y-2">
                  <label className="label">
                    Paste a LinkedIn post ({samples.length}/3)
                  </label>
                  <textarea
                    rows={5}
                    className="input resize-none"
                    placeholder="Paste a real post you've written on LinkedIn…"
                    value={newSample}
                    onChange={(e) => setNewSample(e.target.value)}
                  />
                  <button
                    onClick={addSample}
                    disabled={!newSample.trim()}
                    className="btn-secondary w-full"
                  >
                    + Add this post
                  </button>
                </div>
              )}

              {samples.length === 0 && (
                <p className="text-xs text-gray-400">
                  No samples yet. You can skip and use a preset instead.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {TONE_PRESETS.map(({ value, label, desc }) => (
                <button
                  key={value}
                  onClick={() => setTonePreset(value)}
                  className={`rounded-xl border-2 p-4 text-left transition ${
                    tonePreset === value
                      ? "border-brand-500 bg-brand-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="font-semibold text-sm text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button className="btn-ghost" onClick={() => setStep(1)}>← Back</button>
            <button
              className="btn-primary flex-1"
              onClick={handleFinish}
              disabled={saving}
            >
              {saving ? "Saving…" : "Finish setup →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
