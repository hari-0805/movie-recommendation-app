import React, { useState, useEffect, useCallback } from "react";
import { useAuth }            from "./context/AuthContext";
import Navbar                 from "./components/Navbar";
import SearchBar              from "./components/SearchBar";
import MovieCard              from "./components/MovieCard";
import MovieModal             from "./components/MovieModal";
import Pagination             from "./components/Pagination";
import SkeletonCard           from "./components/SkeletonCard";
import Toast                  from "./components/Toast";
import RecommendationSection  from "./components/RecommendationSection";
import LoginPage              from "./pages/LoginPage";
import FavoritesPage          from "./pages/FavoritesPage";
import useDebounce            from "./hooks/useDebounce";
import {
  searchMovies,
  getMovieDetails,
  getFavorites,
  addFavorite,
  removeFavorite,
  getRecentSearches,
  getTrendingSearches,
  getRecommendations,
  markMovieViewed,
} from "./api/movieApi";
import "./App.css";

function App() {
  const { loggedIn } = useAuth();

  const [query,            setQuery]            = useState("batman");
  const [movies,           setMovies]           = useState([]);
  const [totalResults,     setTotalResults]     = useState(0);
  const [currentPage,      setCurrentPage]      = useState(1);
  const [loading,          setLoading]          = useState(false);
  const [error,            setError]            = useState("");
  const [selectedMovie,    setSelectedMovie]    = useState(null);
  const [favorites,        setFavorites]        = useState([]);
  const [showFavorites,    setShowFavorites]    = useState(false);
  const [isDark,           setIsDark]           = useState(false);
  const [toast,            setToast]            = useState(null);
  const [recentSearches,   setRecentSearches]   = useState([]);
  const [trendingSearches, setTrendingSearches] = useState([]);
  const [recommendations,  setRecommendations]  = useState([]);
  const [recLoading,       setRecLoading]       = useState(false);

  const debouncedQuery = useDebounce(query, 500);

  function showToast(message, type = "success") {
    setToast({ message, type });
  }

  //Load recommendations
  const loadRecommendations = useCallback(async (forceRefresh = false) => {
    if (!loggedIn) return;
    setRecLoading(true);
    try {
      const data = await getRecommendations(10, forceRefresh);
      setRecommendations(data);
    } catch {
      setRecommendations([]);
    } finally {
      setRecLoading(false);
    }
  }, [loggedIn]);

  //Load search history
  async function loadSearchHistory() {
    if (!loggedIn) return;
    try {
      const recent   = await getRecentSearches();
      const trending = await getTrendingSearches();
      setRecentSearches(recent.data ?? recent);
      setTrendingSearches(trending);
    } catch {
    }
  }

  // On login / logout
  useEffect(() => {
    if (loggedIn) {
      loadSearchHistory();
      loadRecommendations();
      getFavorites().then(setFavorites).catch(() => setFavorites([]));
    } else {
      setRecentSearches([]);
      setTrendingSearches([]);
      setFavorites([]);
      setRecommendations([]);
    }
  }, [loggedIn]);

  //  Search
  useEffect(() => {
    if (!loggedIn || !debouncedQuery.trim()) {
      setMovies([]);
      setError("");
      return;
    }

    async function fetchMovies() {
      setLoading(true);
      setError("");
      setMovies([]);
      try {
        const data = await searchMovies(debouncedQuery, currentPage);
        setMovies(data.movies);
        setTotalResults(data.totalResults);
        loadSearchHistory();
        // Refresh recommendations after each search (dynamic update)
        loadRecommendations();
      } catch (err) {
        // 404 means no results found — show empty state, not an error
        if (err.response?.status === 404) {
          setMovies([]);
          setTotalResults(0);
        } else {
          setError(err.response?.data?.detail || err.message);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchMovies();
  }, [debouncedQuery, currentPage, loggedIn]);

  useEffect(() => { setCurrentPage(1); }, [debouncedQuery]);

  //   Theme
  useEffect(() => {
    document.body.classList.toggle("dark",  isDark);
    document.body.classList.toggle("light", !isDark);
  }, [isDark]);

  // View details (records viewed + refreshes recs) 
  async function handleViewDetails(imdbID) {
    setSelectedMovie({});
    try {
      const data = await getMovieDetails(imdbID);
      setSelectedMovie(data);
      // Record this as viewed
      await markMovieViewed(
        imdbID,
        data.Title   || "",
        data.Genre   || "",
        data.Year    || "",
        data.Poster !== "N/A" ? data.Poster : "",
      );
      // Refresh recommendations after viewing
      loadRecommendations();
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

  // Toggle favorite (refreshes recs) 
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
      // Refresh recommendations after favorite change
      loadRecommendations();
    } catch (err) {
      showToast(err.response?.data?.detail || err.message, "error");
    }
  }

  // Not logged in
  if (!loggedIn) {
    return (
      <div className={`app-root ${isDark ? "dark" : "light"}`}>
        <LoginPage onToast={showToast} />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  return (
    <div className={`app-root ${isDark ? "dark" : "light"}`}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <Navbar
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        watchlistCount={favorites.length}
        onShowFavorites={() => setShowFavorites(!showFavorites)}
      />

      <main className="main">
        <SearchBar query={query} onChange={setQuery} />

        {/* Recent & trending chips */}
        {(recentSearches.length > 0 || trendingSearches.length > 0) && (
          <div className="history-container">
            {recentSearches.length > 0 && (
              <div className="history-row">
                <span className="history-label">Recent:</span>
                {recentSearches.slice(0, 5).map((item, i) => (
                  <button key={i} className="chip" onClick={() => setQuery(item.keyword)}>
                    {item.keyword}
                  </button>
                ))}
              </div>
            )}
            {trendingSearches.length > 0 && (
              <div className="history-row" style={{ marginTop: "4px" }}>
                <span className="history-label">Trending🔥 :</span>
                {trendingSearches.slice(0, 5).map((item, i) => (
                  <button key={i} className="chip chip-trending" onClick={() => setQuery(item.keyword)}>
                    {item.keyword} ({item.count})
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/*Recommendations */}
        <RecommendationSection
          recommendations={recommendations}
          loading={recLoading}
          onViewDetails={handleViewDetails}
          onToggleFavorite={handleToggleFavorite}
          isFavorite={isFavorite}
          onRefresh={() => loadRecommendations(true)}
        />

        {/* Favorites overlay */}
        {showFavorites && (
          <FavoritesPage favorites={favorites} onRemove={handleToggleFavorite} />
        )}

        {error && !loading && <div className="error-box">⚠️ {error}</div>}

        {/* Search results */}
        {loading ? (
          <div className="cards-grid">
            {Array(8).fill(null).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
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
