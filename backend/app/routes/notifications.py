from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.db import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationListResponse, NotificationResponse
from app.services.auth import get_current_user
from datetime import datetime, timezone

router = APIRouter(prefix="/notifications", tags=["Notifications"], redirect_slashes=False)


def _build_response(n: Notification, actor_name: str = None) -> dict:
    return {
        "id":         n.id,
        "type":       n.type,
        "title":      n.title,
        "message":    n.message,
        "link_id":    n.link_id,
        "is_read":    n.is_read,
        "created_at": n.created_at,
        "actor_name": actor_name,
    }


# ── GET /notifications ────────────────────────────────────────────────────────
@router.get("", response_model=NotificationListResponse)
def get_notifications(
    limit:        int     = Query(20, ge=1, le=50),
    unread_only:  bool    = Query(False),
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """Fetch notifications for the current user, newest first."""
    query = db.query(Notification).filter(Notification.user_id == current_user.id)

    if unread_only:
        query = query.filter(Notification.is_read == False)

    notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()

    unread_count = db.query(func.count(Notification.id)).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).scalar()

    result = []
    for n in notifications:
        actor_name = None
        if n.actor_id:
            actor = db.query(User).filter(User.id == n.actor_id).first()
            actor_name = actor.username if actor else None
        result.append(_build_response(n, actor_name))

    return NotificationListResponse(
        success=True,
        notifications=result,
        unread_count=unread_count,
    )


# ── GET /notifications/unread-count ───────────────────────────────────────────
@router.get("/unread-count")
def get_unread_count(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """Lightweight endpoint — just returns unread count for bell badge."""
    count = db.query(func.count(Notification.id)).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).scalar()
    return {"success": True, "unread_count": count}


# ── PATCH /notifications/{id}/read ────────────────────────────────────────────
@router.patch("/{notification_id}/read", status_code=200)
def mark_as_read(
    notification_id: int,
    db:              Session = Depends(get_db),
    current_user:    User    = Depends(get_current_user),
):
    """Mark a single notification as read."""
    n = db.query(Notification).filter(
        Notification.id      == notification_id,
        Notification.user_id == current_user.id,
    ).first()
    if not n:
        raise HTTPException(404, detail={"success": False, "message": "Notification not found"})
    n.is_read = True
    db.commit()
    return {"success": True, "message": "Marked as read"}


# ── PATCH /notifications/read-all ─────────────────────────────────────────────
@router.patch("/read-all", status_code=200)
def mark_all_read(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """Mark all notifications as read for the current user."""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"success": True, "message": "All notifications marked as read"}


# ── DELETE /notifications/{id} ────────────────────────────────────────────────
@router.delete("/{notification_id}", status_code=200)
def delete_notification(
    notification_id: int,
    db:              Session = Depends(get_db),
    current_user:    User    = Depends(get_current_user),
):
    """Delete a single notification."""
    n = db.query(Notification).filter(
        Notification.id      == notification_id,
        Notification.user_id == current_user.id,
    ).first()
    if not n:
        raise HTTPException(404, detail={"success": False, "message": "Notification not found"})
    db.delete(n)
    db.commit()
    return {"success": True, "message": "Notification deleted"}


# ── DELETE /notifications/clear-all ──────────────────────────────────────────
@router.delete("/clear-all", status_code=200)
def clear_all(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """Delete all notifications for the current user."""
    db.query(Notification).filter(Notification.user_id == current_user.id).delete()
    db.commit()
    return {"success": True, "message": "All notifications cleared"}
