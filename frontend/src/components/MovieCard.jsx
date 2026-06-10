import React from "react";

function MovieCard({ movie, isAdded, onToggleWatchlist, onViewDetails, isWatchlisted, onToggleWatchlistItem }) {
  const posterSrc =
    movie.Poster && movie.Poster !== "N/A"
      ? movie.Poster
      : "https://placehold.co/300x450?text=No+Poster";

  return (
    <div className="card" onClick={() => onViewDetails(movie.imdbID)}>
      <div className="card-poster-wrap">
        <img src={posterSrc} alt={movie.Title} className="card-poster" />
        <span className="card-year-badge">{movie.Year}</span>
      </div>
      <div className="card-body">
        <h2 className="card-title">{movie.Title}</h2>
        <p className="card-meta">{movie.Type?.toUpperCase()}</p>
        <div className="card-actions">
          <button
            className={`watchlist-btn ${isAdded ? "added" : ""}`}
            onClick={(e) => { e.stopPropagation(); onToggleWatchlist(movie); }}
            title={isAdded ? "Remove from favorites" : "Add to favorites"}
          >
            {isAdded ? "❤️ Favorited" : "🤍 Favorite"}
          </button>
          <button
            className={`watchlist-btn secondary ${isWatchlisted ? "added" : ""}`}
            onClick={(e) => { e.stopPropagation(); onToggleWatchlistItem(movie); }}
            title={isWatchlisted ? "Remove from watchlist" : "Watch later"}
          >
            {isWatchlisted ? "✅ Watchlist" : "🔖 Watch Later"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MovieCard;
