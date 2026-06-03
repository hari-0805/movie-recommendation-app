from pydantic import BaseModel
from typing import List


class DashboardResponse(BaseModel):
    total_favorites:  int
    total_searches:   int
    recent_searches:  List[str]
