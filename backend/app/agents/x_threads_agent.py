"""
Native X threads generation agent.
Generates 5 original threads matched to the creator's X style and current trends.
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
TWEET_SEPARATOR = "\n---\n"

VALID_FORMATS = {"opinion", "tips", "story", "hot_take", "thread_essay", "qa"}


class XThreadDraft(BaseModel):
    format: str
    topic: str
    tweets: list[str]
    trend_context: str = ""

    @field_validator("format")
    @classmethod
    def valid_format(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in VALID_FORMATS:
            for f in VALID_FORMATS:
                if f in v:
                    return f
            return "opinion"
        return v

    @field_validator("tweets")
    @classmethod
    def validate_tweets(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("tweets list is empty")
        result = []
        for i, tweet in enumerate(v):
            tweet = tweet.strip()
            # Strip em/en dashes
            tweet = tweet.replace("\u2014", " ").replace("\u2013", " ").replace("—", " ").replace("–", " ")
            if not tweet:
                continue
            if len(tweet) > 280:
                tweet = tweet[:277] + "..."
            result.append(tweet)
        if not result:
            raise ValueError("all tweets were empty")
        return result[:7]

    @field_validator("topic", "trend_context")
    @classmethod
    def strip_dashes(cls, v: str) -> str:
        return v.replace("\u2014", " ").replace("\u2013", " ").replace("—", " ").replace("–", " ").strip()


class XThreadsResult(BaseModel):
    threads: list[XThreadDraft]

    @field_validator("threads")
    @classmethod
    def validate_count(cls, v: list[XThreadDraft]) -> list[XThreadDraft]:
        if not v:
            raise ValueError("No threads returned")
        return v[:5]


def _load_template(version: str) -> str:
    return (PROMPTS_DIR / f"x_threads_{version}.txt").read_text(encoding="utf-8")


def _extract_json(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
    start = text.find("[")
    end = text.rfind("]")
    if start == -1 or end == -1:
        raise ValueError("No JSON array in LLM response")
    return text[start: end + 1]


async def generate_x_threads(
    *,
    handle: str,
    niche: str,
    target_audience: str,
    past_tweets: str,
    preferred_formats: str,
    tone: str,
) -> tuple[XThreadsResult, str, str]:
    """
    Generate 5 native X threads.
    Returns (XThreadsResult, model_label, trend_summary).
    """
    import re as _re
    clean_niche = _re.sub(r"[^\w\s]", "", niche)[:50].strip()

    import hashlib as _hashlib
    from datetime import date as _date
    day_seed = int(_hashlib.md5(_date.today().isoformat().encode()).hexdigest(), 16) % 6
    query_sets = [
        f"{clean_niche} trending",
        f"{clean_niche} Twitter X 2026",
        f"{clean_niche} debate 2026",
        f"{clean_niche} viral thread",
        f"{clean_niche} hot take",
        f"{clean_niche} tips creators",
    ]
    q1 = query_sets[day_seed % len(query_sets)]
    q2 = query_sets[(day_seed + 1) % len(query_sets)]

    raw_results = search_trends(q1, max_results=4)
    if len(raw_results) < 2:
        import time
        time.sleep(2)
        raw_results += search_trends(q2, max_results=4)

    seen: set[str] = set()
    deduped = []
    for r in raw_results:
        t = r.get("title", "")
        if t not in seen:
            seen.add(t)
            deduped.append(r)

    trend_summary = format_results(deduped[:6])
    logger.info("X threads: %d search results for niche=%r", len(deduped), clean_niche)

    template = _load_template(CURRENT_VERSION)
    replacements = {
        "{handle}": handle or "Unknown",
        "{niche}": niche or "general",
        "{target_audience}": target_audience or "general audience",
        "{tone}": tone or "conversational",
        "{preferred_formats}": preferred_formats or "opinion, tips, story",
        "{past_tweets}": past_tweets or "No past tweets provided.",
        "{trend_context}": trend_summary,
    }
    prompt = template
    for key, value in replacements.items():
        prompt = prompt.replace(key, value)

    messages = [{"role": "user", "content": prompt}]

    last_error: Exception | None = None
    for attempt in range(2):
        try:
            raw, model_label = await call_llm(messages)
            logger.info("X threads raw response (first 300): %s", raw[:300])
            json_str = _extract_json(raw)
            data = json.loads(json_str)
            threads = [XThreadDraft(**item) for item in data]
            result = XThreadsResult(threads=threads)
            return result, model_label, trend_summary
        except Exception as e:
            last_error = e
            logger.warning("X threads attempt %d failed: %s", attempt + 1, e)

    raise RuntimeError(f"X threads generation failed: {last_error}") from last_error
