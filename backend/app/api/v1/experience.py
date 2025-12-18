from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List

from app.api import deps
from app.models.experience import WorkExperience
from app.schemas.experience import Experience, ExperienceCreate, ExperienceUpdate

router = APIRouter()

@router.get("/", response_model=List[Experience])
async def get_my_experiences(
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    result = await db.execute(
        select(WorkExperience).where(WorkExperience.user_id == current_user.id).order_by(WorkExperience.start_date.desc())
    )
    return result.scalars().all()

@router.post("/", response_model=Experience, status_code=status.HTTP_201_CREATED)
async def create_experience(
    exp_in: ExperienceCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    exp = WorkExperience(
        **exp_in.model_dump(),
        user_id=current_user.id
    )
    db.add(exp)
    await db.commit()
    await db.refresh(exp)
    return exp

@router.patch("/{exp_id}", response_model=Experience)
async def update_experience(
    exp_id: UUID,
    exp_in: ExperienceUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    result = await db.execute(
        select(WorkExperience).where(WorkExperience.id == exp_id, WorkExperience.user_id == current_user.id)
    )
    exp = result.scalar_one_or_none()
    if not exp:
        raise HTTPException(status_code=404, detail="Experience not found")
    
    update_data = exp_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(exp, key, value)
    
    db.add(exp)
    await db.commit()
    await db.refresh(exp)
    return exp

@router.delete("/{exp_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_experience(
    exp_id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    result = await db.execute(
        select(WorkExperience).where(WorkExperience.id == exp_id, WorkExperience.user_id == current_user.id)
    )
    exp = result.scalar_one_or_none()
    if not exp:
        raise HTTPException(status_code=404, detail="Experience not found")
    
    await db.delete(exp)
    await db.commit()
    return None
