import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route, Link } from "react-router-dom";
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
import WatchlistPage          from "./pages/WatchlistPage";
import ProfilePage            from "./pages/ProfilePage";
import AdminPage              from "./pages/AdminPage";
import ComparePage            from "./pages/ComparePage";
import WatchedHistoryPage     from "./pages/WatchedHistoryPage";
import DashboardPage          from "./pages/DashboardPage";
import useDebounce            from "./hooks/useDebounce";
import CollectionsPage from "./pages/CollectionsPage";
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
  getTrendingRecommendations,
  getGenreAnalytics,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  getWatchedHistory,
  markAsWatched,
  removeFromWatched,
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
  const [watchlist,        setWatchlist]        = useState([]);
  const [showWatchlist,    setShowWatchlist]    = useState(false);
  const [showProfile,      setShowProfile]      = useState(false);
  const [showAdmin,        setShowAdmin]        = useState(false);
  const [showCollections,  setShowCollections]  = useState(false);
  const [collectionMovie,  setCollectionMovie]  = useState(null);
  const [isDark,           setIsDark]           = useState(false);
  const [toast,            setToast]            = useState(null);
  const [recentSearches,   setRecentSearches]   = useState([]);
  const [trendingSearches, setTrendingSearches] = useState([]);
  const [recommendations,  setRecommendations]  = useState([]);
  const [trending,         setTrending]         = useState([]);
  const [genres,           setGenres]           = useState([]);
  const [recLoading,       setRecLoading]       = useState(false);
  const [compareList,      setCompareList]      = useState([]);
  const [watchedHistory,   setWatchedHistory]   = useState([]);
  const [showWatched,      setShowWatched]       = useState(false);

  const debouncedQuery = useDebounce(query, 500);

  function showToast(message, type = "success") {
    setToast({ message, type });
  }

  
  const loadRecommendations = useCallback(async (forceRefresh = false) => {
    if (!loggedIn) return;
    setRecLoading(true);
    try {
      const [recs, trend, genreData] = await Promise.all([
        getRecommendations(10, forceRefresh),
        getTrendingRecommendations(10),
        getGenreAnalytics(),
      ]);
      setRecommendations(recs);
      setTrending(trend);
      setGenres(genreData);
    } catch {
      setWatchlist([]);
      setRecommendations([]);
      setTrending([]);
      setGenres([]);
    } finally {
      setRecLoading(false);
    }
  }, [loggedIn]);

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


  useEffect(() => {
    if (loggedIn) {
      loadSearchHistory();
      loadRecommendations();
      getFavorites().then(setFavorites).catch(() => setFavorites([]));
      getWatchlist().then(setWatchlist).catch(() => setWatchlist([]));
      getWatchedHistory().then(setWatchedHistory).catch(() => setWatchedHistory([]));
    } else {
      setRecentSearches([]);
      setTrendingSearches([]);
      setFavorites([]);
      setWatchlist([]);
      setWatchedHistory([]);
      setRecommendations([]);
    }
  }, [loggedIn]);

  
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
        
        loadRecommendations();
      } catch (err) {
       
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

  useEffect(() => {
    document.body.classList.toggle("dark",  isDark);
    document.body.classList.toggle("light", !isDark);
  }, [isDark]);

  async function handleViewDetails(imdbID) {
    setSelectedMovie({});
    try {
      const data = await getMovieDetails(imdbID);
      setSelectedMovie(data);
      
      await markMovieViewed(
        imdbID,
        data.Title   || "",
        data.Genre   || "",
        data.Year    || "",
        data.Poster !== "N/A" ? data.Poster : "",
      );
     
      loadRecommendations();
    } catch (err) {
      setError(err.message);
      setSelectedMovie(null);
    }
  }

  function isFavorite(imdbID) {
    return favorites.some((f) => f.imdb_id === imdbID);
  }

  function isInWatchlist(imdbID) {
    return watchlist.some((w) => w.movie_id === imdbID);
  }

  function getWatchlistId(imdbID) {
    return watchlist.find((w) => w.movie_id === imdbID)?.id;
  }

  function isInCompare(imdbID) {
    return compareList.some((m) => m.imdbID === imdbID);
  }

  function handleToggleCompare(movie) {
    if (isInCompare(movie.imdbID)) {
      setCompareList((prev) => prev.filter((m) => m.imdbID !== movie.imdbID));
      return;
    }
    if (compareList.length >= 2) {
      showToast("You can only compare up to 2 movies at a time.", "error");
      return;
    }
    setCompareList((prev) => [...prev, movie]);
  }

  function clearCompare() {
    setCompareList([]);
  }

  function isWatched(imdbID) {
    return watchedHistory.some((w) => w.movie_id === imdbID);
  }

  async function handleMarkWatched(movie) {
    const movieId = movie.imdbID || movie.movie_id;
    if (isWatched(movieId)) return;
    try {
      const result = await markAsWatched(movie);
      setWatchedHistory((prev) => [result.data, ...prev]);
      // Remove from watchlist state if present
      setWatchlist((prev) => prev.filter((w) => w.movie_id !== movieId));
      showToast(result.message || `"${movie.Title || movie.title}" marked as watched`, "success");
    } catch (err) {
      const msg = err.response?.data?.detail?.message || err.response?.data?.detail;
      if (msg?.includes("already")) {
        showToast("Already in watched history", "error");
      } else {
        showToast("Failed to mark as watched", "error");
      }
    }
  }


  async function handleToggleWatchlist(movie) {
    if (!movie?.imdbID) return;
    try {
      if (isInWatchlist(movie.imdbID)) {
        await removeFromWatchlist(getWatchlistId(movie.imdbID));
        setWatchlist((prev) => prev.filter((w) => w.movie_id !== movie.imdbID));
        showToast(`${movie.Title} removed from watchlist`, "error");
      } else {
        const newItem = await addToWatchlist(movie);
        setWatchlist((prev) => [...prev, newItem]);
        showToast(`${movie.Title} added to watchlist!`, "success");
      }
    } catch (err) {
      showToast(err.response?.data?.detail?.message || err.message, "error");
    }
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
      
      loadRecommendations();
    } catch (err) {
      showToast(err.response?.data?.detail || err.message, "error");
    }
  }

 
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

      <Routes>
        <Route
          path="/"
          element={
            <>
              <Navbar
                isDark={isDark}
                onToggleTheme={() => setIsDark(!isDark)}
                watchlistCount={favorites.length}
                onShowFavorites={() => { setShowFavorites(!showFavorites); setShowWatchlist(false); setShowProfile(false); }}
                watchlistItemCount={watchlist.length}
                onShowWatchlist={() => { setShowWatchlist(!showWatchlist); setShowFavorites(false); setShowProfile(false); }}
                onShowProfile={() => { setShowProfile(!showProfile); setShowFavorites(false); setShowWatchlist(false); setShowAdmin(false); }}
                onShowAdmin={() => { setShowAdmin(!showAdmin); setShowProfile(false); setShowFavorites(false); setShowWatchlist(false); }}
                onShowCollections={() => setShowCollections(!showCollections)}
                onShowWatched={() => { setShowWatched(!showWatched); setShowFavorites(false); setShowWatchlist(false); setShowProfile(false); }}
                watchedCount={watchedHistory.length}
              />

              <main className="main">
                <SearchBar query={query} onChange={setQuery} />

             
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
                        <span className="history-label">Trending 🔥:</span>
                        {trendingSearches.slice(0, 5).map((item, i) => (
                          <button key={i} className="chip chip-trending" onClick={() => setQuery(item.keyword)}>
                            {item.keyword} ({item.count})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              
                <RecommendationSection
                  recommendations={recommendations}
                  trending={trending}
                  genres={genres}
                  loading={recLoading}
                  onViewDetails={handleViewDetails}
                  onToggleFavorite={handleToggleFavorite}
                  isFavorite={isFavorite}
                  onRefresh={() => loadRecommendations(true)}
                />


                {showFavorites && (
                  <FavoritesPage favorites={favorites} onRemove={handleToggleFavorite} />
                )}

              
                {showAdmin && (
                  <AdminPage onClose={() => setShowAdmin(false)} />
                )}

                {showCollections && (
                  <CollectionsPage
                    onClose={() => { setShowCollections(false); setCollectionMovie(null); }}
                    currentMovie={collectionMovie}
                  />
                )}

                {showProfile && (
                  <ProfilePage
                    onClose={() => setShowProfile(false)}
                    onToast={showToast}
                  />
                )}

            
                {showWatchlist && (
                  <WatchlistPage
                    watchlist={watchlist}
                    onRemove={async (id) => {
                      await removeFromWatchlist(id);
                      setWatchlist((prev) => prev.filter((w) => w.id !== id));
                      showToast("Removed from watchlist", "error");
                    }}
                    onViewDetails={handleViewDetails}
                    onMarkWatched={handleMarkWatched}
                    watchedIds={watchedHistory.map((w) => w.movie_id)}
                  />
                )}

                {showWatched && (
                  <WatchedHistoryPage
                    onViewDetails={handleViewDetails}
                    onToast={showToast}
                  />
                )}

                {error && !loading && <div className="error-box">⚠️ {error}</div>}

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
                        isWatchlisted={isInWatchlist(movie.imdbID)}
                        onToggleWatchlistItem={handleToggleWatchlist}
                        isCompareSelected={isInCompare(movie.imdbID)}
                        onToggleCompare={handleToggleCompare}
                        compareDisabled={compareList.length >= 2}
                        isWatched={isWatched(movie.imdbID)}
                        onMarkWatched={handleMarkWatched}
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
                  isWatchlisted={isInWatchlist(selectedMovie.imdbID)}
                  onToggleWatchlistItem={handleToggleWatchlist}
                   onAddToCollection={(movie) => {
                    setCollectionMovie(movie);
                    setShowCollections(true);
                  }}
                />
              )}

              {compareList.length > 0 && (
                <div className="compare-bar">
                  <div className="compare-bar-items">
                    {compareList.map((m) => (
                      <div className="compare-bar-item" key={m.imdbID}>
                        <img
                          src={m.Poster && m.Poster !== "N/A" ? m.Poster : "https://placehold.co/60x90?text=N/A"}
                          alt={m.Title}
                        />
                        <span>{m.Title}</span>
                        <button onClick={() => handleToggleCompare(m)} title="Remove">✕</button>
                      </div>
                    ))}
                    {compareList.length < 2 && (
                      <span className="compare-bar-hint">Select {2 - compareList.length} more movie{2 - compareList.length > 1 ? "s" : ""} to compare</span>
                    )}
                  </div>
                  <div className="compare-bar-actions">
                    <button className="compare-bar-clear" onClick={clearCompare}>Clear</button>
                    {compareList.length === 2 ? (
                      <Link
                        className="compare-bar-go"
                        to={`/compare?movie1=${compareList[0].imdbID}&movie2=${compareList[1].imdbID}`}
                      >
                        Compare Now
                      </Link>
                    ) : (
                      <button className="compare-bar-go" disabled>Compare Now</button>
                    )}
                  </div>
                </div>
              )}
            </>
          }
        />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/watched" element={
          <WatchedHistoryPage onViewDetails={handleViewDetails} onToast={showToast} />
        } />
        <Route path="/dashboard" element={
          <DashboardPage onViewDetails={handleViewDetails} onToast={showToast} />
        } />
      </Routes>
    </div>
  );
}

export default App;
