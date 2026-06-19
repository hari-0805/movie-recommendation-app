from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class CollectionMovieItem(BaseModel):
    movie_id: str
    title:    str
    year:     str = ""
    poster:   str = ""
    genre:    str = ""

    class Config:
        from_attributes = True


class CollectionCreate(BaseModel):
    name:        str = Field(..., min_length=1, max_length=200)
    description: str = Field("", max_length=1000)
    emoji:       str = Field("🎬", max_length=10)


class CollectionUpdate(BaseModel):
    name:        Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    emoji:       Optional[str] = Field(None, max_length=10)


class CollectionResponse(BaseModel):
    id:          int
    name:        str
    description: str
    emoji:       str
    movie_count: int
    created_at:  datetime
    updated_at:  Optional[datetime]
    movies:      List[CollectionMovieItem] = []

    class Config:
        from_attributes = True


class CollectionListItem(BaseModel):
    id:          int
    name:        str
    description: str
    emoji:       str
    movie_count: int
    created_at:  datetime
    preview_posters: List[str] = []

    class Config:
        from_attributes = True
