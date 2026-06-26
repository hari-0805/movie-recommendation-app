"""
notification_service.py
=======================
Called from other routes to create notifications.
Import this in reviews.py, collections.py, recommendations.py, auth.py
"""
from sqlalchemy.orm import Session
from app.models.notification import Notification
from datetime import datetime, timezone


def create_notification(
    db:       Session,
    user_id:  int,          # who receives the notification
    type:     str,          # notification type key
    title:    str,
    message:  str,
    actor_id: int = None,   # who triggered it (optional)
    link_id:  str = None,   # imdb_id or collection_id for deep linking
):
    """Create and save a notification. Call this from any route."""
    n = Notification(
        user_id=user_id,
        actor_id=actor_id,
        type=type,
        title=title,
        message=message,
        link_id=link_id,
        is_read=False,
        created_at=datetime.now(timezone.utc),
    )
    db.add(n)
    db.commit()
    return n


# ── Specific notification creators ────────────────────────────────────────────

def notify_review_liked(db: Session, review_owner_id: int, liker_name: str,
                         movie_title: str, imdb_id: str, liker_id: int):
    """Triggered when someone likes a review."""
    if review_owner_id == liker_id:
        return  # don't notify yourself
    create_notification(
        db=db,
        user_id=review_owner_id,
        actor_id=liker_id,
        type="review_liked",
        title="⭐ Review Liked",
        message=f"{liker_name} liked your review of {movie_title}",
        link_id=imdb_id,
    )


def notify_collection_followed(db: Session, owner_id: int, follower_name: str,
                                 collection_name: str, collection_id: int, follower_id: int):
    """Triggered when someone follows/saves a collection."""
    if owner_id == follower_id:
        return  # don't notify yourself
    create_notification(
        db=db,
        user_id=owner_id,
        actor_id=follower_id,
        type="collection_followed",
        title="📁 Collection Followed",
        message=f"{follower_name} is following your '{collection_name}' collection",
        link_id=str(collection_id),
    )


def notify_new_recommendations(db: Session, user_id: int):
    """Triggered when recommendations are refreshed."""
    # Only create if no unread recommendation notification already exists
    from app.models.notification import Notification
    existing = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.type    == "new_recommendation",
        Notification.is_read == False,
    ).first()
    if existing:
        return  # already has an unread one — don't spam
    create_notification(
        db=db,
        user_id=user_id,
        type="new_recommendation",
        title="🎬 New Recommendations",
        message="Your personalized movie recommendations have been updated based on your activity",
    )


def notify_welcome(db: Session, user_id: int):
    """Triggered on registration."""
    create_notification(
        db=db,
        user_id=user_id,
        type="welcome",
        title="👋 Welcome to MovieSearch!",
        message="Start by searching for your favorite movies, adding them to favorites, and getting personalized recommendations.",
    )
