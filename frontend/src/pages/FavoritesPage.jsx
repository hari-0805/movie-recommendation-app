import React from "react";
import ProtectedRoute from "../components/ProtectedRoute";

function FavoritesPage({ favorites, onRemove }) {
  return (
    <ProtectedRoute>
      <div className="favorites-panel">
        <h3 className="fav-heading"> My Favorites ({favorites.length})</h3>
        
        {favorites.length === 0 ? (
          <div className="empty-state">
            <p className="empty-icon"></p>
            <p className="empty-title">No favorites yet</p>
            <p className="empty-sub">Search for movies and add them to your favorites!</p>
          </div>
        ) : (
          <div className="fav-list">
            {favorites.map((fav) => (
              <div key={fav.id} className="fav-item">
                <img
                  src={fav.poster || "https://placehold.co/50x70?text=N/A"}
                  alt={fav.title}
                  className="fav-poster"
                />
                <div className="fav-info">
                  <p className="fav-title">{fav.title}</p>
                  <p className="fav-year">{fav.year} • ⭐ {fav.imdb_rating}</p>
                </div>
                <button
                  className="fav-remove"
                  onClick={() => onRemove({
                    imdbID:     fav.imdb_id,
                    Title:      fav.title,
                    Year:       fav.year,
                    Poster:     fav.poster,
                    imdbRating: fav.imdb_rating,
                  })}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

export default FavoritesPage;
