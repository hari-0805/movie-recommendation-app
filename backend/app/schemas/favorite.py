from pydantic import BaseModel

class FavoriteCreate(BaseModel):
    imdb_id:    str
    title:      str
    year:       str
    poster:     str
    imdb_rating: str

class FavoriteResponse(BaseModel):
    id:         int
    imdb_id:    str
    title:      str
    year:       str
    poster:     str
    imdb_rating: str

    class Config:
        from_attributes = True
