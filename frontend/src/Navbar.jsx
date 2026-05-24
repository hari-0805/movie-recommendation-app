import React from "react";

function Navbar({ isDark, onToggleTheme, watchlistCount, onLogout, onShowFavorites }) {
  return (
    <nav className="navbar">
      <h1 className="nav-title">MovieSearch</h1>
      <div className="nav-right">

  
        <button className="nav-fav-btn" onClick={onShowFavorites}>
           Favorites
          {watchlistCount > 0 && (
            <span className="nav-badge">{watchlistCount}</span>
          )}
        </button>

        <button className="theme-toggle" onClick={onToggleTheme}>
          {isDark ? "Light" : "Dark"}
        </button>

        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
