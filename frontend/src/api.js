

const BASE_URL = "http://localhost:8000";

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
}

export async function registerUser(username, email, password) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Registration failed");
  return data;
}

export async function loginUser(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Login failed");
  localStorage.setItem("token", data.access_token);
  return data;
}

export function logoutUser() {
  localStorage.removeItem("token");
}

export function isLoggedIn() {
  return !!localStorage.getItem("token");
}

export async function searchMovies(query, page = 1) {
  const res = await fetch(
    `${BASE_URL}/movies/search?title=${encodeURIComponent(query)}&page=${page}`
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Search failed");
  return {
    movies: data.results,
    totalResults: data.total,
  };
}

export async function getMovieDetails(imdbID) {
  const res = await fetch(`${BASE_URL}/movies/${imdbID}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Movie not found");
  return data;
}

export async function getFavorites() {
  const token = getToken();
  if (!token) return [];
  const res = await fetch(`${BASE_URL}/favorites`, {
    headers: authHeaders(),
  });
  if (res.status === 401) return [];
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to get favorites");
  return data;
}

export async function addFavorite(movie) {
  const res = await fetch(`${BASE_URL}/favorites`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      imdb_id:     movie.imdbID,
      title:       movie.Title,
      year:        movie.Year       || "N/A",
      poster:      movie.Poster !== "N/A" ? movie.Poster : "",
      imdb_rating: movie.imdbRating || "N/A",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to add favorite");
  return data;
}

export async function removeFavorite(id) {
  const res = await fetch(`${BASE_URL}/favorites/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (res.status === 204) return;
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.detail || "Failed to remove favorite");
  }
}