import React, { useEffect } from "react";
import StarRating from "./StarRating";

function MovieModal({ movie, isAdded, onToggleWatchlist, onClose }) {
  
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const posterSrc =
    movie.Poster && movie.Poster !== "N/A"
      ? movie.Poster
      : "https://placehold.co/300x450?text=No+Poster";

  return (
  
    <div className="modal-backdrop" onClick={onClose}>

      
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>

      
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-content">
      
          <img src={posterSrc} alt={movie.Title} className="modal-poster" />

      
          <div className="modal-info">
            <h2 className="modal-title">{movie.Title}</h2>

            <div className="modal-meta-row">
              <span className="modal-badge">{movie.Year}</span>
              <span className="modal-badge">{movie.Rated}</span>
              <span className="modal-badge">{movie.Runtime}</span>
            </div>

            <p className="modal-genre">🎭 {movie.Genre}</p>
            <p className="modal-director"> Director: {movie.Director}</p>
            <p className="modal-cast"> Cast: {movie.Actors}</p>

         
            {movie.imdbRating && movie.imdbRating !== "N/A" && (
              <StarRating rating={movie.imdbRating} />
            )}

           
            <p className="modal-plot">{movie.Plot}</p>

            <button
              className={`watchlist-btn ${isAdded ? "added" : ""}`}
              onClick={() => onToggleWatchlist(movie.imdbID)}
            >
              {isAdded ? "Remove from Watchlist" : "Add to Watchlist"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MovieModal;
