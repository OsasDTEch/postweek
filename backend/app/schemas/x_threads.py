from datetime import datetime
from pydantic import BaseModel


class XProfileUpdate(BaseModel):
    handle: str | None = None
    niche: str | None = None
    target_audience: str | None = None
    past_tweets: str | None = None
    preferred_formats: str | None = None
    tone: str | None = None


class XProfileOut(BaseModel):
    id: str
    user_id: str
    handle: str | None
    niche: str | None
    target_audience: str | None
    past_tweets: str | None
    preferred_formats: str | None
    tone: str | None

    model_config = {"from_attributes": True}


class XThreadOut(BaseModel):
    id: str
    batch_id: str
    format: str
    topic: str
    tweets: list[str]
    trend_context: str | None
    status: str
    copied_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_model(cls, thread: object) -> "XThreadOut":
        from app.models.x_thread import XThread
        t: XThread = thread  # type: ignore[assignment]
        return cls(
            id=t.id,
            batch_id=t.batch_id,
            format=t.format,
            topic=t.topic,
            tweets=t.tweets,
            trend_context=t.trend_context,
            status=t.status,
            copied_at=t.copied_at,
            created_at=t.created_at,
        )


class XThreadsBatch(BaseModel):
    batch_id: str
    threads: list[XThreadOut]
    model_used: str | None = None


class XThreadEdit(BaseModel):
    tweets: list[str]
