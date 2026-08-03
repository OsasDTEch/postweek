"""
Video ideas agent.
1. Searches DuckDuckGo for trending topics in the creator's niche.
2. Builds a prompt combining their profile + trends + past titles.
3. Returns 7 validated VideoIdeaDraft objects.
"""
import json
import logging
import re
from pathlib import Path

from pydantic import BaseModel, field_validator

from app.agents.llm_client import call_llm
from app.agents.search_tool import format_results, search_trends

logger = logging.getLogger(__name__)

PROMPTS_DIR = Path(__file__).parent.parent.parent / "prompts"
CURRENT_VERSION = "v1"

VALID_FORMATS = {"tutorial", "opinion", "story", "list", "experiment", "review", "reaction"}


# ---------------------------------------------------------------------------
# Output type
# ---------------------------------------------------------------------------

class VideoIdeaDraft(BaseModel):
    title: str
    hook: str
    angle: str
    format: str
    trend_context: str

    @field_validator("title", "hook", "angle", "trend_context")
    @classmethod
    def not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Field cannot be empty")
        return v

    @field_validator("format")
    @classmethod
    def valid_format(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in VALID_FORMATS:
            # Try to recover a close match rather than hard-fail
            for f in VALID_FORMATS:
                if f in v:
                    return f
            return "tutorial"  # safe fallback
        return v


class VideoIdeasResult(BaseModel):
    ideas: list[VideoIdeaDraft]

    @field_validator("ideas")
    @classmethod
    def validate_count(cls, v: list[VideoIdeaDraft]) -> list[VideoIdeaDraft]:
        if not v:
            raise ValueError("LLM returned no ideas")
        return v[:7]  # cap at 7


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _strip_dashes(text: str) -> str:
    """Remove em dashes and en dashes from generated text."""
    return text.replace("\u2014", " ").replace("\u2013", " ").replace("—", " ").replace("–", " ")


def _clean_draft(draft: VideoIdeaDraft) -> VideoIdeaDraft:
    return VideoIdeaDraft(
        title=_strip_dashes(draft.title),
        hook=_strip_dashes(draft.hook),
        angle=_strip_dashes(draft.angle),
        format=draft.format,
        trend_context=_strip_dashes(draft.trend_context),
    )
    path = PROMPTS_DIR / f"video_ideas_{version}.txt"
    return path.read_text(encoding="utf-8")


def _extract_json(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
    start = text.find("[")
    end = text.rfind("]")
    if start == -1 or end == -1:
        raise ValueError("No JSON array in LLM response")
    return text[start: end + 1]


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

async def generate_video_ideas(
    *,
    channel_name: str,
    channel_type: str,
    niche: str,
    target_audience: str,
    content_style: str,
    past_titles: str,
) -> tuple[VideoIdeasResult, str, str]:
    """
    Generate video ideas using live trend data.
    Returns (VideoIdeasResult, model_label, trend_summary).
    """
    # Step 1 — build diverse search queries to avoid always pulling the same topics
    import re as _re
    clean_niche = _re.sub(r"[^\w\s]", "", niche)[:50].strip()

    # Rotate through varied search angles so we don't always get RAG/LangGraph
    import hashlib as _hashlib
    # Use date to rotate queries daily
    from datetime import date as _date
    day_seed = int(_hashlib.md5(_date.today().isoformat().encode()).hexdigest(), 16) % 5

    query_sets = [
        f"{clean_niche} tutorial new",
        f"{clean_niche} beginners guide 2026",
        f"{clean_niche} mistakes to avoid",
        f"{clean_niche} tools comparison 2026",
        f"{clean_niche} project ideas 2026",
    ]
    # Pick two queries starting from day_seed so each day gets different angles
    q1 = query_sets[day_seed % len(query_sets)]
    q2 = query_sets[(day_seed + 1) % len(query_sets)]

    raw_results = search_trends(q1, max_results=4)
    if len(raw_results) < 3:
        import time
        time.sleep(2)
        raw_results += search_trends(q2, max_results=4)

    # Deduplicate by title
    seen: set[str] = set()
    deduped = []
    for r in raw_results:
        t = r.get("title", "")
        if t not in seen:
            seen.add(t)
            deduped.append(r)

    trend_summary = format_results(deduped[:7])
    logger.info("Search returned %d results (queries: %r, %r)", len(deduped), q1, q2)
    logger.info("Trend summary:\n%s", trend_summary[:500])

    # Step 2 — build prompt via safe substitution
    template = _load_template(CURRENT_VERSION)
    replacements = {
        "{channel_name}": channel_name or "Unknown channel",
        "{channel_type}": channel_type or "youtube",
        "{niche}": niche or "general",
        "{target_audience}": target_audience or "general audience",
        "{content_style}": content_style or "mixed",
        "{past_titles}": past_titles or "No past titles provided.",
        "{trend_context}": trend_summary,
    }
    prompt = template
    for key, value in replacements.items():
        prompt = prompt.replace(key, value)

    messages = [{"role": "user", "content": prompt}]

    # Step 3 — call LLM with retry
    last_error: Exception | None = None
    for attempt in range(2):
        try:
            raw, model_label = await call_llm(messages)
            logger.info("Raw LLM response (first 500 chars): %s", raw[:500])
            json_str = _extract_json(raw)
            data = json.loads(json_str)
            ideas = [_clean_draft(VideoIdeaDraft(**item)) for item in data]
            result = VideoIdeasResult(ideas=ideas)
            return result, model_label, trend_summary
        except Exception as e:
            last_error = e
            logger.warning("Video ideas attempt %d failed: %s", attempt + 1, e)

    raise RuntimeError(
        f"Video ideas generation failed after 2 attempts: {last_error}"
    ) from last_error
