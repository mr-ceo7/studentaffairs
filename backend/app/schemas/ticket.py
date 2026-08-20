from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator


class CommentCreate(BaseModel):
    message: str
    proof_attachment: Optional[str] = None


class CommentResponse(BaseModel):
    id: int
    ticket_id: int
    author_name: str
    author_role: str
    message: str
    proof_attachment: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TicketCreate(BaseModel):
    reg_number: str
    faculty: str
    department: str
    unit_code: str
    assessment_category: str
    claimed_score: Optional[int] = None
    proof_attachment: Optional[str] = None
    additional_notes: Optional[str] = None


class TicketStatusUpdate(BaseModel):
    status: str
    verified_score: Optional[int] = None
    comment: Optional[str] = None  # Optional explanation comment


class TicketResponse(BaseModel):
    id: int
    ticket_id: str
    reg_number: str
    faculty: str
    department: str
    unit_code: str
    assessment_category: str
    claimed_score: Optional[int] = None
    verified_score: Optional[int] = None
    status: str
    proof_attachment: Optional[str] = None
    additional_notes: Optional[str] = None
    student_id: int
    student_name: Optional[str] = None
    lecturer_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    comments: List[CommentResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}

    @field_validator("student_name", mode="before")
    @classmethod
    def get_student_name(cls, v: Optional[str], info) -> Optional[str]:
        # If student_name is not populated, we can fetch it from student relationship if info.data has student object
        # But FastAPI will automatically map it if we supply it in the dictionary.
        return v
