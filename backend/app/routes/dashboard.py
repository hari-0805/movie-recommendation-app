from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models.favorite import Favorite
from app.models.search_history import SearchHistory
from app.models.user import User
from app.schemas.dashboard import DashboardResponse
from app.services.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"], redirect_slashes=False)


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """
    Return dashboard statistics for the authenticated user:
    - total_favorites : total saved favourites
    - total_searches  : total searches ever performed
    - recent_searches : last 3 distinct search keywords
    """
    total_favorites = (
        db.query(Favorite)
        .filter(Favorite.user_id == current_user.id)
        .count()
    )

    total_searches = (
        db.query(SearchHistory)
        .filter(SearchHistory.user_id == current_user.id)
        .count()
    )

    recent_rows = (
        db.query(SearchHistory.keyword)
        .filter(SearchHistory.user_id == current_user.id)
        .order_by(SearchHistory.searched_at.desc())
        .limit(3)
        .all()
    )
    recent_searches = [row.keyword for row in recent_rows]

    return DashboardResponse(
        total_favorites=total_favorites,
        total_searches=total_searches,
        recent_searches=recent_searches,
    )
