import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class VideoProfile(Base):
    __tablename__ = "video_profiles"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    # Channel context
    channel_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    channel_type: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )  # youtube | tiktok | instagram_reels | shorts | podcast
    niche: Mapped[str | None] = mapped_column(Text, nullable=True)          # e.g. "AI tools for developers"
    target_audience: Mapped[str | None] = mapped_column(Text, nullable=True)
    content_style: Mapped[str | None] = mapped_column(Text, nullable=True)  # e.g. "tutorial, talking head, screen share"

    # Past titles — stored as newline-separated list
    past_titles: Mapped[str | None] = mapped_column(Text, nullable=True)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user: Mapped["User"] = relationship("User", back_populates="video_profile")  # noqa: F821
