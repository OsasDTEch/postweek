from datetime import datetime

from pydantic import BaseModel


class StyleSampleCreate(BaseModel):
    content: str


class StyleSampleOut(BaseModel):
    id: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
