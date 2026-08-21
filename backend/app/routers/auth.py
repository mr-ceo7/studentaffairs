"""
Authentication routes: Google login, phone OTP, refresh, me, logout.
"""

import httpx
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from datetime import datetime, timedelta, timezone
UTC = timezone.utc
import random
import os
import string
import uuid

from typing import Optional
from app.database import AsyncSessionLocal
from app.dependencies import get_db, get_current_user, get_current_user_optional
from app.models.user import User, UserSession
from app.config import settings
from app.schemas.auth import GoogleLoginRequest, PhoneLoginRequest, PhoneVerifyRequest, UpdateFavoritesRequest, UserResponse, ActivityRequest, MockSSOLoginRequest, UpdateProfileRequest
from app.models.activity import UserActivity, AnonymousVisitor, AnonymousActivity
from app.security import hash_password, create_access_token, create_refresh_token, decode_token
from app.services.email_service import send_welcome_email
# from app.services.subscription_access import grant_subscription_entitlement
from fastapi.responses import RedirectResponse
from app.models.ticket import Ticket
from sqlalchemy import update

async def associate_lecturer_tickets(user_id: int, user_email: str, db: AsyncSession):
    """Automatically maps all submitted student tickets targeting this email to the newly onboarded lecturer."""
    await db.execute(
        update(Ticket)
        .where(Ticket.lecturer_email == user_email.lower().strip())
        .where(Ticket.lecturer_id.is_(None))
        .values(lecturer_id=user_id)
    )
    await db.commit()



def set_auth_cookies(response: Response, request: Request, access_token: str, refresh_token: str):
    """Set auth cookies with correct flags for HTTP vs HTTPS."""
    is_secure = request.url.scheme == "https" or request.headers.get("x-forwarded-proto") == "https"
    samesite_val = "none" if is_secure else "lax"
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=is_secure, samesite=samesite_val, max_age=3600)
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=is_secure, samesite=samesite_val, max_age=604800)


def get_real_ip(request: Request) -> str:
    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    x_real_ip = request.headers.get("x-real-ip")
    if x_real_ip:
        return x_real_ip.strip()
    return request.client.host if request.client else ""


async def create_user_session(user: User, db: AsyncSession) -> str:
    """Create a new session. Regular users get 1 active session, admins get 4."""
    MAX_ADMIN_SESSIONS = 4
    session_id = uuid.uuid4().hex

    if not user.is_admin and user.sessions:
        for old_session in user.sessions:
            await db.delete(old_session)
        await db.commit()
        await db.refresh(user)

    new_session = UserSession(
        user_id=user.id,
        session_id=session_id,
        created_at=datetime.now(UTC).replace(tzinfo=None),
        last_used_at=datetime.now(UTC).replace(tzinfo=None),
    )
    db.add(new_session)

    if user.is_admin:
        result = await db.execute(
            select(UserSession).where(UserSession.user_id == user.id).order_by(UserSession.created_at)
        )
        sessions = result.scalars().all()
        if len(sessions) > MAX_ADMIN_SESSIONS:
            delete_count = len(sessions) - MAX_ADMIN_SESSIONS
            for old_session in sessions[:delete_count]:
                await db.delete(old_session)
            await db.commit()
            await db.refresh(user)

    await db.commit()

    user.session_id = session_id
    db.add(user)
    await db.commit()

    # Track login campaign event (Archived)
    # from app.routers.campaigns import track_campaign_event
    # import asyncio
    # asyncio.create_task(track_campaign_event("login"))

    return session_id


async def cleanup_expired_sessions(user: User, db: AsyncSession):
    """Remove sessions inactive for 7+ days."""
    expiry_threshold = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=7)
    result = await db.execute(
        select(UserSession).where(UserSession.user_id == user.id, UserSession.last_used_at < expiry_threshold)
    )
    expired = result.scalars().all()
    for session in expired:
        await db.delete(session)
    if expired:
        await db.commit()


router = APIRouter(prefix="/api/auth", tags=["Auth"])


async def fetch_user_country(user_id: int, ip_address: str):
    if not ip_address or ip_address in ("127.0.0.1", "::1", "localhost"):
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get("https://api.ipify.org")
                ip_address = res.text.strip()
        except Exception:
            return

    if not ip_address:
        return

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get(f"http://ip-api.com/json/{ip_address}")
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    async with AsyncSessionLocal() as session:
                        user = await session.get(User, user_id)
                        if user:
                            user.country = data.get("countryCode")
                            session.add(user)
                            await session.commit()
    except Exception as e:
        print(f"IP Geolocation failed: {e}")


import re

def _normalize_phone(phone: str) -> str:
    phone = re.sub(r'[\s\-\(\)]', '', phone)
    if not phone.startswith('+'):
        phone = '+' + phone
    return phone


@router.post("/google")
async def google_auth(body: GoogleLoginRequest, request: Request, response: Response, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests

        client_id = os.getenv("GOOGLE_CLIENT_ID") or settings.GOOGLE_CLIENT_ID
        idinfo = id_token.verify_oauth2_token(body.id_token, google_requests.Request(), client_id)

        email = idinfo.get("email")
        name = idinfo.get("name")
        picture = idinfo.get("picture")

        if not email:
            raise HTTPException(status_code=400, detail="No email provided in Google Token")

        result = await db.execute(select(User).where(User.email == email.lower().strip()))
        user = result.scalar_one_or_none()

        if not user:
            rand_pass = "".join(random.choices(string.ascii_letters + string.digits, k=32))

            user = User(
                name=name.strip(),
                email=email.lower().strip(),
                password=hash_password(rand_pass),
                subscription_tier="free",
                is_admin=False,
                is_active=True,
                email_verified_at=datetime.now(UTC).replace(tzinfo=None),
                profile_picture=picture,
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

            background_tasks.add_task(send_welcome_email, user.email, user.name)

            # Referral fulfillment
            if body.referred_by_code:
                result_ref = await db.execute(select(User).where(User.referral_code == body.referred_by_code))
                referrer = result_ref.scalar_one_or_none()
                if referrer and referrer.id != user.id:
                    user.referrer_id = referrer.id
                    referrer.referrals_count += 1
                    referrer.referral_points += 1
                    db.add(referrer)
                    db.add(user)
                    await db.commit()

        if picture and user.profile_picture != picture:
            user.profile_picture = picture

        if not user.referral_code:
            safe_name = "".join([c for c in user.name if c.isalpha()])[:3].upper()
            if len(safe_name) < 3:
                safe_name = "VIP"
            user.referral_code = f"{safe_name}{uuid.uuid4().hex[:5].upper()}"

        db.add(user)
        await db.commit()

        await associate_lecturer_tickets(user.id, user.email, db)
        await cleanup_expired_sessions(user, db)
        session_id = await create_user_session(user, db)

        client_ip = get_real_ip(request)
        background_tasks.add_task(fetch_user_country, user.id, client_ip)

        access_token = create_access_token(str(user.id), extra={"session_id": session_id})
        refresh_token = create_refresh_token(str(user.id))

        set_auth_cookies(response, request, access_token, refresh_token)

        return {"status": "success"}

    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google Token: {e}")
    except Exception as e:
        import logging
        logging.error(f"Google Auth Error: {e}")
        if "retries exceeded" in str(e) or "Temporary failure" in str(e):
            raise HTTPException(status_code=502, detail="Could not reach Google securely to verify login.")
        raise HTTPException(status_code=500, detail="An unexpected authentication error occurred.")


@router.post("/mock-sso")
async def mock_sso_login(body: MockSSOLoginRequest, request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    email = body.email.lower().strip()
    name = body.name.strip()
    picture = body.profile_picture
    
    # Check domain
    if not (email.endswith("@student.uonbi.ac.ke") or email.endswith("@uonbi.ac.ke")):
        raise HTTPException(
            status_code=400,
            detail="Domain restriction: Must use a @student.uonbi.ac.ke or @uonbi.ac.ke email."
        )
    
    # Determine roles
    is_student = email.endswith("@student.uonbi.ac.ke")
    is_admin = False
    
    # If the user selected admin or if email matches admin@uonbi.ac.ke or Kassim's email
    if body.role == "admin" or email == "admin@uonbi.ac.ke" or email == "kassimmusa322@gmail.com":
        is_admin = True
    
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
        rand_pass = "".join(random.choices(string.ascii_letters + string.digits, k=32))
        user = User(
            name=name,
            email=email,
            password=hash_password(rand_pass),
            subscription_tier="free" if is_student else "premium",
            is_admin=is_admin,
            is_active=True,
            email_verified_at=datetime.now(UTC).replace(tzinfo=None),
            profile_picture=picture or f"https://api.dicebear.com/7.x/initials/svg?seed={name}",
            reg_number=body.reg_number or (None if email == "new.student@student.uonbi.ac.ke" else ("F17/141029/2022" if is_student else None)),
            campus=body.campus or (None if email == "new.student@student.uonbi.ac.ke" else ("Main Campus" if is_student else None)),
            faculty=body.faculty or (None if email == "new.student@student.uonbi.ac.ke" else ("Faculty of Science & Technology" if is_student else None)),
            department=body.department or (None if email == "new.student@student.uonbi.ac.ke" else ("Department of Computer Science" if is_student else None)),
            course=body.course or (None if email == "new.student@student.uonbi.ac.ke" else ("B.Sc. Computer Science" if is_student else None)),
            year_of_study=body.year_of_study or (None if email == "new.student@student.uonbi.ac.ke" else ("Year 3" if is_student else None)),
            semester=body.semester or (None if email == "new.student@student.uonbi.ac.ke" else ("Semester 2" if is_student else None)),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        user.name = name
        user.is_admin = is_admin
        if picture:
            user.profile_picture = picture
        if email == "new.student@student.uonbi.ac.ke":
            user.reg_number = None
            user.campus = None
            user.faculty = None
            user.department = None
            user.course = None
            user.year_of_study = None
            user.semester = None
        else:
            if body.reg_number: user.reg_number = body.reg_number
            if body.campus: user.campus = body.campus
            if body.faculty: user.faculty = body.faculty
            if body.department: user.department = body.department
            if body.course: user.course = body.course
            if body.year_of_study: user.year_of_study = body.year_of_study
            if body.semester: user.semester = body.semester
        db.add(user)
        await db.commit()
        await db.refresh(user)

    await associate_lecturer_tickets(user.id, user.email, db)
    await cleanup_expired_sessions(user, db)
    session_id = await create_user_session(user, db)
    
    access_token = create_access_token(str(user.id), extra={"session_id": session_id})
    refresh_token = create_refresh_token(str(user.id))
    
    set_auth_cookies(response, request, access_token, refresh_token)
    
    return {"status": "success"}


def _normalize_phone_digits_for_sms(phone: str) -> str:
    import re
    digits = re.sub(r'[\D]', '', phone or '')
    if digits.startswith('0') and len(digits) == 10:
        return f"254{digits[1:]}"
    if digits.startswith('7') and len(digits) == 9:
        return f"254{digits}"
    return digits

async def _send_otp_sms(phone: str, code: str, db: AsyncSession):
    try:
        from app.routers.admin import get_sms_settings
        sms_settings = await get_sms_settings(db)
        sms_enabled = sms_settings.get("SMS_ENABLED", True)

        if not sms_enabled:
            return

        sms_src = sms_settings.get("SMS_SRC", "ARVOCAP")
        sms_template = sms_settings.get("SMS_TEMPLATE", "[Student Affairs] Your verification code is {code}. This code expires in 5 minutes. Do NOT share this code with anyone. Visit {url} to access your account.")
        
        stripped_phone = _normalize_phone_digits_for_sms(phone)
        site_url = settings.FRONTEND_URL.replace("http://", "").replace("https://", "")
        sms_message = sms_template.replace("{code}", code).replace("{url}", site_url)
        
        sms_url = "https://quicksms.advantasms.com/api/services/sendotp/"
        params = {
            "apikey": "7218b12ef227065935349cc18da61ea7",
            "partnerID": "2872",
            "mobile": stripped_phone,
            "message": sms_message,
            "shortcode": sms_src
        }
        
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(sms_url, params=params)
            if response.status_code == 200:
                print(f"[Student Affairs] SMS sent successfully to {stripped_phone}")
            else:
                print(f"[Student Affairs] SMS provider returned status {response.status_code} for {stripped_phone}")
    except Exception as e:
        print(f"[Student Affairs] Failed to send OTP SMS to {phone}: {e}")

@router.post("/phone/request-otp")
async def request_phone_otp(body: PhoneLoginRequest, db: AsyncSession = Depends(get_db)):
    phone = _normalize_phone(body.phone)

    if len(phone) < 10 or len(phone) > 15:
        raise HTTPException(status_code=400, detail="Invalid phone number format")

    result = await db.execute(select(User).where(User.phone == phone))
    user = result.scalar_one_or_none()

    code = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.now(UTC).replace(tzinfo=None) + timedelta(minutes=5)

    if user:
        user.verification_code = code
        user.verification_code_expires_at = expires_at
        db.add(user)
    else:
        placeholder_email = f"phone_{phone.replace('+', '')}@uon_clearinghouse.local"
        rand_pass = "".join(random.choices(string.ascii_letters + string.digits, k=32))
        user = User(
            name=f"User {phone[-4:]}",
            email=placeholder_email,
            password=hash_password(rand_pass),
            phone=phone,
            subscription_tier="free",
            is_active=True,
            verification_code=code,
            verification_code_expires_at=expires_at,
        )
        db.add(user)

    await db.commit()

    # Send OTP via SMS provider
    await _send_otp_sms(phone, code, db)
    print(f"[UoN Clearinghouse] OTP for {phone}: {code}")

    return {"status": "success", "message": "OTP sent"}


@router.post("/phone/verify-otp")
async def verify_phone_otp(body: PhoneVerifyRequest, request: Request, response: Response, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    phone = _normalize_phone(body.phone)

    result = await db.execute(select(User).where(User.phone == phone))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="No OTP was requested for this number")

    if not user.verification_code or not user.verification_code_expires_at:
        raise HTTPException(status_code=400, detail="No pending OTP. Please request a new one.")

    if datetime.now(UTC).replace(tzinfo=None) > user.verification_code_expires_at:
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    if user.verification_code != body.code:
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    user.verification_code = None
    user.verification_code_expires_at = None

    if not user.email_verified_at:
        user.email_verified_at = datetime.now(UTC).replace(tzinfo=None)

    is_new_user = user.referral_code is None
    if is_new_user and body.referred_by_code:
        result_ref = await db.execute(select(User).where(User.referral_code == body.referred_by_code))
        referrer = result_ref.scalar_one_or_none()
        if referrer and referrer.id != user.id:
            user.referrer_id = referrer.id
            referrer.referrals_count += 1
            referrer.referral_points += 1
            db.add(referrer)

    if not user.referral_code:
        safe_name = "".join([c for c in user.name if c.isalpha()])[:3].upper()
        if len(safe_name) < 3:
            safe_name = "VIP"
        user.referral_code = f"{safe_name}{uuid.uuid4().hex[:5].upper()}"

    db.add(user)
    await db.commit()

    await cleanup_expired_sessions(user, db)
    session_id = await create_user_session(user, db)

    client_ip = get_real_ip(request)
    background_tasks.add_task(fetch_user_country, user.id, client_ip)

    access_token = create_access_token(str(user.id), extra={"session_id": session_id})
    refresh_token = create_refresh_token(str(user.id))

    set_auth_cookies(response, request, access_token, refresh_token)

    return {"status": "success"}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", samesite="none", secure=True)
    response.delete_cookie("refresh_token", samesite="none", secure=True)
    return {"status": "success"}


@router.post("/refresh")
async def refresh(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing")

    payload = decode_token(refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    session_id = await create_user_session(user, db)

    access_token = create_access_token(str(user.id), extra={"session_id": session_id})
    new_refresh_token = create_refresh_token(str(user.id))

    set_auth_cookies(response, request, access_token, new_refresh_token)

    return {"status": "success"}


@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_user)):
    return user


@router.put("/me/favorites", response_model=UserResponse)
async def update_favorites(body: UpdateFavoritesRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user.favorite_teams = body.favorite_teams
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.put("/me/profile", response_model=UserResponse)
async def update_profile(body: UpdateProfileRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if body.name is not None: user.name = body.name
    if body.reg_number is not None: user.reg_number = body.reg_number
    if body.campus is not None: user.campus = body.campus
    if body.faculty is not None: user.faculty = body.faculty
    if body.department is not None: user.department = body.department
    if body.course is not None: user.course = body.course
    if body.year_of_study is not None: user.year_of_study = body.year_of_study
    if body.semester is not None: user.semester = body.semester
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def cleanup_old_visitors_task():
    try:
        async with AsyncSessionLocal() as session:
            cutoff = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=30)
            await session.execute(delete(AnonymousVisitor).where(AnonymousVisitor.last_seen < cutoff))
            await session.commit()
    except Exception as e:
        print(f"Cleanup error: {e}")


@router.post("/activity")
async def track_activity(
    body: ActivityRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    if random.random() < 0.05:
        background_tasks.add_task(cleanup_old_visitors_task)

    if user:
        user.last_seen = datetime.now(UTC).replace(tzinfo=None)
        db.add(user)
        
        if body.time_spent > 0 and body.path:
            act = UserActivity(
                user_id=user.id,
                path=body.path,
                time_spent_seconds=body.time_spent
            )
            db.add(act)
    elif body.session_id:
        res = await db.execute(select(AnonymousVisitor).where(AnonymousVisitor.session_id == body.session_id))
        visitor = res.scalar_one_or_none()
        
        if not visitor:
            visitor = AnonymousVisitor(session_id=body.session_id)
            db.add(visitor)
            try:
                await db.commit()
                await db.refresh(visitor)
            except Exception:
                await db.rollback()
                res = await db.execute(select(AnonymousVisitor).where(AnonymousVisitor.session_id == body.session_id))
                visitor = res.scalar_one_or_none()
                if not visitor:
                    body.session_id = str(uuid.uuid4())
                    visitor = AnonymousVisitor(session_id=body.session_id)
                    db.add(visitor)
                    await db.commit()
                    await db.refresh(visitor)
            
        visitor.last_seen = datetime.now(UTC).replace(tzinfo=None)
        db.add(visitor)
        
        if body.time_spent > 0 and body.path:
            act = AnonymousActivity(
                visitor_id=visitor.id,
                path=body.path,
                time_spent_seconds=body.time_spent
            )
            db.add(act)
        
    await db.commit()
    return {"status": "ok"}


@router.get("/onboard")
async def onboard_lecturer(
    email: str,
    name: str,
    request: Request,
    response: Response,
    role: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    email = email.lower().strip()
    name = name.strip()

    # Check if user already exists
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        # Auto-create user
        rand_pass = "".join(random.choices(string.ascii_letters + string.digits, k=32))
        user = User(
            name=name,
            email=email,
            password=hash_password(rand_pass),
            subscription_tier="premium",  # Staff/lecturers/admins get premium tier privileges
            is_admin=True if role == "admin" else False,
            is_active=True,
            email_verified_at=datetime.now(UTC).replace(tzinfo=None),
            profile_picture=f"https://api.dicebear.com/7.x/initials/svg?seed={name}",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # Associate tickets
    await associate_lecturer_tickets(user.id, user.email, db)

    # Create session and set cookies
    await cleanup_expired_sessions(user, db)
    session_id = await create_user_session(user, db)

    access_token = create_access_token(str(user.id), extra={"session_id": session_id})
    refresh_token = create_refresh_token(str(user.id))

    # Redirect to the frontend dashboard
    redirect_res = RedirectResponse(url=f"{settings.FRONTEND_URL}/clearance")
    set_auth_cookies(redirect_res, request, access_token, refresh_token)
    return redirect_res


