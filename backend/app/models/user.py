from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database.db import Base


class User(Base):
    __tablename__ = "users"

    id       = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email    = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)

    favorites      = relationship("Favorite",       back_populates="user", cascade="all, delete-orphan")
    search_history = relationship("SearchHistory",  back_populates="user", cascade="all, delete-orphan")
    reviews        = relationship("Review",         back_populates="user", cascade="all, delete-orphan")
    viewed_movies  = relationship("ViewedMovie",    back_populates="user", cascade="all, delete-orphan")
    preferences    = relationship("UserPreference", back_populates="user", cascade="all, delete-orphan")
    watchlist      = relationship("Watchlist",       back_populates="user", cascade="all, delete-orphan")
