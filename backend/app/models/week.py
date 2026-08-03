import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Week(Base):
    __tablename__ = "weeks"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    prompt_version: Mapped[str] = mapped_column(String(20), nullable=False, default="v1")
    model_used: Mapped[str | None] = mapped_column(String(100), nullable=True)
    regen_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="weeks")  # noqa: F821
    posts: Mapped[list["Post"]] = relationship(  # noqa: F821
        "Post", back_populates="week", cascade="all, delete-orphan"
    )
