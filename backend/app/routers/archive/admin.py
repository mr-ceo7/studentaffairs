"""
Admin routes — user management, tip management, payment overview, settings.
"""

import json
import uuid
from typing import Optional
from datetime import datetime, timedelta, timezone
UTC = timezone.utc

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete, update, and_, or_, case
from sqlalchemy.orm import selectinload

from app.dependencies import get_db, require_admin
from app.models.user import User
from app.models.payment import Payment
from app.models.tip import Tip
from app.models.subscription import SubscriptionTier, SubscriptionEntitlement
from app.models.setting import AdminSetting
from app.models.ad import AdPost
from app.models.activity import UserActivity, AnonymousVisitor
from app.schemas.auth import UserResponse, AdminUserResponse
from app.schemas.payment import PaymentResponse
from app.schemas.ad import AdPostResponse, AdPostCreate, AdPostUpdate
from app.services.subscription_access import (
    grant_subscription_entitlement,
    revoke_all_subscription_entitlements,
    sync_user_subscription_summary,
)

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ═══════════════════════════════════════════════════════════════
#  SETTINGS
# ═══════════════════════════════════════════════════════════════

SETTINGS_DEFAULTS = {
    "referral_enabled": "true",
    "points_per_tip": "2",
    "points_per_discount": "5",
    "discount_percentage": "50",
    "points_per_premium": "10",
    "premium_days_reward": "7",
}

SETTINGS_DESCRIPTIONS = {
    "referral_enabled": "Master toggle for the referral system",
    "points_per_tip": "Points required to unlock a single locked tip",
    "points_per_discount": "Points required to generate a payment discount",
    "discount_percentage": "Percentage discount applied when discount is redeemed",
    "points_per_premium": "Points required to redeem free premium access",
    "premium_days_reward": "Days of premium access granted on premium redemption",
}


async def get_referral_settings(db: AsyncSession) -> dict:
    """Helper to read all referral settings as a typed dict."""
    result = await db.execute(select(AdminSetting).where(AdminSetting.key.in_(SETTINGS_DEFAULTS.keys())))
    settings_db = {s.key: s.value for s in result.scalars().all()}
    out = {}
    for key, default in SETTINGS_DEFAULTS.items():
        raw = settings_db.get(key, default)
        if default in ("true", "false"):
            out[key] = raw.lower() == "true"
        elif default.isdigit():
            out[key] = int(raw) if raw.isdigit() else int(default)
        else:
            out[key] = raw
    return out


class SettingsUpdateProps(BaseModel):
    referral_enabled: Optional[bool] = None
    points_per_tip: Optional[int] = None
    points_per_discount: Optional[int] = None
    discount_percentage: Optional[int] = None
    points_per_premium: Optional[int] = None
    premium_days_reward: Optional[int] = None


@router.get("/settings")
async def get_settings(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    return await get_referral_settings(db)


@router.put("/settings")
async def update_settings(body: SettingsUpdateProps, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    updates = body.model_dump(exclude_none=True)
    for key, value in updates.items():
        str_value = str(value).lower() if isinstance(value, bool) else str(value)
        res = await db.execute(select(AdminSetting).where(AdminSetting.key == key))
        setting = res.scalar_one_or_none()
        if not setting:
            setting = AdminSetting(key=key, value=str_value, description=SETTINGS_DESCRIPTIONS.get(key, ""))
            db.add(setting)
        else:
            setting.value = str_value
    await db.commit()
    return await get_referral_settings(db)


# ═══════════════════════════════════════════════════════════════
#  DASHBOARD STATS
# ═══════════════════════════════════════════════════════════════

@router.get("/dashboard")
async def dashboard_stats(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Aggregated dashboard stats for Student Affairs styled widgets."""
    now = datetime.now(UTC).replace(tzinfo=None)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)
    two_days_ago_start = today_start - timedelta(days=2)
    three_min_ago = now - timedelta(minutes=3)
    
    # 1. Total Visitors & History
    total_reg = (await db.execute(select(func.count(User.id)))).scalar_one() or 0
    reg_today = (await db.execute(select(func.count(User.id)).where(User.last_seen >= today_start))).scalar_one() or 0
    reg_yesterday = (await db.execute(select(func.count(User.id)).where(User.last_seen >= yesterday_start, User.last_seen < today_start))).scalar_one() or 0
    reg_two_days_ago = (await db.execute(select(func.count(User.id)).where(User.last_seen >= two_days_ago_start, User.last_seen < yesterday_start))).scalar_one() or 0
    
    total_guests = (await db.execute(select(func.count(AnonymousVisitor.id)))).scalar_one() or 0
    guests_today = (await db.execute(select(func.count(AnonymousVisitor.id)).where(AnonymousVisitor.last_seen >= today_start))).scalar_one() or 0
    guests_yesterday = (await db.execute(select(func.count(AnonymousVisitor.id)).where(AnonymousVisitor.last_seen >= yesterday_start, AnonymousVisitor.last_seen < today_start))).scalar_one() or 0
    guests_two_days_ago = (await db.execute(select(func.count(AnonymousVisitor.id)).where(AnonymousVisitor.last_seen >= two_days_ago_start, AnonymousVisitor.last_seen < yesterday_start))).scalar_one() or 0
    
    # 2. Online Now
    online_reg = (await db.execute(select(func.count(User.id)).where(User.last_seen >= three_min_ago))).scalar_one() or 0
    online_guests = (await db.execute(select(func.count(AnonymousVisitor.id)).where(AnonymousVisitor.last_seen >= three_min_ago))).scalar_one() or 0
    
    online_new_reg = (await db.execute(select(func.count(User.id)).where(User.last_seen >= three_min_ago, User.created_at >= today_start))).scalar_one() or 0
    online_existing_reg = online_reg - online_new_reg
    
    been_online_today = reg_today + guests_today
    
    # 3. Subscribers
    active_subs = (await db.execute(select(func.count(User.id)).where(User.subscription_tier != "free", User.subscription_expires_at > now))).scalar_one() or 0
    conv_rate = round((active_subs / total_reg) * 100, 1) if total_reg > 0 else 0.0
    
    tiers_res = await db.execute(select(User.subscription_tier, func.count(User.id)).group_by(User.subscription_tier))
    tier_distribution = {t: c for t, c in tiers_res.all()}
    
    sub_5day = (await db.execute(select(func.count(User.id)).where(User.subscription_tier != "free", User.subscription_expires_at > now, User.created_at >= now - timedelta(days=5)))).scalar_one() or 0
    sub_10day = (await db.execute(select(func.count(User.id)).where(User.subscription_tier != "free", User.subscription_expires_at > now, User.created_at >= now - timedelta(days=10)))).scalar_one() or 0
    sub_30day = (await db.execute(select(func.count(User.id)).where(User.subscription_tier != "free", User.subscription_expires_at > now, User.created_at >= now - timedelta(days=30)))).scalar_one() or 0
    
    # 4. Revenue Stats (Monthly and All-Time)
    thirty_days_ago = now - timedelta(days=30)
    payments_30d_res = await db.execute(select(Payment).where(Payment.status == "completed", Payment.created_at >= thirty_days_ago))
    payments_30d = payments_30d_res.scalars().all()
    
    monthly_rev = sum(p.amount for p in payments_30d)
    today_rev = sum(p.amount for p in payments_30d if p.created_at >= today_start)
    
    rev_mpesa = sum(p.amount for p in payments_30d if p.method.lower() in ("mpesa", "m-pesa"))
    rev_paypal = sum(p.amount for p in payments_30d if p.method.lower() == "paypal")
    
    last_30_days_by_day = {}
    for p in payments_30d:
        day_str = p.created_at.strftime("%Y-%m-%d")
        last_30_days_by_day[day_str] = last_30_days_by_day.get(day_str, 0) + p.amount
        
    last_7_days_list = []
    for i in range(7):
        day = now - timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        label = "Today" if i == 0 else "Yesterday" if i == 1 else day.strftime("%a %d")
        day_start_i = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end_i = day_start_i + timedelta(days=1)
        day_amt = sum(p.amount for p in payments_30d if p.created_at >= day_start_i and p.created_at < day_end_i)
        last_7_days_list.append({"label": label, "amount": day_amt, "date": day_str})
        
    # All-Time
    all_payments_res = await db.execute(select(Payment).where(Payment.status == "completed"))
    all_payments = all_payments_res.scalars().all()
    all_time_rev = sum(p.amount for p in all_payments)
    
    year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    year_rev = sum(p.amount for p in all_payments if p.created_at >= year_start)
    
    monthly_alltime = {}
    for p in all_payments:
        month_str = p.created_at.strftime("%B %Y")
        month_sort_key = p.created_at.strftime("%Y-%m")
        if month_sort_key not in monthly_alltime:
            monthly_alltime[month_sort_key] = {"label": month_str, "amount": 0}
        monthly_alltime[month_sort_key]["amount"] += p.amount
        
    by_month_list = [
        {"label": v["label"], "amount": v["amount"], "key": k}
        for k, v in sorted(monthly_alltime.items(), reverse=True)[:6]
    ]
    
    # 5. Tips & Win Rate
    tips_res = await db.execute(select(Tip))
    tips = tips_res.scalars().all()
    tip_won = sum(1 for t in tips if t.result == "won")
    tip_lost = sum(1 for t in tips if t.result == "lost")
    tip_pending = sum(1 for t in tips if t.result == "pending")
    tip_void = sum(1 for t in tips if t.result == "void")
    decided = tip_won + tip_lost
    win_rate = round((tip_won / decided) * 100, 1) if decided > 0 else 0.0
    
    return {
        "visitors": {
            "total": total_reg + total_guests,
            "registered": total_reg,
            "guests": total_guests,
            "today": reg_today + guests_today,
            "yesterday": reg_yesterday + guests_yesterday,
            "two_days_ago": reg_two_days_ago + guests_two_days_ago,
        },
        "online": {
            "total": online_reg + online_guests,
            "users": online_reg,
            "guests": online_guests,
            "been_online_today": been_online_today,
            "existing_users_online": online_existing_reg,
            "new_users_online": online_new_reg,
        },
        "subscribers": {
            "total": active_subs,
            "conversion_rate": conv_rate,
            "tier_distribution": tier_distribution,
            "recent_5day": sub_5day,
            "recent_10day": sub_10day,
            "recent_30day": sub_30day,
        },
        "revenue_monthly": {
            "total": monthly_rev,
            "today": today_rev,
            "by_method": {
                "mpesa": rev_mpesa,
                "paypal": rev_paypal,
            },
            "daily_history": last_7_days_list,
        },
        "revenue_alltime": {
            "total": all_time_rev,
            "this_year": year_rev,
            "monthly_history": by_month_list,
        },
        "tips": {
            "total": len(tips),
            "won": tip_won,
            "lost": tip_lost,
            "pending": tip_pending,
            "void": tip_void,
            "win_rate": win_rate,
        },
        "revenue_over_time": last_30_days_by_day,
    }


# ═══════════════════════════════════════════════════════════════
#  USER MANAGEMENT
# ═══════════════════════════════════════════════════════════════

class AdminUserListResponse(BaseModel):
    users: list[AdminUserResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
    counts: dict[str, int]


@router.get("/users", response_model=AdminUserListResponse)
async def list_users(
    search: Optional[str] = Query(None),
    tier: str = Query("all"),
    sort_field: str = Query("last_seen"),
    sort_dir: str = Query("desc"),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    now = datetime.now(UTC).replace(tzinfo=None)
    online_cutoff = now - timedelta(minutes=3)

    # Subqueries for activity telemetry
    path_totals_subq = (
        select(
            UserActivity.user_id.label("user_id"),
            UserActivity.path.label("path"),
            func.sum(UserActivity.time_spent_seconds).label("path_total"),
        )
        .group_by(UserActivity.user_id, UserActivity.path)
        .subquery()
    )

    ranked_paths_subq = (
        select(
            path_totals_subq.c.user_id,
            path_totals_subq.c.path,
            func.row_number().over(
                partition_by=path_totals_subq.c.user_id,
                order_by=(path_totals_subq.c.path_total.desc(), path_totals_subq.c.path.asc()),
            ).label("rn"),
        )
        .subquery()
    )

    top_path_subq = (
        select(
            ranked_paths_subq.c.user_id.label("user_id"),
            ranked_paths_subq.c.path.label("most_visited_page"),
        )
        .where(ranked_paths_subq.c.rn == 1)
        .subquery()
    )

    activity_totals_subq = (
        select(
            UserActivity.user_id.label("user_id"),
            func.sum(UserActivity.time_spent_seconds).label("total_time_spent"),
        )
        .group_by(UserActivity.user_id)
        .subquery()
    )

    # Filtering
    filters = []
    if search:
        search_term = f"%{search}%"
        filters.append(
            or_(
                User.name.like(search_term),
                User.email.like(search_term),
                User.phone.like(search_term),
            )
        )

    if tier != "all":
        if tier == "online":
            filters.append(User.last_seen.is_not(None))
            filters.append(User.last_seen >= online_cutoff)
        else:
            filters.append(User.subscription_tier == tier)

    # Sorting
    sort_exprs = {
        "name": User.name,
        "email": User.email,
        "subscription_tier": User.subscription_tier,
        "last_seen": User.last_seen,
        "total_time_spent": func.coalesce(activity_totals_subq.c.total_time_spent, 0),
        "created_at": User.created_at,
    }
    sort_column = sort_exprs.get(sort_field, User.last_seen)
    sort_direction = sort_dir.lower()
    if sort_direction not in {"asc", "desc"}:
        sort_direction = "desc"

    is_online_expr = case(
        (
            and_(User.last_seen.is_not(None), User.last_seen >= online_cutoff),
            1,
        ),
        else_=0,
    )

    total_stmt = select(func.count(User.id))
    if filters:
        total_stmt = total_stmt.where(and_(*filters))
    total = int((await db.execute(total_stmt)).scalar() or 0)

    users_stmt = (
        select(
            User,
            func.coalesce(activity_totals_subq.c.total_time_spent, 0).label("total_time_spent"),
            top_path_subq.c.most_visited_page,
        )
        .outerjoin(activity_totals_subq, activity_totals_subq.c.user_id == User.id)
        .outerjoin(top_path_subq, top_path_subq.c.user_id == User.id)
    )

    if filters:
        users_stmt = users_stmt.where(and_(*filters))

    if sort_direction == "asc":
        users_stmt = users_stmt.order_by(is_online_expr.desc(), sort_column.asc(), User.id.asc())
    else:
        users_stmt = users_stmt.order_by(is_online_expr.desc(), sort_column.desc(), User.id.desc())

    users_stmt = users_stmt.offset((page - 1) * per_page).limit(per_page)
    rows = (await db.execute(users_stmt)).all()

    response_users = []
    for user, total_time_spent, most_visited_page in rows:
        resp_obj = AdminUserResponse.model_validate(user)
        resp_obj.most_visited_page = most_visited_page
        resp_obj.total_time_spent = int(total_time_spent or 0)
        resp_obj.is_online = bool(user.last_seen and user.last_seen >= online_cutoff)
        response_users.append(resp_obj)

    total_all_users = int((await db.execute(select(func.count(User.id)))).scalar() or 0)
    online_count = int((
        await db.execute(
            select(func.count(User.id)).where(
                User.last_seen.is_not(None),
                User.last_seen >= online_cutoff,
            )
        )
    ).scalar() or 0)
    tier_rows = (
        await db.execute(
            select(User.subscription_tier, func.count(User.id))
            .group_by(User.subscription_tier)
        )
    ).all()

    counts: dict[str, int] = {"all": total_all_users, "online": online_count}
    for subscription_tier, count in tier_rows:
        counts[subscription_tier] = int(count)

    return {
        "users": response_users,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if per_page else 0,
        "counts": counts,
    }


@router.put("/users/{user_id}/revoke")
async def revoke_subscription(user_id: int, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(User).where(User.id == user_id))
    u = result.scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    u.subscription_tier = "free"
    u.subscription_expires_at = None
    revoke_all_subscription_entitlements(u)
    await db.commit()
    return {"status": "success"}


@router.put("/users/{user_id}/toggle-active")
async def toggle_user_active(user_id: int, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot toggle your own active status")
    result = await db.execute(select(User).where(User.id == user_id))
    u = result.scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    u.is_active = not u.is_active
    await db.commit()
    return {"status": "success", "is_active": u.is_active}


@router.get("/users/{user_id}/activity")
async def user_activity_detail(user_id: int, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    # Check user exists
    user_res = await db.execute(select(User).where(User.id == user_id))
    u = user_res.scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    # Page activity breakdown
    activity_res = await db.execute(
        select(
            UserActivity.path,
            func.count(UserActivity.id).label("visits"),
            func.sum(UserActivity.time_spent_seconds).label("total_time")
        )
        .where(UserActivity.user_id == user_id)
        .group_by(UserActivity.path)
        .order_by(func.sum(UserActivity.time_spent_seconds).desc())
    )
    pages = [
        {"path": row.path, "visits": row.visits, "total_time": int(row.total_time)}
        for row in activity_res.all()
    ]

    # Payment history
    payment_res = await db.execute(
        select(Payment).where(Payment.user_id == user_id).order_by(Payment.created_at.desc())
    )
    payments = payment_res.scalars().all()
    payment_list = [
        {
            "id": p.id,
            "amount": p.amount,
            "currency": p.currency,
            "method": p.method,
            "status": p.status,
            "item_type": p.item_type,
            "item_id": p.item_id,
            "reference": p.reference,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in payments
    ]

    return {
        "user": {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "subscription_tier": u.subscription_tier,
            "subscription_expires_at": u.subscription_expires_at.isoformat() if u.subscription_expires_at else None,
            "is_active": u.is_active,
            "is_admin": u.is_admin,
            "country": u.country,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "last_seen": u.last_seen.isoformat() if u.last_seen else None,
        },
        "pages": pages,
        "payments": payment_list,
        "total_time_spent": sum(p["total_time"] for p in pages),
        "total_spent": sum(p.amount for p in payments if p.status == "completed"),
    }


class BroadcastRequest(BaseModel):
    title: str
    body: str
    url: str = "/"
    target_tier: str = "all"
    target_country: str = "all"


@router.post("/broadcast-push")
async def broadcast_push(
    body: BroadcastRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    query = select(func.count(User.id))
    if body.target_tier != "all":
        query = query.where(User.subscription_tier == body.target_tier)
    
    targeted_users = (await db.execute(query)).scalar() or 0
    
    return {
        "message": "Broadcast successfully simulated!",
        "targeted_users": targeted_users,
        "total_subscriptions": targeted_users,
        "emails_sent": 0
    }


class GrantSubscriptionRequest(BaseModel):
    tier: str
    duration_days: int


@router.post("/users/{user_id}/grant-subscription")
async def admin_grant_subscription(
    user_id: int,
    body: GrantSubscriptionRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(
        select(User)
        .options(selectinload(User.subscription_entitlement_rows))
        .where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.tier == "free":
        revoke_all_subscription_entitlements(user)
    else:
        grant_subscription_entitlement(user, tier_id=body.tier, duration_days=body.duration_days, source="admin")

    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {"status": "success", "user": UserResponse.model_validate(user)}


@router.delete("/users/{user_id}")
async def admin_delete_user(user_id: int, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_admin:
        raise HTTPException(status_code=400, detail="Cannot delete admin users")

    await db.delete(user)
    await db.commit()
    return {"status": "success"}


# ═══════════════════════════════════════════════════════════════
#  PAYMENT MANAGEMENT
# ═══════════════════════════════════════════════════════════════

@router.get("/payments")
async def list_payments(
    status_filter: Optional[str] = Query(None, alias="status"),
    method: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    query = select(Payment)

    if status_filter:
        query = query.where(Payment.status == status_filter)
    if method:
        query = query.where(Payment.method == method)

    query = query.order_by(Payment.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    payments = result.scalars().all()

    return {
        "payments": [PaymentResponse.model_validate(p) for p in payments],
    }


@router.post("/payments/{payment_id}/approve")
async def approve_payment(payment_id: int, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    """Manually approve a pending payment (e.g., PayPal manual flow)."""
    result = await db.execute(select(Payment).where(Payment.id == payment_id).with_for_update())
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if payment.status == "completed":
        raise HTTPException(status_code=400, detail="Payment already completed")

    payment.status = "completed"

    user_result = await db.execute(
        select(User)
        .options(selectinload(User.subscription_entitlement_rows))
        .where(User.id == payment.user_id)
    )
    user = user_result.scalar_one_or_none()
    if user and payment.item_type == "subscription":
        tier_result = await db.execute(select(SubscriptionTier).where(SubscriptionTier.tier_id == payment.item_id))
        tier = tier_result.scalar_one_or_none()
        weeks = 4 if tier and payment.amount == tier.price_4wk else 2

        grant_subscription_entitlement(
            user,
            tier_id=payment.item_id,
            duration_days=weeks * 7,
            payment_id=payment.id,
            source="admin_approval",
        )
        sync_user_subscription_summary(user)
        db.add(user)

    await db.commit()
    return {"status": "success", "payment": PaymentResponse.model_validate(payment)}


# ═══════════════════════════════════════════════════════════════
#  SMS CONFIGURATION
# ═══════════════════════════════════════════════════════════════

SMS_DEFAULTS = {
    "SMS_SRC": "ARVOCAP",
    "SMS_ENABLED": "true",
    "SMS_TEMPLATE": "[Student Affairs] Your verification code is {code}. This code expires in 5 minutes. Do NOT share this code with anyone. Visit {url} to access your account.",
}

SMS_DESCRIPTIONS = {
    "SMS_SRC": "The name recipients see as the sender. Max 11 characters.",
    "SMS_ENABLED": "Master toggle for sending SMS OTP codes.",
    "SMS_TEMPLATE": "SMS template for OTP dispatch.",
}

class SMSSettingsUpdate(BaseModel):
    SMS_SRC: Optional[str] = None
    SMS_ENABLED: Optional[bool] = None
    SMS_TEMPLATE: Optional[str] = None

async def get_sms_settings(db: AsyncSession) -> dict:
    result = await db.execute(select(AdminSetting).where(AdminSetting.key.in_(SMS_DEFAULTS.keys())))
    settings_db = {s.key: s.value for s in result.scalars().all()}
    out = {}
    for key, default in SMS_DEFAULTS.items():
        raw = settings_db.get(key, default)
        if default in ("true", "false"):
            out[key] = raw.lower() == "true"
        else:
            out[key] = raw
    return out

@router.get("/settings/sms")
async def get_sms_settings_endpoint(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    return await get_sms_settings(db)

@router.put("/settings/sms")
async def update_sms_settings(body: SMSSettingsUpdate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    updates = body.model_dump(exclude_none=True)
    for key, value in updates.items():
        str_value = str(value).lower() if isinstance(value, bool) else str(value)
        res = await db.execute(select(AdminSetting).where(AdminSetting.key == key))
        setting = res.scalar_one_or_none()
        if not setting:
            setting = AdminSetting(key=key, value=str_value, description=SMS_DESCRIPTIONS.get(key, ""))
            db.add(setting)
        else:
            setting.value = str_value
    await db.commit()
    return await get_sms_settings(db)

# ═══════════════════════════════════════════════════════════════
#  EMAIL CONFIGURATION
# ═══════════════════════════════════════════════════════════════

EMAIL_DEFAULTS = {
    "SMTP_EMAIL": "",
    "SMTP_PASSWORD": "",
}

EMAIL_DESCRIPTIONS = {
    "SMTP_EMAIL": "The Gmail address used for authenticating SMTP.",
    "SMTP_PASSWORD": "Generated 16-character App Password.",
}

class EmailSettingsUpdate(BaseModel):
    SMTP_EMAIL: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None

async def get_email_settings(db: AsyncSession) -> dict:
    result = await db.execute(select(AdminSetting).where(AdminSetting.key.in_(EMAIL_DEFAULTS.keys())))
    settings_db = {s.key: s.value for s in result.scalars().all()}
    out = {}
    for key, default in EMAIL_DEFAULTS.items():
        out[key] = settings_db.get(key, default)
    return out

@router.get("/settings/email")
async def get_email_settings_endpoint(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    return await get_email_settings(db)

@router.put("/settings/email")
async def update_email_settings(body: EmailSettingsUpdate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    updates = body.model_dump(exclude_none=True)
    for key, value in updates.items():
        str_value = str(value)
        res = await db.execute(select(AdminSetting).where(AdminSetting.key == key))
        setting = res.scalar_one_or_none()
        if not setting:
            setting = AdminSetting(key=key, value=str_value, description=EMAIL_DESCRIPTIONS.get(key, ""))
            db.add(setting)
        else:
            setting.value = str_value
    await db.commit()
    return await get_email_settings(db)

# ═══════════════════════════════════════════════════════════════
#  SUPPORT CONTACT SETTINGS
# ═══════════════════════════════════════════════════════════════

SUPPORT_DEFAULTS = {
    "SUPPORT_EMAIL": "support@studentsaffairs.com",
    "SUPPORT_WHATSAPP": "https://wa.me/254700000000",
    "SUPPORT_WHATSAPP_NUMBER": "+254 700 000 000",
}

SUPPORT_DESCRIPTIONS = {
    "SUPPORT_EMAIL": "Public support email address shown on the contact page and help widget.",
    "SUPPORT_WHATSAPP": "Full WhatsApp link (https://wa.me/...) for the support chat button.",
    "SUPPORT_WHATSAPP_NUMBER": "Display-formatted WhatsApp number for user reference.",
}

class SupportSettingsUpdate(BaseModel):
    SUPPORT_EMAIL: Optional[str] = None
    SUPPORT_WHATSAPP: Optional[str] = None
    SUPPORT_WHATSAPP_NUMBER: Optional[str] = None

async def get_support_settings(db: AsyncSession) -> dict:
    result = await db.execute(select(AdminSetting).where(AdminSetting.key.in_(SUPPORT_DEFAULTS.keys())))
    settings_db = {s.key: s.value for s in result.scalars().all()}
    out = {}
    for key, default in SUPPORT_DEFAULTS.items():
        out[key] = settings_db.get(key, default)
    return out

@router.get("/settings/support")
async def get_support_settings_endpoint(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    return await get_support_settings(db)

@router.put("/settings/support")
async def update_support_settings(body: SupportSettingsUpdate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    updates = body.model_dump(exclude_none=True)
    for key, value in updates.items():
        str_value = str(value)
        res = await db.execute(select(AdminSetting).where(AdminSetting.key == key))
        setting = res.scalar_one_or_none()
        if not setting:
            setting = AdminSetting(key=key, value=str_value, description=SUPPORT_DESCRIPTIONS.get(key, ""))
            db.add(setting)
        else:
            setting.value = str_value
    await db.commit()
    return await get_support_settings(db)

# ═══════════════════════════════════════════════════════════════
#  AD POSTS (Custom Promo Slides)
# ═══════════════════════════════════════════════════════════════

@router.get("/ads", response_model=list[AdPostResponse])
async def list_admin_ads(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(AdPost).order_by(AdPost.created_at.desc()))
    return result.scalars().all()

@router.post("/ads", response_model=AdPostResponse)
async def create_admin_ad(data: AdPostCreate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    new_ad = AdPost(**data.model_dump())
    db.add(new_ad)
    await db.commit()
    await db.refresh(new_ad)
    return new_ad

@router.put("/ads/{ad_id}", response_model=AdPostResponse)
async def update_admin_ad(ad_id: int, data: AdPostUpdate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(AdPost).where(AdPost.id == ad_id))
    ad = result.scalar_one_or_none()
    if not ad:
        raise HTTPException(status_code=404, detail="Ad Post not found")
        
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(ad, k, v)
        
    await db.commit()
    await db.refresh(ad)
    return ad

@router.delete("/ads/{ad_id}")
async def delete_admin_ad(ad_id: int, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(AdPost).where(AdPost.id == ad_id))
    ad = result.scalar_one_or_none()
    if not ad:
        raise HTTPException(status_code=404, detail="Ad Post not found")
        
    await db.delete(ad)
    await db.commit()
    return {"status": "success"}

