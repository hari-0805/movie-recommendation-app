import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

function Navbar({ isDark, onToggleTheme, watchlistCount, onShowFavorites,
                  watchlistItemCount, onShowWatchlist, onShowProfile, onShowAdmin,
                  onShowCollections, onShowWatched, watchedCount }) {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef(null);

  useEffect(() => {
    if (!showMoreMenu) return;
    function handleClickOutside(e) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMoreMenu]);

  return (
    <nav className="navbar">
      <h1 className="nav-title"> MovieSearch</h1>
      
      <NotificationBell />
      <div className="nav-right">
        {/* Full buttons - hidden on mobile via CSS, shown on tablet/desktop */}
        <button className="nav-fav-btn nav-primary-action" onClick={onShowFavorites}>
          Favorites
          {watchlistCount > 0 && <span className="nav-badge">{watchlistCount}</span>}
        </button>

        <button className="nav-fav-btn nav-watchlist-btn nav-primary-action" onClick={onShowWatchlist}>
          Watchlist
          {watchlistItemCount > 0 && <span className="nav-badge">{watchlistItemCount}</span>}
        </button>

        <button className="nav-fav-btn nav-col-btn nav-primary-action" onClick={onShowCollections}>
           Collections
        </button>

        <button className="nav-fav-btn nav-watched-btn nav-primary-action" onClick={onShowWatched}>
           Watched
          {watchedCount > 0 && <span className="nav-badge">{watchedCount}</span>}
        </button>

        {/* Collapsed "More" menu - hidden on tablet/desktop, shown on mobile via CSS */}
        <div className="nav-more-wrap" ref={moreMenuRef}>
          <button
            className="nav-fav-btn nav-more-btn"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
          >
            ☰
            {(watchlistCount > 0 || watchlistItemCount > 0) && (
              <span className="nav-badge">{watchlistCount + watchlistItemCount}</span>
            )}
          </button>

          {showMoreMenu && (
            <div className="dropdown nav-more-dropdown">
              <button
                className="dropdown-item"
                onClick={() => { onShowFavorites(); setShowMoreMenu(false); }}
              >
                 Favorites
                {watchlistCount > 0 && <span className="nav-badge">{watchlistCount}</span>}
              </button>
              <button
                className="dropdown-item"
                onClick={() => { onShowWatchlist(); setShowMoreMenu(false); }}
              >
                 Watchlist
                {watchlistItemCount > 0 && <span className="nav-badge">{watchlistItemCount}</span>}
              </button>
              <button
                className="dropdown-item"
                onClick={() => { onShowCollections(); setShowMoreMenu(false); }}
              >
                Collections
              </button>
              <button
                className="dropdown-item"
                onClick={() => { onShowWatched(); setShowMoreMenu(false); }}
              >
                 Watched
                {watchedCount > 0 && <span className="nav-badge">{watchedCount}</span>}
              </button>
            </div>
          )}
        </div>

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
            <span className="profile-username-text">{user?.username || "User"} ▾</span>
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
              {user?.is_admin && (
                <button
                  className="dropdown-item admin-menu-item"
                  onClick={() => { onShowAdmin(); setShowDropdown(false); }}
                >
                  Admin Panel
                </button>
              )}
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