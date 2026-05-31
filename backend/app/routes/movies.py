from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from app.services.omdb import search_movies, get_movie_by_id
from app.services.auth import get_current_user
from app.models.search_history import SearchHistory
from app.models.user import User
from app.database.db import get_db

router = APIRouter(prefix="/movies", tags=["Movies"])

@router.get("/search")
async def search(
    title: str = Query(..., description="Movie title to search"),
    page:  int = Query(1,   description="Page number"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not title.strip():
        raise HTTPException(status_code=400, detail="Title cannot be empty")

    results, total = await search_movies(title, page)

    if results is None:
        raise HTTPException(status_code=404, detail=total)

    history = SearchHistory(
        user_id=current_user.id,
        keyword=title.strip().lower()
    )
    db.add(history)
    db.commit()

    return {
        "results": results,
        "total":   total,
        "page":    page
    }

@router.get("/{imdb_id}")
async def get_movie(imdb_id: str):
    movie = await get_movie_by_id(imdb_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return movie
