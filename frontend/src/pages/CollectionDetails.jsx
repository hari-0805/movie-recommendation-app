import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getCollectionById, removeMovieFromCollection } from "../api/movieApi";

function CollectionDetails({ onViewDetails, onToast }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [col,     setCol]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    getCollectionById(id)
      .then(setCol)
      .catch((e) => setError(e.response?.data?.detail?.message || "Collection not found."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleRemoveMovie(movieId, title) {
    if (!window.confirm(`Remove "${title}" from this collection?`)) return;
    try {
      const updated = await removeMovieFromCollection(Number(id), movieId);
      setCol(updated);
      onToast?.(`"${title}" removed`, "error");
    } catch (e) {
      onToast?.(e.response?.data?.detail?.message || "Failed to remove", "error");
    }
  }

  if (loading) return (
    <div className="col-page">
      <div className="col-detail-loading">
        <div className="spinner" />
        <p>Loading collection…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="col-page">
      <div className="error-box">⚠️ {error}</div>
      <Link to="/collections" className="compare-back-link" style={{ marginTop: 16, display: "inline-block" }}>← Back to Collections</Link>
    </div>
  );

  return (
    <div className="col-page">
      {/* Header */}
      <div className="col-detail-header-bar">
        <Link to="/collections" className="compare-back-link">← Collections</Link>
        <span className={`col-visibility-badge standalone ${col.is_public ? "public" : "private"}`}>
          {col.is_public ? " Public" : " Private"}
        </span>
      </div>

      <div className="col-detail-hero">
        <span className="col-detail-emoji">{col.emoji}</span>
        <div>
          <h1 className="col-detail-name">{col.name}</h1>
          {col.description && <p className="col-detail-desc">{col.description}</p>}
          <p className="col-detail-count">
            {col.movie_count} movie{col.movie_count !== 1 ? "s" : ""}
            {col.owner_username && <span className="col-detail-owner"> · by {col.owner_username}</span>}
          </p>
        </div>
      </div>

      {/* Movies grid */}
      {col.movies?.length === 0 ? (
        <div className="col-detail-empty">
          <p className="col-empty-icon">🎬</p>
          <p className="col-empty-title">No movies in this collection yet.</p>
          <p className="col-empty-sub">Add movies from the search page via the "Add to Collection" button.</p>
        </div>
      ) : (
        <div className="col-detail-grid">
          {col.movies.map((m) => (
            <div key={m.movie_id} className="col-movie-card">
              <div
                className="col-movie-poster-wrap"
                onClick={() => onViewDetails && onViewDetails(m.movie_id)}
              >
                <img
                  src={m.poster || "https://placehold.co/160x240?text=No+Poster"}
                  alt={m.title}
                  className="col-movie-poster"
                />
              </div>
              <div className="col-movie-info">
                <p
                  className="col-movie-title"
                  onClick={() => onViewDetails && onViewDetails(m.movie_id)}
                  style={{ cursor: "pointer" }}
                >
                  {m.title}
                </p>
                {m.year  && <p className="col-movie-year">{m.year}</p>}
                {m.genre && <p className="col-movie-genre">{m.genre.split(",")[0]}</p>}
              </div>
              <button
                className="col-movie-remove"
                onClick={() => handleRemoveMovie(m.movie_id, m.title)}
                title="Remove from collection"
              >
                ✕ Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CollectionDetails;
