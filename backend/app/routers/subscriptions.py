"""
Subscription routes: list pricing tiers.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.dependencies import get_db, get_current_user, require_admin
from app.models.user import User
from app.models.subscription import SubscriptionTier
from app.schemas.payment import SubscriptionTierResponse
from pydantic import BaseModel

router = APIRouter(prefix="/api/subscriptions", tags=["Subscriptions"])


class SubscriptionTierCreate(BaseModel):
    tier_id: str
    name: str
    description: Optional[str] = None
    price_2wk: float
    price_4wk: float
    categories: list
    popular: bool = False


class SubscriptionTierUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_2wk: Optional[float] = None
    price_4wk: Optional[float] = None
    categories: Optional[list] = None
    popular: Optional[bool] = None


@router.get("/tiers", response_model=List[SubscriptionTierResponse])
async def list_tiers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SubscriptionTier).order_by(SubscriptionTier.price_2wk.asc()))
    tiers = result.scalars().all()

    response = []
    for t in tiers:
        t_dict = t.__dict__.copy()
        t_dict["currency"] = "KES"
        t_dict["currency_symbol"] = "KES"
        response.append(SubscriptionTierResponse.model_validate(t_dict))

    return response


@router.get("/me")
async def my_subscription(user: User = Depends(get_current_user)):
    return {
        "tier": user.subscription_tier,
        "expires_at": user.subscription_expires_at,
        "is_active": user.is_subscription_active,
    }


@router.post("/tiers", response_model=SubscriptionTierResponse)
async def create_tier(tier: SubscriptionTierCreate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    db_tier = SubscriptionTier(**tier.model_dump())
    db.add(db_tier)
    try:
        await db.commit()
        await db.refresh(db_tier)
        return db_tier
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/tiers/{tier_id}", response_model=SubscriptionTierResponse)
async def update_tier(tier_id: str, tier_update: SubscriptionTierUpdate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(SubscriptionTier).where(SubscriptionTier.tier_id == tier_id))
    db_tier = result.scalar_one_or_none()
    if not db_tier:
        raise HTTPException(status_code=404, detail="Tier not found")

    update_data = tier_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_tier, key, value)

    await db.commit()
    await db.refresh(db_tier)
    return db_tier


@router.delete("/tiers/{tier_id}")
async def delete_tier(tier_id: str, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(SubscriptionTier).where(SubscriptionTier.tier_id == tier_id))
    db_tier = result.scalar_one_or_none()
    if not db_tier:
        raise HTTPException(status_code=404, detail="Tier not found")

    await db.delete(db_tier)
    await db.commit()
    return {"status": "success", "message": f"Tier {tier_id} deleted"}
