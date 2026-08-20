"""
Comment ORM model for Claim feedback threads.
"""

from datetime import datetime, timezone
UTC = timezone.utc
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship

from app.database import Base


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False, index=True)
    author_name = Column(String(255), nullable=False)
    author_role = Column(String(50), nullable=False)  # 'student', 'lecturer', 'admin'
    message = Column(Text, nullable=False)
    proof_attachment = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False)

    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

    ticket = relationship("Ticket", back_populates="comments")
