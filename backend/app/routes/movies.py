from fastapi import APIRouter, HTTPException, Query, Depends, status
from sqlalchemy.orm import Session
from app.services.omdb import search_movies, get_movie_by_id
from app.services.auth import get_current_user
from app.models.search_history import SearchHistory
from app.models.user import User
from app.database.db import get_db

router = APIRouter(prefix="/movies", tags=["Movies"])


@router.get("/search")
async def search(
    title: str = Query(..., min_length=1, description="Movie title to search"),
    page:  int = Query(1,  ge=1,          description="Page number (1-based)"),
    db:    Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search for movies by title via OMDB and log the keyword to search history."""
    cleaned = title.strip()
    if not cleaned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "Invalid request"},
        )

    results, total = await search_movies(cleaned, page)

    if results is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=total)

    last = (
        db.query(SearchHistory)
        .filter(SearchHistory.user_id == current_user.id)
        .order_by(SearchHistory.searched_at.desc())
        .first()
    )
    if last is None or last.keyword != cleaned.lower():
        db.add(SearchHistory(user_id=current_user.id, keyword=cleaned.lower()))
        db.commit()

    return {
        "results": results,
        "total":   total,
        "page":    page,
    }


@router.get("/{imdb_id}")
async def get_movie(imdb_id: str):
    """Fetch full movie details from OMDB by IMDb ID."""
    movie = await get_movie_by_id(imdb_id)
    if not movie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "message": "Movie not found"},
        )
    return movie
