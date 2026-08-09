from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class SupportMessageCreate(BaseModel):
    target_recipient: str  # 'developer' or 'student_leader'
    category: str
    user_email: Optional[str] = None
    sender_name: Optional[str] = None
    subject: Optional[str] = None
    message: str
    reg_number: Optional[str] = None
    campus: Optional[str] = None
    faculty: Optional[str] = None
    department: Optional[str] = None
    course: Optional[str] = None
    year_of_study: Optional[str] = None
    semester: Optional[str] = None


class SupportMessageUpdate(BaseModel):
    status: Optional[str] = None
    reply_notes: Optional[str] = None


class SupportMessageResponse(BaseModel):
    id: int
    target_recipient: str
    category: str
    user_email: Optional[str] = None
    sender_name: Optional[str] = None
    subject: Optional[str] = None
    message: str
    status: str
    reply_notes: Optional[str] = None
    reg_number: Optional[str] = None
    campus: Optional[str] = None
    faculty: Optional[str] = None
    department: Optional[str] = None
    course: Optional[str] = None
    year_of_study: Optional[str] = None
    semester: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
