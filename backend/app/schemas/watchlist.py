from pydantic import BaseModel
from datetime import datetime
from typing import List


class WatchlistCreate(BaseModel):
    movie_id: str
    title:    str
    year:     str = ""
    poster:   str = ""
    genre:    str = ""


class WatchlistItem(BaseModel):
    id:         int
    movie_id:   str
    title:      str
    year:       str
    poster:     str
    genre:      str
    created_at: datetime

    class Config:
        from_attributes = True


class WatchlistResponse(BaseModel):
    success: bool = True
    data:    List[WatchlistItem]


class WatchlistAddResponse(BaseModel):
    success: bool = True
    message: str
    data:    WatchlistItem
