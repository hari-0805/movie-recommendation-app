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

// ── SEARCH HISTORY ────────────────────────────
export async function getRecentSearches() {
  const res = await axiosInstance.get("/history");
  return res.data;
}

export async function getTrendingSearches() {
  const res = await axiosInstance.get("/history/trending");
  return res.data;
}

// ── REVIEWS ───────────────────────────────────
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

// ── RECOMMENDATIONS ───────────────────────────────────────────────────────────
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

// ── WATCHLIST ─────────────────────────────────────────────────────────────────
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

// ── PROFILE 
export async function getProfile() {
  const res = await axiosInstance.get("/profile");
  return res.data;
}

export async function updateProfile(username, email) {
  const res = await axiosInstance.put("/profile", { username, email });
  return res.data;
}

export async function changePassword(currentPassword, newPassword, confirmPassword) {
  const res = await axiosInstance.put("/profile/password", {
    current_password: currentPassword,
    new_password:     newPassword,
    confirm_password: confirmPassword,
  });
  return res.data;
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const res = await axiosInstance.get("/admin/stats");
  return res.data;
}

export async function getAdminUsers(page = 1, limit = 10, search = "") {
  const res = await axiosInstance.get(
    `/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
  );
  return res.data;
}

export async function deleteAdminUser(userId) {
  const res = await axiosInstance.delete(`/admin/users/${userId}`);
  return res.data;
}

export async function toggleAdminRole(userId) {
  const res = await axiosInstance.patch(`/admin/users/${userId}/toggle-admin`);
  return res.data;
}

export async function getAdminReviews(page = 1, limit = 10, search = "") {
  const res = await axiosInstance.get(
    `/admin/reviews?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
  );
  return res.data;
}

export async function deleteAdminReview(reviewId) {
  const res = await axiosInstance.delete(`/admin/reviews/${reviewId}`);
  return res.data;
}
// ── COLLECTIONS — paste at bottom of movieApi.js ─────────────────────────────

export async function getCollections() {
  const res = await axiosInstance.get("/collections");
  return res.data.data;
}

export async function createCollection(name, description, emoji) {
  const res = await axiosInstance.post("/collections", { name, description, emoji });
  return res.data.data;
}

export async function updateCollection(id, name, description, emoji) {
  const res = await axiosInstance.put(`/collections/${id}`, { name, description, emoji });
  return res.data.data;
}

export async function deleteCollection(id) {
  const res = await axiosInstance.delete(`/collections/${id}`);
  return res.data;
}

export async function addMovieToCollection(collectionId, movie) {
  const res = await axiosInstance.post(`/collections/${collectionId}/movies`, {
    movie_id: movie.imdbID || movie.movie_id,
    title:    movie.Title  || movie.title  || "",
    year:     movie.Year   || movie.year   || "",
    poster:   (movie.Poster !== "N/A" ? movie.Poster : "") || movie.poster || "",
    genre:    movie.Genre  || movie.genre  || "",
  });
  return res.data.data;
}

export async function removeMovieFromCollection(collectionId, movieId) {
  const res = await axiosInstance.delete(`/collections/${collectionId}/movies/${movieId}`);
  return res.data.data;
}