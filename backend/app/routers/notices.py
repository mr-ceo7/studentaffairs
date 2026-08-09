from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.notice import Notice
from app.schemas.notice import NoticeCreate, NoticeResponse

router = APIRouter(prefix="/api/notices", tags=["Notices"])


@router.get("", response_model=List[NoticeResponse])
async def get_notices(
    category: Optional[str] = None,
    faculty: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = select(Notice)
    
    if category and category != "All":
        query = query.where(Notice.category == category)
        
    if faculty and faculty != "All Faculties":
        query = query.where(Notice.target_faculty == faculty)
        
    # Order pinned notices first, then newest first
    query = query.order_by(Notice.is_pinned.desc(), Notice.created_at.desc())
    
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=NoticeResponse, status_code=201)
async def create_notice(
    body: NoticeCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Verify staff role (admin or email ends in @uonbi.ac.ke)
    if not (user.is_admin or user.email.endswith("@uonbi.ac.ke")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only university staff can post notices.",
        )

    notice = Notice(
        title=body.title,
        category=body.category,
        content=body.content,
        priority=body.priority,
        target_faculty=body.target_faculty,
        is_pinned=body.is_pinned,
        posted_by=user.name,
    )
    
    db.add(notice)
    await db.commit()
    await db.refresh(notice)
    return notice


@router.delete("/{id}", status_code=204)
async def delete_notice(
    id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Verify staff role
    if not (user.is_admin or user.email.endswith("@uonbi.ac.ke")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only university staff can delete notices.",
        )

    result = await db.execute(select(Notice).where(Notice.id == id))
    notice = result.scalars().first()
    if not notice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notice not found.",
        )
        
    await db.delete(notice)
    await db.commit()
    return None
