import React, { useState } from "react";

function WatchlistPage({ watchlist, onRemove, onViewDetails, onMarkWatched, watchedIds }) {
  const [tab, setTab] = useState("watchlist");

  const watchedList = watchlist.filter((item) => watchedIds?.includes(item.movie_id));
  const pendingList = watchlist.filter((item) => !watchedIds?.includes(item.movie_id));
  const displayList = tab === "watched" ? watchedList : pendingList;

  return (
    <div className="watchlist-panel">
      <div className="watchlist-tabs">
        <button
          className={`watchlist-tab ${tab === "watchlist" ? "active" : ""}`}
          onClick={() => setTab("watchlist")}
        >
           Watchlist
          {pendingList.length > 0 && (
            <span className="nav-badge" style={{ marginLeft: 6 }}>{pendingList.length}</span>
          )}
        </button>
        <button
          className={`watchlist-tab ${tab === "watched" ? "active" : ""}`}
          onClick={() => setTab("watched")}
        >
           Watched
          {watchedList.length > 0 && (
            <span className="nav-badge" style={{ marginLeft: 6 }}>{watchedList.length}</span>
          )}
        </button>
      </div>

      {displayList.length === 0 ? (
        <div className="empty-state">
          <p className="empty-icon">{tab === "watchlist" ? "" : ""}</p>
          <p className="empty-title">
            {tab === "watchlist" ? "Your watchlist is empty" : "No watched movies here yet"}
          </p>
          <p className="empty-sub">
            {tab === "watchlist"
              ? "Add movies to watch later."
              : "Mark watchlist movies as watched to see them here."}
          </p>
        </div>
      ) : (
        <div className="fav-list">
          {displayList.map((item) => (
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
                {item.genre && <p className="fav-genre">{item.genre.split(",")[0]}</p>}
              </div>
              <div className="fav-actions" onClick={(e) => e.stopPropagation()}>
                {tab === "watchlist" && onMarkWatched && (
                  <button
                    className="watched-btn mini"
                    title="Mark as watched"
                    onClick={() => onMarkWatched(item)}
                  >
                     Watched
                  </button>
                )}
                <button
                  className="fav-remove"
                  title="Remove"
                  onClick={() => onRemove(item.id)}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default WatchlistPage;
