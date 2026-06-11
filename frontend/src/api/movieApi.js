import axiosInstance from "./axiosInstance";

export async function registerUser(username, email, password) {
  const res = await axiosInstance.post("/auth/register", {
    username,
    email,
    password,
  });
  return res.data;
}

export async function loginUser(email, password) {
  const res = await axiosInstance.post("/auth/login", { email, password });
  return res.data;
}

export async function searchMovies(query, page = 1) {
  const res = await axiosInstance.get(
    `/movies/search?title=${encodeURIComponent(query)}&page=${page}`
  );
  return {
    movies:       res.data.results,
    totalResults: res.data.total,
  };
}

export async function getMovieDetails(imdbID) {
  const res = await axiosInstance.get(`/movies/${imdbID}`);
  return res.data;
}

export async function getFavorites() {
  const res = await axiosInstance.get("/favorites");
  return res.data;
}

export async function addFavorite(movie) {
  const res = await axiosInstance.post("/favorites", {
    imdb_id:     movie.imdbID,
    title:       movie.Title,
    year:        movie.Year        || "N/A",
    poster:      movie.Poster !== "N/A" ? movie.Poster : "",
    imdb_rating: movie.imdbRating  || "N/A",
  });
  return res.data;
}

export async function removeFavorite(id) {
  await axiosInstance.delete(`/favorites/${id}`);
}

export async function getRecentSearches() {
  const res = await axiosInstance.get("/history");
  return res.data;
}

export async function getTrendingSearches() {
  const res = await axiosInstance.get("/history/trending");
  return res.data;
}

export async function getMovieReviews(imdbID) {
  const res = await axiosInstance.get(`/reviews/${imdbID}`);
  return res.data;
}

export async function getAverageRating(imdbID) {
  const res = await axiosInstance.get(`/reviews/${imdbID}/average`);
  return res.data;
}

export async function addReview(imdbID, rating, reviewText) {
  const res = await axiosInstance.post("/reviews", {
    imdb_id: imdbID,
    rating,
    review:  reviewText,
  });
  return res.data;
}

export async function updateReview(reviewID, rating, reviewText) {
  const res = await axiosInstance.put(`/reviews/${reviewID}`, {
    rating,
    review:  reviewText,
  });
  return res.data;
}

export async function deleteReview(reviewID) {
  await axiosInstance.delete(`/reviews/${reviewID}`);
}

export async function getRecommendations(limit = 10, forceRefresh = false) {
  const res = await axiosInstance.get(
    `/recommendations?limit=${limit}&refresh=${forceRefresh}`
  );
  return res.data.recommended_movies;
}

export async function markMovieViewed(imdb_id, title, genre = "", year = "", poster = "") {
  const params = new URLSearchParams({ title, genre, year, poster });
  await axiosInstance.post(`/recommendations/viewed/${imdb_id}?${params}`);
}

export async function getTrendingRecommendations(limit = 10) {
  const res = await axiosInstance.get(`/recommendations/trending?limit=${limit}`);
  return res.data.recommended_movies;
}

export async function getGenreAnalytics() {
  const res = await axiosInstance.get("/recommendations/genres");
  return res.data.genres;
}
export async function getWatchlist() {
  const res = await axiosInstance.get("/watchlist");
  return res.data.data;
}

export async function addToWatchlist(movie) {
  const res = await axiosInstance.post("/watchlist", {
    movie_id: movie.imdbID,
    title:    movie.Title,
    year:     movie.Year    || "",
    poster:   movie.Poster !== "N/A" ? (movie.Poster || "") : "",
    genre:    movie.Genre   || "",
  });
  return res.data.data;
}

export async function removeFromWatchlist(id) {
  await axiosInstance.delete(`/watchlist/${id}`);
}
