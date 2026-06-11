import httpx
import os
import asyncio
import time
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.favorite import Favorite
from app.models.search_history import SearchHistory
from app.models.viewed_movie import ViewedMovie
from app.models.user_preference import UserPreference
from dotenv import load_dotenv
from collections import defaultdict, Counter

load_dotenv()

API_KEY  = os.getenv("OMDB_API_KEY")
BASE_URL = "https://www.omdbapi.com/"

_cache: dict[int, tuple[float, list]] = {}
CACHE_TTL = 300  


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

async def _genres_from_keyword(keyword: str) -> list[str]:
    search = await _omdb({"s": keyword, "type": "movie"})
    if search.get("Response") != "True":
        return []
    hits = search.get("Search", [])
    if not hits:
        return []
   
    detail = await _omdb({"i": hits[0]["imdbID"]})
    return _genres(detail.get("Genre", ""))

def _frequency_score(items, key_fn, base_weight: float) -> dict[str, float]:
    """
    Count how many times each key appears and multiply by base_weight.
    e.g. if user has 3 Action favorites → Action gets 3 × 3 = 9 instead of just 3
    """
    freq: Counter = Counter(key_fn(item) for item in items)
    scores: dict[str, float] = defaultdict(float)
    for key, count in freq.items():
        scores[key] += count * base_weight
    return scores


async def get_recommendations(
    user_id: int,
    db: Session,
    limit: int = 10,
    force_refresh: bool = False,
) -> list[dict]:

    if not force_refresh:
        cached = _cache_get(user_id)
        if cached is not None:
            return cached[:limit]

    favorites = db.query(Favorite).filter(Favorite.user_id == user_id).limit(20).all()
    viewed    = (db.query(ViewedMovie)
                   .filter(ViewedMovie.user_id == user_id)
                   .order_by(ViewedMovie.viewed_at.desc())
                   .limit(15).all())
    searches  = (db.query(SearchHistory)
                   .filter(SearchHistory.user_id == user_id)
                   .order_by(SearchHistory.searched_at.desc())
                   .limit(10).all())

    if not favorites and not viewed and not searches:
        return []

    seen: set[str] = {f.imdb_id for f in favorites} | {v.imdb_id for v in viewed}

    scores: dict[str, float] = defaultdict(float)

    fav_details = await asyncio.gather(
        *[_omdb({"i": f.imdb_id}) for f in favorites]
    ) if favorites else []

    fav_genre_map: dict[str, list[str]] = {}
    genre_fav_count: Counter = Counter()

    for f, detail in zip(favorites, fav_details):
        genres = _genres(detail.get("Genre", ""))
        fav_genre_map[f.imdb_id] = genres
        for g in genres:
            genre_fav_count[g] += 1

    for genre, count in genre_fav_count.items():
        scores[genre] += count * 3  

    genre_viewed_count: Counter = Counter()
    for v in viewed:
        for g in _genres(v.genre or ""):
            genre_viewed_count[g] += 1
    for genre, count in genre_viewed_count.items():
        scores[genre] += count * 2  

    unique_keywords = list({s.keyword.lower() for s in searches})[:5]

    keyword_genre_results = await asyncio.gather(
        *[_genres_from_keyword(kw) for kw in unique_keywords]
    ) if unique_keywords else []


    keyword_freq = Counter(s.keyword.lower() for s in searches)
    for kw, genres in zip(unique_keywords, keyword_genre_results):
        freq = keyword_freq.get(kw, 1)
        for g in genres:
            scores[g] += freq * 1 

    if not scores:
        return []

    db.query(UserPreference).filter(UserPreference.user_id == user_id).delete()
    for genre, score in scores.items():
        db.add(UserPreference(user_id=user_id, genre=genre, score=score))
    db.commit()

   
    top_genres = sorted(scores, key=lambda g: scores[g], reverse=True)[:4]

    search_results = await asyncio.gather(
        *[_omdb({"s": g, "type": "movie", "page": "1"}) for g in top_genres]
    )

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

    candidate_ids = candidate_ids[:20]
    details = await asyncio.gather(*[_omdb({"i": iid}) for iid, _ in candidate_ids])

    seen_titles: set[str] = set()
    recommendations: list[dict] = []

    for (iid, source_genre), detail in zip(candidate_ids, details):
        if detail.get("Response") != "True":
            continue

        title = detail.get("Title", "Unknown")
        if title.lower() in seen_titles:
            continue
        seen_titles.add(title.lower())

        if detail.get("Type", "movie") != "movie":
            continue
        movie_genres = _genres(detail.get("Genre", ""))
        if "Short" in movie_genres:
            continue

        rec_score = sum(scores.get(g, 0) for g in movie_genres)

        fav_contrib    = sum(genre_fav_count.get(g, 0) * 3    for g in movie_genres)
        viewed_contrib = sum(genre_viewed_count.get(g, 0) * 2 for g in movie_genres)

        if fav_contrib >= viewed_contrib and fav_contrib > 0:
            reason = "Based on your favorites"
        elif viewed_contrib > 0:
            reason = "Similar to movies you viewed"
        else:
            reason = "Based on your recent searches"

        poster = detail.get("Poster", "")
        if poster == "N/A":
            poster = ""

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

async def get_trending_recommendations(db: Session, limit: int = 10) -> list[dict]:
    trending = (
        db.query(SearchHistory.keyword, func.count(SearchHistory.keyword).label("cnt"))
        .group_by(SearchHistory.keyword)
        .order_by(func.count(SearchHistory.keyword).desc())
        .limit(5)
        .all()
    )
    if not trending:
        return []

    results = await asyncio.gather(
        *[_omdb({"s": t.keyword, "type": "movie"}) for t in trending]
    )

    seen: set[str] = set()
    movies: list[dict] = []

    for trend, result in zip(trending, results):
        if result.get("Response") != "True":
            continue
        for item in result.get("Search", [])[:2]:
            iid = item.get("imdbID", "")
            if not iid or iid in seen:
                continue
            seen.add(iid)
            detail = await _omdb({"i": iid})
            if detail.get("Response") != "True":
                continue
            if detail.get("Type", "movie") != "movie":
                continue
            poster = detail.get("Poster", "")
            if poster == "N/A":
                poster = ""
            movies.append({
                "imdb_id": iid,
                "title":   detail.get("Title", ""),
                "genre":   detail.get("Genre", "N/A"),
                "year":    detail.get("Year", "N/A"),
                "poster":  poster,
                "reason":  f"Trending: {trend.keyword} ({trend.cnt} searches)",
                "score":   float(trend.cnt),
            })
            if len(movies) >= limit:
                break

    return movies


def get_genre_analytics(user_id: int, db: Session) -> list[dict]:
    """
    Return user's genre preference breakdown with percentages.
    Uses the stored user_preferences table.
    """
    prefs = (
        db.query(UserPreference)
        .filter(UserPreference.user_id == user_id)
        .order_by(UserPreference.score.desc())
        .all()
    )
    if not prefs:
        return []

    total = sum(p.score for p in prefs)
    return [
        {
            "genre":      p.genre,
            "score":      round(p.score, 2),
            "percentage": round((p.score / total) * 100, 1),
        }
        for p in prefs[:10]
    ]
