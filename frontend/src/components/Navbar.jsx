import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

function Navbar({ isDark, onToggleTheme, watchlistCount, onShowFavorites,
                  watchlistItemCount, onShowWatchlist, onShowProfile }) {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <nav className="navbar">
      <h1 className="nav-title"> MovieSearch</h1>

      <div className="nav-right">
        <button className="nav-fav-btn" onClick={onShowFavorites}>
          ❤️ Favorites
          {watchlistCount > 0 && <span className="nav-badge">{watchlistCount}</span>}
        </button>

        <button className="nav-fav-btn nav-watchlist-btn" onClick={onShowWatchlist}>
           Watchlist
          {watchlistItemCount > 0 && <span className="nav-badge">{watchlistItemCount}</span>}
        </button>

        <button className="theme-toggle" onClick={onToggleTheme}>
          {isDark ? " Light" : " Dark"}
        </button>

        <div className="profile-wrap">
          <button
            className="profile-btn"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <span className="profile-avatar-sm">
              {(user?.username || "U")[0].toUpperCase()}
            </span>
            {user?.username || "User"} ▾
          </button>

          {showDropdown && (
            <div className="dropdown">
              <div className="dropdown-user">
                <p className="dropdown-name">{user?.username}</p>
                <p className="dropdown-email">{user?.email}</p>
              </div>
              <hr className="dropdown-divider" />
              <button
                className="dropdown-item"
                onClick={() => { onShowProfile(); setShowDropdown(false); }}
              >
                 Edit Profile
              </button>
              <button
                className="dropdown-logout"
                onClick={() => { logout(); setShowDropdown(false); }}
              >
                 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
