from datetime import datetime
from pydantic import BaseModel


class VideoProfileUpdate(BaseModel):
    channel_name: str | None = None
    channel_type: str | None = None   # youtube | tiktok | instagram_reels | shorts | podcast
    niche: str | None = None
    target_audience: str | None = None
    content_style: str | None = None
    past_titles: str | None = None    # newline-separated list of past video titles


class VideoProfileOut(BaseModel):
    id: str
    user_id: str
    channel_name: str | None
    channel_type: str | None
    niche: str | None
    target_audience: str | None
    content_style: str | None
    past_titles: str | None

    model_config = {"from_attributes": True}


class VideoIdeaOut(BaseModel):
    id: str
    batch_id: str
    title: str
    hook: str
    angle: str
    format: str
    trend_context: str | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class VideoIdeasBatch(BaseModel):
    batch_id: str
    ideas: list[VideoIdeaOut]
    model_used: str | None = None
