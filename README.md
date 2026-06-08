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

Frontend Integration

All forms connected to live API
Loading spinner while fetching
Error messages shown and auto-hide after 3 seconds
Favorites update instantly without page refreshs

Implementation Explanation
This is a full-stack Movie Recommendation and Search application built with a modern decoupled architecture:

1. Backend (FastAPI & SQLite)
Web Framework: Built using FastAPI to provide a fast, asynchronous, and auto-documented (Swagger) REST API.
Database & ORM: Powered by SQLite for local data persistence and SQLAlchemy for object-relational mapping (ORM) and schema definition.
Authentication: Features JWT-based token authorization. Passwords are encrypted using the bcrypt hashing algorithm (via passlib). Secure routes check the Authorization: Bearer <token> header on every incoming request.
OMDb Integration: Connects securely to the external OMDb API using the asynchronous HTTP client httpx to handle search requests and movie details. The OMDb API key is hidden in server-side environment variables (.env) for security.
Core Endpoints:
Authentication: User registration (POST /auth/register) and login (POST /auth/login).
Movie Search: Querying OMDb (GET /movies/search) and looking up details by ID (GET /movies/{imdb_id}).
Favorites: Managing watchlist items via CRUD endpoints (POST, GET, DELETE on /favorites).
Search History (Bonus): Logs past user queries (GET /history) and computes global trending keywords (GET /history/trending).
Reviews (Bonus): Allows users to read and leave star ratings and reviews (POST, GET on /reviews).

2. Frontend (React & Vite)
State Management: Built with React using a global AuthContext to manage user sessions and login status.
API Communication: Leverages Axios with request/response interceptors to automatically append the JWT token to outgoing headers and globally handle authentication expiry (401 errors).
UI Features:
Debounced search query input (500ms delay) to prevent hitting OMDb rate limits.
Dark Mode / Light Mode styling switch.
Visual feedback including skeleton loaders during fetching, custom rating stars, and toast alerts for operations.
A full details popup (modal) displaying ratings, overview, and cast info.

8/6/26
How the recommendation logic works

User Activity
    ├── Favorites   → weight 3  (strongest signal)
    ├── Viewed      → weight 2
    └── Searches    → weight 1
            ↓
    Fetch OMDB details for each activity item
            ↓
    Build genre score map
    e.g. { Action: 9, Drama: 4, Sci-Fi: 3 }
            ↓
    Save to user_preferences table
            ↓
    Pick top 3 genres
            ↓
    Search OMDB for each genre
            ↓
    Skip movies already in favorites/viewed
            ↓
    Score each result by matching genre weights
            ↓
    Sort by score → return top 10