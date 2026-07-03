from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.db import Base


class WatchedHistory(Base):
    __tablename__ = "watched_history"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    movie_id   = Column(String(20),  nullable=False)
    title      = Column(String(500), nullable=False)
    year       = Column(String(10),  default="")
    poster     = Column(String(500), default="")
    genre      = Column(String(200), default="")
    imdb_rating = Column(String(10), default="")
    watched_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="watched_history")
