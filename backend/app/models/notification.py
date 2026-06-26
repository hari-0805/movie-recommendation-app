from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.db import Base


class Notification(Base):
    __tablename__ = "notifications"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    # actor = the person who triggered the notification
    actor_id   = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    type       = Column(String(50),   nullable=False)   # review_liked | collection_followed | new_recommendation
    title      = Column(String(200),  nullable=False)
    message    = Column(String(500),  nullable=False)
    link_id    = Column(String(50),   nullable=True)    # imdb_id or collection_id
    is_read    = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user  = relationship("User", foreign_keys=[user_id],  back_populates="notifications")
    actor = relationship("User", foreign_keys=[actor_id])
