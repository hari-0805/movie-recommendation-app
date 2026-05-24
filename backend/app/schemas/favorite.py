# app/schemas/favorite.py
# Pydantic models for favorites

from pydantic import BaseModel


# Used when adding a favorite
class FavoriteCreate(BaseModel):
    imdb_id:    str
    title:      str
    year:       str
    poster:     str
    imdb_rating: str


# Returned when listing favorites
class FavoriteResponse(BaseModel):
    id:         int
    imdb_id:    str
    title:      str
    year:       str
    poster:     str
    imdb_rating: str

    class Config:
        from_attributes = True
