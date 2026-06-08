from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.db import Base


class ViewedMovie(Base):
    __tablename__ = "viewed_movies"

    id        = Column(Integer, primary_key=True, index=True)
    user_id   = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    imdb_id   = Column(String(20),  nullable=False)
    title     = Column(String(500), nullable=False)
    genre     = Column(String(200))
    year      = Column(String(10))
    poster    = Column(String(500))
    viewed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="viewed_movies")
