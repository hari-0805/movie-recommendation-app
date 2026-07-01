from fastapi import APIRouter, HTTPException, Query, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.services.omdb import search_movies, get_movie_by_id
from app.services.auth import get_current_user
from app.models.search_history import SearchHistory
from app.models.review import Review
from app.models.user import User
from app.database.db import get_db
from app.services.recommendation import invalidate_cache

router = APIRouter(prefix="/movies", tags=["Movies"])


@router.get("/search")
async def search(
    title: str = Query(..., min_length=1, description="Movie title to search"),
    page:  int = Query(1,  ge=1,          description="Page number (1-based)"),
    db:    Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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
    is_new_keyword = last is None or last.keyword != cleaned.lower()

    if is_new_keyword:
        db.add(SearchHistory(user_id=current_user.id, keyword=cleaned.lower()))
        db.commit()
   
        invalidate_cache(current_user.id)

    return {"results": results, "total": total, "page": page}


def _review_stats(db: Session, imdb_id: str) -> dict:
    result = (
        db.query(
            func.avg(Review.rating).label("average"),
            func.count(Review.id).label("total"),
        )
        .filter(Review.imdb_id == imdb_id)
        .first()
    )
    return {
        "average_rating": round(float(result.average or 0), 1),
        "total_reviews": result.total or 0,
    }


@router.get("/compare")
async def compare_movies(
    movie1: str = Query(..., description="IMDb ID of the first movie"),
    movie2: str = Query(..., description="IMDb ID of the second movie"),
    movie3: str | None = Query(None, description="IMDb ID of an optional third movie"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    movie_ids = [movie1, movie2] + ([movie3] if movie3 else [])

    if len(set(movie_ids)) != len(movie_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "Please select different movies to compare"},
        )

    movies = []
    for imdb_id in movie_ids:
        movie_data = await get_movie_by_id(imdb_id)
        if not movie_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": f"Movie '{imdb_id}' not found"},
            )
        movies.append({**movie_data, **_review_stats(db, imdb_id)})

    response = {"movie1": movies[0], "movie2": movies[1]}
    if len(movies) == 3:
        response["movie3"] = movies[2]

    return response


@router.get("/{imdb_id}")
async def get_movie(imdb_id: str):
    movie = await get_movie_by_id(imdb_id)
    if not movie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "message": "Movie not found"},
        )
    return movie