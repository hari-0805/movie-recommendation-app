from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.database.db import engine
from app.models import user, favorite, review, search_history
from app.routes import auth, movies, favorites, history, reviews
from app.routes.dashboard import router as dashboard_router

# ── Create all tables ────────────────────────────────────────────────────────
user.Base.metadata.create_all(bind=engine)
favorite.Base.metadata.create_all(bind=engine)
review.Base.metadata.create_all(bind=engine)
search_history.Base.metadata.create_all(bind=engine)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Movie Recommendation API",
    description="Backend with Auth, Movies, Favorites, Reviews, Search History and Dashboard",
    version="2.1.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # restrict in production
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global exception handlers ─────────────────────────────────────────────────

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Return a clean 400 for malformed / invalid query parameters or body."""
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"success": False, "message": "Invalid request"},
    )


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """Catch unmatched routes and surface a structured 404."""
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


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {"message": "Movie API v2.1 is running ✅"}
