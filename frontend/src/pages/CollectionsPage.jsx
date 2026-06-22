import { useState, useEffect } from "react";
import {
  getCollections, createCollection, updateCollection,
  deleteCollection, addMovieToCollection, removeMovieFromCollection,
} from "../api/movieApi";

const EMOJIS = ["🎬","🎥","🍿","⭐","❤️","🔥","👻","🚀","🦸","🎭","🌙","🏆","😂","💀","🎵","🌟","🎯","💎","🦄","🌈"];

// Sub-components 
function EmojiPicker({ value, onChange }) {
  return (
    <div className="col-emoji-grid">
      {EMOJIS.map(e => (
        <button
          key={e} type="button"
          className={`col-emoji-btn ${value === e ? "selected" : ""}`}
          onClick={() => onChange(e)}
        >{e}</button>
      ))}
    </div>
  );
}

function CollectionCard({ col, onOpen, onEdit, onDelete }) {
  return (
    <div className="col-card" onClick={() => onOpen(col)}>
      {/* Poster mosaic */}
      <div className="col-card-mosaic">
        {col.preview_posters?.length > 0 ? (
          col.preview_posters.slice(0, 4).map((p, i) => (
            <img key={i} src={p} alt="" className="col-mosaic-img" />
          ))
        ) : (
          <div className="col-mosaic-empty">
            <span className="col-mosaic-emoji">{col.emoji}</span>
          </div>
        )}
      </div>

      <div className="col-card-body">
        <div className="col-card-top">
          <span className="col-card-emoji">{col.emoji}</span>
          <h3 className="col-card-name">{col.name}</h3>
        </div>
        {col.description && <p className="col-card-desc">{col.description}</p>}
        <p className="col-card-count">{col.movie_count} movie{col.movie_count !== 1 ? "s" : ""}</p>
      </div>

      <div className="col-card-actions" onClick={e => e.stopPropagation()}>
        <button className="col-action-btn" onClick={() => onEdit(col)} title="Edit">✏️</button>
        <button className="col-action-btn danger" onClick={() => onDelete(col)} title="Delete">❌</button>
      </div>
    </div>
  );
}

function CollectionForm({ initial, onSave, onCancel, loading }) {
  const [name,  setName]  = useState(initial?.name || "");
  const [desc,  setDesc]  = useState(initial?.description || "");
  const [emoji, setEmoji] = useState(initial?.emoji || "🎬");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required"); return; }
    setError("");
    onSave(name.trim(), desc.trim(), emoji);
  }

  return (
    <form onSubmit={handleSubmit} className="col-form">
      <div className="col-form-field">
        <label className="col-form-label">📝 Collection Name</label>
        <input
          className="col-form-input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Marvel Collection"
          maxLength={200}
          required
        />
      </div>

      <div className="col-form-field">
        <label className="col-form-label">📄 Description (optional)</label>
        <textarea
          className="col-form-input"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="What's this collection about?"
          maxLength={1000}
          rows={2}
          style={{ resize: "vertical" }}
        />
      </div>

      <div className="col-form-field">
        <label className="col-form-label">🎨 Pick an Emoji</label>
        <EmojiPicker value={emoji} onChange={setEmoji} />
      </div>

      {error && <div className="col-error">⚠️ {error}</div>}

      <div className="col-form-btns">
        <button type="button" className="col-btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="col-btn-primary" disabled={loading}>
          {loading ? "Saving..." : initial ? "💾 Save Changes" : "✨ Create Collection"}
        </button>
      </div>
    </form>
  );
}

function CollectionDetail({ col, onBack, movies, onRemoveMovie }) {
  return (
    <div className="col-detail">
      <button className="col-back-btn" onClick={onBack}>← Back</button>

      <div className="col-detail-header">
        <span className="col-detail-emoji">{col.emoji}</span>
        <div>
          <h2 className="col-detail-name">{col.name}</h2>
          {col.description && <p className="col-detail-desc">{col.description}</p>}
          <p className="col-detail-count">{col.movie_count} movie{col.movie_count !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {movies.length === 0 ? (
        <div className="col-detail-empty">
          <p className="col-detail-empty-icon">🎬</p>
          <p className="col-detail-empty-text">No movies yet.</p>
          <p className="col-detail-empty-sub">Add movies from the search results or movie details.</p>
        </div>
      ) : (
        <div className="col-detail-grid">
          {movies.map(m => (
            <div key={m.movie_id} className="col-movie-card">
              <img
                src={m.poster || `https://placehold.co/120x180/1a1a2e/ffffff?text=${encodeURIComponent(m.title?.slice(0,8) || "?")}`}
                alt={m.title}
                className="col-movie-poster"
              />
              <div className="col-movie-info">
                <p className="col-movie-title">{m.title}</p>
                <p className="col-movie-year">{m.year}</p>
                {m.genre && <p className="col-movie-genre">{m.genre.split(",")[0]}</p>}
              </div>
              <button
                className="col-movie-remove"
                onClick={() => onRemoveMovie(col.id, m.movie_id, m.title)}
                title="Remove from collection"
              >✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

//Main Component 
function CollectionsPage({ onClose, currentMovie }) {
  const [collections,  setCollections]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [view,         setView]         = useState("list"); // "list" | "create" | "edit" | "detail"
  const [activeCol,    setActiveCol]    = useState(null);
  const [prefill,      setPrefill]      = useState(null);
  const [toast,        setToast]        = useState({ msg: "", type: "" });

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3000);
  }

  // Load collections
  useEffect(() => {
    getCollections()
      .then(setCollections)
      .catch(() => showToast("Failed to load collections", "error"))
      .finally(() => setLoading(false));
  }, []);

  // Create 
  async function handleCreate(name, desc, emoji) {
    setSaving(true);
    try {
      const col = await createCollection(name, desc, emoji);
      setCollections(prev => [col, ...prev]);
      setView("list");
      showToast(`✅ "${name}" created!`);
    } catch (e) {
      showToast("❌ " + (e.response?.data?.detail?.message || "Create failed"), "error");
    } finally { setSaving(false); }
  }

  // Edit 
  async function handleEdit(name, desc, emoji) {
    setSaving(true);
    try {
      const updated = await updateCollection(activeCol.id, name, desc, emoji);
      setCollections(prev => prev.map(c => c.id === updated.id ? updated : c));
      setActiveCol(updated);
      setView("list");
      showToast(`✅ "${name}" updated!`);
    } catch (e) {
      showToast("❌ " + (e.response?.data?.detail?.message || "Update failed"), "error");
    } finally { setSaving(false); }
  }

  // Delete 
  async function handleDelete(col) {
    if (!window.confirm(`Delete "${col.name}"? All movies in it will be removed.`)) return;
    try {
      await deleteCollection(col.id);
      setCollections(prev => prev.filter(c => c.id !== col.id));
      showToast(`✅ "${col.name}" deleted`);
    } catch (error) {
      console.error(error);
      showToast("❌ Delete failed", "error");
    }
  }

  // Add current movie to collection 
  async function handleAddMovie(colId) {
    if (!currentMovie) return;
    try {
      const updated = await addMovieToCollection(colId, currentMovie);
      setCollections(prev => prev.map(c => c.id === updated.id ? updated : c));
      showToast(`✅ Added to collection!`);
    } catch (e) {
      showToast("❌ " + (e.response?.data?.detail?.message || "Add failed"), "error");
    }
  }

  // Remove movie
  async function handleRemoveMovie(colId, movieId, title) {
    if (!window.confirm(`Remove "${title}" from this collection?`)) return;
    try {
      const updated = await removeMovieFromCollection(colId, movieId);
      setCollections(prev => prev.map(c => c.id === colId ? updated : c));
      if (activeCol?.id === colId) setActiveCol(updated);
      showToast(`✅ "${title}" removed`);
    } catch (error) {
      console.error(error);
      showToast("❌ Remove failed", "error");
    }
  }

  function openEdit(col)  { setActiveCol(col); setView("edit"); }
  function openDetail(col) { setActiveCol(col); setView("detail"); }

  // Check if current movie is in a collection
  function movieInCollection(col) {
    return col.movies?.some(m => m.movie_id === (currentMovie?.imdbID || currentMovie?.movie_id));
  }

  return (
    <div className="col-overlay" onClick={onClose}>
      <div className="col-panel" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="col-header">
          <div className="col-header-left">
            {view !== "list" && (
              <button className="col-header-back" onClick={() => setView("list")}>←</button>
            )}
            <div>
              <h2 className="col-header-title">
                {view === "list"   && "🗂️ My Collections"}
                {view === "create" && "✨ New Collection"}
                {view === "edit"   && "✏️ Edit Collection"}
                {view === "detail" && activeCol?.name}
              </h2>
              {view === "list" && <p className="col-header-sub">{collections.length} collection{collections.length !== 1 ? "s" : ""}</p>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {view === "list" && (
              <button className="col-btn-primary small" onClick={() => { setPrefill(null); setView("create"); }}>+ New</button>
            )}
            <button className="col-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Toast */}
        {toast.msg && (
          <div className={`col-toast ${toast.type === "error" ? "error" : ""}`}>{toast.msg}</div>
        )}

        {/* Body */}
        <div className="col-body">

          {/* List view */}
          {view === "list" && (
            loading ? (
              <div className="col-loading">Loading collections...</div>
            ) : collections.length === 0 ? (
              <div className="col-empty">
                <p className="col-empty-icon">🗂️</p>
                <p className="col-empty-title">No collections yet</p>
                <p className="col-empty-sub">Create your first collection to organize movies</p>
                <button className="col-btn-primary" onClick={() => setView("create")}>✨ Create Collection</button>
                <div className="col-suggestions">
                  <p className="col-suggestions-title">Popular ideas:</p>
                  {["🦸 Marvel Collection","🌙 Weekend Movies","👻 Horror Nights","🚀 Top Sci-Fi"].map(s => (
                    <button
                      key={s} className="col-suggestion-chip"
                      onClick={() => {
                        const parts = s.split(" ");
                        const emoji = parts[0];
                        const name = parts.slice(1).join(" ");
                        setPrefill({ name, description: "", emoji });
                        setView("create");
                      }}
                    >{s}</button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {/* If we have a currentMovie, show add-to-collection panel */}
                {currentMovie && (
                  <div className="col-add-to">
                    <p className="col-add-to-label">
                       Add <strong>"{currentMovie.Title || currentMovie.title}"</strong> to:
                    </p>
                    <div className="col-add-to-list">
                      {collections.map(col => (
                        <button
                          key={col.id}
                          className={`col-add-chip ${movieInCollection(col) ? "added" : ""}`}
                          onClick={() => !movieInCollection(col) && handleAddMovie(col.id)}
                          disabled={movieInCollection(col)}
                        >
                          {col.emoji} {col.name}
                          {movieInCollection(col) && " "}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Collection grid */}
                <div className="col-grid">
                  {collections.map(col => (
                    <CollectionCard
                      key={col.id}
                      col={col}
                      onOpen={openDetail}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )
          )}

          {/* Create view */}
          {view === "create" && (
            <CollectionForm
              initial={prefill}
              onSave={handleCreate}
              onCancel={() => { setView("list"); setPrefill(null); }}
              loading={saving}
            />
          )}

          {/* Edit view */}
          {view === "edit" && activeCol && (
            <CollectionForm
              initial={activeCol}
              onSave={handleEdit}
              onCancel={() => setView("list")}
              loading={saving}
            />
          )}

          {/* Detail view */}
          {view === "detail" && activeCol && (
            <CollectionDetail
              col={collections.find(c => c.id === activeCol.id) || activeCol}
              onBack={() => setView("list")}
              onRemoveMovie={handleRemoveMovie}
              movies={(collections.find(c => c.id === activeCol.id) || activeCol).movies || []}
            />
          )}

        </div>
      </div>
    </div>
  );
}

export default CollectionsPage;
