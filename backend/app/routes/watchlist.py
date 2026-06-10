from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models.watchlist import Watchlist
from app.models.user import User
from app.schemas.watchlist import WatchlistCreate, WatchlistItem, WatchlistResponse, WatchlistAddResponse
from app.services.auth import get_current_user

router = APIRouter(prefix="/watchlist", tags=["Watchlist"], redirect_slashes=False)


@router.post("", response_model=WatchlistAddResponse, status_code=201)
def add_to_watchlist(
    data: WatchlistCreate,
    db:   Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Prevent duplicates
    existing = db.query(Watchlist).filter(
        Watchlist.user_id  == current_user.id,
        Watchlist.movie_id == data.movie_id,
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "Movie already in watchlist"},
        )

    item = Watchlist(
        user_id  = current_user.id,
        movie_id = data.movie_id,
        title    = data.title,
        year     = data.year,
        poster   = data.poster,
        genre    = data.genre,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    return WatchlistAddResponse(
        success=True,
        message=f"{data.title} added to your watchlist",
        data=WatchlistItem.model_validate(item),
    )


@router.get("", response_model=WatchlistResponse)
def get_watchlist(
    db:   Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = (
        db.query(Watchlist)
        .filter(Watchlist.user_id == current_user.id)
        .order_by(Watchlist.created_at.desc())
        .all()
    )
    return WatchlistResponse(success=True, data=items)


@router.delete("/{movie_id}", status_code=200)
def remove_from_watchlist(
    movie_id: int,
    db:   Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(Watchlist).filter(
        Watchlist.id      == movie_id,
        Watchlist.user_id == current_user.id,
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "message": "Watchlist item not found"},
        )

    db.delete(item)
    db.commit()
    return {"success": True, "message": "Removed from watchlist"}
