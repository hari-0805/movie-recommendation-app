from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models.user import User
from app.services.auth import get_current_user
from app.models.collection import Collection, CollectionMovie
from app.schemas.collection import (
    CollectionCreate, CollectionUpdate,
    CollectionResponse, CollectionListItem, CollectionMovieItem
)
from typing import List

router = APIRouter(prefix="/collections", tags=["Collections"], redirect_slashes=False)


def _build_response(col: Collection) -> dict:
    movies = col.movies or []
    return {
        "id":          col.id,
        "name":        col.name,
        "description": col.description or "",
        "emoji":       col.emoji or "🎬",
        "movie_count": len(movies),
        "created_at":  col.created_at,
        "updated_at":  col.updated_at,
        "movies":      [
            {
                "movie_id": m.movie_id,
                "title":    m.title or "",
                "year":     m.year  or "",
                "poster":   m.poster or "",
                "genre":    m.genre  or "",
            }
            for m in sorted(movies, key=lambda x: x.added_at or "", reverse=True)
        ],
        "preview_posters": [
            m.poster for m in movies if m.poster
        ][:4],
    }


#CRUD 

@router.post("", status_code=201)
def create_collection(
    data:         CollectionCreate,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    # Prevent duplicate name per user
    existing = db.query(Collection).filter(
        Collection.user_id == current_user.id,
        Collection.name    == data.name.strip(),
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "message": "A collection with this name already exists"},
        )

    col = Collection(
        user_id=current_user.id,
        name=data.name.strip(),
        description=data.description.strip(),
        emoji=data.emoji or "🎬",
    )
    db.add(col)
    db.commit()
    db.refresh(col)
    return {"success": True, "data": _build_response(col)}


@router.get("")
def get_collections(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    cols = (
        db.query(Collection)
        .filter(Collection.user_id == current_user.id)
        .order_by(Collection.created_at.desc())
        .all()
    )
    return {"success": True, "data": [_build_response(c) for c in cols]}


@router.get("/{collection_id}")
def get_collection(
    collection_id: int,
    db:            Session = Depends(get_db),
    current_user:  User    = Depends(get_current_user),
):
    col = db.query(Collection).filter(
        Collection.id      == collection_id,
        Collection.user_id == current_user.id,
    ).first()
    if not col:
        raise HTTPException(404, detail={"success": False, "message": "Collection not found"})
    return {"success": True, "data": _build_response(col)}


@router.put("/{collection_id}")
def update_collection(
    collection_id: int,
    data:          CollectionUpdate,
    db:            Session = Depends(get_db),
    current_user:  User    = Depends(get_current_user),
):
    col = db.query(Collection).filter(
        Collection.id      == collection_id,
        Collection.user_id == current_user.id,
    ).first()
    if not col:
        raise HTTPException(404, detail={"success": False, "message": "Collection not found"})

    if data.name is not None:
        # Check name uniqueness excluding self
        conflict = db.query(Collection).filter(
            Collection.user_id == current_user.id,
            Collection.name    == data.name.strip(),
            Collection.id      != collection_id,
        ).first()
        if conflict:
            raise HTTPException(400, detail={"success": False, "message": "Name already used"})
        col.name = data.name.strip()

    if data.description is not None:
        col.description = data.description.strip()
    if data.emoji is not None:
        col.emoji = data.emoji

    db.commit()
    db.refresh(col)
    return {"success": True, "data": _build_response(col)}


@router.delete("/{collection_id}", status_code=200)
def delete_collection(
    collection_id: int,
    db:            Session = Depends(get_db),
    current_user:  User    = Depends(get_current_user),
):
    col = db.query(Collection).filter(
        Collection.id      == collection_id,
        Collection.user_id == current_user.id,
    ).first()
    if not col:
        raise HTTPException(404, detail={"success": False, "message": "Collection not found"})
    db.delete(col)
    db.commit()
    return {"success": True, "message": f'"{col.name}" deleted'}


# Movie management 

@router.post("/{collection_id}/movies", status_code=201)
def add_movie(
    collection_id: int,
    data:          CollectionMovieItem,
    db:            Session = Depends(get_db),
    current_user:  User    = Depends(get_current_user),
):
    col = db.query(Collection).filter(
        Collection.id      == collection_id,
        Collection.user_id == current_user.id,
    ).first()
    if not col:
        raise HTTPException(404, detail={"success": False, "message": "Collection not found"})

    existing = db.query(CollectionMovie).filter(
        CollectionMovie.collection_id == collection_id,
        CollectionMovie.movie_id      == data.movie_id,
    ).first()
    if existing:
        raise HTTPException(400, detail={"success": False, "message": "Movie already in this collection"})

    movie = CollectionMovie(
        collection_id=collection_id,
        movie_id=data.movie_id,
        title=data.title,
        year=data.year,
        poster=data.poster,
        genre=data.genre,
    )
    db.add(movie)
    db.commit()
    db.refresh(col)
    return {"success": True, "message": f'"{data.title}" added', "data": _build_response(col)}


@router.delete("/{collection_id}/movies/{movie_id}", status_code=200)
def remove_movie(
    collection_id: int,
    movie_id:      str,
    db:            Session = Depends(get_db),
    current_user:  User    = Depends(get_current_user),
):
    col = db.query(Collection).filter(
        Collection.id      == collection_id,
        Collection.user_id == current_user.id,
    ).first()
    if not col:
        raise HTTPException(404, detail={"success": False, "message": "Collection not found"})

    movie = db.query(CollectionMovie).filter(
        CollectionMovie.collection_id == collection_id,
        CollectionMovie.movie_id      == movie_id,
    ).first()
    if not movie:
        raise HTTPException(404, detail={"success": False, "message": "Movie not in collection"})

    db.delete(movie)
    db.commit()
    db.refresh(col)
    return {"success": True, "data": _build_response(col)}
