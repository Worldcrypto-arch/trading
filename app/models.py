from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_admin = Column(Boolean, default=False)

class NewsEvent(Base):
    __tablename__ = "news_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    currency = Column(String)
    impact = Column(String) # High, Medium, Low
    date_time = Column(DateTime)
    actual = Column(String, nullable=True)
    forecast = Column(String, nullable=True)
    previous = Column(String, nullable=True)
    source = Column(String) # ForexFactory, Investing
    category = Column(String) # Forex, Gold, Nasdaq, US30
    sentiment = Column(String, nullable=True) # Positive, Negative, Neutral
    analysis = Column(String, nullable=True) # Probable volatility prediction

class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)
    login_time = Column(DateTime)
    token = Column(String, index=True)
