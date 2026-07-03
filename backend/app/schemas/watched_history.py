from pydantic import BaseModel
from datetime import datetime
from typing import List


class WatchedCreate(BaseModel):
    movie_id:    str
    title:       str
    year:        str = ""
    poster:      str = ""
    genre:       str = ""
    imdb_rating: str = ""


class WatchedItem(BaseModel):
    id:          int
    movie_id:    str
    title:       str
    year:        str
    poster:      str
    genre:       str
    imdb_rating: str
    watched_at:  datetime

    class Config:
        from_attributes = True


class WatchedResponse(BaseModel):
    success: bool = True
    data:    List[WatchedItem]


class WatchedAddResponse(BaseModel):
    success: bool = True
    message: str
    data:    WatchedItem


class WatchedStatusResponse(BaseModel):
    watched:    bool
    watched_at: datetime | None = None
