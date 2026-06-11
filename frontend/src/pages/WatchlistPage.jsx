import React from "react";

function WatchlistPage({ watchlist, onRemove, onViewDetails }) {
  return (
    <div className="watchlist-panel">
      <h3 className="fav-heading"> My Watchlist ({watchlist.length})</h3>

      {watchlist.length === 0 ? (
        <div className="empty-state">
          <p className="empty-icon"></p>
          <p className="empty-title">Your watchlist is empty</p>
          <p className="empty-sub">
            Start adding movies to watch later.
          </p>
        </div>
      ) : (
        <div className="fav-list">
          {watchlist.map((item) => (
            <div
              key={item.id}
              className="fav-item"
              style={{ cursor: "pointer" }}
              onClick={() => onViewDetails(item.movie_id)}
            >
              <img
                src={item.poster || "https://placehold.co/50x70?text=N/A"}
                alt={item.title}
                className="fav-poster"
              />
              <div className="fav-info">
                <p className="fav-title">{item.title}</p>
                <p className="fav-year">{item.year}</p>
                {item.genre && (
                  <p className="fav-genre">{item.genre.split(",")[0]}</p>
                )}
              </div>
              <button
                className="fav-remove"
                title="Remove from watchlist"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(item.id);
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default WatchlistPage;
