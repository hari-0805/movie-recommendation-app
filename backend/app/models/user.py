from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database.db import Base

class User(Base):
    __tablename__ = "users"

    id       = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email    = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)

    favorites      = relationship("Favorite",      back_populates="user")
    search_history = relationship("SearchHistory", back_populates="user")
    reviews        = relationship("Review",        back_populates="user")
