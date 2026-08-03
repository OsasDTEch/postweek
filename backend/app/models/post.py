import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    week_id: Mapped[str] = mapped_column(
        String, ForeignKey("weeks.id", ondelete="CASCADE"), nullable=False, index=True
    )

    pillar: Mapped[str] = mapped_column(String(50), nullable=False)
    # personal_story | opinion | how_to | engagement_question | behind_the_scenes
    suggested_day: Mapped[str] = mapped_column(String(20), nullable=False)  # Monday … Friday
    platform: Mapped[str] = mapped_column(String(20), nullable=False, default="linkedin")  # linkedin | x
    body: Mapped[str] = mapped_column(Text, nullable=False)
    edited_body: Mapped[str | None] = mapped_column(Text, nullable=True)

    # draft | edited | copied
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")
    copied_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    week: Mapped["Week"] = relationship("Week", back_populates="posts")  # noqa: F821

    @property
    def display_body(self) -> str:
        """Returns edited body if present, otherwise original generated body."""
        return self.edited_body or self.body
