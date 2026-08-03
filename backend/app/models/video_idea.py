import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class VideoIdea(Base):
    __tablename__ = "video_ideas"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    title: Mapped[str] = mapped_column(Text, nullable=False)
    hook: Mapped[str] = mapped_column(Text, nullable=False)        # opening line / thumbnail hook
    angle: Mapped[str] = mapped_column(Text, nullable=False)       # the specific take / why now
    format: Mapped[str] = mapped_column(String(50), nullable=False)  # short | long | tutorial | story | list
    trend_context: Mapped[str | None] = mapped_column(Text, nullable=True)  # what search result informed this

    # saved | dismissed
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="saved")

    batch_id: Mapped[str] = mapped_column(
        String, nullable=False, index=True
    )  # groups ideas generated in the same run

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    user: Mapped["User"] = relationship("User", back_populates="video_ideas")  # noqa: F821
