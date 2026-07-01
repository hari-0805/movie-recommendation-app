import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { compareMovies } from "../api/movieApi";

function Stat({ label, children }) {
  return (
    <div className="compare-stat-row">
      <span className="compare-stat-label">{label}</span>
      <span className="compare-stat-value">{children}</span>
    </div>
  );
}

function MovieColumn({ movie, winner }) {
  const posterSrc =
    movie.Poster && movie.Poster !== "N/A"
      ? movie.Poster
      : "https://placehold.co/300x450?text=No+Poster";

  return (
    <div className={`compare-column ${winner ? "compare-winner" : ""}`}>
      {winner && <span className="compare-winner-badge"> Better Pick</span>}
      <img src={posterSrc} alt={movie.Title} className="compare-poster" />
      <h2 className="compare-movie-title">{movie.Title}</h2>

      <Stat label="Release Year">{movie.Year || "N/A"}</Stat>
      <Stat label="Genre">{movie.Genre || "N/A"}</Stat>
      <Stat label="Runtime">{movie.Runtime || "N/A"}</Stat>
      <Stat label="Director">{movie.Director || "N/A"}</Stat>
      <Stat label="Cast">{movie.Actors || "N/A"}</Stat>
      <Stat label="IMDb Rating">
        {movie.imdbRating && movie.imdbRating !== "N/A" ? `⭐ ${movie.imdbRating}/10` : "N/A"}
      </Stat>
      <Stat label="User Rating">
        {movie.total_reviews > 0 ? `★ ${movie.average_rating}/5` : "No reviews yet"}
      </Stat>
      <Stat label="Total Reviews">{movie.total_reviews ?? 0}</Stat>

      <div className="compare-plot">
        <span className="compare-stat-label">Plot</span>
        <p>{movie.Plot && movie.Plot !== "N/A" ? movie.Plot : "No plot available."}</p>
      </div>
    </div>
  );
}

function ComparePage() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const movie1Id = searchParams.get("movie1");
  const movie2Id = searchParams.get("movie2");
  const movie3Id = searchParams.get("movie3");

  useEffect(() => {
    if (!movie1Id || !movie2Id) {
      setError("Please select two movies to compare.");
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError("");
      try {
        const result = await compareMovies(movie1Id, movie2Id, movie3Id);
        setData(result);
      } catch (err) {
        setError(err.response?.data?.detail?.message || err.response?.data?.detail || err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [movie1Id, movie2Id, movie3Id]);

  if (loading) {
    return (
      <div className="compare-page">
        <p className="compare-loading">Loading comparison…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="compare-page">
        <div className="error-box">⚠️ {error}</div>
        <Link to="/" className="compare-back-link">← Back to Search</Link>
      </div>
    );
  }

  const movies = [data.movie1, data.movie2, data.movie3].filter(Boolean);

  const numericImdb = (m) => parseFloat(m.imdbRating) || 0;
  const numericUser = (m) => parseFloat(m.average_rating) || 0;
  const numericReviews = (m) => m.total_reviews || 0;

  const bestImdb = movies.reduce((a, b) => (numericImdb(b) > numericImdb(a) ? b : a));
  const bestUser = movies.reduce((a, b) => (numericUser(b) > numericUser(a) ? b : a));
  const bestReviews = movies.reduce((a, b) => (numericReviews(b) > numericReviews(a) ? b : a));

  // overall winner: whichever movie wins the most of the three categories
  const scores = {};
  movies.forEach((m) => { scores[m.imdbID] = 0; });
  [bestImdb, bestUser, bestReviews].forEach((m) => { scores[m.imdbID] += 1; });
  const topScore = Math.max(...Object.values(scores));
  const overallWinners = movies.filter((m) => scores[m.imdbID] === topScore);
  const overallWinner = overallWinners.length === 1 ? overallWinners[0] : null;

  const summaryMessages = [];
  if (numericImdb(bestImdb) > 0 && movies.some((m) => numericImdb(m) !== numericImdb(bestImdb))) {
    summaryMessages.push(`${bestImdb.Title} has a higher IMDb rating than ${movies.filter((m) => m !== bestImdb).map((m) => m.Title).join(" and ")}.`);
  }
  if (numericUser(bestUser) > 0 && movies.some((m) => numericUser(m) !== numericUser(bestUser))) {
    summaryMessages.push(`${bestUser.Title} has a higher user rating than ${movies.filter((m) => m !== bestUser).map((m) => m.Title).join(" and ")}.`);
  }
  if (numericReviews(bestReviews) > 0 && movies.some((m) => numericReviews(m) !== numericReviews(bestReviews))) {
    summaryMessages.push(`${bestReviews.Title} has more reviews than ${movies.filter((m) => m !== bestReviews).map((m) => m.Title).join(" and ")}.`);
  }

  return (
    <div className="compare-page">
      <div className="compare-header">
        <h1>Compare Movies</h1>
        <Link to="/" className="compare-back-link">← Back to Search</Link>
      </div>

      <div className="compare-summary glass-panel">
        <h3>Comparison Summary</h3>
        {overallWinner ? (
          <p className="compare-summary-highlight">
             Overall, <strong>{overallWinner.Title}</strong> looks like the better pick.
          </p>
        ) : (
          <p className="compare-summary-highlight">It's a close call — these movies are evenly matched!</p>
        )}
        <ul className="compare-summary-list">
          {summaryMessages.length > 0
            ? summaryMessages.map((msg, i) => <li key={i}>{msg}</li>)
            : <li>Not enough data to compare ratings yet.</li>}
        </ul>
      </div>

      <div className={`compare-grid compare-grid-${movies.length}`}>
        {movies.map((m) => (
          <MovieColumn key={m.imdbID} movie={m} winner={overallWinner?.imdbID === m.imdbID} />
        ))}
      </div>
    </div>
  );
}

export default ComparePage;
