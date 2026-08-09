from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.dependencies import get_db, get_current_user_optional, get_current_user
from app.models.user import User
from app.models.support import SupportMessage
from app.schemas.support import (
    SupportMessageCreate,
    SupportMessageUpdate,
    SupportMessageResponse,
)

router = APIRouter(prefix="/api/support", tags=["Support"])


@router.post("", response_model=SupportMessageResponse, status_code=201)
async def submit_support_message(
    body: SupportMessageCreate,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional),
):
    reg_number = body.reg_number or (user.reg_number if user else None)
    campus = body.campus or (user.campus if user else None)
    faculty = body.faculty or (user.faculty if user else None)
    department = body.department or (user.department if user else None)
    course = body.course or (user.course if user else None)
    year_of_study = body.year_of_study or (user.year_of_study if user else None)
    semester = body.semester or (user.semester if user else None)

    sender_name = body.sender_name or (user.username if user else None)
    user_email = body.user_email or (user.email if user else None)

    msg = SupportMessage(
        target_recipient=body.target_recipient.lower().strip(),
        category=body.category,
        user_email=user_email,
        sender_name=sender_name,
        subject=body.subject,
        message=body.message.strip(),
        attachment_url=body.attachment_url,
        attachment_name=body.attachment_name,
        reg_number=reg_number,
        campus=campus,
        faculty=faculty,
        department=department,
        course=course,
        year_of_study=year_of_study,
        semester=semester,
        status="open",
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg


@router.get("", response_model=List[SupportMessageResponse])
async def list_support_messages(
    target: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Staff / admin or student leaders check
    if not (user.is_admin or user.email.endswith("@uonbi.ac.ke")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only university staff and student leaders can view the support inbox.",
        )

    query = select(SupportMessage)
    if target and target != "all":
        query = query.where(SupportMessage.target_recipient == target.lower().strip())
    if status_filter and status_filter != "all":
        query = query.where(SupportMessage.status == status_filter.lower().strip())

    query = query.order_by(SupportMessage.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/{id}", response_model=SupportMessageResponse)
async def update_support_message(
    id: int,
    body: SupportMessageUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not (user.is_admin or user.email.endswith("@uonbi.ac.ke")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only university staff and student leaders can update support tickets.",
        )

    result = await db.execute(select(SupportMessage).where(SupportMessage.id == id))
    msg = result.scalars().first()
    if not msg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Support message not found.",
        )

    if body.status:
        msg.status = body.status
    if body.reply_notes:
        msg.reply_notes = body.reply_notes

    await db.commit()
    await db.refresh(msg)
    return msg
