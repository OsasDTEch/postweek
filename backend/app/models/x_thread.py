import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

TWEET_SEPARATOR = "\n---\n"


class XThread(Base):
    __tablename__ = "x_threads"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    batch_id: Mapped[str] = mapped_column(String, nullable=False, index=True)

    # Tweets stored as separator-joined text
    tweets_raw: Mapped[str] = mapped_column(Text, nullable=False)
    edited_tweets_raw: Mapped[str | None] = mapped_column(Text, nullable=True)

    format: Mapped[str] = mapped_column(String(50), nullable=False)
    # opinion | tips | story | hot_take | thread_essay | qa
    topic: Mapped[str] = mapped_column(Text, nullable=False)
    trend_context: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")
    # draft | edited | copied
    copied_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    user: Mapped["User"] = relationship("User", back_populates="x_threads")  # noqa: F821

    @property
    def tweets(self) -> list[str]:
        raw = self.edited_tweets_raw or self.tweets_raw
        return [t.strip() for t in raw.split(TWEET_SEPARATOR) if t.strip()]
