# app/routes/movies.py
# GET /movies/search?title=batman  — search movies
# GET /movies/{imdb_id}            — get movie details

from fastapi import APIRouter, HTTPException, Query
from app.services.omdb import search_movies, get_movie_by_id

router = APIRouter(prefix="/movies", tags=["Movies"])


# Search movies by title
@router.get("/search")
async def search(
    title: str = Query(..., description="Movie title to search"),
    page:  int = Query(1,   description="Page number")
):
    if not title.strip():
        raise HTTPException(status_code=400, detail="Title cannot be empty")

    results, total = await search_movies(title, page)

    # results is None when OMDb returns an error
    if results is None:
        raise HTTPException(status_code=404, detail=total)  # total has the error message here

    return {
        "results": results,
        "total":   total,
        "page":    page
    }


# Get full details of a movie by IMDb ID
@router.get("/{imdb_id}")
async def get_movie(imdb_id: str):
    movie = await get_movie_by_id(imdb_id)

    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    return movie
