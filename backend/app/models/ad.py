from datetime import datetime, timezone
UTC = timezone.utc
from sqlalchemy import Column, String, Boolean, DateTime, BigInteger

from app.database import Base

class AdPost(Base):
    __tablename__ = "ad_posts"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    image_url = Column(String(500), nullable=True)
    link_url = Column(String(500), nullable=True)
    category = Column(String(50), default="Promo")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC).replace(tzinfo=None))
