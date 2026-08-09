"""
SupportMessage ORM model for in-app support messages to Developers and Student Leaders.
"""

from datetime import datetime, timezone
UTC = timezone.utc
from sqlalchemy import Column, Integer, String, DateTime, Text

from app.database import Base


class SupportMessage(Base):
    __tablename__ = "support_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    target_recipient = Column(String(50), nullable=False)  # 'developer' or 'student_leader'
    category = Column(String(100), nullable=False)
    user_email = Column(String(255), nullable=True)
    sender_name = Column(String(255), nullable=True)
    subject = Column(String(255), nullable=True)
    message = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, default="open")  # 'open' or 'resolved'
    reply_notes = Column(Text, nullable=True)

    # Academic metadata for administrative filtering
    reg_number = Column(String(100), nullable=True)
    campus = Column(String(100), nullable=True)
    faculty = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True)
    course = Column(String(100), nullable=True)
    year_of_study = Column(String(20), nullable=True)
    semester = Column(String(20), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(
        DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )
