from pydantic import BaseModel
from typing import List


class RecommendedMovie(BaseModel):
    imdb_id: str
    title:   str
    genre:   str
    year:    str
    poster:  str
    reason:  str
    score:   float

    class Config:
        from_attributes = True


class RecommendationResponse(BaseModel):
    recommended_movies: List[RecommendedMovie]
