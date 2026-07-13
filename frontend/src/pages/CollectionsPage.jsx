import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getCollections, createCollection, updateCollection, deleteCollection, addMovieToCollection,
} from "../api/movieApi";
import CollectionCard        from "../components/CollectionCard";
import CreateCollectionModal from "../components/CreateCollectionModal";

function CollectionsPage({ onClose, currentMovie, onToast }) {
  const [collections, setCollections] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [showModal,   setShowModal]   = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [sortOrder,   setSortOrder]   = useState("newest");
  const navigate = useNavigate();

  useEffect(() => {
    getCollections()
      .then(setCollections)
      .catch(() => onToast?.("Failed to load collections", "error"))
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...collections].sort((a, b) =>
    sortOrder === "newest"
      ? new Date(b.created_at) - new Date(a.created_at)
      : new Date(a.created_at) - new Date(b.created_at)
  );

  async function handleCreate(name, desc, emoji, is_public) {
    setSaving(true);
    try {
      const col = await createCollection(name, desc, emoji, is_public);
      setCollections((prev) => [col, ...prev]);
      setShowModal(false);
      onToast?.(`"${name}" created!`, "success");
    } catch (e) {
      onToast?.(e.response?.data?.detail?.message || "Create failed", "error");
    } finally { setSaving(false); }
  }

  async function handleEdit(name, desc, emoji, is_public) {
    setSaving(true);
    try {
      const updated = await updateCollection(editTarget.id, name, desc, emoji, is_public);
      setCollections((prev) => prev.map((c) => c.id === updated.id ? updated : c));
      setEditTarget(null);
      setShowModal(false);
      onToast?.(`"${name}" updated!`, "success");
    } catch (e) {
      onToast?.(e.response?.data?.detail?.message || "Update failed", "error");
    } finally { setSaving(false); }
  }

  async function handleDelete(col) {
    if (!window.confirm(`Delete "${col.name}"? All movies inside will be removed.`)) return;
    try {
      await deleteCollection(col.id);
      setCollections((prev) => prev.filter((c) => c.id !== col.id));
      onToast?.(`"${col.name}" deleted`, "error");
    } catch (e) {
      onToast?.(e.response?.data?.detail?.message || "Delete failed", "error");
    }
  }

  async function handleAddMovie(colId) {
    if (!currentMovie) return;
    try {
      const updated = await addMovieToCollection(colId, currentMovie);
      setCollections((prev) => prev.map((c) => c.id === updated.id ? updated : c));
      onToast?.(`Added to collection!`, "success");
    } catch (e) {
      onToast?.(e.response?.data?.detail?.message || "Already in collection", "error");
    }
  }

  function isMovieInCol(col) {
    const id = currentMovie?.imdbID || currentMovie?.movie_id;
    return col.movies?.some((m) => m.movie_id === id);
  }

  function openEdit(col) { setEditTarget(col); setShowModal(true); }

  return (
    <div className="col-overlay" onClick={onClose}>
      <div className="col-panel" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="col-header">
          <div className="col-header-left">
            <div>
              <h2 className="col-header-title">🗂️ My Collections</h2>
              <p className="col-header-sub">{collections.length} collection{collections.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="col-header-right">
            <Link to="/collections/public" onClick={onClose} className="col-public-link">
               Public
            </Link>
            <select
              className="col-sort-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
            <button className="col-btn-primary small" onClick={() => { setEditTarget(null); setShowModal(true); }}>
              + New
            </button>
            <button className="col-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div className="col-body">

          {/* Add current movie to collection */}
          {currentMovie && collections.length > 0 && (
            <div className="col-add-to">
              <p className="col-add-to-label">
                 Add <strong>"{currentMovie.Title || currentMovie.title}"</strong> to:
              </p>
              <div className="col-add-to-list">
                {collections.map((col) => (
                  <button
                    key={col.id}
                    className={`col-add-chip ${isMovieInCol(col) ? "added" : ""}`}
                    onClick={() => !isMovieInCol(col) && handleAddMovie(col.id)}
                    disabled={isMovieInCol(col)}
                  >
                    {col.emoji} {col.name} {isMovieInCol(col) && "✓"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="col-grid">
              {Array(4).fill(null).map((_, i) => (
                <div key={i} className="col-card col-card-skeleton" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="col-empty">
              <p className="col-empty-icon">🗂️</p>
              <p className="col-empty-title">No collections yet</p>
              <p className="col-empty-sub">Create your first collection to organize movies</p>
              <button className="col-btn-primary" onClick={() => setShowModal(true)}>
                ✨ Create Collection
              </button>
            </div>
          ) : (
            <div className="col-grid">
              {sorted.map((col) => (
                <CollectionCard
                  key={col.id}
                  col={col}
                  onOpen={(c) => { onClose?.(); navigate(`/collections/${c.id}`); }}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <CreateCollectionModal
          initial={editTarget}
          onSave={editTarget ? handleEdit : handleCreate}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          loading={saving}
        />
      )}
    </div>
  );
}

export default CollectionsPage;
