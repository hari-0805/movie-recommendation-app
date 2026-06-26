from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional


class NotificationResponse(BaseModel):
    id:         int
    type:       str
    title:      str
    message:    str
    link_id:    Optional[str] = None
    is_read:    bool
    created_at: datetime
    actor_name: Optional[str] = None

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    success:      bool = True
    notifications: List[NotificationResponse]
    unread_count: int


class NotificationService:
    """Helper to create notifications from anywhere in the app."""

    TYPES = {
        "review_liked":         ("⭐ Review Liked",          "{actor} liked your review of {movie}"),
        "collection_followed":  ("📁 Collection Followed",   "{actor} started following your '{collection}' collection"),
        "new_recommendation":   ("🎬 New Recommendations",   "Your personalized recommendations have been updated"),
        "review_added":         ("💬 New Review",            "{actor} reviewed a movie you favorited: {movie}"),
        "welcome":              ("👋 Welcome!",              "Welcome to MovieSearch! Start by searching for your favorite movies."),
    }

    @staticmethod
    def build(type_key: str, **kwargs) -> dict:
        title_tmpl, msg_tmpl = NotificationService.TYPES.get(
            type_key, ("Notification", "You have a new notification")
        )
        return {
            "type":    type_key,
            "title":   title_tmpl,
            "message": msg_tmpl.format(**kwargs),
        }
