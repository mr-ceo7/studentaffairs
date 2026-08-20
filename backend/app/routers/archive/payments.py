"""
Payment routes: M-Pesa, PayPal, Paystack.
"""

import asyncio
import uuid
from datetime import datetime, timedelta, timezone
UTC = timezone.utc
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.config import settings
from app.dependencies import get_db, get_current_user
from app.services.payment_gateway import initiate_mpesa_stk
from app.models.user import User
from app.models.payment import Payment
from app.models.campaign import Campaign
from app.models.subscription import SubscriptionTier
from app.schemas.payment import MpesaPaymentRequest, PaymentRequest, PaymentResponse
from app.services.email_service import send_payment_receipt_email
from app.services.subscription_access import grant_subscription_entitlement, sync_user_subscription_summary

router = APIRouter(prefix="/api/pay", tags=["Payments"])


# ── Helpers ──────────────────────────────────────────────────

async def _resolve_amount(body: PaymentRequest, user: User, db: AsyncSession) -> tuple[float, str]:
    """Resolve the price for a subscription purchase."""
    currency = "KES"

    if body.item_type == "subscription":
        result = await db.execute(select(SubscriptionTier).where(SubscriptionTier.tier_id == body.item_id))
        tier = result.scalar_one_or_none()
        if not tier:
            raise HTTPException(status_code=400, detail="Invalid subscription tier")

        amount = tier.price_2wk if body.duration_weeks == 2 else tier.price_4wk

        # Check active campaigns for discounts
        now = datetime.now(UTC).replace(tzinfo=None)
        active_campaign = await db.execute(
            select(Campaign)
            .where(
                Campaign.is_active == True,
                Campaign.start_date <= now,
                Campaign.end_date >= now
            )
            .order_by(Campaign.start_date.desc())
            .limit(1)
        )
        campaign = active_campaign.scalar_one_or_none()
        if campaign and campaign.incentive_type == "discount":
            discount = amount * (campaign.incentive_value / 100.0)
            amount = max(0, amount - discount)

        # Apply referral discount
        if user.referral_discount_active:
            discount = amount * 0.5  # 50% discount
            amount = max(0, amount - discount)

        return float(amount), currency
    else:
        raise HTTPException(status_code=400, detail="Invalid item_type")


async def _fulfill_payment(payment: Payment, user: User, db: AsyncSession):
    """Grant access after successful payment."""
    user_res = await db.execute(
        select(User)
        .options(selectinload(User.subscription_entitlement_rows))
        .where(User.id == user.id)
        .with_for_update()
    )
    locked_user = user_res.scalar_one()

    if locked_user.referral_discount_active:
        locked_user.referral_discount_active = False

    if payment.item_type == "subscription":
        weeks = 2
        result = await db.execute(select(SubscriptionTier).where(SubscriptionTier.tier_id == payment.item_id))
        tier = result.scalar_one_or_none()
        if tier:
            if payment.amount == tier.price_4wk:
                weeks = 4

        now_dt = datetime.now(UTC).replace(tzinfo=None)
        
        # Check active campaign for extra days
        active_campaign = await db.execute(
            select(Campaign)
            .where(
                Campaign.is_active == True,
                Campaign.start_date <= now_dt,
                Campaign.end_date >= now_dt
            )
            .order_by(Campaign.start_date.desc())
            .limit(1)
        )
        campaign = active_campaign.scalar_one_or_none()
        bonus_days = 0
        if campaign and campaign.incentive_type == "extra_days":
            bonus_days = int(campaign.incentive_value)

        grant_subscription_entitlement(
            locked_user,
            tier_id=payment.item_id,
            duration_days=(weeks * 7) + bonus_days,
            payment_id=payment.id,
            source="payment",
            now=now_dt,
        )

    sync_user_subscription_summary(locked_user)
    await db.commit()

    asyncio.create_task(
        send_payment_receipt_email(
            email=locked_user.email,
            amount=float(payment.amount),
            method=payment.method,
            transaction_id=payment.transaction_id or payment.reference,
        )
    )

    # Track Campaign Purchase globally
    from app.routers.campaigns import track_campaign_event
    asyncio.create_task(
        track_campaign_event("purchase", float(payment.amount))
    )


# ── M-Pesa ───────────────────────────────────────────────────

@router.post("/mpesa", response_model=PaymentResponse)
async def pay_mpesa(body: MpesaPaymentRequest, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    amount, currency = await _resolve_amount(body, user, db)
    if currency != "KES":
        raise HTTPException(status_code=400, detail="M-Pesa payments are only available in Kenya (KES)")

    reference = f"BT-{uuid.uuid4().hex[:8].upper()}"

    payment = Payment(
        user_id=user.id,
        amount=amount,
        currency=currency,
        method="mpesa",
        status="pending",
        reference=reference,
        item_type=body.item_type,
        item_id=body.item_id,
        phone=body.phone,
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)

    if settings.PAYMENTS_LIVE:
        try:
            result = await initiate_mpesa_stk(phone=body.phone, amount=amount, reference=reference)
            payment.gateway_response = str(result)

            if result.get("ResponseCode") == "0":
                payment.transaction_id = result.get("CheckoutRequestID")
                await db.commit()
            else:
                payment.status = "failed"
                await db.commit()
        except Exception as e:
            payment.status = "error"
            payment.gateway_response = repr(e)
            await db.commit()
            raise HTTPException(status_code=502, detail="M-Pesa initiation failed. Please try again later.")
    else:
        # Simulation mode
        await asyncio.sleep(1)
        payment.status = "completed"
        payment.transaction_id = f"SIM-{uuid.uuid4().hex[:10].upper()}"
        await db.commit()
        await _fulfill_payment(payment, user, db)
        await db.refresh(payment)

    return payment


@router.post("/mpesa/callback")
async def mpesa_callback(request: Request, secret: str = None, db: AsyncSession = Depends(get_db)):
    """M-Pesa STK Push callback webhook."""
    if settings.MPESA_CALLBACK_SECRET and secret != settings.MPESA_CALLBACK_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")

    data = await request.json()
    stk_callback = data.get("Body", {}).get("stkCallback", {})

    checkout_request_id = stk_callback.get("CheckoutRequestID")
    result_code = stk_callback.get("ResultCode")
    result_desc = stk_callback.get("ResultDesc")

    if not checkout_request_id:
        return {"ResultCode": 1, "ResultDesc": "Invalid Callback"}

    result = await db.execute(
        select(Payment).where(Payment.transaction_id == checkout_request_id).with_for_update()
    )
    payment = result.scalar_one_or_none()

    if not payment:
        return {"ResultCode": 1, "ResultDesc": "Payment Not Found"}

    user_result = await db.execute(select(User).where(User.id == payment.user_id))
    user = user_result.scalar_one_or_none()

    if result_code == 0:
        if payment.status != "completed":
            payment.status = "completed"
            meta = stk_callback.get("CallbackMetadata", {}).get("Item", [])
            receipt = next((item["Value"] for item in meta if item["Name"] == "MpesaReceiptNumber"), None)
            if receipt:
                payment.reference = receipt

            if user:
                await _fulfill_payment(payment, user, db)
    else:
        if payment.status != "completed":
            payment.status = "failed"
            payment.gateway_response = result_desc

    await db.commit()
    return {"ResultCode": 0, "ResultDesc": "Success"}


# ── PayPal ───────────────────────────────────────────────────

@router.post("/paypal", response_model=PaymentResponse)
async def pay_paypal(body: PaymentRequest, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    amount, currency = await _resolve_amount(body, user, db)
    reference = f"BT-PP-{uuid.uuid4().hex[:8].upper()}"

    payment = Payment(
        user_id=user.id,
        amount=amount,
        currency=currency,
        method="paypal",
        status="pending",
        reference=reference,
        item_type=body.item_type,
        item_id=body.item_id,
        email=user.email,
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    return payment


# ── Paystack ─────────────────────────────────────────────────

@router.post("/paystack", response_model=PaymentResponse)
async def pay_paystack(body: PaymentRequest, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    amount, currency = await _resolve_amount(body, user, db)
    reference = f"BT-PS-{uuid.uuid4().hex[:8].upper()}"

    payment = Payment(
        user_id=user.id,
        amount=amount,
        currency=currency,
        method="paystack",
        status="pending",
        reference=reference,
        item_type=body.item_type,
        item_id=body.item_id,
        email=user.email,
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)

    if settings.PAYMENTS_LIVE:
        try:
            from app.services.payment_gateway import initialize_paystack_transaction
            paystack_res = await initialize_paystack_transaction(amount=amount, email=user.email, reference=reference, currency=currency)
            payment.auth_url = paystack_res.get("authorization_url")
            payment.access_code = paystack_res.get("access_code")
        except Exception as e:
            payment.status = "error"
            payment.gateway_response = str(e)
            await db.commit()
            raise HTTPException(status_code=500, detail="Payment initialization failed.")
    else:
        await asyncio.sleep(1)
        payment.status = "completed"
        payment.transaction_id = f"SIM-PS-{uuid.uuid4().hex[:10].upper()}"
        await db.commit()
        await _fulfill_payment(payment, user, db)
        await db.refresh(payment)

    return payment


@router.post("/paystack/webhook")
async def paystack_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Paystack Webhook for successful transactions."""
    import hashlib
    import hmac

    payload = await request.body()
    signature = request.headers.get("x-paystack-signature")

    if not signature:
        raise HTTPException(status_code=400, detail="Missing signature")

    hash_value = hmac.new(settings.PAYSTACK_SECRET_KEY.encode('utf-8'), payload, hashlib.sha512).hexdigest()
    if hash_value != signature:
        raise HTTPException(status_code=400, detail="Invalid signature")

    data = await request.json()
    event = data.get("event")

    if event == "charge.success":
        reference = data.get("data", {}).get("reference")
        result = await db.execute(select(Payment).where(Payment.reference == reference).with_for_update())
        payment = result.scalar_one_or_none()

        if payment and payment.status != "completed":
            paystack_amount = data.get("data", {}).get("amount", 0) / 100
            if float(payment.amount) != float(paystack_amount):
                payment.status = "failed"
                payment.gateway_response = f"Amount mismatch: Expected {payment.amount}, received {paystack_amount}"
                await db.commit()
                return {"status": "error", "message": "Amount mismatch"}

            payment.status = "completed"
            payment.transaction_id = str(data.get("data", {}).get("id"))

            user_result = await db.execute(select(User).where(User.id == payment.user_id))
            user = user_result.scalar_one_or_none()
            if user:
                await _fulfill_payment(payment, user, db)

            await db.commit()

    return {"status": "success"}


# ── Status ───────────────────────────────────────────────────

@router.get("/status/{payment_id}", response_model=PaymentResponse)
async def get_payment_status(payment_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    if payment.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return payment
