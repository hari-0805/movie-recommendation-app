from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.db import Base


class Favorite(Base):
    __tablename__ = "favorites"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    imdb_id     = Column(String(20),  nullable=False)
    title       = Column(String(500), nullable=False)
    year        = Column(String(10))
    poster      = Column(String(500))
    imdb_rating = Column(String(10))

    # Relationship
    user = relationship("User", back_populates="favorites")
