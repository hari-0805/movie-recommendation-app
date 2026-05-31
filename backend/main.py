
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.db import engine
from app.models import user, favorite, review, search_history
from app.routes import auth, movies, favorites, history, reviews


user.Base.metadata.create_all(bind=engine)
favorite.Base.metadata.create_all(bind=engine)
review.Base.metadata.create_all(bind=engine)
search_history.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Movie Recommendation API",
    description="Backend with Auth, Movies, Favorites, Reviews and Search History",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(movies.router)
app.include_router(favorites.router)
app.include_router(history.router)
app.include_router(reviews.router)

@app.get("/", tags=["Health"])
def root():
    return {"message": "Movie API v2.0 is running ✅"}
