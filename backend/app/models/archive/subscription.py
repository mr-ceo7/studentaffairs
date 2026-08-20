"""
Subscription tier configuration and per-user entitlement models.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class SubscriptionTier(Base):
    __tablename__ = "subscription_tiers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tier_id = Column(String(20), unique=True, nullable=False)  # standard, premium
    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    price_2wk = Column(Float, nullable=False)
    price_4wk = Column(Float, nullable=False)
    categories = Column(JSON, nullable=False)  # ["free", "gg", ...]
    popular = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SubscriptionEntitlement(Base):
    __tablename__ = "subscription_entitlements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    tier_id = Column(String(20), ForeignKey("subscription_tiers.tier_id"), nullable=False, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True, index=True)
    source = Column(String(50), nullable=False, default="payment")
    expires_at = Column(DateTime, nullable=False, index=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="subscription_entitlement_rows")
    tier = relationship("SubscriptionTier")
    payment = relationship("Payment", back_populates="subscription_entitlements")
