from pydantic import BaseModel


class ProfileUpdate(BaseModel):
    name: str | None = None
    role: str | None = None
    offering: str | None = None
    audience: str | None = None
    topics: str | None = None
    known_for: str | None = None
    tone_preset: str | None = None  # casual | professional | contrarian | storyteller


class ProfileOut(BaseModel):
    id: str
    user_id: str
    name: str | None
    role: str | None
    offering: str | None
    audience: str | None
    topics: str | None
    known_for: str | None
    tone_preset: str | None

    model_config = {"from_attributes": True}
