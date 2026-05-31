from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class ReviewCreate(BaseModel):
    imdb_id: str
    rating:  int   = Field(..., ge=1, le=5, description="Rating between 1 and 5")
    review:  str   = Field(..., min_length=1, description="Review cannot be empty")

class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    review: Optional[str] = Field(None, min_length=1)

class ReviewResponse(BaseModel):
    id:         int
    imdb_id:    str
    rating:     int
    review:     str
    username:   str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AverageRatingResponse(BaseModel):
    imdb_id:        str
    average_rating: float
    total_reviews:  int
