from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.regen_agent import regenerate_post
from app.agents.repurpose_agent import repurpose_to_x
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.post import Post
from app.models.profile import Profile
from app.models.style_sample import StyleSample
from app.models.user import User
from app.models.week import Week
from app.schemas.post import PostEdit, PostOut, RegenRequest, XPostOut

router = APIRouter(prefix="/posts", tags=["posts"])

TWEET_SEPARATOR = "\n---\n"


async def _get_post_for_user(post_id: str, user: User, db: AsyncSession) -> Post:
    result = await db.execute(
        select(Post)
        .join(Week, Post.week_id == Week.id)
        .where(Post.id == post_id, Week.user_id == user.id)
    )
    post = result.scalar_one_or_none()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return post


async def _load_user_context(user: User, db: AsyncSession) -> tuple[Profile | None, list[str]]:
    profile_result = await db.execute(select(Profile).where(Profile.user_id == user.id))
    profile = profile_result.scalar_one_or_none()
    samples_result = await db.execute(
        select(StyleSample)
        .where(StyleSample.user_id == user.id)
        .order_by(StyleSample.created_at)
    )
    samples = [s.content for s in samples_result.scalars().all()]
    return profile, samples


# ---------------------------------------------------------------------------
# Edit
# ---------------------------------------------------------------------------

@router.patch("/{post_id}", response_model=PostOut)
async def edit_post(
    post_id: str,
    body: PostEdit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = await _get_post_for_user(post_id, current_user, db)
    post.edited_body = body.edited_body.strip()
    post.status = "edited"
    await db.flush()
    return post


# ---------------------------------------------------------------------------
# Regenerate (LinkedIn only)
# ---------------------------------------------------------------------------

@router.post("/{post_id}/regenerate", response_model=PostOut)
async def regenerate_post_route(
    post_id: str,
    body: RegenRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = await _get_post_for_user(post_id, current_user, db)

    if post.platform != "linkedin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use the repurpose endpoint to regenerate X posts.",
        )

    profile, style_samples = await _load_user_context(current_user, db)
    original_body = post.edited_body or post.body

    try:
        draft, _ = await regenerate_post(
            name=profile.name if profile else "",
            role=profile.role if profile else "",
            offering=profile.offering if profile else "",
            audience=profile.audience if profile else "",
            topics=profile.topics if profile else "",
            known_for=profile.known_for if profile else "",
            style_samples=style_samples,
            tone_preset=profile.tone_preset if profile else None,
            original_body=original_body,
            pillar=post.pillar,
            suggested_day=post.suggested_day,
            steering_note=body.steering_note,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))

    post.body = draft.body
    post.edited_body = None
    post.status = "draft"

    week_result = await db.execute(select(Week).where(Week.id == post.week_id))
    week = week_result.scalar_one()
    week.regen_count += 1
    await db.flush()
    return post


# ---------------------------------------------------------------------------
# Repurpose LinkedIn → X thread
# ---------------------------------------------------------------------------

@router.post("/{post_id}/repurpose", response_model=XPostOut)
async def repurpose_post(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Convert a LinkedIn post into an X thread stored as a sibling post."""
    linkedin_post = await _get_post_for_user(post_id, current_user, db)

    if linkedin_post.platform != "linkedin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only LinkedIn posts can be repurposed.",
        )

    profile, style_samples = await _load_user_context(current_user, db)
    source_body = linkedin_post.edited_body or linkedin_post.body

    try:
        draft, _ = await repurpose_to_x(
            name=profile.name if profile else "",
            role=profile.role if profile else "",
            offering=profile.offering if profile else "",
            audience=profile.audience if profile else "",
            style_samples=style_samples,
            tone_preset=profile.tone_preset if profile else None,
            linkedin_body=source_body,
            pillar=linkedin_post.pillar,
            suggested_day=linkedin_post.suggested_day,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))

    # Store tweets joined by separator so the existing Text column works unchanged
    stored_body = TWEET_SEPARATOR.join(draft.tweets)

    x_post = Post(
        week_id=linkedin_post.week_id,
        pillar=linkedin_post.pillar,
        suggested_day=linkedin_post.suggested_day,
        platform="x",
        body=stored_body,
    )
    db.add(x_post)
    await db.flush()
    return XPostOut.from_post(x_post)


# ---------------------------------------------------------------------------
# Re-repurpose (regenerate an existing X post)
# ---------------------------------------------------------------------------

@router.post("/{post_id}/re-repurpose", response_model=XPostOut)
async def re_repurpose_post(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Regenerate an existing X thread from scratch."""
    x_post = await _get_post_for_user(post_id, current_user, db)

    if x_post.platform != "x":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only X posts can be re-repurposed.",
        )

    # Find the sibling LinkedIn post (same week + pillar + day)
    result = await db.execute(
        select(Post).where(
            Post.week_id == x_post.week_id,
            Post.pillar == x_post.pillar,
            Post.suggested_day == x_post.suggested_day,
            Post.platform == "linkedin",
        )
    )
    linkedin_post = result.scalar_one_or_none()
    if not linkedin_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Original LinkedIn post not found.",
        )

    profile, style_samples = await _load_user_context(current_user, db)
    source_body = linkedin_post.edited_body or linkedin_post.body

    try:
        draft, _ = await repurpose_to_x(
            name=profile.name if profile else "",
            role=profile.role if profile else "",
            offering=profile.offering if profile else "",
            audience=profile.audience if profile else "",
            style_samples=style_samples,
            tone_preset=profile.tone_preset if profile else None,
            linkedin_body=source_body,
            pillar=x_post.pillar,
            suggested_day=x_post.suggested_day,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))

    x_post.body = TWEET_SEPARATOR.join(draft.tweets)
    x_post.edited_body = None
    x_post.status = "draft"
    await db.flush()
    return XPostOut.from_post(x_post)


# ---------------------------------------------------------------------------
# Copy / mark done
# ---------------------------------------------------------------------------

@router.post("/{post_id}/copy", response_model=PostOut)
async def mark_copied(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = await _get_post_for_user(post_id, current_user, db)
    post.status = "copied"
    post.copied_at = datetime.now(timezone.utc)
    await db.flush()
    return post
