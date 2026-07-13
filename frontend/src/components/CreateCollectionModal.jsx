import React, { useState } from "react";

const EMOJIS = ["🎬","🎥","🍿","⭐","❤️","🔥","👻","🚀","🦸","🎭","🌙","🏆","😂","💀","🎵","🌟","🎯","💎","🦄","🌈"];

function CreateCollectionModal({ initial, onSave, onClose, loading }) {
  const [name,      setName]      = useState(initial?.name        || "");
  const [desc,      setDesc]      = useState(initial?.description || "");
  const [emoji,     setEmoji]     = useState(initial?.emoji       || "🎬");
  const [isPublic,  setIsPublic]  = useState(initial?.is_public   || false);
  const [error,     setError]     = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError("Collection name is required."); return; }
    setError("");
    onSave(name.trim(), desc.trim(), emoji, isPublic);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box create-col-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 className="create-col-title">
          {initial ? "✏️ Edit Collection" : "✨ New Collection"}
        </h2>

        <form onSubmit={handleSubmit} className="col-form">
          {/* Name */}
          <div className="col-form-field">
            <label className="col-form-label">Collection Name <span style={{color:"#eb3b5a"}}>*</span></label>
            <input
              className="col-form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marvel Universe"
              maxLength={200}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="col-form-field">
            <label className="col-form-label">Description <span className="optional-label">(optional)</span></label>
            <textarea
              className="col-form-input"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="What's this collection about?"
              maxLength={1000}
              rows={2}
            />
          </div>

          {/* Emoji */}
          <div className="col-form-field">
            <label className="col-form-label">Emoji</label>
            <div className="col-emoji-grid">
              {EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  className={`col-emoji-btn ${emoji === em ? "selected" : ""}`}
                  onClick={() => setEmoji(em)}
                >{em}</button>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div className="col-form-field">
            <label className="col-form-label">Visibility</label>
            <div className="col-visibility-toggle">
              <button
                type="button"
                className={`col-vis-btn ${!isPublic ? "active" : ""}`}
                onClick={() => setIsPublic(false)}
              >
                 Private
              </button>
              <button
                type="button"
                className={`col-vis-btn ${isPublic ? "active" : ""}`}
                onClick={() => setIsPublic(true)}
              >
                 Public
              </button>
            </div>
            <p className="col-vis-hint">
              {isPublic
                ? "Anyone can view this collection."
                : "Only you can see this collection."}
            </p>
          </div>

          {error && <div className="col-error">⚠️ {error}</div>}

          <div className="col-form-btns">
            <button type="button" className="col-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="col-btn-primary" disabled={loading}>
              {loading ? "Saving…" : initial ? "💾 Save Changes" : "✨ Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateCollectionModal;
