from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database.db import Base


class User(Base):
    __tablename__ = "users"

    id       = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email    = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)

    # One-to-Many relationships
    favorites      = relationship("Favorite",      back_populates="user", cascade="all, delete-orphan")
    search_history = relationship("SearchHistory", back_populates="user", cascade="all, delete-orphan")
    reviews        = relationship("Review",        back_populates="user", cascade="all, delete-orphan")
