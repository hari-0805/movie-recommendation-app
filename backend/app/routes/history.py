from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.db import get_db
from app.models.search_history import SearchHistory
from app.models.user import User
from app.schemas.search_history import (
    SearchHistoryListResponse,
    SearchHistoryResponse,
    TrendingResponse,
)
from app.services.auth import get_current_user
from typing import List

router = APIRouter(prefix="/history", tags=["Search History"], redirect_slashes=False)


@router.get("", response_model=SearchHistoryListResponse)
def get_history(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """
    Return the latest 10 movie searches for the authenticated user.
    Results are in descending order by search timestamp.
    Returns an empty list (not an error) when no history exists.
    """
    history = (
        db.query(SearchHistory)
        .filter(SearchHistory.user_id == current_user.id)
        .order_by(SearchHistory.searched_at.desc())
        .limit(10)
        .all()
    )

    return SearchHistoryListResponse(
        success=True,
        data=[
            SearchHistoryResponse(keyword=h.keyword, searched_at=h.searched_at)
            for h in history
        ],
    )


@router.get("/trending", response_model=List[TrendingResponse])
def get_trending(
    limit: int    = Query(10, ge=1, le=50, description="Max trending results"),
    db:    Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Global trending searches across all users, ordered by frequency."""
    trending = (
        db.query(
            SearchHistory.keyword,
            func.count(SearchHistory.keyword).label("count"),
        )
        .group_by(SearchHistory.keyword)
        .order_by(func.count(SearchHistory.keyword).desc())
        .limit(limit)
        .all()
    )
    return [{"keyword": t[0], "count": t[1]} for t in trending]
