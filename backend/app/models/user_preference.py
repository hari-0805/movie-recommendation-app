from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database.db import Base


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id     = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    genre  = Column(String(100), nullable=False)
    score  = Column(Float, default=1.0, nullable=False)  # higher = stronger preference

    user = relationship("User", back_populates="preferences")
