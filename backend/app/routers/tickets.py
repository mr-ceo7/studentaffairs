import random
import os
import uuid
import shutil
from typing import List, Optional
from datetime import datetime, timezone
UTC = timezone.utc

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.ticket import Ticket
from app.models.comment import Comment
from app.schemas.ticket import (
    TicketCreate,
    TicketResponse,
    TicketStatusUpdate,
    CommentCreate,
    CommentResponse,
    PaginatedTicketsResponse,
)

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])


ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx", ".heic"}
MAX_FILE_SIZE = 3 * 1024 * 1024  # 3 MB per file
MAX_TOTAL_FILES = 3

@router.post("/upload")
async def upload_proof_attachments(
    files: List[UploadFile] = File(...),
    user: User = Depends(get_current_user)
):
    """
    Robust, public multi-file upload endpoint for students and staff.
    Limits size, extension, counts, and streams in chunks to prevent server crashes/OOM.
    """
    if len(files) > MAX_TOTAL_FILES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You can only upload a maximum of {MAX_TOTAL_FILES} files at once."
        )

    uploaded_urls = []
    uploaded_files = []
    os.makedirs("media/uploads", exist_ok=True)

    for file in files:
        # Validate extension
        filename = file.filename or "file"
        file_extension = os.path.splitext(filename)[1].lower()
        if file_extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File extension {file_extension} is not allowed. Allowed types: PDF, PNG, JPG, JPEG, DOC, DOCX, HEIC."
            )

        # Generate a safe, unique name
        safe_name = f"{uuid.uuid4().hex}{file_extension}"
        file_path = os.path.join("media/uploads", safe_name)

        # Stream file in chunks to prevent memory crash (robust)
        bytes_written = 0
        try:
            with open(file_path, "wb") as buffer:
                chunk_size = 512 * 1024  # 512 KB chunks
                while True:
                    chunk = await file.read(chunk_size)
                    if not chunk:
                        break
                    
                    bytes_written += len(chunk)
                    if bytes_written > MAX_FILE_SIZE:
                        # Clean up file on overflow
                        buffer.close()
                        os.remove(file_path)
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail=f"File {filename} exceeds the maximum size limit of 10MB."
                        )
                    buffer.write(chunk)
        except Exception as e:
            if not isinstance(e, HTTPException):
                # Clean up file if anything failed
                if os.path.exists(file_path):
                    os.remove(file_path)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to process upload: {str(e)}"
                )
            raise e

        uploaded_urls.append(f"/api/media/uploads/{safe_name}")
        uploaded_files.append({
            "url": f"/api/media/uploads/{safe_name}",
            "name": filename
        })

    return {"urls": uploaded_urls, "files": uploaded_files}


@router.post("", response_model=TicketResponse, status_code=201)
async def create_ticket(
    body: TicketCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Verify role
    is_admin = user.is_admin or user.email == "admin@uonbi.ac.ke"
    is_lecturer = user.email.endswith("@uonbi.ac.ke") and not is_admin
    is_student = not is_admin and not is_lecturer
    if not is_student:
        raise HTTPException(
            status_code=403,
            detail="Only students can submit claims.",
        )

    # Generate ticket ID
    count_result = await db.execute(select(func.count(Ticket.id)))
    count = count_result.scalar() or 0
    ticket_id = f"UON-{1043 + count}"

    # Check if lecturer already exists in the platform
    lec_res = await db.execute(
        select(User).where(User.email == body.lecturer_email.lower().strip())
    )
    lec_user = lec_res.scalar_one_or_none()
    lecturer_id = lec_user.id if lec_user else None

    ticket = Ticket(
        ticket_id=ticket_id,
        reg_number=body.reg_number.upper().strip(),
        faculty=body.faculty,
        department=body.department,
        unit_code=body.unit_code,
        assessment_category=body.assessment_category,
        claimed_score=body.claimed_score,
        proof_attachment=body.proof_attachment,
        additional_notes=body.additional_notes,
        student_id=user.id,
        status="Submitted to Department/Lecturer",
        lecturer_id=lecturer_id,
        lecturer_name=body.lecturer_name.strip(),
        lecturer_email=body.lecturer_email.lower().strip(),
        completed_elements=body.completed_elements,
    )

    db.add(ticket)
    
    # Queue lecturer notification for 6-hour debounce
    from app.models.ticket import PendingLecturerNotification
    from app.services.email_service import check_and_send_debounced_lecturer_notifications
    import asyncio

    # Check if there is already a pending notification in the queue
    existing_notif_res = await db.execute(
        select(PendingLecturerNotification)
        .where(PendingLecturerNotification.lecturer_email == body.lecturer_email.lower().strip())
    )
    existing_notif = existing_notif_res.scalars().first()

    pending_notif = PendingLecturerNotification(
        lecturer_email=body.lecturer_email.lower().strip(),
        ticket_id=ticket_id
    )
    db.add(pending_notif)
    await db.commit()
    await db.refresh(ticket)

    if not existing_notif:
        # Spawn the 6-hour debounce background worker task
        asyncio.create_task(
            check_and_send_debounced_lecturer_notifications(
                body.lecturer_email.lower().strip(),
                body.lecturer_name.strip()
            )
        )

    # Fetch user name for response mapping
    ticket.student_name = user.name
    return ticket


@router.get("", response_model=PaginatedTicketsResponse)
async def list_tickets(
    faculty: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = select(Ticket)

    # Filter based on role
    is_admin = user.is_admin or user.email == "admin@uonbi.ac.ke"
    is_lecturer = user.email.endswith("@uonbi.ac.ke") and not is_admin
    is_student = not is_admin and not is_lecturer

    if is_student:
        # Students only see their own tickets
        query = query.where(Ticket.student_id == user.id)
    elif is_lecturer:
        # Staff
        pass

    if faculty:
        query = query.where(Ticket.faculty == faculty)
    if status:
        query = query.where(Ticket.status == status)

    # Count total matching records before paging
    count_query = select(func.count()).select_from(query.subquery())
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    # Order by updated_at desc
    query = query.order_by(Ticket.updated_at.desc())

    # Apply paging
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)

    result = await db.execute(query)
    tickets = result.scalars().all()

    # Map student names
    for t in tickets:
        student_result = await db.execute(select(User).where(User.id == t.student_id))
        student = student_result.scalar_one_or_none()
        t.student_name = student.name if student else "Unknown Student"

    total_pages = (total + per_page - 1) // per_page

    return {
        "tickets": tickets,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
    }


@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(Ticket).where(Ticket.ticket_id == ticket_id))
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Access control
    is_admin = user.is_admin or user.email == "admin@uonbi.ac.ke"
    is_lecturer = user.email.endswith("@uonbi.ac.ke") and not is_admin
    is_student = not is_admin and not is_lecturer

    if is_student and ticket.student_id != user.id:
        raise HTTPException(
            status_code=403, detail="You do not have access to this ticket."
        )

    student_result = await db.execute(select(User).where(User.id == ticket.student_id))
    student = student_result.scalar_one_or_none()
    ticket.student_name = student.name if student else "Unknown Student"

    # Mark comments as read & update ticket read receipts
    from sqlalchemy import update
    if is_student:
        # Student is reading: mark lecturer/admin comments as read
        await db.execute(
            update(Comment)
            .where(Comment.ticket_id == ticket.id)
            .where(Comment.author_role != "student")
            .values(is_read=True)
        )
    else:
        # Lecturer/Admin is reading: mark student comments as read and ticket as read by lecturer
        await db.execute(
            update(Comment)
            .where(Comment.ticket_id == ticket.id)
            .where(Comment.author_role == "student")
            .values(is_read=True)
        )
        ticket.is_read_by_lecturer = True
    
    await db.commit()
    await db.refresh(ticket)

    return ticket


@router.post("/{ticket_id}/status", response_model=TicketResponse)
async def update_ticket_status(
    ticket_id: str,
    body: TicketStatusUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Only staff/admin can change status
    is_admin = user.is_admin or user.email == "admin@uonbi.ac.ke"
    is_lecturer = user.email.endswith("@uonbi.ac.ke") and not is_admin
    if not is_lecturer and not is_admin:
        raise HTTPException(
            status_code=403, detail="Only staff can change claim status."
        )

    result = await db.execute(select(Ticket).where(Ticket.ticket_id == ticket_id))
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket.status = body.status
    if body.verified_score is not None:
        ticket.verified_score = body.verified_score

    # Assign lecturer if not assigned and user is lecturer
    if not user.is_admin and not ticket.lecturer_id:
        ticket.lecturer_id = user.id

    ticket.updated_at = datetime.now(UTC).replace(tzinfo=None)

    ticket.is_read_by_lecturer = True
    db.add(ticket)

    # Add comments if any
    if body.comment:
        comment_text = body.comment.strip()
        if len(comment_text) > 0:
            new_comment = Comment(
                ticket_id=ticket.id,
                author_name=user.name,
                author_role="admin" if user.is_admin else "lecturer",
                message=comment_text,
            )
            db.add(new_comment)

    student_result = await db.execute(select(User).where(User.id == ticket.student_id))
    student = student_result.scalar_one_or_none()

    if student:
        from app.services.email_service import send_student_instant_notification
        import asyncio
        asyncio.create_task(
            send_student_instant_notification(
                student.email,
                student.name,
                ticket.ticket_id,
                user.name,
                ticket.status
            )
        )

    await db.commit()
    await db.refresh(ticket)

    ticket.student_name = student.name if student else "Unknown Student"

    return ticket


@router.post("/{ticket_id}/comments", response_model=CommentResponse)
async def add_comment(
    ticket_id: str,
    body: CommentCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(Ticket).where(Ticket.ticket_id == ticket_id))
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Access control for students
    is_admin = user.is_admin or user.email == "admin@uonbi.ac.ke"
    is_lecturer = user.email.endswith("@uonbi.ac.ke") and not is_admin
    is_student = not is_admin and not is_lecturer

    if is_student and ticket.student_id != user.id:
        raise HTTPException(
            status_code=403, detail="You do not have access to this ticket."
        )

    # Determine role
    if is_student:
        role = "student"
        # If student comments, and it was awaiting student response, revert to submitted
        if ticket.status == "Awaiting Student Response":
            ticket.status = "Submitted to Department/Lecturer"
            db.add(ticket)
    elif is_admin:
        role = "admin"
    else:
        role = "lecturer"
        # Lecturer response can assign them if unassigned
        if not ticket.lecturer_id:
            ticket.lecturer_id = user.id
            db.add(ticket)

    comment = Comment(
        ticket_id=ticket.id,
        author_name=user.name,
        author_role=role,
        message=body.message.strip(),
        proof_attachment=body.proof_attachment,
    )

    ticket.updated_at = datetime.now(UTC).replace(tzinfo=None)
    if role == "student":
        ticket.is_read_by_lecturer = False
    else:
        ticket.is_read_by_lecturer = True
    db.add(ticket)
    db.add(comment)

    if role != "student":
        student_result = await db.execute(select(User).where(User.id == ticket.student_id))
        student = student_result.scalar_one_or_none()
        if student:
            from app.services.email_service import send_student_instant_notification
            import asyncio
            asyncio.create_task(
                send_student_instant_notification(
                    student.email,
                    student.name,
                    ticket.ticket_id,
                    user.name,
                    ticket.status
                )
            )

    await db.commit()
    await db.refresh(comment)

    return comment
