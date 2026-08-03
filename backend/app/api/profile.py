from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.profile import Profile
from app.models.user import User
from app.schemas.profile import ProfileOut, ProfileUpdate

router = APIRouter(prefix="/profile", tags=["profile"])


async def _get_or_create_profile(user: User, db: AsyncSession) -> Profile:
    result = await db.execute(select(Profile).where(Profile.user_id == user.id))
    profile = result.scalar_one_or_none()
    if profile is None:
        profile = Profile(user_id=user.id)
        db.add(profile)
        await db.flush()
    return profile


@router.get("", response_model=ProfileOut)
async def get_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = await _get_or_create_profile(current_user, db)
    return profile


@router.put("", response_model=ProfileOut)
async def update_profile(
    body: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = await _get_or_create_profile(current_user, db)

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    await db.flush()
    return profile
