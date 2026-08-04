"""
Week generation agent.

Builds the prompt from the versioned template, calls the LLM with Ollama→Groq
fallback, parses and validates the structured response via WeeklyPosts.
"""
import json
import logging
import re
from pathlib import Path

from app.agents.llm_client import call_llm
from app.agents.models import PostDraft, WeeklyPosts

logger = logging.getLogger(__name__)

PROMPTS_DIR = Path(__file__).parent.parent.parent / "prompts"
CURRENT_PROMPT_VERSION = "v2"

# Pillar rotation — each week we shift the day assignment so consecutive weeks
# don't feel identical.
PILLAR_SETS = [
    [
        ("personal_story", "Monday"),
        ("opinion", "Tuesday"),
        ("how_to", "Wednesday"),
        ("engagement_question", "Thursday"),
        ("behind_the_scenes", "Friday"),
    ],
    [
        ("how_to", "Monday"),
        ("personal_story", "Tuesday"),
        ("behind_the_scenes", "Wednesday"),
        ("opinion", "Thursday"),
        ("engagement_question", "Friday"),
    ],
    [
        ("engagement_question", "Monday"),
        ("how_to", "Tuesday"),
        ("opinion", "Wednesday"),
        ("behind_the_scenes", "Thursday"),
        ("personal_story", "Friday"),
    ],
]


def _strip_dashes(text: str) -> str:
    """Strip em/en dashes — replace with '. ' so sentences stay readable."""
    result = text.replace("\u2014", ". ").replace("\u2013", ". ").replace("—", ". ").replace("–", ". ")
    # Collapse any double spaces left behind
    import re as _re
    result = _re.sub(r"  +", " ", result)
    return result.strip()


def _load_prompt_template(version: str) -> str:
    path = PROMPTS_DIR / f"week_{version}.txt"
    return path.read_text(encoding="utf-8")


def _build_voice_block(style_samples: list[str], tone_preset: str | None) -> str:
    if style_samples:
        samples_text = "\n\n---\n\n".join(
            f"Sample {i + 1}:\n{s}" for i, s in enumerate(style_samples)
        )
        return (
            "Below are real posts written by this person. Match their tone, vocabulary, "
            "sentence structure, and formatting exactly.\n\n" + samples_text
        )
    preset = tone_preset or "professional"
    preset_descriptions = {
        "casual": "Write in a casual, conversational tone. Short sentences. First-person. Feels like texting a smart friend.",
        "professional": "Write in a polished, confident professional tone. Structured paragraphs. Authoritative but not stiff.",
        "contrarian": "Write with a contrarian edge. Challenge conventional wisdom. Take a clear stance. Punchy.",
        "storyteller": "Write in a narrative storytelling style. Start with a hook scene. Build tension. End with a lesson.",
    }
    return f"Tone preset: {preset}\n{preset_descriptions.get(preset, '')}"


def _build_pillar_assignments(week_number: int) -> tuple[str, list[tuple[str, str]]]:
    rotation = PILLAR_SETS[week_number % len(PILLAR_SETS)]
    lines = "\n".join(
        f"  - {day}: {pillar.replace('_', ' ').title()}" for pillar, day in rotation
    )
    return lines, rotation


def _extract_json(text: str) -> str:
    """Extract a JSON array from the LLM response, stripping markdown fences."""
    text = text.strip()
    # Strip ```json ... ``` fences
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
    # Find the outermost [ ... ]
    start = text.find("[")
    end = text.rfind("]")
    if start == -1 or end == -1:
        raise ValueError("No JSON array found in LLM response")
    return text[start : end + 1]


async def generate_week(
    *,
    name: str,
    role: str,
    offering: str,
    audience: str,
    topics: str,
    known_for: str,
    style_samples: list[str],
    tone_preset: str | None,
    week_number: int,
    avoid_topics: str = "",
) -> tuple[WeeklyPosts, str, str]:
    """
    Generate 5 posts for the week.
    Returns (WeeklyPosts, model_label, prompt_version).
    """
    template = _load_prompt_template(CURRENT_PROMPT_VERSION)
    pillar_text, _ = _build_pillar_assignments(week_number)
    voice_block = _build_voice_block(style_samples, tone_preset)

    # Safe manual substitution — user profile fields may contain curly braces
    replacements = {
        "{name}": name or "Unknown",
        "{role}": role or "Professional",
        "{offering}": offering or "",
        "{audience}": audience or "",
        "{topics}": topics or "",
        "{known_for}": known_for or "",
        "{voice_block}": voice_block,
        "{pillar_assignments}": pillar_text,
        "{avoid_topics}": avoid_topics or "None",
    }
    prompt = template
    for key, value in replacements.items():
        prompt = prompt.replace(key, value)

    messages = [{"role": "user", "content": prompt}]

    # Retry once on parse failure
    last_error: Exception | None = None
    for attempt in range(2):
        try:
            raw, model_label = await call_llm(messages)
            json_str = _extract_json(raw)
            data = json.loads(json_str)
            # Apply dash-stripping to every post body before validation
            for item in data:
                if "body" in item:
                    item["body"] = _strip_dashes(item["body"])
            posts = [PostDraft(**item) for item in data]
            result = WeeklyPosts(posts=posts)
            return result, model_label, CURRENT_PROMPT_VERSION
        except Exception as e:
            last_error = e
            logger.warning("Week generation attempt %d failed: %s", attempt + 1, e)

    raise RuntimeError(f"Week generation failed after 2 attempts: {last_error}") from last_error
