from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List

from app.api import deps
from app.models.portfolio import PortfolioItem
from app.schemas.portfolio import PortfolioItem as PortfolioItemSchema, PortfolioItemCreate, PortfolioItemUpdate

router = APIRouter()

@router.get("/", response_model=List[PortfolioItemSchema])
async def get_my_portfolio(
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    result = await db.execute(
        select(PortfolioItem).where(PortfolioItem.user_id == current_user.id).order_by(PortfolioItem.created_at.desc())
    )
    return result.scalars().all()

@router.post("/", response_model=PortfolioItemSchema, status_code=status.HTTP_201_CREATED)
async def create_portfolio_item(
    item_in: PortfolioItemCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    item = PortfolioItem(
        **item_in.model_dump(),
        user_id=current_user.id
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item

@router.patch("/{item_id}", response_model=PortfolioItemSchema)
async def update_portfolio_item(
    item_id: UUID,
    item_in: PortfolioItemUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    result = await db.execute(
        select(PortfolioItem).where(PortfolioItem.id == item_id, PortfolioItem.user_id == current_user.id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    
    update_data = item_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)
    
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_portfolio_item(
    item_id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    result = await db.execute(
        select(PortfolioItem).where(PortfolioItem.id == item_id, PortfolioItem.user_id == current_user.id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    
    await db.delete(item)
    await db.commit()
    return None
