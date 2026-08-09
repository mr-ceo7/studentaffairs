from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.clearance import ClearanceRecord
from app.schemas.clearance import ClearanceRecordResponse

router = APIRouter(prefix="/api/clearance", tags=["Clearance"])


@router.get("/my", response_model=ClearanceRecordResponse)
async def get_my_clearance(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ClearanceRecord).where(ClearanceRecord.student_id == user.id)
    )
    record = result.scalars().first()

    if not record:
        # Generate default record for the logged-in student
        reg_number = "CS/45231/2022"
        if user.email.endswith("@student.uonbi.ac.ke"):
            # Try to infer reg number from email prefix or fallback
            prefix = user.email.split("@")[0].replace(".", "/").upper()
            if "/" in prefix:
                reg_number = prefix
                
        record = ClearanceRecord(
            student_id=user.id,
            student_name=user.name,
            reg_number=reg_number,
            program="Bachelor of Science in Computer Science",
            faculty="Faculty of Science & Technology",
            department="Computing & Informatics",
            department_status="approved",
            library_status="approved",
            finance_status="pending",
            hostel_status="approved",
            sports_status="approved",
            dean_status="pending",
            registry_status="pending",
            outstanding_fee=0,
            remarks="Outstanding library fines cleared. Tuition fees balance verification pending from Finance department.",
            certificate_ready=False,
        )
        db.add(record)
        await db.commit()
        await db.refresh(record)

    return record


@router.get("/records", response_model=List[ClearanceRecordResponse])
async def list_clearance_records(
    faculty: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Only staff can view all records
    if not (user.is_admin or user.email.endswith("@uonbi.ac.ke")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only university staff can view clearance list.",
        )

    query = select(ClearanceRecord)
    if faculty and faculty != "All":
        query = query.where(ClearanceRecord.faculty == faculty)

    result = await db.execute(query)
    return result.scalars().all()


@router.post("/{record_id}/action", response_model=ClearanceRecordResponse)
async def update_clearance_status(
    record_id: int,
    department: str,
    status_val: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Only staff can update status
    if not (user.is_admin or user.email.endswith("@uonbi.ac.ke")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only university staff can perform clearance actions.",
        )

    result = await db.execute(
        select(ClearanceRecord).where(ClearanceRecord.id == record_id)
    )
    record = result.scalars().first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clearance record not found.",
        )

    dept = department.lower().strip()
    status_val = status_val.lower().strip()

    if status_val not in ["approved", "pending", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status value. Must be approved, pending, or rejected.",
        )

    if dept == "library":
        record.library_status = status_val
    elif dept == "finance":
        record.finance_status = status_val
    elif dept == "hostel":
        record.hostel_status = status_val
    elif dept == "sports":
        record.sports_status = status_val
    elif dept == "dean":
        record.dean_status = status_val
    elif dept == "registry":
        record.registry_status = status_val
    elif dept in ["academic", "department"]:
        record.department_status = status_val
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid department node: {department}",
        )

    # Re-calculate overall certificate readiness
    all_cleared = (
        record.department_status == "approved"
        and record.library_status == "approved"
        and record.finance_status == "approved"
        and record.hostel_status == "approved"
        and record.sports_status == "approved"
        and record.dean_status == "approved"
        and record.registry_status == "approved"
    )
    record.certificate_ready = all_cleared

    await db.commit()
    await db.refresh(record)
    return record
