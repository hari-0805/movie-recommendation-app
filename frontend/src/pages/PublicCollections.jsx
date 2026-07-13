import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPublicCollections, searchCollections } from "../api/movieApi";
import CollectionCard from "../components/CollectionCard";
import useDebounce from "../hooks/useDebounce";

function PublicCollections({ onToast }) {
  const [collections, setCollections] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [query,       setQuery]       = useState("");
  const [searching,   setSearching]   = useState(false);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    getPublicCollections()
      .then(setCollections)
      .catch(() => onToast?.("Failed to load public collections", "error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      getPublicCollections().then(setCollections).catch(() => {});
      return;
    }
    setSearching(true);
    searchCollections(debouncedQuery)
      .then(setCollections)
      .catch(() => onToast?.("Search failed", "error"))
      .finally(() => setSearching(false));
  }, [debouncedQuery]);

  function openCollection(col) {
    navigate(`/collections/${col.id}`);
  }

  return (
    <div className="col-page">
      <div className="col-page-header">
        <div>
          <h1 className="col-page-title"> Public Collections</h1>
          <p className="col-page-sub">Discover collections shared by the community</p>
        </div>
        <Link to="/collections" className="compare-back-link">← My Collections</Link>
      </div>

      {/* Search */}
      <div className="col-search-bar">
        <input
          className="col-search-input"
          placeholder="Search by collection name or username…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button className="col-search-clear" onClick={() => setQuery("")}>✕</button>
        )}
      </div>

      {(loading || searching) ? (
        <div className="col-grid">
          {Array(6).fill(null).map((_, i) => (
            <div key={i} className="col-card col-card-skeleton" />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <div className="col-empty">
          <p className="col-empty-icon">{query ? "" : ""}</p>
          <p className="col-empty-title">
            {query ? `No results for "${query}"` : "No public collections yet"}
          </p>
          <p className="col-empty-sub">
            {query ? "Try a different search term." : "Be the first to share a collection!"}
          </p>
        </div>
      ) : (
        <>
          <p className="col-results-count">{collections.length} collection{collections.length !== 1 ? "s" : ""}</p>
          <div className="col-grid">
            {collections.map((col) => (
              <CollectionCard
                key={col.id}
                col={col}
                onOpen={openCollection}
                showOwner
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default PublicCollections;
