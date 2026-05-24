# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.db import engine
from app.models import user, favorite
from app.routes import auth, movies, favorites

user.Base.metadata.create_all(bind=engine)
favorite.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Movie Recommendation API",
    description="Backend for Movie Recommendation App",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,   # ✅ must be False when allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(movies.router)
app.include_router(favorites.router)

@app.get("/", tags=["Health"])
def root():
    return {"message": "Movie API is running ✅"}