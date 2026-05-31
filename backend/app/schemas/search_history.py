from pydantic import BaseModel
from datetime import datetime

class SearchHistoryResponse(BaseModel):
    id:          int
    keyword:     str
    searched_at: datetime

    class Config:
        from_attributes = True


class TrendingResponse(BaseModel):
    keyword: str
    count:   int
