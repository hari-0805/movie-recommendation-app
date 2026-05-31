from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.db import Base

class Favorite(Base):
    __tablename__ = "favorites"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    imdb_id    = Column(String, nullable=False)  
    title      = Column(String, nullable=False)
    year       = Column(String)
    poster     = Column(String)
    imdb_rating = Column(String)

    user = relationship("User", back_populates="favorites")
