# app/services/omdb.py
# Handles all OMDb API communication

import httpx
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY  = os.getenv("OMDB_API_KEY")
BASE_URL = "https://www.omdbapi.com/"


# Search movies by title — returns list + total count
async def search_movies(title: str, page: int = 1):
    async with httpx.AsyncClient() as client:
        response = await client.get(BASE_URL, params={
            "apikey": API_KEY,
            "s": title,
            "page": page
        })

    data = response.json()

    if data.get("Response") == "False":
        return None, data.get("Error", "No results found")

    return data.get("Search", []), int(data.get("totalResults", 0))


# Get full details of one movie by IMDb ID
async def get_movie_by_id(imdb_id: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(BASE_URL, params={
            "apikey": API_KEY,
            "i": imdb_id,
            "plot": "full"
        })

    data = response.json()

    if data.get("Response") == "False":
        return None

    return data
