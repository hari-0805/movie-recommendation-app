import React from "react";

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function Stars({ rating }) {
  return (
    <span className="db-stars">
      {Array(5).fill(0).map((_, i) => (
        <span key={i} style={{ color: i < rating ? "#f7b731" : "var(--border)" }}>★</span>
      ))}
    </span>
  );
}

function MovieItem({ poster, title, sub, onClick }) {
  return (
    <div className="db-activity-item" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      <img
        src={poster || "https://placehold.co/48x68?text=N/A"}
        alt={title}
        className="db-activity-poster"
      />
      <div className="db-activity-info">
        <p className="db-activity-title">{title}</p>
        <p className="db-activity-sub">{sub}</p>
      </div>
    </div>
  );
}

function RecentActivity({ data, loading, onViewDetails }) {
  if (loading) {
    return (
      <div className="db-recent-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="db-recent-card db-recent-skeleton" />
        ))}
      </div>
    );
  }

  const { recent_watched = [], recent_favorites = [], recent_reviews = [] } = data || {};
  const hasAny = recent_watched.length > 0 || recent_favorites.length > 0 || recent_reviews.length > 0;

  if (!hasAny) {
    return (
      <div className="db-empty-chart">
        <p></p>
        <p>No recent activity yet.</p>
        <p>Start watching, favoriting, or reviewing movies!</p>
      </div>
    );
  }

  return (
    <div className="db-recent-grid">

      {recent_watched.length > 0 && (
        <div className="db-recent-card">
          <h4 className="db-recent-title"> Recently Watched</h4>
          <div className="db-activity-list">
            {recent_watched.map((m, i) => (
              <MovieItem
                key={i}
                poster={m.poster}
                title={m.title}
                sub={` ${formatDate(m.watched_date)}`}
                onClick={() => onViewDetails && onViewDetails(m.movie_id)}
              />
            ))}
          </div>
        </div>
      )}

      {recent_favorites.length > 0 && (
        <div className="db-recent-card">
          <h4 className="db-recent-title">❤️ Recent Favorites</h4>
          <div className="db-activity-list">
            {recent_favorites.map((m, i) => (
              <MovieItem
                key={i}
                poster={m.poster}
                title={m.title}
                sub="Added to favorites"
                onClick={() => onViewDetails && onViewDetails(m.movie_id)}
              />
            ))}
          </div>
        </div>
      )}

      {recent_reviews.length > 0 && (
        <div className="db-recent-card">
          <h4 className="db-recent-title">✍️ Recent Reviews</h4>
          <div className="db-activity-list">
            {recent_reviews.map((r, i) => (
              <div key={i} className="db-activity-item">
                <div className="db-review-badge">
                  <Stars rating={r.rating} />
                </div>
                <div className="db-activity-info">
                  <p className="db-activity-title">{r.movie_title}</p>
                  <p className="db-activity-sub">{r.review ? `"${r.review}…"` : ""}</p>
                  <p className="db-activity-sub"> {formatDate(r.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default RecentActivity;
