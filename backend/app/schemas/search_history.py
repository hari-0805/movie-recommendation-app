from pydantic import BaseModel
from datetime import datetime
from typing import List


class SearchHistoryResponse(BaseModel):
    keyword:     str
    searched_at: datetime

    class Config:
        from_attributes = True


class SearchHistoryListResponse(BaseModel):
    success: bool = True
    data:    List[SearchHistoryResponse]


class TrendingResponse(BaseModel):
    keyword: str
    count:   int
