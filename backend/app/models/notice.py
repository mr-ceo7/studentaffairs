"""
Notice ORM model for noticeboard bulletins and official announcements.
"""

from datetime import datetime, timezone
UTC = timezone.utc
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean

from app.database import Base


class Notice(Base):
    __tablename__ = "notices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False, default="General")
    content = Column(Text, nullable=False)
    priority = Column(String(50), nullable=False, default="normal")  # urgent, high, normal
    target_faculty = Column(String(255), nullable=False, default="All Faculties")
    posted_by = Column(String(255), nullable=False)
    is_pinned = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(
        DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )
