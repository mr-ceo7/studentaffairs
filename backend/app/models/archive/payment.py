"""
Payment transaction model.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="KES", nullable=False)
    method = Column(String(20), nullable=False)  # mpesa, paypal, paystack
    status = Column(String(20), nullable=False, default="pending")  # pending, completed, failed, refunded
    reference = Column(String(255), nullable=True)
    transaction_id = Column(String(255), nullable=True)

    # What was purchased
    item_type = Column(String(50), nullable=False)  # subscription
    item_id = Column(String(100), nullable=True)  # tier_id

    # Metadata
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    gateway_response = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="payments")
    subscription_entitlements = relationship("SubscriptionEntitlement", back_populates="payment", lazy="selectin")
