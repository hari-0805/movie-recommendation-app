from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models.favorite import Favorite
from app.models.user import User
from app.schemas.favorite import FavoriteCreate, FavoriteResponse
from app.services.auth import get_current_user
from app.services.recommendation import invalidate_cache
from typing import List

router = APIRouter(prefix="/favorites", tags=["Favorites"], redirect_slashes=False)


@router.post("", response_model=FavoriteResponse, status_code=201)
def add_favorite(
    data: FavoriteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.imdb_id == data.imdb_id,
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Movie already in favorites")

    favorite = Favorite(
        user_id=current_user.id,
        imdb_id=data.imdb_id,
        title=data.title,
        year=data.year,
        poster=data.poster,
        imdb_rating=data.imdb_rating,
    )
    db.add(favorite)
    db.commit()
    db.refresh(favorite)

    invalidate_cache(current_user.id)  # fresh recs next load
    return favorite


@router.get("", response_model=List[FavoriteResponse])
def get_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Favorite).filter(Favorite.user_id == current_user.id).all()


@router.delete("/{movie_id}", status_code=204)
def delete_favorite(
    movie_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    favorite = db.query(Favorite).filter(
        Favorite.id == movie_id,
        Favorite.user_id == current_user.id,
    ).first()

    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")

    db.delete(favorite)
    db.commit()

    invalidate_cache(current_user.id)  # fresh recs next load
