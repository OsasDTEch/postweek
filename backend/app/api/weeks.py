from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.agents.week_agent import generate_week
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.post import Post
from app.models.profile import Profile
from app.models.style_sample import StyleSample
from app.models.user import User
from app.models.week import Week
from app.schemas.week import WeekOut, WeekSummary

router = APIRouter(prefix="/weeks", tags=["weeks"])


async def _load_context(user: User, db: AsyncSession) -> tuple[Profile | None, list[str]]:
    profile_result = await db.execute(select(Profile).where(Profile.user_id == user.id))
    profile = profile_result.scalar_one_or_none()

    samples_result = await db.execute(
        select(StyleSample)
        .where(StyleSample.user_id == user.id)
        .order_by(StyleSample.created_at)
    )
    samples = [s.content for s in samples_result.scalars().all()]
    return profile, samples


async def _get_avoid_topics(user: User, db: AsyncSession) -> str:
    result = await db.execute(
        select(Week)
        .where(Week.user_id == user.id)
        .order_by(Week.created_at.desc())
        .limit(1)
        .options(selectinload(Week.posts))
    )
    last_week = result.scalar_one_or_none()
    if not last_week:
        return ""
    pillars = {p.pillar for p in last_week.posts}
    return ", ".join(pillars)


@router.post("/generate", response_model=WeekOut, status_code=status.HTTP_201_CREATED)
async def generate_week_route(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile, style_samples = await _load_context(current_user, db)
    avoid_topics = await _get_avoid_topics(current_user, db)

    week_count_result = await db.execute(
        select(func.count()).select_from(Week).where(Week.user_id == current_user.id)
    )
    week_number = week_count_result.scalar_one()

    try:
        weekly_posts, model_label, prompt_version = await generate_week(
            name=profile.name if profile else "",
            role=profile.role if profile else "",
            offering=profile.offering if profile else "",
            audience=profile.audience if profile else "",
            topics=profile.topics if profile else "",
            known_for=profile.known_for if profile else "",
            style_samples=style_samples,
            tone_preset=profile.tone_preset if profile else None,
            week_number=week_number,
            avoid_topics=avoid_topics,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))

    week = Week(
        user_id=current_user.id,
        prompt_version=prompt_version,
        model_used=model_label,
    )
    db.add(week)
    await db.flush()

    for draft in weekly_posts.posts:
        post = Post(
            week_id=week.id,
            pillar=draft.pillar,
            suggested_day=draft.suggested_day,
            body=draft.body,
        )
        db.add(post)

    await db.flush()

    result = await db.execute(
        select(Week).where(Week.id == week.id).options(selectinload(Week.posts))
    )
    return result.scalar_one()


@router.get("", response_model=list[WeekSummary])
async def list_weeks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all weeks for the user, newest first — lightweight, no posts."""
    result = await db.execute(
        select(Week)
        .where(Week.user_id == current_user.id)
        .order_by(Week.created_at.desc())
    )
    return result.scalars().all()


@router.get("/latest", response_model=WeekOut)
async def get_latest_week(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Week)
        .where(Week.user_id == current_user.id)
        .order_by(Week.created_at.desc())
        .limit(1)
        .options(selectinload(Week.posts))
    )
    week = result.scalar_one_or_none()
    if week is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No weeks generated yet")
    return week


@router.get("/{week_id}", response_model=WeekOut)
async def get_week(
    week_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Week)
        .where(Week.id == week_id, Week.user_id == current_user.id)
        .options(selectinload(Week.posts))
    )
    week = result.scalar_one_or_none()
    if week is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Week not found")
    return week
