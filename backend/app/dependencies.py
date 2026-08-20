"""
FastAPI dependencies: database session + current user extraction.
"""

from typing import Optional

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone
UTC = timezone.utc

from app.database import AsyncSessionLocal
from app.security import decode_token
# from app.services.subscription_access import sync_user_subscription_summary

security_scheme = HTTPBearer(auto_error=False)


async def _auto_downgrade_expired_subscription(db: AsyncSession, user) -> bool:
    return False


async def get_db():
    """Yield an async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
):
    """
    Extract and validate the current user from the cookie token (or Bearer fallback).
    """
    token = request.cookies.get("access_token")
    if not token and credentials:
        token = credentials.credentials

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    from app.models.user import User, UserSession

    result = await db.execute(
        select(User)
        .where(User.id == int(user_id))
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")

    subscription_downgraded = await _auto_downgrade_expired_subscription(db, user)

    # Multi-device session validation
    session_id_from_token = payload.get("session_id")

    if session_id_from_token:
        result = await db.execute(
            select(UserSession).where(UserSession.session_id == session_id_from_token)
        )
        session = result.scalar_one_or_none()

        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired. Device logged in elsewhere."
            )

        session.last_used_at = datetime.now(UTC).replace(tzinfo=None)
        db.add(session)
        try:
            await db.commit()
        except Exception:
            await db.rollback()
    else:
        if user.session_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired. Device logged in elsewhere."
            )
        if subscription_downgraded:
            try:
                await db.commit()
            except Exception:
                await db.rollback()

    return user


async def get_current_user_optional(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Like get_current_user, but returns None instead of raising."""
    token = request.cookies.get("access_token")
    if not token and credentials:
        token = credentials.credentials

    if not token:
        return None

    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        return None

    user_id = payload.get("sub")
    if user_id is None:
        return None

    from app.models.user import User, UserSession

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()

    if user and not user.is_active:
        return None

    if user:
        await _auto_downgrade_expired_subscription(db, user)

        session_id_from_token = payload.get("session_id")
        if session_id_from_token:
            result = await db.execute(
                select(UserSession).where(UserSession.session_id == session_id_from_token)
            )
            session = result.scalar_one_or_none()
            if not session:
                return None

    return user


async def require_admin(user=Depends(get_current_user)):
    """Require the current user to be an admin."""
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user
