Short Explanation of Implementation

Project Structure
movie-recommendation-app/
├── frontend/          ← React app (Vite)
├── backend/           ← FastAPI server
└── README.md

Backend Implementation (FastAPI)
Built a REST API using FastAPI with the following structure:
backend/
├── main.py                  ← App entry, CORS setup
└── app/
    ├── database/db.py       ← SQLite + SQLAlchemy connection
    ├── models/
    │   ├── user.py          ← Users table
    │   └── favorite.py      ← Favorites table
    ├── schemas/
    │   ├── user.py          ← Pydantic validation for auth
    │   └── favorite.py      ← Pydantic validation for favorites
    ├── services/
    │   ├── auth.py          ← JWT token + bcrypt password hashing
    │   └── omdb.py          ← OMDb API integration using httpx
    └── routes/
        ├── auth.py          ← POST /auth/register, /auth/login
        ├── movies.py        ← GET /movies/search, /movies/{id}
        └── favorites.py     ← POST/GET/DELETE /favorites
Authentication:

Passwords hashed using bcrypt via passlib
JWT tokens generated using python-jose
Token verified on every protected route

Database:

SQLite database auto-created on startup
Two tables — users and favorites
SQLAlchemy ORM for all queries

OMDb Integration:

Backend fetches from OMDb using httpx
API key stored in .env — never exposed to frontend
Clean JSON returned to React


Frontend Implementation (React)
frontend/src/
├── App.jsx          ← Root component, all state management
├── AuthPage.jsx     ← Login / Register form
├── Navbar.jsx       ← Title, favorites count, dark mode, logout
├── SearchBar.jsx    ← Search input with debounce
├── MovieCard.jsx    ← Single movie card
├── MovieModal.jsx   ← Full detail popup
├── Pagination.jsx   ← Page navigation
├── StarRating.jsx   ← Star display
├── api.js           ← All backend API calls
└── useDebounce.js   ← Custom hook — 500ms search delay
How frontend connects to backend:

All API calls go directly to http://localhost:8000
JWT token stored in localStorage
Token sent in Authorization: Bearer header for protected routes


All API Endpoints
MethodEndpointAuthDescriptionPOST/auth/registerNoRegister new userPOST/auth/loginNoLogin, returns JWTGET/movies/searchNoSearch OMDb moviesGET/movies/{imdb_id}NoGet movie detailsPOST/favoritesYesAdd to favoritesGET/favoritesYesGet my favoritesDELETE/favorites/{id}YesRemove favorite