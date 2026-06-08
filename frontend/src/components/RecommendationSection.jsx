import React, { useState, useCallback } from "react";

function RecommendationSection({
  recommendations,
  loading,
  onViewDetails,
  onToggleFavorite,
  isFavorite,
  onRefresh,
}) {
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!loading && recommendations.length === 0) {
    return (
      <section className="rec-section">
        <div className="rec-header">
          <h2 className="rec-title">✨ Recommended For You</h2>
        </div>
        <div className="rec-empty">
          <span className="rec-empty-icon">🎬</span>
          <p className="rec-empty-text">
            Start searching and adding favorites to get personalized recommendations.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rec-section">
      <div className="rec-header">
        <h2 className="rec-title">✨ Recommended For You</h2>
        <button
          className={`rec-refresh-btn ${refreshing ? "spinning" : ""}`}
          onClick={handleRefresh}
          title="Refresh recommendations"
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="rec-carousel">
          {Array(5).fill(null).map((_, i) => (
            <div key={i} className="rec-skeleton" />
          ))}
        </div>
      ) : (
        <div className="rec-carousel">
          {recommendations.map((movie) => (
            <div
              key={movie.imdb_id}
              className="rec-card"
              onClick={() => onViewDetails(movie.imdb_id)}
            >
              <div className="rec-poster-wrap">
                <img
                  src={movie.poster || "https://placehold.co/160x240?text=No+Poster"}
                  alt={movie.title}
                  className="rec-poster"
                />
                <div className="rec-score-badge">⭐ {movie.score}</div>
              </div>
              <div className="rec-card-body">
                <h3 className="rec-card-title">{movie.title}</h3>
                <p className="rec-card-year">{movie.year}</p>
                <p className="rec-card-genre">{movie.genre.split(",")[0]}</p>
                <p className="rec-reason">💡 {movie.reason}</p>
                <button
                  className={`watchlist-btn small ${isFavorite(movie.imdb_id) ? "added" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite({
                      imdbID:     movie.imdb_id,
                      Title:      movie.title,
                      Year:       movie.year,
                      Poster:     movie.poster,
                      imdbRating: "",
                    });
                  }}
                >
                  {isFavorite(movie.imdb_id) ? "✅" : "🔖"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default RecommendationSection;
