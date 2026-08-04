import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.video_agent import generate_video_ideas
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.video_idea import VideoIdea
from app.models.video_profile import VideoProfile
from app.schemas.video import VideoIdeasBatch, VideoIdeaOut, VideoProfileOut, VideoProfileUpdate

router = APIRouter(prefix="/video", tags=["video"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _get_or_create_video_profile(user: User, db: AsyncSession) -> VideoProfile:
    result = await db.execute(
        select(VideoProfile).where(VideoProfile.user_id == user.id)
    )
    profile = result.scalar_one_or_none()
    if profile is None:
        profile = VideoProfile(user_id=user.id)
        db.add(profile)
        await db.flush()
    return profile


# ---------------------------------------------------------------------------
# Video profile
# ---------------------------------------------------------------------------

@router.get("/profile", response_model=VideoProfileOut)
async def get_video_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await _get_or_create_video_profile(current_user, db)


@router.put("/profile", response_model=VideoProfileOut)
async def update_video_profile(
    body: VideoProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = await _get_or_create_video_profile(current_user, db)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    await db.flush()
    return profile


# ---------------------------------------------------------------------------
# Generate ideas
# ---------------------------------------------------------------------------

@router.post("/ideas/generate", response_model=VideoIdeasBatch, status_code=status.HTTP_201_CREATED)
async def generate_ideas(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = await _get_or_create_video_profile(current_user, db)

    if not profile.niche:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Set up your video profile first — at minimum add your niche.",
        )

    # Build avoid_topics from the most recent batch so the LLM doesn't repeat titles
    avoid_topics = ""
    recent_result = await db.execute(
        select(VideoIdea.title)
        .where(VideoIdea.user_id == current_user.id)
        .order_by(VideoIdea.created_at.desc())
        .limit(7)
    )
    recent_titles = [row[0] for row in recent_result.all() if row[0]]
    if recent_titles:
        avoid_topics = "; ".join(recent_titles)

    try:
        result, model_label, _ = await generate_video_ideas(
            channel_name=profile.channel_name or "",
            channel_type=profile.channel_type or "youtube",
            niche=profile.niche or "",
            target_audience=profile.target_audience or "",
            content_style=profile.content_style or "",
            past_titles=profile.past_titles or "",
            avoid_topics=avoid_topics,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))

    batch_id = str(uuid.uuid4())
    ideas_out: list[VideoIdeaOut] = []

    for draft in result.ideas:
        idea = VideoIdea(
            user_id=current_user.id,
            batch_id=batch_id,
            title=draft.title,
            hook=draft.hook,
            angle=draft.angle,
            format=draft.format,
            trend_context=draft.trend_context,
        )
        db.add(idea)
        await db.flush()
        ideas_out.append(VideoIdeaOut.model_validate(idea))

    return VideoIdeasBatch(batch_id=batch_id, ideas=ideas_out, model_used=model_label)


# ---------------------------------------------------------------------------
# Latest batch
# ---------------------------------------------------------------------------

@router.get("/ideas/latest", response_model=VideoIdeasBatch)
async def get_latest_ideas(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(VideoIdea.batch_id)
        .where(VideoIdea.user_id == current_user.id)
        .order_by(VideoIdea.created_at.desc())
        .limit(1)
    )
    row = result.scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No ideas generated yet")

    batch_id = row
    ideas_result = await db.execute(
        select(VideoIdea)
        .where(VideoIdea.user_id == current_user.id, VideoIdea.batch_id == batch_id)
        .order_by(VideoIdea.created_at)
    )
    ideas = ideas_result.scalars().all()
    return VideoIdeasBatch(
        batch_id=batch_id,
        ideas=[VideoIdeaOut.model_validate(i) for i in ideas],
    )


@router.get("/ideas/batches", response_model=list[dict])
async def list_batches(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all batch IDs with their creation date, newest first."""
    from sqlalchemy import func as sa_func
    result = await db.execute(
        select(VideoIdea.batch_id, sa_func.min(VideoIdea.created_at).label("created_at"))
        .where(VideoIdea.user_id == current_user.id)
        .group_by(VideoIdea.batch_id)
        .order_by(sa_func.min(VideoIdea.created_at).desc())
    )
    rows = result.all()
    return [{"batch_id": r.batch_id, "created_at": r.created_at.isoformat()} for r in rows]


@router.get("/ideas/batch/{batch_id}", response_model=VideoIdeasBatch)
async def get_batch(
    batch_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ideas_result = await db.execute(
        select(VideoIdea)
        .where(VideoIdea.user_id == current_user.id, VideoIdea.batch_id == batch_id)
        .order_by(VideoIdea.created_at)
    )
    ideas = ideas_result.scalars().all()
    if not ideas:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")
    return VideoIdeasBatch(
        batch_id=batch_id,
        ideas=[VideoIdeaOut.model_validate(i) for i in ideas],
    )


@router.delete("/ideas/batch/{batch_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_batch(
    batch_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete all ideas in a batch."""
    result = await db.execute(
        select(VideoIdea)
        .where(VideoIdea.user_id == current_user.id, VideoIdea.batch_id == batch_id)
    )
    ideas = result.scalars().all()
    if not ideas:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")
    for idea in ideas:
        await db.delete(idea)
    await db.flush()


# ---------------------------------------------------------------------------
# Dismiss an idea
# ---------------------------------------------------------------------------

@router.patch("/ideas/{idea_id}/dismiss", response_model=VideoIdeaOut)
async def dismiss_idea(
    idea_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(VideoIdea).where(
            VideoIdea.id == idea_id,
            VideoIdea.user_id == current_user.id,
        )
    )
    idea = result.scalar_one_or_none()
    if idea is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Idea not found")
    idea.status = "dismissed"
    await db.flush()
    return idea
