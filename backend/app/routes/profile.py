from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.db import get_db
from app.models.user import User
from app.models.favorite import Favorite
from app.models.watchlist import Watchlist
from app.models.review import Review
from app.models.watched_history import WatchedHistory
from app.models.user_preference import UserPreference
from app.schemas.profile import ProfileResponse, ProfileUpdate, PasswordChange
from app.services.auth import get_current_user, hash_password, verify_password
from pydantic import BaseModel
from typing import List
from datetime import datetime

router = APIRouter(prefix="/profile", tags=["Profile"], redirect_slashes=False)


# ── Schemas ────────────────────────────────────────────────────────────────────
class StatsResponse(BaseModel):
    watched_count:   int
    favorites_count: int
    watchlist_count: int
    reviews_count:   int


class PreferenceOut(BaseModel):
    id:    int
    genre: str
    score: float
    class Config:
        from_attributes = True


class PreferenceCreate(BaseModel):
    genre: str


# ── Profile endpoints ──────────────────────────────────────────────────────────
@router.get("", response_model=ProfileResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("", response_model=ProfileResponse)
def update_profile(
    data:         ProfileUpdate,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    if data.username and data.username.strip() != current_user.username:
        conflict = db.query(User).filter(
            User.username == data.username.strip(),
            User.id != current_user.id
        ).first()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "message": "Username already taken"},
            )
        current_user.username = data.username.strip()

    if data.email and data.email.strip() != current_user.email:
        conflict = db.query(User).filter(
            User.email == data.email.strip(),
            User.id != current_user.id
        ).first()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "message": "Email already in use"},
            )
        current_user.email = data.email.strip()

    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/password", status_code=200)
def change_password(
    data:         PasswordChange,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    if not verify_password(data.current_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "Current password is incorrect"},
        )
    if data.new_password != data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "New passwords do not match"},
        )
    if data.new_password == data.current_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "New password must differ from current password"},
        )
    if len(data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "Password must be at least 6 characters"},
        )
    current_user.password = hash_password(data.new_password)
    db.commit()
    return {"success": True, "message": "Password changed successfully"}


# ── Stats ──────────────────────────────────────────────────────────────────────
@router.get("/stats", response_model=StatsResponse)
def get_profile_stats(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    uid = current_user.id
    return StatsResponse(
        watched_count   = db.query(func.count(WatchedHistory.id)).filter(WatchedHistory.user_id == uid).scalar() or 0,
        favorites_count = db.query(func.count(Favorite.id)).filter(Favorite.user_id == uid).scalar() or 0,
        watchlist_count = db.query(func.count(Watchlist.id)).filter(Watchlist.user_id == uid).scalar() or 0,
        reviews_count   = db.query(func.count(Review.id)).filter(Review.user_id == uid).scalar() or 0,
    )


# ── Genre Preferences ──────────────────────────────────────────────────────────
@router.get("/preferences", response_model=List[PreferenceOut])
def get_preferences(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    return db.query(UserPreference).filter(UserPreference.user_id == current_user.id).all()


@router.post("/preferences", response_model=PreferenceOut, status_code=201)
def add_preference(
    data:         PreferenceCreate,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    genre = data.genre.strip().title()
    if not genre:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Genre cannot be empty"})

    existing = db.query(UserPreference).filter(
        UserPreference.user_id == current_user.id,
        UserPreference.genre   == genre,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail={"success": False, "message": f'"{genre}" is already in your preferences'})

    pref = UserPreference(user_id=current_user.id, genre=genre, score=1.0)
    db.add(pref)
    db.commit()
    db.refresh(pref)
    return pref


@router.delete("/preferences/{pref_id}", status_code=200)
def delete_preference(
    pref_id:      int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    pref = db.query(UserPreference).filter(
        UserPreference.id      == pref_id,
        UserPreference.user_id == current_user.id,
    ).first()
    if not pref:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Preference not found"})
    db.delete(pref)
    db.commit()
    return {"success": True, "message": f'"{pref.genre}" removed from preferences'}