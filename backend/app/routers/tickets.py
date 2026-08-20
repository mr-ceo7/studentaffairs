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
    # Verify domain
    if not user.email.endswith("@student.uonbi.ac.ke"):
        raise HTTPException(
            status_code=403,
            detail="Only students (@student.uonbi.ac.ke) can submit claims.",
        )

    # Generate ticket ID
    count_result = await db.execute(select(func.count(Ticket.id)))
    count = count_result.scalar() or 0
    ticket_id = f"UON-{1043 + count}"

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
    )

    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)

    # Fetch user name for response mapping
    ticket.student_name = user.name
    return ticket


@router.get("", response_model=List[TicketResponse])
async def list_tickets(
    faculty: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = select(Ticket)

    # Filter based on role
    if user.email.endswith("@student.uonbi.ac.ke"):
        # Students only see their own tickets
        query = query.where(Ticket.student_id == user.id)
    elif user.email.endswith("@uonbi.ac.ke"):
        # Staff
        if not user.is_admin:
            # Lecturers: Filter by units or department (let's show department tickets, or all, but let's make it flexible)
            # In a real system we'd check their assigned units. Here, let's filter by department or show all.
            # We can allow filtering by query param
            pass
    else:
        raise HTTPException(
            status_code=403,
            detail="Unauthorized domain. Must be @student.uonbi.ac.ke or @uonbi.ac.ke",
        )

    if faculty:
        query = query.where(Ticket.faculty == faculty)
    if status:
        query = query.where(Ticket.status == status)

    # Order by updated_at desc
    query = query.order_by(Ticket.updated_at.desc())

    result = await db.execute(query)
    tickets = result.scalars().all()

    # Map student names
    for t in tickets:
        student_result = await db.execute(select(User).where(User.id == t.student_id))
        student = student_result.scalar_one_or_none()
        t.student_name = student.name if student else "Unknown Student"

    return tickets


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
    if user.email.endswith("@student.uonbi.ac.ke") and ticket.student_id != user.id:
        raise HTTPException(
            status_code=403, detail="You do not have access to this ticket."
        )

    student_result = await db.execute(select(User).where(User.id == ticket.student_id))
    student = student_result.scalar_one_or_none()
    ticket.student_name = student.name if student else "Unknown Student"

    # Mark comments as read & update ticket read receipts
    from sqlalchemy import update
    if user.email.endswith("@student.uonbi.ac.ke"):
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
    # Only staff can change status
    if not user.email.endswith("@uonbi.ac.ke"):
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

    await db.commit()
    await db.refresh(ticket)

    student_result = await db.execute(select(User).where(User.id == ticket.student_id))
    student = student_result.scalar_one_or_none()
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
    if user.email.endswith("@student.uonbi.ac.ke") and ticket.student_id != user.id:
        raise HTTPException(
            status_code=403, detail="You do not have access to this ticket."
        )

    # Determine role
    if user.email.endswith("@student.uonbi.ac.ke"):
        role = "student"
        # If student comments, and it was awaiting student response, revert to submitted
        if ticket.status == "Awaiting Student Response":
            ticket.status = "Submitted to Department/Lecturer"
            db.add(ticket)
    elif user.is_admin:
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

    await db.commit()
    await db.refresh(comment)

    return comment
