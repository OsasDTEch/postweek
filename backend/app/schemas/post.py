from datetime import datetime
from pydantic import BaseModel


class PostEdit(BaseModel):
    edited_body: str


class RegenRequest(BaseModel):
    steering_note: str | None = None


class PostOut(BaseModel):
    id: str
    week_id: str
    pillar: str
    suggested_day: str
    platform: str          # linkedin | x
    body: str
    edited_body: str | None
    status: str
    copied_at: datetime | None

    model_config = {"from_attributes": True}


class XPostOut(BaseModel):
    """Returned by the repurpose endpoint — the X thread as a list of tweets."""
    id: str
    week_id: str
    pillar: str
    suggested_day: str
    platform: str
    body: str              # tweets joined by \n---\n for storage
    edited_body: str | None
    status: str
    copied_at: datetime | None
    tweets: list[str]      # convenience split for the frontend

    model_config = {"from_attributes": True}

    @classmethod
    def from_post(cls, post: object) -> "XPostOut":
        from app.models.post import Post
        p: Post = post  # type: ignore[assignment]
        body = p.edited_body or p.body
        tweets = [t.strip() for t in body.split("\n---\n") if t.strip()]
        return cls(
            id=p.id,
            week_id=p.week_id,
            pillar=p.pillar,
            suggested_day=p.suggested_day,
            platform=p.platform,
            body=p.body,
            edited_body=p.edited_body,
            status=p.status,
            copied_at=p.copied_at,
            tweets=tweets,
        )
