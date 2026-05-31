
import React, { useState, useEffect } from "react";
import { useAuth }       from "./context/AuthContext";
import Navbar            from "./components/Navbar";
import SearchBar         from "./components/SearchBar";
import MovieCard         from "./components/MovieCard";
import MovieModal        from "./components/MovieModal";
import Pagination        from "./components/Pagination";
import SkeletonCard      from "./components/SkeletonCard";
import Toast             from "./components/Toast";
import LoginPage         from "./pages/LoginPage";
import FavoritesPage     from "./pages/FavoritesPage";
import useDebounce       from "./hooks/useDebounce";
import {
  searchMovies,
  getMovieDetails,
  getFavorites,
  addFavorite,
  removeFavorite,
  getRecentSearches,
  getTrendingSearches,
} from "./api/movieApi";
import "./App.css";

function App() {
  const { loggedIn }  = useAuth();

  const [query,         setQuery]         = useState("batman");
  const [movies,        setMovies]        = useState([]);
  const [totalResults,  setTotalResults]  = useState(0);
  const [currentPage,   setCurrentPage]   = useState(1);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [favorites,     setFavorites]     = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [isDark,        setIsDark]        = useState(false);
  const [toast,         setToast]         = useState(null); 
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingSearches, setTrendingSearches] = useState([]);

  const debouncedQuery = useDebounce(query, 500);

  function showToast(message, type = "success") {
    setToast({ message, type });
  }

  async function loadSearchHistory() {
    if (!loggedIn) return;
    try {
      const recent = await getRecentSearches();
      setRecentSearches(recent);
      const trending = await getTrendingSearches();
      setTrendingSearches(trending);
    } catch (err) {
      console.error("Failed to load search history", err);
    }
  }

  useEffect(() => {
    if (loggedIn) {
      loadSearchHistory();
    } else {
      setRecentSearches([]);
      setTrendingSearches([]);
    }
  }, [loggedIn]);

  useEffect(() => {
    if (loggedIn) {
      getFavorites()
        .then(setFavorites)
        .catch(() => setFavorites([]));
    } else {
      setFavorites([]);
    }
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn || !debouncedQuery.trim()) return;

    async function fetchMovies() {
      setLoading(true);
      setError("");
      setMovies([]);
      try {
        const data = await searchMovies(debouncedQuery, currentPage);
        setMovies(data.movies);
        setTotalResults(data.totalResults);
       
        loadSearchHistory();
      } catch (err) {
        setError(err.response?.data?.detail || err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMovies();
  }, [debouncedQuery, currentPage, loggedIn]);

  useEffect(() => { setCurrentPage(1); }, [debouncedQuery]);

  useEffect(() => {
    if (isDark) {
      document.body.classList.add("dark");
      document.body.classList.remove("light");
    } else {
      document.body.classList.add("light");
      document.body.classList.remove("dark");
    }
  }, [isDark]);

  async function handleViewDetails(imdbID) {
    setSelectedMovie({});
    try {
      const data = await getMovieDetails(imdbID);
      setSelectedMovie(data);
    } catch (err) {
      setError(err.message);
      setSelectedMovie(null);
    }
  }

  function isFavorite(imdbID) {
    return favorites.some((f) => f.imdb_id === imdbID);
  }

  function getFavoriteId(imdbID) {
    return favorites.find((f) => f.imdb_id === imdbID)?.id;
  }

  async function handleToggleFavorite(movie) {
    if (!movie?.imdbID) return;
    try {
      if (isFavorite(movie.imdbID)) {
        await removeFavorite(getFavoriteId(movie.imdbID));
        setFavorites((prev) => prev.filter((f) => f.imdb_id !== movie.imdbID));
        showToast(`${movie.Title} removed from favorites`, "error");
      } else {
        const newFav = await addFavorite(movie);
        setFavorites((prev) => [...prev, newFav]);
        showToast(`${movie.Title} added to favorites!`, "success");
      }
    } catch (err) {
      showToast(err.response?.data?.detail || err.message, "error");
    }
  }

  if (!loggedIn) {
    return (
      <div className={`app-root ${isDark ? "dark" : "light"}`}>
        <LoginPage onToast={showToast} />
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`app-root ${isDark ? "dark" : "light"}`}>

    
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Navbar
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        watchlistCount={favorites.length}
        onShowFavorites={() => setShowFavorites(!showFavorites)}
      />

      <main className="main">
        
        <SearchBar query={query} onChange={setQuery} />

        {loggedIn && (recentSearches.length > 0 || trendingSearches.length > 0) && (
          <div className="history-container">
            {recentSearches.length > 0 && (
              <div className="history-row">
                <span className="history-label">Recent:</span>
                {recentSearches.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    className="chip"
                    onClick={() => setQuery(item.keyword)}
                  >
                     {item.keyword}
                  </button>
                ))}
              </div>
            )}
            {trendingSearches.length > 0 && (
              <div className="history-row" style={{ marginTop: "4px" }}>
                <span className="history-label">Trending 🔥:</span>
                {trendingSearches.slice(0, 5).map((item, idx) => (
                  <button
                    key={idx}
                    className="chip chip-trending"
                    onClick={() => setQuery(item.keyword)}
                  >
                     {item.keyword} ({item.count})
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

       
        {showFavorites && (
          <FavoritesPage
            favorites={favorites}
            onRemove={handleToggleFavorite}
          />
        )}

   
        {error && !loading && (
          <div className="error-box">⚠️ {error}</div>
        )}

        {loading && (
          <div className="cards-grid">
            {Array(8).fill(null).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

     
        {!loading && (
          <div className="cards-grid">
            {movies.map((movie) => (
              <MovieCard
                key={movie.imdbID}
                movie={movie}
                isAdded={isFavorite(movie.imdbID)}
                onToggleWatchlist={handleToggleFavorite}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}

   
        {!loading && !error && movies.length === 0 && debouncedQuery && (
          <div className="empty-state">
            <p className="empty-icon"></p>
            <p className="empty-title">No movies found</p>
            <p className="empty-sub">Try searching for a different title</p>
          </div>
        )}

   
        {!loading && movies.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalResults={totalResults}
            onPageChange={setCurrentPage}
          />
        )}
      </main>

     
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          isAdded={isFavorite(selectedMovie.imdbID)}
          onToggleWatchlist={handleToggleFavorite}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </div>
  );
}

export default App;
