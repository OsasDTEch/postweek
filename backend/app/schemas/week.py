from datetime import datetime

from pydantic import BaseModel

from app.schemas.post import PostOut


class WeekSummary(BaseModel):
    """Lightweight week — no posts, used for history list."""
    id: str
    prompt_version: str
    model_used: str | None
    regen_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class WeekOut(BaseModel):
    id: str
    prompt_version: str
    model_used: str | None
    regen_count: int
    created_at: datetime
    posts: list[PostOut]

    model_config = {"from_attributes": True}
