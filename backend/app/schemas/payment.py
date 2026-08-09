"""
Pydantic schemas for payment endpoints.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class PaymentRequest(BaseModel):
    item_type: str  # subscription
    item_id: str  # tier_id
    duration_weeks: Optional[int] = None  # 2 or 4
    currency: Optional[str] = None


class MpesaPaymentRequest(PaymentRequest):
    phone: str


class PaymentResponse(BaseModel):
    id: int
    amount: float
    currency: str
    method: str
    status: str
    reference: Optional[str] = None
    item_type: str
    item_id: Optional[str] = None
    created_at: Optional[datetime] = None
    auth_url: Optional[str] = None
    access_code: Optional[str] = None

    model_config = {"from_attributes": True}


class SubscriptionTierResponse(BaseModel):
    tier_id: str
    name: str
    description: Optional[str] = None
    price_2wk: float
    price_4wk: float
    categories: list
    popular: bool = False
    currency: str = "KES"
    currency_symbol: str = "KES"

    model_config = {"from_attributes": True}
