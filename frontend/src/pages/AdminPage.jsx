import React, { useState, useEffect } from "react";
import {
  getAdminStats, getAdminUsers, deleteAdminUser,
  toggleAdminRole, getAdminReviews, deleteAdminReview,
} from "../api/movieApi";

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="admin-stat-card" style={{ borderTop: `4px solid ${color}` }}>
      <div className="admin-stat-icon" style={{ background: color + "22", color }}>{icon}</div>
      <div>
        <p className="admin-stat-value">{value}</p>
        <p className="admin-stat-label">{label}</p>
        {sub && <p className="admin-stat-sub">{sub}</p>}
      </div>
    </div>
  );
}

function AdminPage({ onClose }) {
  const [tab,     setTab]     = useState("stats");
  const [stats,   setStats]   = useState(null);
  const [users,   setUsers]   = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState("");
  const [search,  setSearch]  = useState("");

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [s, u, r] = await Promise.all([
          getAdminStats(),
          getAdminUsers(),
          getAdminReviews(),
        ]);
        setStats(s);
        setUsers(u.users);
        setReviews(r.reviews);
      } catch (e) {
        showToast("Failed to load admin data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleDeleteUser(userId, username) {
    if (!window.confirm(`Delete user "${username}" and all their data?`)) return;
    try {
      await deleteAdminUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setReviews(prev => prev.filter(r => r.user_id !== userId));
      showToast(`✅ User ${username} deleted`);
    } catch (e) {
      showToast("❌ " + (e.response?.data?.detail?.message || "Delete failed"));
    }
  }

  async function handleToggleAdmin(userId, username) {
    try {
      const res = await toggleAdminRole(userId);
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, is_admin: res.is_admin } : u
      ));
      showToast(`✅ ${username} is now ${res.is_admin ? "Admin" : "User"}`);
    } catch (e) {
      showToast("❌ " + (e.response?.data?.detail?.message || "Failed"));
    }
  }

  async function handleDeleteReview(reviewId) {
    if (!window.confirm("Delete this review?")) return;
    try {
      await deleteAdminReview(reviewId);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      showToast("✅ Review deleted");
    } catch (e) {
      showToast("❌ Delete failed");
    }
  }

  const filteredUsers   = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const filteredReviews = reviews.filter(r =>
    r.username.toLowerCase().includes(search.toLowerCase()) ||
    r.review.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-panel" onClick={e => e.stopPropagation()}>


        <div className="admin-header">
          <div className="admin-header-left">
            <span className="admin-logo">🛡️</span>
            <div>
              <h2 className="admin-title">Admin Dashboard</h2>
              <p className="admin-subtitle">Platform Management</p>
            </div>
          </div>
          <button className="admin-close" onClick={onClose}>✕</button>
        </div>

     
        {toast && <div className="admin-toast">{toast}</div>}

      
        <div className="admin-tabs">
          {[
            { key: "stats",   label: "📊 Statistics" },
            { key: "users",   label: "👥 Users" },
            { key: "reviews", label: "💬 Reviews" },
          ].map(t => (
            <button
              key={t.key}
              className={`admin-tab ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="admin-body">
          {loading ? (
            <div className="admin-loading">Loading...</div>
          ) : (

            <>
           
              {tab === "stats" && stats && (
                <div>
                  <div className="admin-stat-grid">
                    <StatCard icon="👥" label="Total Users"    value={stats.total_users}    color="#6c63ff" />
                    <StatCard icon="💬" label="Total Reviews"  value={stats.total_reviews}  color="#f7b731" />
                    <StatCard icon="❤️" label="Total Favorites" value={stats.total_favorites} color="#eb3b5a" />
                    <StatCard icon="🔖" label="Watchlist Items" value={stats.total_watchlist} color="#26de81" />
                  </div>
                  <div className="admin-most-searched">
                    <span className="admin-ms-label">🔥 Most Searched</span>
                    <span className="admin-ms-value">
                      {stats.most_searched}
                      <span className="admin-ms-count"> ({stats.most_searched_count} times)</span>
                    </span>
                  </div>
                  {stats.recent_reviews.length > 0 && (
                    <div className="admin-recent-reviews">
                      <h3 className="admin-section-title">📈 Recent Review Activity</h3>
                      <div className="admin-review-bars">
                        {[...stats.recent_reviews].reverse().map((r, i) => (
                          <div key={i} className="admin-bar-row">
                            <span className="admin-bar-date">{r.date?.slice(5)}</span>
                            <div className="admin-bar-track">
                              <div
                                className="admin-bar-fill"
                                style={{
                                  width: `${Math.min(100, (r.count / Math.max(...stats.recent_reviews.map(x => x.count))) * 100)}%`
                                }}
                              />
                            </div>
                            <span className="admin-bar-count">{r.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              
              {tab === "users" && (
                <div>
                  <div className="admin-search-wrap">
                    <input
                      className="admin-search"
                      placeholder="🔍 Search users..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                    <span className="admin-count">{filteredUsers.length} users</span>
                  </div>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>❤️</th>
                          <th>💬</th>
                          <th>🔍</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map(u => (
                          <tr key={u.id}>
                            <td>
                              <div className="admin-user-cell">
                                <div className="admin-user-avatar">
                                  {u.username[0].toUpperCase()}
                                </div>
                                {u.username}
                              </div>
                            </td>
                            <td className="admin-muted">{u.email}</td>
                            <td>
                              <span className={`admin-role-badge ${u.is_admin ? "admin" : "user"}`}>
                                {u.is_admin ? "🛡️ Admin" : "👤 User"}
                              </span>
                            </td>
                            <td className="admin-center">{u.favorites}</td>
                            <td className="admin-center">{u.reviews}</td>
                            <td className="admin-center">{u.searches}</td>
                            <td>
                              <div className="admin-actions">
                                <button
                                  className="admin-btn-secondary"
                                  onClick={() => handleToggleAdmin(u.id, u.username)}
                                  title={u.is_admin ? "Revoke Admin" : "Make Admin"}
                                >
                                  {u.is_admin ? "⬇️" : "⬆️"}
                                </button>
                                <button
                                  className="admin-btn-danger"
                                  onClick={() => handleDeleteUser(u.id, u.username)}
                                  title="Delete User"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Reviews Tab ───────────────────────────────────────────── */}
              {tab === "reviews" && (
                <div>
                  <div className="admin-search-wrap">
                    <input
                      className="admin-search"
                      placeholder="🔍 Search reviews..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                    <span className="admin-count">{filteredReviews.length} reviews</span>
                  </div>
                  <div className="admin-review-list">
                    {filteredReviews.map(r => (
                      <div key={r.id} className="admin-review-card">
                        <div className="admin-review-header">
                          <div className="admin-user-cell">
                            <div className="admin-user-avatar sm">
                              {r.username[0].toUpperCase()}
                            </div>
                            <span className="admin-review-user">{r.username}</span>
                          </div>
                          <div className="admin-review-meta">
                            <span className="admin-review-stars">
                              {"⭐".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                            </span>
                            <span className="admin-muted admin-review-date">
                              {r.created_at?.slice(0, 10)}
                            </span>
                            <span className="admin-review-movie">IMDb: {r.imdb_id}</span>
                          </div>
                          <button
                            className="admin-btn-danger"
                            onClick={() => handleDeleteReview(r.id)}
                            title="Delete Review"
                          >
                            🗑️
                          </button>
                        </div>
                        <p className="admin-review-text">"{r.review}"</p>
                      </div>
                    ))}
                    {filteredReviews.length === 0 && (
                      <div className="admin-empty">No reviews found.</div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
