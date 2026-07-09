from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timezone, timedelta
from app.database.db import get_db
from app.models.favorite import Favorite
from app.models.watchlist import Watchlist
from app.models.watched_history import WatchedHistory
from app.models.review import Review
from app.models.collection import Collection
from app.models.search_history import SearchHistory
from app.models.user import User
from app.services.auth import get_current_user
from typing import List
from pydantic import BaseModel

router = APIRouter(prefix="/dashboard", tags=["Dashboard"], redirect_slashes=False)

MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]


# ── GET /dashboard — full stats ──────────────────────────────────────────────
@router.get("")
def get_dashboard(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    uid = current_user.id
    return {
        "watched_count":     db.query(func.count(WatchedHistory.id)).filter(WatchedHistory.user_id == uid).scalar() or 0,
        "favorites_count":   db.query(func.count(Favorite.id)).filter(Favorite.user_id == uid).scalar() or 0,
        "watchlist_count":   db.query(func.count(Watchlist.id)).filter(Watchlist.user_id == uid).scalar() or 0,
        "reviews_count":     db.query(func.count(Review.id)).filter(Review.user_id == uid).scalar() or 0,
        "collections_count": db.query(func.count(Collection.id)).filter(Collection.user_id == uid).scalar() or 0,
        "total_searches":    db.query(func.count(SearchHistory.id)).filter(SearchHistory.user_id == uid).scalar() or 0,
    }


# ── GET /dashboard/genres — top 5 genres from watched ───────────────────────
@router.get("/genres")
def get_top_genres(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    rows = (
        db.query(WatchedHistory.genre)
        .filter(WatchedHistory.user_id == current_user.id, WatchedHistory.genre != "")
        .all()
    )
    counts: dict[str, int] = {}
    for (genre_str,) in rows:
        for g in (genre_str or "").split(","):
            g = g.strip()
            if g:
                counts[g] = counts.get(g, 0) + 1

    top5 = sorted(counts.items(), key=lambda x: x[1], reverse=True)[:5]
    return [{"genre": g, "count": c} for g, c in top5]


# ── GET /dashboard/monthly — watched per month, last 6 months ────────────────
@router.get("/monthly")
def get_monthly(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    now   = datetime.now(timezone.utc)
    months = []
    for i in range(5, -1, -1):
        d = now - timedelta(days=30 * i)
        months.append((d.year, d.month, MONTH_NAMES[d.month - 1]))

    result = []
    for year, month, label in months:
        count = (
            db.query(func.count(WatchedHistory.id))
            .filter(
                WatchedHistory.user_id == current_user.id,
                extract("year",  WatchedHistory.watched_at) == year,
                extract("month", WatchedHistory.watched_at) == month,
            )
            .scalar() or 0
        )
        result.append({"month": label, "count": count})
    return result


# ── GET /dashboard/recent — last 5 watched, favorites, reviews ───────────────
@router.get("/recent")
def get_recent(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    uid = current_user.id

    watched = (
        db.query(WatchedHistory)
        .filter(WatchedHistory.user_id == uid)
        .order_by(WatchedHistory.watched_at.desc())
        .limit(5).all()
    )

    favorites = (
        db.query(Favorite)
        .filter(Favorite.user_id == uid)
        .order_by(Favorite.id.desc())
        .limit(5).all()
    )

    reviews = (
        db.query(Review)
        .filter(Review.user_id == uid)
        .order_by(Review.created_at.desc())
        .limit(5).all()
    )

    # Fetch movie titles for reviews from omdb or just use imdb_id
    return {
        "recent_watched": [
            {"title": w.title, "poster": w.poster, "watched_date": w.watched_at.isoformat(), "movie_id": w.movie_id}
            for w in watched
        ],
        "recent_favorites": [
            {"title": f.title, "poster": f.poster, "movie_id": f.imdb_id}
            for f in favorites
        ],
        "recent_reviews": [
            {"movie_title": r.imdb_id, "rating": r.rating, "created_at": r.created_at.isoformat(), "review": r.review[:80]}
            for r in reviews
        ],
    }