from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database.db import get_db
from app.models.user import User
from app.models.collection import Collection, CollectionMovie
from app.schemas.collection import (
    CollectionCreate, CollectionUpdate,
    CollectionResponse, CollectionListItem, CollectionMovieItem,
)
from app.services.auth import get_current_user
from typing import List, Optional

router = APIRouter(prefix="/collections", tags=["Collections"], redirect_slashes=False)


def _build_response(col: Collection, include_owner: bool = False) -> dict:
    movies = col.movies or []
    result = {
        "id":              col.id,
        "name":            col.name,
        "description":     col.description or "",
        "emoji":           col.emoji or "🎬",
        "is_public":       col.is_public or False,
        "movie_count":     len(movies),
        "created_at":      col.created_at,
        "updated_at":      col.updated_at,
        "preview_posters": [m.poster for m in movies if m.poster][:4],
        "movies": [
            {
                "movie_id": m.movie_id,
                "title":    m.title or "",
                "year":     m.year  or "",
                "poster":   m.poster or "",
                "genre":    m.genre  or "",
            }
            for m in sorted(movies, key=lambda x: x.added_at or "", reverse=True)
        ],
    }
    if include_owner and col.user:
        result["owner_username"] = col.user.username
    return result


# ── Public routes (no auth needed for reading) ─────────────────────────────────

@router.get("/public")
def get_public_collections(
    db: Session = Depends(get_db),
):
    cols = (
        db.query(Collection)
        .filter(Collection.is_public == True)
        .order_by(Collection.created_at.desc())
        .all()
    )
    return {"success": True, "data": [_build_response(c, include_owner=True) for c in cols]}


@router.get("/search")
def search_collections(
    query: str = Query("", min_length=1),
    db:    Session = Depends(get_db),
):
    q = f"%{query.strip()}%"
    cols = (
        db.query(Collection)
        .join(Collection.user)
        .filter(
            Collection.is_public == True,
            or_(
                Collection.name.ilike(q),
                User.username.ilike(q),
            )
        )
        .order_by(Collection.created_at.desc())
        .all()
    )
    return {"success": True, "data": [_build_response(c, include_owner=True) for c in cols]}


# ── Authenticated CRUD ──────────────────────────────────────────────────────────

@router.get("")
def get_collections(
    db:           Session = Depends(get_db),
):
    cols = (
        db.query(Collection)
        .filter(Collection.user_id == current_user.id)
        .order_by(Collection.created_at.desc())
        .all()
    )
    return {"success": True, "data": [_build_response(c) for c in cols]}


@router.post("", status_code=201)
def create_collection(
    data:         CollectionCreate,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    existing = db.query(Collection).filter(
        Collection.user_id == current_user.id,
        Collection.name    == data.name.strip(),
    ).first()
    if existing:
        raise HTTPException(400, detail={"success": False, "message": "A collection with this name already exists"})

    col = Collection(
        user_id     = current_user.id,
        name        = data.name.strip(),
        description = data.description.strip(),
        emoji       = data.emoji or "🎬",
        is_public   = data.is_public,
    )
    db.add(col)
    db.commit()
    db.refresh(col)
    return {"success": True, "data": _build_response(col)}


@router.get("/{collection_id}")
def get_collection(
    collection_id: int,
    db:            Session = Depends(get_db),
    current_user:  User    = Depends(get_current_user),
):
    col = db.query(Collection).filter(Collection.id == collection_id).first()
    if not col:
        raise HTTPException(404, detail={"success": False, "message": "Collection not found"})
    # Allow viewing own collections or public ones
    if col.user_id != current_user.id and not col.is_public:
        raise HTTPException(403, detail={"success": False, "message": "Access denied"})
    return {"success": True, "data": _build_response(col, include_owner=True)}


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
    if data.is_public is not None:
        col.is_public = data.is_public

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
    name = col.name
    db.delete(col)
    db.commit()
    return {"success": True, "message": f'"{name}" deleted'}


# ── Collection Movies ───────────────────────────────────────────────────────────

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
        collection_id = collection_id,
        movie_id = data.movie_id,
        title    = data.title,
        year     = data.year,
        poster   = data.poster,
        genre    = data.genre,
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
