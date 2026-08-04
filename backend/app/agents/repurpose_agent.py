"""
Repurpose agent — converts a LinkedIn post into an X thread.
"""
import json
import logging
import re
from pathlib import Path

from app.agents.llm_client import call_llm
from app.agents.models import XPostDraft

logger = logging.getLogger(__name__)

PROMPTS_DIR = Path(__file__).parent.parent.parent / "prompts"
CURRENT_VERSION = "v2"


def _load_template(version: str) -> str:
    path = PROMPTS_DIR / f"repurpose_x_{version}.txt"
    return path.read_text(encoding="utf-8")


def _build_voice_block(style_samples: list[str], tone_preset: str | None) -> str:
    if style_samples:
        samples_text = "\n\n---\n\n".join(
            f"Sample {i + 1}:\n{s}" for i, s in enumerate(style_samples)
        )
        return "Real posts written by this person — match their style exactly:\n\n" + samples_text
    preset = tone_preset or "professional"
    return f"Tone preset: {preset}"


def _extract_json(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("No JSON object found in LLM response")
    return text[start : end + 1]


async def repurpose_to_x(
    *,
    name: str,
    role: str,
    offering: str,
    audience: str,
    style_samples: list[str],
    tone_preset: str | None,
    linkedin_body: str,
    pillar: str,
    suggested_day: str,
) -> tuple[XPostDraft, str]:
    """
    Convert a LinkedIn post into an X thread.
    Returns (XPostDraft, model_label).
    """
    template = _load_template(CURRENT_VERSION)
    voice_block = _build_voice_block(style_samples, tone_preset)

    # Safe manual substitution — source post body may contain curly braces
    replacements = {
        "{name}": name or "Unknown",
        "{role}": role or "Professional",
        "{offering}": offering or "",
        "{audience}": audience or "",
        "{voice_block}": voice_block,
        "{linkedin_body}": linkedin_body,
        "{pillar}": pillar,
        "{suggested_day}": suggested_day,
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
            # v2 prompt no longer asks the LLM to output suggested_day —
            # inject it from the caller's parameter so XPostDraft validates cleanly.
            data["suggested_day"] = suggested_day
            draft = XPostDraft(**data)
            return draft, model_label
        except Exception as e:
            last_error = e
            logger.warning("Repurpose attempt %d failed: %s", attempt + 1, e)

    raise RuntimeError(f"Repurpose failed after 2 attempts: {last_error}") from last_error
