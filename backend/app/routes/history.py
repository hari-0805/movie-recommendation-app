from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.db import get_db
from app.models.search_history import SearchHistory
from app.models.user import User
from app.schemas.search_history import SearchHistoryResponse, TrendingResponse
from app.services.auth import get_current_user
from typing import List

router = APIRouter(prefix="/history", tags=["Search History"], redirect_slashes=False)

@router.get("", response_model=List[SearchHistoryResponse])
def get_history(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    history = (
        db.query(SearchHistory)
        .filter(SearchHistory.user_id == current_user.id)
        .order_by(SearchHistory.searched_at.desc())
        .limit(limit)
        .all()
    )
    return history

@router.get("/trending", response_model=List[TrendingResponse])
def get_trending(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trending = (
        db.query(
            SearchHistory.keyword,
            func.count(SearchHistory.keyword).label("count")
        )
        .group_by(SearchHistory.keyword)
        .order_by(func.count(SearchHistory.keyword).desc())
        .limit(limit)
        .all()
    )
    return [{"keyword": t[0], "count": t[1]} for t in trending]
