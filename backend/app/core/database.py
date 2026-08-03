from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


def _normalise_url(url: str) -> str:
    """Ensure postgresql+asyncpg:// prefix, strip pgbouncer param."""
    if "postgresql+asyncpg://" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    url = url.replace("?pgbouncer=true", "").replace("&pgbouncer=true", "")
    return url


# Use DIRECT_URL (port 5432, session mode, no PgBouncer) for the app.
# The transaction-mode pooler (port 6543) is incompatible with asyncpg
# prepared statements regardless of configuration. Session mode works fine.
engine = create_async_engine(
    _normalise_url(settings.DIRECT_URL),
    echo=settings.APP_ENV == "development",
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:  # type: ignore[override]
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
