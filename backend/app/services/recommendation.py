"""
Recommendation Service — rate-limit safe version
Minimises OMDB calls to stay within free tier (1000/day, ~1/sec).

Call budget per recommendation run:
  - Favorites genre fetch : up to 10 calls (batched)
  - Genre candidate search: 4 genres × 1 page = 4 calls
  - Candidate details     : up to 20 calls (batched)
  Total: ~34 calls max, cached for 5 minutes
"""

import httpx
import os
import asyncio
import time
from sqlalchemy.orm import Session
from app.models.favorite import Favorite
from app.models.search_history import SearchHistory
from app.models.viewed_movie import ViewedMovie
from app.models.user_preference import UserPreference
from dotenv import load_dotenv
from collections import defaultdict

load_dotenv()

API_KEY  = os.getenv("OMDB_API_KEY")
BASE_URL = "https://www.omdbapi.com/"

# Cache 
_cache: dict[int, tuple[float, list]] = {}
CACHE_TTL = 300  # 5 minutes


def _cache_get(user_id: int):
    entry = _cache.get(user_id)
    if entry and (time.time() - entry[0]) < CACHE_TTL:
        return entry[1]
    return None


def _cache_set(user_id: int, results: list):
    _cache[user_id] = (time.time(), results)


def invalidate_cache(user_id: int):
    _cache.pop(user_id, None)


async def _omdb(params: dict) -> dict:
    params["apikey"] = API_KEY
    try:
        async with httpx.AsyncClient(timeout=6) as client:
            r = await client.get(BASE_URL, params=params)
        return r.json()
    except Exception:
        return {}


def _genres(genre_str: str) -> list[str]:
    if not genre_str or genre_str == "N/A":
        return []
    return [g.strip() for g in genre_str.split(",")]


# Reliable OMDB search terms per genre one term only — saves API calls
GENRE_TERMS = {
    "Action":    "marvel action",
    "Adventure": "adventure heroes",
    "Drama":     "award drama",
    "Comedy":    "popular comedy",
    "Thriller":  "suspense thriller",
    "Horror":    "scary horror",
    "Sci-Fi":    "space sci-fi",
    "Romance":   "romantic love",
    "Animation": "pixar animation",
    "Crime":     "crime mystery",
    "Fantasy":   "magic fantasy",
    "Mystery":   "detective mystery",
}


async def get_recommendations(
    user_id: int,
    db: Session,
    limit: int = 10,
    force_refresh: bool = False,
) -> list[dict]:

    #  Serve from cache if fresh 
    if not force_refresh:
        cached = _cache_get(user_id)
        if cached is not None:
            return cached[:limit]

    #  Load user activity 
    favorites = db.query(Favorite).filter(Favorite.user_id == user_id).limit(10).all()
    viewed    = (db.query(ViewedMovie)
                   .filter(ViewedMovie.user_id == user_id)
                   .order_by(ViewedMovie.viewed_at.desc())
                   .limit(10).all())
    searches  = (db.query(SearchHistory)
                   .filter(SearchHistory.user_id == user_id)
                   .order_by(SearchHistory.searched_at.desc())
                   .limit(5).all())

    if not favorites and not viewed and not searches:
        return []

    # Already-seen ids — never recommend these
    seen: set[str] = {f.imdb_id for f in favorites} | {v.imdb_id for v in viewed}

    #  Build genre scores 
    scores: dict[str, float] = defaultdict(float)

    # Favorites: fetch genres in parallel (capped at 10)
    fav_details = await asyncio.gather(
        *[_omdb({"i": f.imdb_id}) for f in favorites]
    ) if favorites else []

    fav_genre_map: dict[str, list[str]] = {}
    for f, detail in zip(favorites, fav_details):
        genres = _genres(detail.get("Genre", ""))
        fav_genre_map[f.imdb_id] = genres
        for g in genres:
            scores[g] += 3

    # Viewed: genre already stored in DB — zero API calls
    for v in viewed:
        for g in _genres(v.genre or ""):
            scores[g] += 2

    # Searches: use keyword directly as genre hint — zero API calls
    # This avoids fetching OMDB for each search keyword
    SEARCH_GENRE_HINTS = {
        "batman": ["Action", "Adventure"],
        "superman": ["Action", "Adventure"],
        "avengers": ["Action", "Adventure", "Sci-Fi"],
        "spider": ["Action", "Adventure"],
        "thor": ["Action", "Adventure", "Fantasy"],
        "iron man": ["Action", "Sci-Fi"],
        "horror": ["Horror"],
        "comedy": ["Comedy"],
        "thriller": ["Thriller"],
        "romance": ["Romance"],
        "sci-fi": ["Sci-Fi"],
        "animation": ["Animation"],
    }

    for s in searches:
        kw = s.keyword.lower()
        matched = False
        for hint_kw, genres in SEARCH_GENRE_HINTS.items():
            if hint_kw in kw:
                for g in genres:
                    scores[g] += 1
                matched = True
                break
        if not matched:
            # Generic boost — use keyword as-is
            scores[s.keyword.title()] += 1

    if not scores:
        return []

    # Save preferences
    db.query(UserPreference).filter(UserPreference.user_id == user_id).delete()
    for genre, score in scores.items():
        db.add(UserPreference(user_id=user_id, genre=genre, score=score))
    db.commit()

    #  Fetch candidates for top 4 genres — 1 search each 
    top_genres = sorted(scores, key=lambda g: scores[g], reverse=True)[:4]

    search_results = await asyncio.gather(
        *[_omdb({"s": GENRE_TERMS.get(g, g), "type": "movie", "page": "1"})
          for g in top_genres]
    )

    # Collect unique candidates
    candidate_ids: list[tuple[str, str]] = []
    seen_candidates: set[str] = set()

    for genre, result in zip(top_genres, search_results):
        if result.get("Response") != "True":
            continue
        for item in result.get("Search", []):
            iid = item.get("imdbID", "")
            if iid and iid not in seen and iid not in seen_candidates:
                seen_candidates.add(iid)
                candidate_ids.append((iid, genre))

    if not candidate_ids:
        return []

    # Fetch full details — parallel, capped at 20
    candidate_ids = candidate_ids[:20]
    details = await asyncio.gather(*[_omdb({"i": iid}) for iid, _ in candidate_ids])

    # Score, deduplicate, build output 
    seen_titles: set[str] = set()
    recommendations: list[dict] = []

    for (iid, source_genre), detail in zip(candidate_ids, details):
        if detail.get("Response") != "True":
            continue

        title = detail.get("Title", "Unknown")
        if title.lower() in seen_titles:
            continue
        seen_titles.add(title.lower())

        movie_genres = _genres(detail.get("Genre", ""))
        rec_score    = sum(scores.get(g, 0) for g in movie_genres)

        fav_contrib    = sum(3 for glist in fav_genre_map.values()
                               for g in glist if g in movie_genres)
        viewed_contrib = sum(2 for v in viewed
                               for g in _genres(v.genre or "") if g in movie_genres)

        if fav_contrib >= viewed_contrib and fav_contrib > 0:
            reason = "Based on your favorites"
        elif viewed_contrib > 0:
            reason = "Similar to movies you viewed"
        else:
            reason = "Based on your recent searches"

        poster = detail.get("Poster", "")
        if poster == "N/A":
            poster = ""

        # Skip short films and non-movies only allow no-poster
        if "Short" in movie_genres or detail.get("Type", "movie") != "movie":
            continue

        recommendations.append({
            "imdb_id": iid,
            "title":   title,
            "genre":   detail.get("Genre", "N/A"),
            "year":    detail.get("Year",  "N/A"),
            "poster":  poster,
            "reason":  reason,
            "score":   round(rec_score, 2),
        })

    recommendations.sort(key=lambda x: x["score"], reverse=True)
    result = recommendations[:limit]
    _cache_set(user_id, result)
    return result
