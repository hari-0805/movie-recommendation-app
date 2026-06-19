from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.database.db import engine
from app.models import user, favorite, review, search_history
from app.models.viewed_movie    import ViewedMovie
from app.models.watchlist        import Watchlist
from app.models.collection       import Collection, CollectionMovie
from app.models.user_preference import UserPreference
from app.routes import auth, movies, favorites, history, reviews
from app.routes.dashboard       import router as dashboard_router
from app.routes.watchlist        import router as watchlist_router
from app.routes.profile          import router as profile_router
from app.routes.collections      import router as collections_router
from app.routes.admin            import router as admin_router
from app.routes.recommendations import router as recommendations_router

# ── Create all tables ─────────────────────────────────────────────────────────
from app.database.db import Base
Base.metadata.create_all(bind=engine)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Movie Recommendation API",
    description="Auth · Movies · Favorites · Reviews · History · Dashboard · Recommendations",
    version="3.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global exception handlers ─────────────────────────────────────────────────
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"success": False, "message": "Invalid request"},
    )

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"success": False, "message": "Resource not found"},
    )

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(movies.router)
app.include_router(favorites.router)
app.include_router(history.router)
app.include_router(reviews.router)
app.include_router(dashboard_router)
app.include_router(watchlist_router)
app.include_router(profile_router)
app.include_router(collections_router)
app.include_router(admin_router)
app.include_router(recommendations_router)

# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {"message": "Movie API v3.0 is running ✅"}