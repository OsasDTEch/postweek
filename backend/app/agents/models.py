"""Shared Pydantic result types used by both agents."""
from pydantic import BaseModel, field_validator


VALID_PILLARS = {
    "personal_story",
    "opinion",
    "how_to",
    "engagement_question",
    "behind_the_scenes",
}

VALID_DAYS = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday"}


class PostDraft(BaseModel):
    pillar: str
    suggested_day: str
    body: str

    @field_validator("pillar")
    @classmethod
    def validate_pillar(cls, v: str) -> str:
        if v not in VALID_PILLARS:
            raise ValueError(f"pillar must be one of {VALID_PILLARS}, got '{v}'")
        return v

    @field_validator("suggested_day")
    @classmethod
    def validate_day(cls, v: str) -> str:
        if v not in VALID_DAYS:
            raise ValueError(f"suggested_day must be one of {VALID_DAYS}, got '{v}'")
        return v

    @field_validator("body")
    @classmethod
    def validate_body(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("body cannot be empty")
        if len(v) > 1300:
            raise ValueError(f"body exceeds 1300 characters ({len(v)})")
        return v


class WeeklyPosts(BaseModel):
    posts: list[PostDraft]

    @field_validator("posts")
    @classmethod
    def validate_count(cls, v: list[PostDraft]) -> list[PostDraft]:
        if len(v) != 5:
            raise ValueError(f"Expected exactly 5 posts, got {len(v)}")
        return v


# ---------------------------------------------------------------------------
# X / Twitter types
# ---------------------------------------------------------------------------

class XPostDraft(BaseModel):
    """A repurposed LinkedIn post converted into an X thread."""
    pillar: str
    suggested_day: str
    tweets: list[str]  # each element is one tweet, max 280 chars

    @field_validator("pillar")
    @classmethod
    def validate_pillar(cls, v: str) -> str:
        if v not in VALID_PILLARS:
            raise ValueError(f"pillar must be one of {VALID_PILLARS}, got '{v}'")
        return v

    @field_validator("tweets")
    @classmethod
    def validate_tweets(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("tweets list cannot be empty")
        if len(v) > 6:
            raise ValueError(f"Thread too long: {len(v)} tweets (max 6)")
        result = []
        for i, tweet in enumerate(v):
            tweet = tweet.strip()
            if not tweet:
                raise ValueError(f"Tweet {i + 1} is empty")
            if len(tweet) > 280:
                raise ValueError(
                    f"Tweet {i + 1} exceeds 280 characters ({len(tweet)}): {tweet[:60]}..."
                )
            result.append(tweet)
        return result
