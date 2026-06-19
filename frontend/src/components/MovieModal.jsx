import React, { useEffect, useState } from "react";
import StarRating from "./StarRating";
import { useAuth } from "../context/AuthContext";
import {
  getMovieReviews,
  getAverageRating,
  addReview,
  updateReview,
  deleteReview,
} from "../api/movieApi";

function MovieModal({ movie, isAdded, onToggleWatchlist, onClose, isWatchlisted, onToggleWatchlistItem, onAddToCollection }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [avgRatingInfo, setAvgRatingInfo] = useState({ average_rating: 0, total_reviews: 0 });
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewError, setReviewError] = useState("");

  async function loadReviewsAndRating() {
    if (!movie?.imdbID) return;
    setLoadingReviews(true);
    setReviewError("");
    try {
      const data = await getMovieReviews(movie.imdbID);
      setReviews(data);
      const avg = await getAverageRating(movie.imdbID);
      setAvgRatingInfo(avg);
      
      const myReview = data.find((r) => r.username === user?.username);
      if (myReview) {
        setRating(myReview.rating);
        setReviewText(myReview.review);
        setEditingReviewId(myReview.id);
      } else {
        setRating(0);
        setReviewText("");
        setEditingReviewId(null);
      }
    } catch (err) {
      console.error("Failed to load reviews", err);
      setReviewError("Could not load reviews.");
    } finally {
      setLoadingReviews(false);
    }
  }

  useEffect(() => {
    if (movie?.imdbID) {
      loadReviewsAndRating();
    }
  }, [movie?.imdbID, user?.username]);

  async function handleSubmitReview(e) {
    e.preventDefault();
    if (rating === 0) {
      setReviewError("Please select a rating of at least 1 star.");
      return;
    }
    setReviewError("");
    try {
      if (editingReviewId) {
        await updateReview(editingReviewId, rating, reviewText);
      } else {
        await addReview(movie.imdbID, rating, reviewText);
      }
      loadReviewsAndRating();
    } catch (err) {
      setReviewError(err.response?.data?.detail || err.message || "Failed to submit review.");
    }
  }

  async function handleDeleteReview(reviewId) {
    if (!window.confirm("Are you sure you want to delete your review?")) return;
    setReviewError("");
    try {
      await deleteReview(reviewId);
      loadReviewsAndRating();
    } catch (err) {
      setReviewError(err.message || "Failed to delete review.");
    }
  }

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!movie || !movie.Title) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-box" onClick={(e) => e.stopPropagation()}>
          <div className="status-box">
            <div className="spinner"></div>
            <p>Loading details...</p>
          </div>
        </div>
      </div>
    );
  }

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
            <p className="modal-genre"><strong>Genre:</strong> {movie.Genre}</p>
            <p className="modal-director"><strong>Director:</strong> {movie.Director}</p>
            <p className="modal-cast"><strong>Actors:</strong> {movie.Actors}</p>
            {movie.imdbRating && movie.imdbRating !== "N/A" && (
              <StarRating rating={movie.imdbRating} />
            )}
            <p className="modal-plot">{movie.Plot}</p>
            <div className="modal-action-row">
              <button
                className={`watchlist-btn ${isAdded ? "added" : ""}`}
                onClick={() => onToggleWatchlist(movie)}
              >
                {isAdded ? "❤️ Remove Favorite" : "🤍 Add to Favorites"}
              </button>
              <button
                className={`watchlist-btn secondary ${isWatchlisted ? "added" : ""}`}
                onClick={() => onToggleWatchlistItem && onToggleWatchlistItem(movie)}
              >
                {isWatchlisted ? " In Watchlist" : " Watch Later"}
              </button>
              
               <button
                className="watchlist-btn secondary"
                onClick={() => onAddToCollection && onAddToCollection(movie)}
              >
                🗂️ Add to Collection
              </button>
              
            </div>

        
            <div className="reviews-section">
              <div className="reviews-title">
                <h3>User Reviews</h3>
                {avgRatingInfo.total_reviews > 0 && (
                  <span className="avg-rating-badge">
                     {avgRatingInfo.average_rating} ({avgRatingInfo.total_reviews} reviews)
                  </span>
                )}
              </div>

              {reviewError && <div className="error-box">⚠️ {reviewError}</div>}

        
              <form onSubmit={handleSubmitReview} className="review-form">
                <p className="review-form-title">
                  {editingReviewId ? "Edit your review:" : "Write a review:"}
                </p>
                <div className="star-select">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-select-btn ${(hoverRating || rating) >= star ? "active" : ""}`}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  className="review-textarea"
                  placeholder="Share your thoughts about this movie..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  maxLength={500}
                />
                <div className="review-submit-row">
                  {editingReviewId && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setEditingReviewId(null);
                        setRating(0);
                        setReviewText("");
                      }}
                    >
                      Cancel
                    </button>
                  )}
                  <button type="submit" className="btn-primary">
                    {editingReviewId ? "Update Review" : "Submit Review"}
                  </button>
                </div>
              </form>

             
              {loadingReviews ? (
                <div className="status-box" style={{ padding: "20px 0" }}>
                  <div className="spinner" style={{ width: "24px", height: "24px" }}></div>
                </div>
              ) : reviews.length === 0 ? (
                <p className="fav-empty">No reviews yet. Be the first to review!</p>
              ) : (
                <div className="reviews-list">
                  {reviews.map((r) => (
                    <div key={r.id} className="review-card">
                      <div className="review-header">
                        <span className="review-author">{r.username}</span>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span style={{ color: "var(--star-color)", fontWeight: "bold" }}>
                            {"★".repeat(r.rating)}
                            {"☆".repeat(5 - r.rating)}
                          </span>
                          <span className="review-meta">
                            {new Date(r.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p className="review-body">{r.review}</p>
                      {r.username === user?.username && (
                        <div className="review-actions">
                          <button
                            type="button"
                            className="action-link"
                            onClick={() => {
                              setEditingReviewId(r.id);
                              setRating(r.rating);
                              setReviewText(r.review);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="action-link danger"
                            onClick={() => handleDeleteReview(r.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MovieModal;
