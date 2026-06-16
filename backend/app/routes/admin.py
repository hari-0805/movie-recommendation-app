from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.db import get_db
from app.models.user import User
from app.models.review import Review
from app.models.favorite import Favorite
from app.models.search_history import SearchHistory
from app.models.watchlist import Watchlist
from app.services.auth import get_admin_user

router = APIRouter(prefix="/admin", tags=["Admin"], redirect_slashes=False)



@router.get("/stats")
def get_stats(
    db:         Session = Depends(get_db),
    admin_user: User    = Depends(get_admin_user),
):
    """Platform-wide statistics for the admin dashboard."""
    total_users   = db.query(func.count(User.id)).scalar()
    total_reviews = db.query(func.count(Review.id)).scalar()
    total_favs    = db.query(func.count(Favorite.id)).scalar()
    total_wl      = db.query(func.count(Watchlist.id)).scalar()

    most_searched = (
        db.query(SearchHistory.keyword, func.count(SearchHistory.keyword).label("cnt"))
        .group_by(SearchHistory.keyword)
        .order_by(func.count(SearchHistory.keyword).desc())
        .first()
    )


    from datetime import datetime, timezone
    now   = datetime.now(timezone.utc)
    month = datetime(now.year, now.month, 1, tzinfo=timezone.utc)

  
    recent_reviews = (
        db.query(func.date(Review.created_at).label("date"), func.count(Review.id).label("count"))
        .filter(Review.created_at != None)
        .group_by(func.date(Review.created_at))
        .order_by(func.date(Review.created_at).desc())
        .limit(7)
        .all()
    )

    return {
        "total_users":    total_users,
        "total_reviews":  total_reviews,
        "total_favorites": total_favs,
        "total_watchlist": total_wl,
        "most_searched":  most_searched.keyword if most_searched else "N/A",
        "most_searched_count": most_searched.cnt if most_searched else 0,
        "recent_reviews": [{"date": str(r.date), "count": r.count} for r in recent_reviews],
    }



@router.get("/users")
def get_users(
    db:         Session = Depends(get_db),
    admin_user: User    = Depends(get_admin_user),
):
    """List all users with their activity counts."""
    users = db.query(User).order_by(User.id).all()
    result = []
    for u in users:
        fav_count    = db.query(func.count(Favorite.id)).filter(Favorite.user_id == u.id).scalar()
        review_count = db.query(func.count(Review.id)).filter(Review.user_id == u.id).scalar()
        search_count = db.query(func.count(SearchHistory.id)).filter(SearchHistory.user_id == u.id).scalar()
        result.append({
            "id":           u.id,
            "username":     u.username,
            "email":        u.email,
            "is_admin":     u.is_admin,
            "favorites":    fav_count,
            "reviews":      review_count,
            "searches":     search_count,
        })
    return {"users": result, "total": len(result)}


@router.delete("/users/{user_id}", status_code=200)
def delete_user(
    user_id:    int,
    db:         Session = Depends(get_db),
    admin_user: User    = Depends(get_admin_user),
):
    """Delete a user and all their data (cascade)."""
    if user_id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "Cannot delete your own admin account"},
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail={"success": False, "message": "User not found"})
    db.delete(user)
    db.commit()
    return {"success": True, "message": f"User {user.username} deleted"}


@router.patch("/users/{user_id}/toggle-admin", status_code=200)
def toggle_admin(
    user_id:    int,
    db:         Session = Depends(get_db),
    admin_user: User    = Depends(get_admin_user),
):
    """Grant or revoke admin role for a user."""
    if user_id == admin_user.id:
        raise HTTPException(400, detail={"success": False, "message": "Cannot change your own role"})
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, detail={"success": False, "message": "User not found"})
    user.is_admin = not user.is_admin
    db.commit()
    return {"success": True, "is_admin": user.is_admin, "username": user.username}



@router.get("/reviews")
def get_all_reviews(
    db:         Session = Depends(get_db),
    admin_user: User    = Depends(get_admin_user),
):
    """List all reviews across all users for moderation."""
    reviews = db.query(Review).order_by(Review.created_at.desc()).limit(100).all()
    result  = []
    for r in reviews:
        user = db.query(User).filter(User.id == r.user_id).first()
        result.append({
            "id":         r.id,
            "imdb_id":    r.imdb_id,
            "rating":     r.rating,
            "review":     r.review,
            "username":   user.username if user else "Deleted",
            "user_id":    r.user_id,
            "created_at": str(r.created_at),
        })
    return {"reviews": result, "total": len(result)}


@router.delete("/reviews/{review_id}", status_code=200)
def delete_review(
    review_id:  int,
    db:         Session = Depends(get_db),
    admin_user: User    = Depends(get_admin_user),
):
    """Delete any review as admin (moderation)."""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(404, detail={"success": False, "message": "Review not found"})
    db.delete(review)
    db.commit()
    return {"success": True, "message": "Review deleted"}
