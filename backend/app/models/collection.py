from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.db import Base


class Collection(Base):
    __tablename__ = "collections"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name        = Column(String(200), nullable=False)
    description = Column(String(1000), default="")
    emoji       = Column(String(10), default="🎬")
    is_public   = Column(Boolean, default=False, nullable=False)
    created_at  = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at  = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                         onupdate=lambda: datetime.now(timezone.utc))

    user   = relationship("User", back_populates="collections")
    movies = relationship("CollectionMovie", back_populates="collection",
                          cascade="all, delete-orphan")


class CollectionMovie(Base):
    __tablename__ = "collection_movies"

    collection_id = Column(Integer, ForeignKey("collections.id", ondelete="CASCADE"), primary_key=True)
    movie_id      = Column(String(20), nullable=False, primary_key=True)
    title         = Column(String(500))
    year          = Column(String(10))
    poster        = Column(String(500))
    genre         = Column(String(200))
    added_at      = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    collection = relationship("Collection", back_populates="movies")
