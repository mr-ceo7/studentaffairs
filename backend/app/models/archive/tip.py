"""
Tip ORM model — categories focused on GG and Over 2.5.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON

from app.database import Base


class Tip(Base):
    __tablename__ = "tips"

    id = Column(Integer, primary_key=True, autoincrement=True)
    fixture_id = Column(Integer, nullable=False, index=True)
    home_team = Column(String(255), nullable=False)
    away_team = Column(String(255), nullable=False)
    league = Column(String(255), nullable=False)
    match_date = Column(DateTime, nullable=False)
    prediction = Column(String(255), nullable=False)
    odds = Column(String(50), nullable=False)
    bookmaker = Column(String(100), nullable=False)
    bookmaker_odds = Column(JSON, nullable=True)  # [{bookmaker: str, odds: str}]
    confidence = Column(Integer, nullable=False, default=3)
    reasoning = Column(Text, nullable=True)
    category = Column(String(20), nullable=False, default="free")  # free, gg, over25
    is_premium = Column(Integer, nullable=False, default=0)  # 0=free, 1=premium
    result = Column(String(20), nullable=False, default="pending")  # pending, won, lost, void, postponed

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
