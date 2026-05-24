import React from "react";

function SearchBar({ query, onChange }) {
  return (
    <div className="search-wrapper">
      <span className="search-icon"></span>
      <input
        type="text"
        className="search-input"
        placeholder="Search for any movie..."
        value={query}
        onChange={(e) => onChange(e.target.value)}
      />
      
      {query && (
        <button className="clear-btn" onClick={() => onChange("")}>✕</button>
      )}
    </div>
  );
}

export default SearchBar;
