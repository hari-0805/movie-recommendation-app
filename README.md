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


What was implemented:
Database Setup

SQLite database (movies.db) created automatically when backend starts
SQLAlchemy ORM used for all database operations
Two tables — users and favorites

User Model
pythonclass User(Base):
    id       = Column(Integer, primary_key=True)
    username = Column(String, unique=True)
    email    = Column(String, unique=True)
    password = Column(String)  # bcrypt hashed
Favorites Model
pythonclass Favorite(Base):
    id          = Column(Integer, primary_key=True)
    user_id     = Column(Integer, ForeignKey("users.id"))
    imdb_id     = Column(String)
    title       = Column(String)
    year        = Column(String)
    poster      = Column(String)
    imdb_rating = Column(String)
CRUD Operations

Register → INSERT into users table
Login → SELECT from users + verify password
Add Favorite → INSERT into favorites table
Get Favorites → SELECT from favorites WHERE user_id
Delete Favorite → DELETE from favorites WHERE id

Validation

Pydantic validates all request data
Duplicate email → 400 error
Duplicate favorite → 400 error
Invalid token → 401 error
Movie not found → 404 error

demo video check the link
https://drive.google.com/file/d/1f9_1e_aHVGRiDNTktAyHy3AKKE5CEzZM/view?usp=sharing

Frontend Integration

All forms connected to live API
Loading spinner while fetching
Error messages shown and auto-hide after 3 seconds
Favorites update instantly without page refreshs
