from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class NoticeCreate(BaseModel):
    title: str
    category: Optional[str] = "General"
    content: str
    priority: Optional[str] = "normal"
    target_faculty: Optional[str] = "All Faculties"
    is_pinned: Optional[bool] = False
    image_url: Optional[str] = None


class NoticeResponse(BaseModel):
    id: int
    title: str
    category: str
    content: str
    priority: str
    target_faculty: str
    posted_by: str
    is_pinned: bool
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
