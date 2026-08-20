"""
ClearanceRecord ORM model to track graduation clearances across 7 departments.
"""

from datetime import datetime, timezone
UTC = timezone.utc
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class ClearanceRecord(Base):
    __tablename__ = "clearance_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    student_name = Column(String(255), nullable=False)
    reg_number = Column(String(50), nullable=False, unique=True, index=True)
    program = Column(String(255), nullable=False)
    faculty = Column(String(255), nullable=False)
    department = Column(String(255), nullable=False)

    # Status nodes: approved, pending, rejected
    department_status = Column(String(50), nullable=False, default="pending")
    library_status = Column(String(50), nullable=False, default="pending")
    finance_status = Column(String(50), nullable=False, default="pending")
    hostel_status = Column(String(50), nullable=False, default="pending")
    sports_status = Column(String(50), nullable=False, default="pending")
    dean_status = Column(String(50), nullable=False, default="pending")
    registry_status = Column(String(50), nullable=False, default="pending")

    outstanding_fee = Column(Integer, nullable=False, default=0)
    remarks = Column(Text, nullable=True)
    certificate_ready = Column(Boolean, nullable=False, default=False)
    updated_at = Column(
        DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )

    student = relationship(
        "User",
        foreign_keys=[student_id],
        backref="clearance_records",
        lazy="selectin",
    )
