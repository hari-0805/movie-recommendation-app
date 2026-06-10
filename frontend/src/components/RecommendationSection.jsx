import React, { useState } from "react";
import GenreChart from "./GenreChart";

function RecommendationSection({
  recommendations,
  trending,
  genres,
  loading,
  onViewDetails,
  onToggleFavorite,
  isFavorite,
  onRefresh,
}) {
  const [activeTab, setActiveTab] = useState("foryou"); // "foryou" | "trending"
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }

  const activeList = activeTab === "foryou" ? recommendations : trending;

  return (
    <section className="rec-section">
      {/* Header */}
      <div className="rec-header">
        <div className="rec-tabs">
          <button
            className={`rec-tab ${activeTab === "foryou" ? "active" : ""}`}
            onClick={() => setActiveTab("foryou")}
          >
            ✨ For You
          </button>
          <button
            className={`rec-tab ${activeTab === "trending" ? "active" : ""}`}
            onClick={() => setActiveTab("trending")}
          >
            🔥 Trending
          </button>
        </div>
        <button
          className={`rec-refresh-btn ${refreshing ? "spinning" : ""}`}
          onClick={handleRefresh}
          title="Refresh recommendations"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Genre analytics chart */}
      {activeTab === "foryou" && genres && genres.length > 0 && (
        <GenreChart genres={genres} />
      )}

      {/* Empty state */}
      {!loading && activeList.length === 0 && (
        <div className="rec-empty">
          <span className="rec-empty-icon">🎬</span>
          <p className="rec-empty-text">
            {activeTab === "foryou"
              ? "Start searching and adding favorites to get personalized recommendations."
              : "No trending movies yet. Start searching!"}
          </p>
        </div>
      )}

      {/* Movie carousel */}
      {loading ? (
        <div className="rec-carousel">
          {Array(5).fill(null).map((_, i) => <div key={i} className="rec-skeleton" />)}
        </div>
      ) : activeList.length > 0 ? (
        <div className="rec-carousel">
          {activeList.map((movie) => (
            <div
              key={movie.imdb_id}
              className="rec-card"
              onClick={() => onViewDetails(movie.imdb_id)}
            >
              <div className="rec-poster-wrap">
                <img
                  src={
                    movie.poster ||
                    `https://placehold.co/160x240/1a1a2e/ffffff?text=${encodeURIComponent(
                      movie.title.slice(0, 10)
                    )}`
                  }
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
      ) : null}
    </section>
  );
}

export default RecommendationSection;
