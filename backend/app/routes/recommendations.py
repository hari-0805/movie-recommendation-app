from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models.user import User
from app.models.viewed_movie import ViewedMovie
from app.schemas.recommendation import RecommendationResponse, RecommendedMovie
from app.services.auth import get_current_user
from app.services.recommendation import (
    get_recommendations,
    get_trending_recommendations,
    get_genre_analytics,
    invalidate_cache,
)
from datetime import datetime, timezone
from typing import List

router = APIRouter(prefix="/recommendations", tags=["Recommendations"], redirect_slashes=False)


@router.get("", response_model=RecommendationResponse)
async def recommendations(
    limit:   int  = Query(10, ge=1, le=20),
    refresh: bool = Query(False, description="Force bypass cache"),
    db:      Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Personalised recommendations based on favorites, viewed, search history."""
    movies = await get_recommendations(current_user.id, db, limit=limit, force_refresh=refresh)
    return RecommendationResponse(
        recommended_movies=[RecommendedMovie(**m) for m in movies]
    )


@router.get("/trending", response_model=RecommendationResponse)
async def trending_recommendations(
    limit: int     = Query(10, ge=1, le=20),
    db:    Session = Depends(get_db),
    current_user:  User = Depends(get_current_user),
):
    """Trending movies based on what all users are searching."""
    movies = await get_trending_recommendations(db, limit=limit)
    return RecommendationResponse(
        recommended_movies=[RecommendedMovie(**m) for m in movies]
    )


@router.get("/genres")
def genre_analytics(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """User's genre preference breakdown with scores and percentages."""
    return {"genres": get_genre_analytics(current_user.id, db)}


@router.post("/viewed/{imdb_id}", status_code=201)
async def mark_viewed(
    imdb_id: str,
    title:   str = Query(...),
    genre:   str = Query(""),
    year:    str = Query(""),
    poster:  str = Query(""),
    db:      Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record that the user opened a movie's detail page."""
    existing = (
        db.query(ViewedMovie)
        .filter(ViewedMovie.user_id == current_user.id, ViewedMovie.imdb_id == imdb_id)
        .first()
    )
    if existing:
        existing.viewed_at = datetime.now(timezone.utc)
        existing.genre     = genre or existing.genre
    else:
        db.add(ViewedMovie(
            user_id=current_user.id,
            imdb_id=imdb_id,
            title=title,
            genre=genre,
            year=year,
            poster=poster,
        ))
    db.commit()
    invalidate_cache(current_user.id)
    return {"success": True, "message": "Viewed recorded"}
