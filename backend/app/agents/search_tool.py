"""
Search helper using the ddgs metasearch library.
ddgs aggregates results from Bing, DuckDuckGo, Brave and others
so a rate limit on one backend does not kill the whole search.
"""
import logging
import time

from ddgs import DDGS

logger = logging.getLogger(__name__)


def search_trends(query: str, max_results: int = 6) -> list[dict]:
    """
    Search for recent results using ddgs (multi-backend metasearch).
    Tries last 7 days first, falls back to last 30 days if empty.
    Retries once after 3s on rate limit.
    Never raises.
    """
    for attempt in range(2):
        try:
            with DDGS() as ddgs:
                results = list(ddgs.text(
                    query,
                    max_results=max_results,
                    timelimit="m",   # last 30 days as primary — 7 days is too aggressive
                ))
            if results:
                return results

            # No results in 30 days, try without time limit
            with DDGS() as ddgs:
                results = list(ddgs.text(
                    query,
                    max_results=max_results,
                ))
            if results:
                return results

        except Exception as exc:
            err = str(exc)
            if "Ratelimit" in err and attempt == 0:
                logger.warning("Search rate limited, retrying in 3s...")
                time.sleep(3)
                continue
            logger.warning("Search failed for %r: %s", query, exc)
            return []

    return []


def format_results(results: list[dict]) -> str:
    """Format search results into a compact string for the prompt."""
    if not results:
        return "No recent search results found."
    lines = []
    for i, r in enumerate(results, 1):
        title = r.get("title", "").strip()
        body = (r.get("body") or r.get("snippet") or "").strip()[:250]
        url = r.get("href") or r.get("url") or ""
        lines.append(f"{i}. {title}\n   {body}\n   Source: {url}")
    return "\n\n".join(lines)
