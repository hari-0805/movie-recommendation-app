import React, { useEffect, useState } from "react";
import { getPreferences, addPreference, deletePreference } from "../../api/movieApi";

const COMMON_GENRES = [
  "Action", "Adventure", "Animation", "Biography", "Comedy",
  "Crime", "Documentary", "Drama", "Fantasy", "History",
  "Horror", "Musical", "Mystery", "Romance", "Sci-Fi",
  "Sport", "Thriller", "War", "Western",
];

function GenrePreferences({ onToast }) {
  const [prefs,   setPrefs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding,  setAdding]  = useState(false);
  const [genre,   setGenre]   = useState("");
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    getPreferences()
      .then(setPrefs)
      .catch(() => setPrefs([]))
      .finally(() => setLoading(false));
  }, []);

  const availableGenres = COMMON_GENRES.filter(
    (g) => !prefs.some((p) => p.genre.toLowerCase() === g.toLowerCase())
  );

  async function handleAdd(e) {
    e.preventDefault();
    const g = genre.trim();
    if (!g) return;
    setAdding(true);
    try {
      const newPref = await addPreference(g);
      setPrefs((prev) => [...prev, newPref]);
      setGenre("");
      onToast(`"${newPref.genre}" added to preferences`, "success");
    } catch (err) {
      onToast(err.response?.data?.detail?.message || "Failed to add genre", "error");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(pref) {
    setRemoving(pref.id);
    try {
      await deletePreference(pref.id);
      setPrefs((prev) => prev.filter((p) => p.id !== pref.id));
      onToast(`"${pref.genre}" removed`, "error");
    } catch {
      onToast("Failed to remove genre", "error");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="genre-prefs-section">
      <h3 className="profile-section-title"> Genre Preferences</h3>

      {loading ? (
        <p className="profile-loading-text">Loading preferences…</p>
      ) : (
        <>
          <div className="genre-chips">
            {prefs.length === 0 ? (
              <p className="profile-empty-text">No genre preferences yet. Add some below!</p>
            ) : (
              prefs.map((p) => (
                <span key={p.id} className="genre-chip">
                  {p.genre}
                  <button
                    className="genre-chip-remove"
                    onClick={() => handleRemove(p)}
                    disabled={removing === p.id}
                    title={`Remove ${p.genre}`}
                  >
                    {removing === p.id ? "…" : "✕"}
                  </button>
                </span>
              ))
            )}
          </div>

          <form onSubmit={handleAdd} className="genre-add-form">
            <select
              className="form-input genre-select"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            >
              <option value="">Select a genre…</option>
              {availableGenres.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <button
              type="submit"
              className="genre-add-btn"
              disabled={adding || !genre}
            >
              {adding ? "Adding…" : "+ Add"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default GenrePreferences;
