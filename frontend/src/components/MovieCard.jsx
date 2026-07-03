import React from "react";

function MovieCard({
  movie,
  isAdded, onToggleWatchlist,
  onViewDetails,
  isWatchlisted, onToggleWatchlistItem,
  isCompareSelected, onToggleCompare, compareDisabled,
  isWatched, onMarkWatched,
}) {
  const posterSrc =
    movie.Poster && movie.Poster !== "N/A"
      ? movie.Poster
      : "https://placehold.co/300x450?text=No+Poster";

  return (
    <div
      className={`card ${isCompareSelected ? "card-compare-selected" : ""} ${isWatched ? "card-watched" : ""}`}
      onClick={() => onViewDetails(movie.imdbID)}
    >
      <div className="card-poster-wrap">
        <img src={posterSrc} alt={movie.Title} className="card-poster" />
        <span className="card-year-badge">{movie.Year}</span>
        {isWatched && <span className="card-watched-badge"> Watched</span>}
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

        {onMarkWatched && (
          <button
            className={`watched-btn ${isWatched ? "active" : ""}`}
            onClick={(e) => { e.stopPropagation(); onMarkWatched(movie); }}
            title={isWatched ? "Already watched" : "Mark as watched"}
            disabled={isWatched}
          >
            {isWatched ? " Watched" : " Mark as Watched"}
          </button>
        )}

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
