from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ClearanceRecordResponse(BaseModel):
    id: int
    student_id: int
    student_name: str
    reg_number: str
    program: str
    faculty: str
    department: str
    department_status: str
    library_status: str
    finance_status: str
    hostel_status: str
    sports_status: str
    dean_status: str
    registry_status: str
    outstanding_fee: int
    remarks: Optional[str] = None
    certificate_ready: bool
    updated_at: datetime

    model_config = {"from_attributes": True}
