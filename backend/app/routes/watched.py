from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models.watched_history import WatchedHistory
from app.models.watchlist import Watchlist
from app.models.user import User
from app.schemas.watched_history import (
    WatchedCreate, WatchedItem, WatchedResponse,
    WatchedAddResponse, WatchedStatusResponse,
)
from app.services.auth import get_current_user

router = APIRouter(prefix="/watched", tags=["Watched History"], redirect_slashes=False)


@router.post("", response_model=WatchedAddResponse, status_code=201)
def mark_as_watched(
    data: WatchedCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Prevent duplicates
    existing = db.query(WatchedHistory).filter(
        WatchedHistory.user_id  == current_user.id,
        WatchedHistory.movie_id == data.movie_id,
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "Movie already in watched history"},
        )

    # Auto-remove from watchlist if present
    watchlist_item = db.query(Watchlist).filter(
        Watchlist.user_id  == current_user.id,
        Watchlist.movie_id == data.movie_id,
    ).first()
    if watchlist_item:
        db.delete(watchlist_item)

    item = WatchedHistory(
        user_id     = current_user.id,
        movie_id    = data.movie_id,
        title       = data.title,
        year        = data.year,
        poster      = data.poster,
        genre       = data.genre,
        imdb_rating = data.imdb_rating,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    return WatchedAddResponse(
        success=True,
        message=f'"{data.title}" marked as watched',
        data=WatchedItem.model_validate(item),
    )


@router.get("", response_model=WatchedResponse)
def get_watched_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = (
        db.query(WatchedHistory)
        .filter(WatchedHistory.user_id == current_user.id)
        .order_by(WatchedHistory.watched_at.desc())
        .all()
    )
    return WatchedResponse(success=True, data=items)


@router.get("/status/{movie_id}", response_model=WatchedStatusResponse)
def get_watched_status(
    movie_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(WatchedHistory).filter(
        WatchedHistory.user_id  == current_user.id,
        WatchedHistory.movie_id == movie_id,
    ).first()
    return WatchedStatusResponse(
        watched    = item is not None,
        watched_at = item.watched_at if item else None,
    )


@router.delete("/{movie_id}", status_code=200)
def remove_from_watched(
    movie_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(WatchedHistory).filter(
        WatchedHistory.movie_id == movie_id,
        WatchedHistory.user_id  == current_user.id,
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "message": "Watched record not found"},
        )

    db.delete(item)
    db.commit()
    return {"success": True, "message": "Removed from watched history"}
