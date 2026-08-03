import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.x_threads_agent import generate_x_threads
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.x_profile import XProfile
from app.models.x_thread import XThread, TWEET_SEPARATOR
from app.schemas.x_threads import (
    XProfileOut, XProfileUpdate,
    XThreadOut, XThreadsBatch, XThreadEdit,
)

router = APIRouter(prefix="/x-threads", tags=["x-threads"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _get_or_create_profile(user: User, db: AsyncSession) -> XProfile:
    result = await db.execute(select(XProfile).where(XProfile.user_id == user.id))
    profile = result.scalar_one_or_none()
    if profile is None:
        profile = XProfile(user_id=user.id)
        db.add(profile)
        await db.flush()
    return profile


async def _get_latest_batch_id(user: User, db: AsyncSession) -> str | None:
    from sqlalchemy import func as sa_func
    result = await db.execute(
        select(XThread.batch_id, sa_func.min(XThread.created_at).label("created_at"))
        .where(XThread.user_id == user.id)
        .group_by(XThread.batch_id)
        .order_by(sa_func.min(XThread.created_at).desc())
        .limit(1)
    )
    row = result.first()
    return row.batch_id if row else None


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

@router.get("/profile", response_model=XProfileOut)
async def get_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await _get_or_create_profile(current_user, db)


@router.put("/profile", response_model=XProfileOut)
async def update_profile(
    body: XProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = await _get_or_create_profile(current_user, db)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    await db.flush()
    return profile


# ---------------------------------------------------------------------------
# Generate
# ---------------------------------------------------------------------------

@router.post("/generate", response_model=XThreadsBatch, status_code=status.HTTP_201_CREATED)
async def generate_threads(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = await _get_or_create_profile(current_user, db)

    if not profile.niche:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Set up your X profile first — add your niche at minimum.",
        )

    try:
        result, model_label, _ = await generate_x_threads(
            handle=profile.handle or "",
            niche=profile.niche or "",
            target_audience=profile.target_audience or "",
            past_tweets=profile.past_tweets or "",
            preferred_formats=profile.preferred_formats or "opinion, tips, story",
            tone=profile.tone or "conversational",
        )
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))

    batch_id = str(uuid.uuid4())
    threads_out: list[XThreadOut] = []

    for draft in result.threads:
        thread = XThread(
            user_id=current_user.id,
            batch_id=batch_id,
            tweets_raw=TWEET_SEPARATOR.join(draft.tweets),
            format=draft.format,
            topic=draft.topic,
            trend_context=draft.trend_context or None,
        )
        db.add(thread)
        await db.flush()
        threads_out.append(XThreadOut.from_model(thread))

    return XThreadsBatch(batch_id=batch_id, threads=threads_out, model_used=model_label)


# ---------------------------------------------------------------------------
# Latest batch
# ---------------------------------------------------------------------------

@router.get("/latest", response_model=XThreadsBatch)
async def get_latest(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    batch_id = await _get_latest_batch_id(current_user, db)
    if not batch_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No threads generated yet")

    result = await db.execute(
        select(XThread)
        .where(XThread.user_id == current_user.id, XThread.batch_id == batch_id)
        .order_by(XThread.created_at)
    )
    threads = result.scalars().all()
    return XThreadsBatch(
        batch_id=batch_id,
        threads=[XThreadOut.from_model(t) for t in threads],
    )


# ---------------------------------------------------------------------------
# Batch list + delete
# ---------------------------------------------------------------------------

@router.get("/batches", response_model=list[dict])
async def list_batches(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy import func as sa_func
    result = await db.execute(
        select(XThread.batch_id, sa_func.min(XThread.created_at).label("created_at"))
        .where(XThread.user_id == current_user.id)
        .group_by(XThread.batch_id)
        .order_by(sa_func.min(XThread.created_at).desc())
    )
    return [{"batch_id": r.batch_id, "created_at": r.created_at.isoformat()} for r in result.all()]


@router.delete("/batch/{batch_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_batch(
    batch_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(XThread).where(XThread.user_id == current_user.id, XThread.batch_id == batch_id)
    )
    threads = result.scalars().all()
    if not threads:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")
    for t in threads:
        await db.delete(t)
    await db.flush()


# ---------------------------------------------------------------------------
# Edit / copy / dismiss individual thread
# ---------------------------------------------------------------------------

@router.patch("/{thread_id}", response_model=XThreadOut)
async def edit_thread(
    thread_id: str,
    body: XThreadEdit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(XThread).where(XThread.id == thread_id, XThread.user_id == current_user.id)
    )
    thread = result.scalar_one_or_none()
    if not thread:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Thread not found")

    # Validate and clean tweets
    cleaned = []
    for tw in body.tweets:
        tw = tw.strip().replace("\u2014", " ").replace("\u2013", " ")
        if tw:
            cleaned.append(tw[:280])
    thread.edited_tweets_raw = TWEET_SEPARATOR.join(cleaned)
    thread.status = "edited"
    await db.flush()
    return XThreadOut.from_model(thread)


@router.post("/{thread_id}/copy", response_model=XThreadOut)
async def copy_thread(
    thread_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(XThread).where(XThread.id == thread_id, XThread.user_id == current_user.id)
    )
    thread = result.scalar_one_or_none()
    if not thread:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Thread not found")
    thread.status = "copied"
    thread.copied_at = datetime.now(timezone.utc)
    await db.flush()
    return XThreadOut.from_model(thread)
