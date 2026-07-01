import React from "react";

function MovieCard({ movie, isAdded, onToggleWatchlist, onViewDetails, isWatchlisted, onToggleWatchlistItem, isCompareSelected, onToggleCompare, compareDisabled }) {
  const posterSrc =
    movie.Poster && movie.Poster !== "N/A"
      ? movie.Poster
      : "https://placehold.co/300x450?text=No+Poster";

  return (
    <div className={`card ${isCompareSelected ? "card-compare-selected" : ""}`} onClick={() => onViewDetails(movie.imdbID)}>
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
            {isWatchlisted ? " Watchlist" : " Watch Later"}
          </button>
        </div>
        {onToggleCompare && (
          <button
            className={`compare-btn ${isCompareSelected ? "active" : ""}`}
            disabled={!isCompareSelected && compareDisabled}
            onClick={(e) => { e.stopPropagation(); onToggleCompare(movie); }}
            title={isCompareSelected ? "Remove from comparison" : "Add to comparison"}
          >
            {isCompareSelected ? "✓ Added to Compare" : "⚖️ Compare"}
          </button>
        )}
      </div>
    </div>
  );
}

export default MovieCard;
