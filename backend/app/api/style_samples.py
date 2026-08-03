from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.style_sample import StyleSample
from app.models.user import User
from app.schemas.style_sample import StyleSampleCreate, StyleSampleOut

router = APIRouter(prefix="/style-samples", tags=["style-samples"])

MAX_SAMPLES = 3


@router.get("", response_model=list[StyleSampleOut])
async def list_samples(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(StyleSample)
        .where(StyleSample.user_id == current_user.id)
        .order_by(StyleSample.created_at)
    )
    return result.scalars().all()


@router.post("", response_model=StyleSampleOut, status_code=status.HTTP_201_CREATED)
async def add_sample(
    body: StyleSampleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Count existing samples
    result = await db.execute(
        select(StyleSample).where(StyleSample.user_id == current_user.id)
    )
    existing = result.scalars().all()

    if len(existing) >= MAX_SAMPLES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Maximum {MAX_SAMPLES} style samples allowed. Delete one first.",
        )

    sample = StyleSample(user_id=current_user.id, content=body.content.strip())
    db.add(sample)
    await db.flush()
    return sample


@router.delete("/{sample_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sample(
    sample_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(StyleSample).where(
            StyleSample.id == sample_id,
            StyleSample.user_id == current_user.id,
        )
    )
    sample = result.scalar_one_or_none()
    if sample is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sample not found")
    await db.delete(sample)
