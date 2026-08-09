"""
Ticket ORM model for Student Claims (Missing Marks & Academic Grievance).
"""

from datetime import datetime, timezone
UTC = timezone.utc
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ticket_id = Column(String(20), unique=True, nullable=False, index=True)
    reg_number = Column(String(50), nullable=False, index=True)
    faculty = Column(String(255), nullable=False)
    department = Column(String(255), nullable=False)
    unit_code = Column(String(255), nullable=False)
    assessment_category = Column(String(100), nullable=False)
    claimed_score = Column(Integer, nullable=False)
    verified_score = Column(Integer, nullable=True)
    status = Column(
        String(100),
        nullable=False,
        default="Submitted to Department/Lecturer",
    )
    proof_attachment = Column(String(255), nullable=True)
    additional_notes = Column(Text, nullable=True)

    # Relationships
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lecturer_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(
        DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )

    comments = relationship(
        "Comment",
        back_populates="ticket",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    student = relationship(
        "User",
        foreign_keys=[student_id],
        backref="submitted_tickets",
        lazy="selectin",
    )
    lecturer = relationship(
        "User",
        foreign_keys=[lecturer_id],
        backref="assigned_tickets",
        lazy="selectin",
    )
