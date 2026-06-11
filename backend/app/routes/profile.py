from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models.user import User
from app.schemas.profile import ProfileResponse, ProfileUpdate, PasswordChange
from app.services.auth import get_current_user, hash_password, verify_password

router = APIRouter(prefix="/profile", tags=["Profile"], redirect_slashes=False)


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
