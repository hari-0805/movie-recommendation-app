import React from "react";

function MovieCard({ movie, isAdded, onToggleWatchlist, onViewDetails }) {

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

        <button
          className={`watchlist-btn ${isAdded ? "added" : ""}`}
          onClick={(e) => {
            e.stopPropagation(); 
            onToggleWatchlist(movie.imdbID);
          }}
        >
          {isAdded ? "Added" : "Add to Watchlist"}
        </button>
      </div>
    </div>
  );
}

export default MovieCard;
