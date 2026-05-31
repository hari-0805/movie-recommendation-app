from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database.db import get_db
from app.models.review import Review
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewUpdate, ReviewResponse, AverageRatingResponse
from app.services.auth import get_current_user

router = APIRouter(prefix="/reviews", tags=["Reviews"], redirect_slashes=False)

@router.post("", response_model=ReviewResponse, status_code=201)
def add_review(
    data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
   
    existing = db.query(Review).filter(
        Review.user_id == current_user.id,
        Review.imdb_id == data.imdb_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reviewed this movie. Edit your existing review."
        )

    review = Review(
        user_id=current_user.id,
        imdb_id=data.imdb_id,
        rating=data.rating,
        review=data.review,
    )

    db.add(review)
    db.commit()
    db.refresh(review)

    return _format_review(review, current_user.username)

@router.get("/{imdb_id}", response_model=List[ReviewResponse])
def get_reviews(
    imdb_id: str,
    page:  int = Query(1,  ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    offset = (page - 1) * limit

    reviews = (
        db.query(Review)
        .filter(Review.imdb_id == imdb_id)
        .order_by(Review.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    result = []
    for r in reviews:
        username = db.query(User).filter(User.id == r.user_id).first().username
        result.append(_format_review(r, username))

    return result

@router.put("/{review_id}", response_model=ReviewResponse)
def update_review(
    review_id: int,
    data: ReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    review = db.query(Review).filter(Review.id == review_id).first()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own reviews"
        )

    if data.rating is not None:
        review.rating = data.rating
    if data.review is not None:
        review.review = data.review

    db.commit()
    db.refresh(review)

    return _format_review(review, current_user.username)

@router.delete("/{review_id}", status_code=204)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    review = db.query(Review).filter(Review.id == review_id).first()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own reviews"
        )

    db.delete(review)
    db.commit()

@router.get("/{imdb_id}/average", response_model=AverageRatingResponse)
def get_average_rating(
    imdb_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = db.query(
        func.avg(Review.rating).label("average"),
        func.count(Review.id).label("total")
    ).filter(Review.imdb_id == imdb_id).first()

    return {
        "imdb_id":        imdb_id,
        "average_rating": round(float(result.average or 0), 1),
        "total_reviews":  result.total or 0,
    }

def _format_review(review: Review, username: str) -> dict:
    return {
        "id":         review.id,
        "imdb_id":    review.imdb_id,
        "rating":     review.rating,
        "review":     review.review,
        "username":   username,
        "created_at": review.created_at,
        "updated_at": review.updated_at,
    }
