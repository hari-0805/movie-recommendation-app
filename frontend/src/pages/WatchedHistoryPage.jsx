import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getWatchedHistory, removeFromWatched } from "../api/movieApi";

function WatchedHistoryPage({ onViewDetails, onToast }) {
  const [watched, setWatched]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [genreFilter, setGenreFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    async function load() {
      try {
        const data = await getWatchedHistory();
        setWatched(data);
      } catch (e) {
        setError("Failed to load watched history.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleRemove(movieId, title) {
    try {
      await removeFromWatched(movieId);
      setWatched((prev) => prev.filter((m) => m.movie_id !== movieId));
      onToast && onToast(`"${title}" removed from watched history`, "error");
    } catch {
      onToast && onToast("Failed to remove movie", "error");
    }
  }

  // All unique genres
  const allGenres = useMemo(() => {
    const genres = new Set();
    watched.forEach((m) => {
      if (m.genre) m.genre.split(",").forEach((g) => genres.add(g.trim()));
    });
    return ["All", ...Array.from(genres).sort()];
  }, [watched]);

  const filtered = useMemo(() => {
    let list = genreFilter === "All"
      ? watched
      : watched.filter((m) => m.genre?.includes(genreFilter));
    return [...list].sort((a, b) =>
      sortOrder === "newest"
        ? new Date(b.watched_at) - new Date(a.watched_at)
        : new Date(a.watched_at) - new Date(b.watched_at)
    );
  }, [watched, genreFilter, sortOrder]);

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric", month: "short", day: "numeric",
    });
  }

  return (
    <div className="watched-page">
      {/* Header */}
      <div className="watched-header">
        <div>
          <h1 className="watched-title"> Watched History</h1>
          <p className="watched-subtitle">
            {watched.length} movie{watched.length !== 1 ? "s" : ""} watched
          </p>
        </div>
        <Link to="/" className="compare-back-link">← Back to Search</Link>
      </div>

      {/* Controls */}
      {watched.length > 0 && (
        <div className="watched-controls">
          <div className="watched-filters">
            {allGenres.map((g) => (
              <button
                key={g}
                className={`chip ${genreFilter === g ? "chip-active" : ""}`}
                onClick={() => setGenreFilter(g)}
              >
                {g}
              </button>
            ))}
          </div>
          <select
            className="watched-sort"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      )}

      {/* States */}
      {loading && (
        <div className="cards-grid">
          {Array(6).fill(null).map((_, i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="error-box">⚠️ {error}</div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="empty-state">
          <p className="empty-icon"></p>
          <p className="empty-title">No watched movies yet</p>
          <p className="empty-sub">
            Click "Mark as Watched" on any movie card to start your history.
          </p>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="watched-grid">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="watched-card"
              onClick={() => onViewDetails && onViewDetails(m.movie_id)}
            >
              <div className="watched-poster-wrap">
                <img
                  src={m.poster || "https://placehold.co/300x450?text=No+Poster"}
                  alt={m.title}
                  className="watched-poster"
                />
                <span className="watched-badge"> Watched</span>
              </div>
              <div className="watched-info">
                <h3 className="watched-movie-title">{m.title}</h3>
                {m.year && <p className="watched-year">{m.year}</p>}
                {m.genre && (
                  <p className="watched-genre">{m.genre.split(",").slice(0, 2).join(", ")}</p>
                )}
                {m.imdb_rating && m.imdb_rating !== "N/A" && (
                  <p className="watched-imdb">⭐ {m.imdb_rating}/10</p>
                )}
                <p className="watched-date"> {formatDate(m.watched_at)}</p>
                <button
                  className="watched-remove-btn"
                  onClick={(e) => { e.stopPropagation(); handleRemove(m.movie_id, m.title); }}
                  title="Remove from watched history"
                >
                  ✕ Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default WatchedHistoryPage;
