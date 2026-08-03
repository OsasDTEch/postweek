import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    # Email verification
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    verification_token: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Password reset
    reset_token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reset_token_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    profile: Mapped["Profile"] = relationship(  # noqa: F821
        "Profile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    style_samples: Mapped[list["StyleSample"]] = relationship(  # noqa: F821
        "StyleSample", back_populates="user", cascade="all, delete-orphan"
    )
    weeks: Mapped[list["Week"]] = relationship(  # noqa: F821
        "Week", back_populates="user", cascade="all, delete-orphan"
    )
    video_profile: Mapped["VideoProfile"] = relationship(  # noqa: F821
        "VideoProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    video_ideas: Mapped[list["VideoIdea"]] = relationship(  # noqa: F821
        "VideoIdea", back_populates="user", cascade="all, delete-orphan"
    )
