from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.dependencies import get_db
from app.models.setting import AdminSetting

router = APIRouter(prefix="/api/internal", tags=["Internal"])

SUPPORT_DEFAULTS = {
    "SUPPORT_EMAIL": "support@studentsaffairs.com",
    "SUPPORT_WHATSAPP": "https://wa.me/254700000000",
    "SUPPORT_WHATSAPP_NUMBER": "+254 700 000 000",
}

@router.get("/support-contact")
async def get_public_support_contact(db: AsyncSession = Depends(get_db)):
    """Public: Get active support contact information."""
    result = await db.execute(
        select(AdminSetting).where(AdminSetting.key.in_(SUPPORT_DEFAULTS.keys()))
    )
    settings_db = {s.key: s.value for s in result.scalars().all()}
    
    out = {}
    for key, default in SUPPORT_DEFAULTS.items():
        out[key] = settings_db.get(key, default)
        
    return out
