import React from "react";

function CollectionCard({ col, onOpen, onEdit, onDelete, showOwner = false }) {
  function formatDate(iso) {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div className="col-card" onClick={() => onOpen && onOpen(col)}>
      {/* Poster mosaic */}
      <div className="col-card-mosaic">
        {col.preview_posters?.length > 0 ? (
          <div className={`col-mosaic-grid col-mosaic-${Math.min(col.preview_posters.length, 4)}`}>
            {col.preview_posters.slice(0, 4).map((p, i) => (
              <img key={i} src={p} alt="" className="col-mosaic-img" />
            ))}
          </div>
        ) : (
          <div className="col-mosaic-empty">
            <span className="col-mosaic-emoji">{col.emoji}</span>
          </div>
        )}
        {/* Visibility badge */}
        <span className={`col-visibility-badge ${col.is_public ? "public" : "private"}`}>
          {col.is_public ? " Public" : " Private"}
        </span>
      </div>

      <div className="col-card-body">
        <div className="col-card-top">
          <span className="col-card-emoji">{col.emoji}</span>
          <h3 className="col-card-name">{col.name}</h3>
        </div>
        {col.description && <p className="col-card-desc">{col.description}</p>}
        <div className="col-card-meta">
          <span className="col-card-count"> {col.movie_count} movie{col.movie_count !== 1 ? "s" : ""}</span>
          {showOwner && col.owner_username && (
            <span className="col-card-owner"> {col.owner_username}</span>
          )}
          <span className="col-card-date"> {formatDate(col.created_at)}</span>
        </div>
      </div>

      {(onEdit || onDelete) && (
        <div className="col-card-actions" onClick={(e) => e.stopPropagation()}>
          {onEdit   && <button className="col-action-btn"        onClick={() => onEdit(col)}   title="Edit">✏️</button>}
          {onDelete && <button className="col-action-btn danger" onClick={() => onDelete(col)} title="Delete">🗑️</button>}
        </div>
      )}
    </div>
  );
}

export default CollectionCard;
