import React, { useState, useEffect } from "react";
import Navbar     from "./Navbar";
import SearchBar  from "./SearchBar";
import MovieCard  from "./MovieCard";
import MovieModal from "./MovieModal";
import Pagination from "./Pagination";
import AuthPage   from "./AuthPage";
import useDebounce from "./useDebounce";
import {
  searchMovies,
  getMovieDetails,
  getFavorites,
  addFavorite,
  removeFavorite,
  logoutUser,
  isLoggedIn,
} from "./api";
import "./App.css";
function App() {
  const [loggedIn,      setLoggedIn]      = useState(isLoggedIn());
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
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (loggedIn) {
      getFavorites()
        .then(setFavorites)
        .catch((err) => {    
          if (err.message.includes("401") || err.message.includes("token")) {
            handleLogout();
          }
        });
    }
  }, [loggedIn]);

  useEffect(() => {
    if (!debouncedQuery.trim()) return;

    async function fetchMovies() {
      setLoading(true);
      setError("");
      setMovies([]);
      try {
        const data = await searchMovies(debouncedQuery, currentPage);
        setMovies(data.movies);
        setTotalResults(data.totalResults);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMovies();
  }, [debouncedQuery, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery]);

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
    const fav = favorites.find((f) => f.imdb_id === imdbID);
    return fav ? fav.id : null;
  }

  async function handleToggleFavorite(movie) {
    if (!loggedIn) {
      setError("Please login to manage favorites");
      return;
    }
    try {
      if (isFavorite(movie.imdbID)) {
        const favId = getFavoriteId(movie.imdbID);
        await removeFavorite(favId);
        setFavorites(favorites.filter((f) => f.imdb_id !== movie.imdbID));
      } else {
        const newFav = await addFavorite(movie);
        setFavorites([...favorites, newFav]);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  function handleLogout() {
    logoutUser();
    setLoggedIn(false);
    setFavorites([]);
  }

  if (!loggedIn) {
    return (
      <div className={`app-root ${isDark ? "dark" : "light"}`}>
        <AuthPage onLoginSuccess={() => setLoggedIn(true)} />
      </div>
    );
  }

  return (
    <div className={`app-root ${isDark ? "dark" : "light"}`}>

      <Navbar
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        watchlistCount={favorites.length}
        onLogout={handleLogout}
        onShowFavorites={() => setShowFavorites(!showFavorites)}
      />

      <main className="main">
       

        <SearchBar query={query} onChange={setQuery} />

        {showFavorites && (
          <div className="favorites-panel">
            <h3 className="fav-heading">My Favorites ({favorites.length})</h3>
            {favorites.length === 0 ? (
              <p className="fav-empty">No favorites added yet.</p>
            ) : (
              <div className="fav-list">
                {favorites.map((fav) => (
                  <div key={fav.id} className="fav-item">
                    <img
                      src={fav.poster || "https://placehold.co/50x70?text=N/A"}
                      alt={fav.title}
                      className="fav-poster"
                    />
                    <div className="fav-info">
                      <p className="fav-title">{fav.title}</p>
                      <p className="fav-year">{fav.year} •  {fav.imdb_rating}</p>
                    </div>
                    <button
                      className="fav-remove"
                      onClick={() => handleToggleFavorite({ imdbID: fav.imdb_id, Title: fav.title, Year: fav.year, Poster: fav.poster, imdbRating: fav.imdb_rating })}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="status-box">
            <div className="spinner"></div>
            <p>Searching movies...</p>
          </div>
        )}

        {error && !loading && (
          <div className="error-box">⚠️ {error}</div>
        )}

        {/* {!loading && movies.length > 0 && (
          <p className="results-count">
            Found {totalResults} results for "<strong>{debouncedQuery}</strong>"
          </p>
        )} */}

        {!loading && (
          <div className="cards-grid">
            {movies.map((movie) => (
              <MovieCard
                key={movie.imdbID}
                movie={movie}
                isAdded={isFavorite(movie.imdbID)}
                onToggleWatchlist={() => handleToggleFavorite(movie)}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}

        {!loading && movies.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalResults={totalResults}
            onPageChange={setCurrentPage}
          />
        )}

        {!loading && !error && movies.length === 0 && debouncedQuery && (
          <div className="status-box">
            <p> No movies found. Try a different search!</p>
          </div>
        )}
      </main>

      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          isAdded={isFavorite(selectedMovie.imdbID)}
          onToggleWatchlist={() => handleToggleFavorite(selectedMovie)}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </div>
  );
}

export default App;
