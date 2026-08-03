import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class XProfile(Base):
    __tablename__ = "x_profiles"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    handle: Mapped[str | None] = mapped_column(String(100), nullable=True)
    niche: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_audience: Mapped[str | None] = mapped_column(Text, nullable=True)
    # past_tweets — newline separated examples of their tweet style
    past_tweets: Mapped[str | None] = mapped_column(Text, nullable=True)
    # preferred formats: opinion, tips, story, hot_take, thread_essay, qa
    preferred_formats: Mapped[str | None] = mapped_column(Text, nullable=True)
    # tone: punchy, educational, conversational, provocative
    tone: Mapped[str | None] = mapped_column(String(50), nullable=True)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user: Mapped["User"] = relationship("User", back_populates="x_profile")  # noqa: F821
