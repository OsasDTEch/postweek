"""
Single-post regeneration agent.

Takes an existing post + optional steering note, rewrites it in the user's
voice, and returns a validated PostDraft.
"""
import json
import logging
import re
from pathlib import Path

from app.agents.llm_client import call_llm
from app.agents.models import PostDraft

logger = logging.getLogger(__name__)

PROMPTS_DIR = Path(__file__).parent.parent.parent / "prompts"
CURRENT_REGEN_VERSION = "v1"


def _load_prompt_template(version: str) -> str:
    path = PROMPTS_DIR / f"regen_{version}.txt"
    return path.read_text(encoding="utf-8")


def _build_voice_block(style_samples: list[str], tone_preset: str | None) -> str:
    if style_samples:
        samples_text = "\n\n---\n\n".join(
            f"Sample {i + 1}:\n{s}" for i, s in enumerate(style_samples)
        )
        return (
            "Real posts written by this person — match their style exactly:\n\n" + samples_text
        )
    preset = tone_preset or "professional"
    return f"Tone preset: {preset}"


def _extract_json(text: str) -> str:
    """Extract a JSON object from the LLM response."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("No JSON object found in LLM response")
    return text[start : end + 1]


async def regenerate_post(
    *,
    name: str,
    role: str,
    offering: str,
    audience: str,
    topics: str,
    known_for: str,
    style_samples: list[str],
    tone_preset: str | None,
    original_body: str,
    pillar: str,
    suggested_day: str,
    steering_note: str | None,
) -> tuple[PostDraft, str]:
    """
    Regenerate a single post.
    Returns (PostDraft, model_label).
    """
    template = _load_prompt_template(CURRENT_REGEN_VERSION)
    voice_block = _build_voice_block(style_samples, tone_preset)

    # Use manual replacement instead of .format() so user content with
    # curly braces (e.g. code snippets) doesn't cause a KeyError.
    replacements = {
        "{name}": name or "Unknown",
        "{role}": role or "Professional",
        "{offering}": offering or "",
        "{audience}": audience or "",
        "{topics}": topics or "",
        "{known_for}": known_for or "",
        "{voice_block}": voice_block,
        "{original_body}": original_body,
        "{pillar}": pillar,
        "{suggested_day}": suggested_day,
        "{steering_note}": steering_note or "No specific changes requested — just improve the post.",
    }
    prompt = template
    for key, value in replacements.items():
        prompt = prompt.replace(key, value)

    messages = [{"role": "user", "content": prompt}]

    last_error: Exception | None = None
    for attempt in range(2):
        try:
            raw, model_label = await call_llm(messages)
            json_str = _extract_json(raw)
            data = json.loads(json_str)
            draft = PostDraft(**data)
            return draft, model_label
        except Exception as e:
            last_error = e
            logger.warning("Regen attempt %d failed: %s", attempt + 1, e)

    raise RuntimeError(f"Post regeneration failed after 2 attempts: {last_error}") from last_error
