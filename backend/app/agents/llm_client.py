"""
Low-level LLM call helper with Ollama Cloud → Groq fallback.

PydanticAI supports pluggable models. We build two model instances at startup
and try Ollama first; on any exception we retry with Groq.
"""
import logging
from typing import Any

import httpx
from tenacity import retry, stop_after_attempt, wait_fixed

from app.core.config import settings

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = "https://ollama.com/v1"
GROQ_BASE_URL = "https://api.groq.com/openai/v1"

# Timeout for each LLM call (seconds)
LLM_TIMEOUT = 120


async def _call_openai_compat(
    base_url: str,
    api_key: str,
    model: str,
    messages: list[dict[str, str]],
) -> str:
    """Call an OpenAI-compatible chat completions endpoint and return the text."""
    async with httpx.AsyncClient(timeout=LLM_TIMEOUT) as client:
        response = await client.post(
            f"{base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": messages,
                "temperature": 0.8,
                "max_tokens": 4096,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]


async def call_llm(messages: list[dict[str, str]]) -> tuple[str, str]:
    """
    Try Ollama Cloud first, fall back to Groq.
    Returns (response_text, model_label).
    """
    # --- Primary: Ollama Cloud ---
    try:
        text = await _call_openai_compat(
            base_url=OLLAMA_BASE_URL,
            api_key=settings.OLLAMA_API_KEY,
            model=settings.OLLAMA_MODEL,
            messages=messages,
        )
        logger.info("LLM served by Ollama Cloud (%s)", settings.OLLAMA_MODEL)
        return text, f"ollama/{settings.OLLAMA_MODEL}"
    except Exception as ollama_err:
        logger.warning(
            "Ollama Cloud failed — %s: %s, falling back to Groq",
            type(ollama_err).__name__,
            ollama_err,
        )

    # --- Fallback: Groq ---
    text = await _call_openai_compat(
        base_url=GROQ_BASE_URL,
        api_key=settings.GROQ_API_KEY,
        model=settings.GROQ_MODEL,
        messages=messages,
    )
    logger.info("LLM served by Groq (%s)", settings.GROQ_MODEL)
    return text, f"groq/{settings.GROQ_MODEL}"
