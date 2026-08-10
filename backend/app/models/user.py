"""
User ORM model for Student Affairs.
"""

from datetime import datetime, timezone
UTC = timezone.utc
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    email_verified_at = Column(DateTime, nullable=True)
    password = Column(String(255), nullable=False)
    remember_token = Column(String(100), nullable=True)
    verification_code = Column(String(6), nullable=True)
    verification_code_expires_at = Column(DateTime, nullable=True)
    profile_picture = Column(String(500), nullable=True)
    phone = Column(String(20), unique=True, nullable=True, index=True)

    is_active = Column(Boolean, default=True, nullable=False, server_default="1")
    last_seen = Column(DateTime, nullable=True)
    is_admin = Column(Boolean, default=False, nullable=False, server_default="0")
    subscription_tier = Column(String(20), default="free", nullable=False, server_default="free")
    subscription_expires_at = Column(DateTime, nullable=True)
    favorite_teams = Column(JSON, default=list)
    country = Column(String(2), nullable=True)

    # Student Academic Profile
    reg_number = Column(String(100), nullable=True)
    campus = Column(String(100), nullable=True)
    faculty = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True)
    course = Column(String(100), nullable=True)
    year_of_study = Column(String(20), nullable=True)
    semester = Column(String(20), nullable=True)

    # Single-device session
    session_id = Column(String(100), nullable=True, unique=True, index=True)

    # Referral
    referral_code = Column(String(20), unique=True, nullable=True, index=True)
    referrer_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    referrals_count = Column(Integer, default=0, nullable=False, server_default="0")
    referral_points = Column(Integer, default=0, nullable=False, server_default="0")
    referral_discount_active = Column(Boolean, default=False, nullable=False, server_default="0")
    unlocked_tip_ids = Column(JSON, default=list)

    # Self-referential relationship for referrals
    referred_users = relationship("User", backref="referrer", remote_side=[id])

    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    # Relationships
    payments = relationship("Payment", back_populates="user", lazy="selectin")
    subscription_entitlement_rows = relationship(
        "SubscriptionEntitlement",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan", lazy="selectin")

    @property
    def subscription_entitlements(self):
        now = datetime.now(UTC).replace(tzinfo=None)
        return [
            entitlement
            for entitlement in (self.subscription_entitlement_rows or [])
            if entitlement.expires_at and entitlement.expires_at > now
        ]

    @property
    def is_subscription_active(self) -> bool:
        if self.subscription_entitlement_rows:
            return len(self.subscription_entitlements) > 0

        if self.subscription_tier == "free" or self.subscription_expires_at is None:
            return False

        return self.subscription_expires_at > datetime.now(UTC).replace(tzinfo=None)


class UserSession(Base):
    """Track multiple sessions per user."""
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    session_id = Column(String(100), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    last_used_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)

    user = relationship("User", back_populates="sessions")
