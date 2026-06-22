import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getAdminStats, getAdminUsers, deleteAdminUser,
  toggleAdminRole, getAdminReviews, deleteAdminReview,
} from "../api/movieApi";

// Mini components
function StatCard({ icon, label, value, color }) {
  return (
    <div className="admin-stat-card" style={{ borderTop: `4px solid ${color}` }}>
      <div className="admin-stat-icon" style={{ background: color + "22", color }}>{icon}</div>
      <div>
        <p className="admin-stat-value">{value ?? "—"}</p>
        <p className="admin-stat-label">{label}</p>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="admin-pagination">
      <button className="admin-page-btn" disabled={page === 1} onClick={() => onPage(page - 1)}>← Prev</button>
      <span className="admin-page-info">Page {page} of {totalPages}</span>
      <button className="admin-page-btn" disabled={page === totalPages} onClick={() => onPage(page + 1)}>Next →</button>
    </div>
  );
}

function MiniBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="admin-bar-row">
      <span className="admin-bar-date">{label}</span>
      <div className="admin-bar-track">
        <div className="admin-bar-fill" style={{ width: `${pct}%`, background: color || "linear-gradient(90deg,#4f46e5,#7c3aed)" }} />
      </div>
      <span className="admin-bar-count">{value}</span>
    </div>
  );
}

// Main AdminPage
function AdminPage({ onClose }) {
  const { user } = useAuth();

  // Role guard 
  if (!user?.is_admin) {
    return (
      <div className="admin-overlay" onClick={onClose}>
        <div className="admin-panel" style={{ maxWidth: 400, padding: 40, textAlign: "center" }} onClick={e => e.stopPropagation()}>
          <p style={{ fontSize: "3rem" }}>🚫</p>
          <h2 style={{ color: "var(--text)" }}>Access Denied</h2>
          <p style={{ color: "var(--muted)" }}>You need admin privileges to view this page.</p>
          <button className="pf-save-btn" style={{ marginTop: 20 }} onClick={onClose}>Go Back</button>
        </div>
      </div>
    );
  }

  const [tab,     setTab]     = useState("stats");
  const [stats,   setStats]   = useState(null);
  const [toast,   setToast]   = useState({ msg: "", type: "" });

  // Users state
  const [users,       setUsers]       = useState([]);
  const [userPage,    setUserPage]    = useState(1);
  const [userTotal,   setUserTotal]   = useState(0);
  const [userPages,   setUserPages]   = useState(1);
  const [userSearch,  setUserSearch]  = useState("");
  const [userLoading, setUserLoading] = useState(false);

  // Reviews state
  const [reviews,       setReviews]       = useState([]);
  const [reviewPage,    setReviewPage]    = useState(1);
  const [reviewTotal,   setReviewTotal]   = useState(0);
  const [reviewPages,   setReviewPages]   = useState(1);
  const [reviewSearch,  setReviewSearch]  = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [statsLoading,  setStatsLoading]  = useState(true);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3000);
  }

  // Load stats 
  useEffect(() => {
    setStatsLoading(true);
    getAdminStats()
      .then(setStats)
      .catch(() => showToast("Failed to load stats", "error"))
      .finally(() => setStatsLoading(false));
  }, []);

  // Load users 
  const loadUsers = useCallback(async (page, search) => {
    setUserLoading(true);
    try {
      const data = await getAdminUsers(page, 10, search);
      setUsers(data.users);
      setUserTotal(data.total);
      setUserPages(data.total_pages);
    } catch {
      showToast("Failed to load users", "error");
    } finally {
      setUserLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "users") loadUsers(userPage, userSearch);
  }, [tab, userPage, userSearch]);

  //  Load reviews 
  const loadReviews = useCallback(async (page, search) => {
    setReviewLoading(true);
    try {
      const data = await getAdminReviews(page, 10, search);
      setReviews(data.reviews);
      setReviewTotal(data.total);
      setReviewPages(data.total_pages);
    } catch {
      showToast("Failed to load reviews", "error");
    } finally {
      setReviewLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "reviews") loadReviews(reviewPage, reviewSearch);
  }, [tab, reviewPage, reviewSearch]);

  //  Actions 
  async function handleDeleteUser(userId, username) {
    if (!window.confirm(`Delete "${username}" and all their data?`)) return;
    try {
      await deleteAdminUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setUserTotal(prev => prev - 1);
      showToast(`✅ ${username} deleted`);
    } catch (e) {
      showToast("❌ " + (e.response?.data?.detail?.message || "Delete failed"), "error");
    }
  }

  async function handleToggleAdmin(userId, username) {
    try {
      const res = await toggleAdminRole(userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: res.is_admin } : u));
      showToast(`✅ ${username} is now ${res.is_admin ? "Admin" : "User"}`);
    } catch (e) {
      showToast("❌ " + (e.response?.data?.detail?.message || "Failed"), "error");
    }
  }

  async function handleDeleteReview(reviewId) {
    if (!window.confirm("Delete this review?")) return;
    try {
      await deleteAdminReview(reviewId);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      setReviewTotal(prev => prev - 1);
      showToast("✅ Review deleted");
    } catch {
      showToast("❌ Delete failed", "error");
    }
  }

  // Search debounce 
  function handleUserSearch(val) {
    setUserSearch(val);
    setUserPage(1);
  }
  function handleReviewSearch(val) {
    setReviewSearch(val);
    setReviewPage(1);
  }

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-panel" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="admin-header">
          <div className="admin-header-left">
            <span className="admin-logo">🛡️</span>
            <div>
              <h2 className="admin-title">Admin Dashboard</h2>
              <p className="admin-subtitle">Welcome, {user?.username}</p>
            </div>
          </div>
          <button className="admin-close" onClick={onClose}>✕</button>
        </div>

        {/* Toast */}
        {toast.msg && (
          <div className={`admin-toast ${toast.type === "error" ? "error" : ""}`}>
            {toast.msg}
          </div>
        )}

        {/* Tabs */}
        <div className="admin-tabs">
          {[
            { key: "stats",   label: "📊 Statistics" },
            { key: "users",   label: `👥 Users${userTotal ? ` (${userTotal})` : ""}` },
            { key: "reviews", label: `💬 Reviews${reviewTotal ? ` (${reviewTotal})` : ""}` },
          ].map(t => (
            <button key={t.key} className={`admin-tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="admin-body">

          {/* Stats  */}
          {tab === "stats" && (
            statsLoading ? <div className="admin-loading">⏳ Loading statistics...</div> :
            stats && (
              <div>
                {/* Stat cards */}
                <div className="admin-stat-grid">
                  <StatCard icon="👥" label="Total Users"     value={stats.total_users}     color="#6c63ff" />
                  <StatCard icon="💬" label="Total Reviews"   value={stats.total_reviews}   color="#f7b731" />
                  <StatCard icon="❤️" label="Total Favorites" value={stats.total_favorites} color="#eb3b5a" />
                  <StatCard icon="🔖" label="Watchlist Items" value={stats.total_watchlist} color="#26de81" />
                  <StatCard icon="🔍" label="Total Searches"  value={stats.total_searches}  color="#2bcbba" />
                </div>

                {/* Most searched banner */}
                <div className="admin-most-searched">
                  <span className="admin-ms-label">🔥 Most Searched Movie</span>
                  <span className="admin-ms-value">
                    {stats.most_searched}
                    <span className="admin-ms-count"> ({stats.most_searched_count} searches)</span>
                  </span>
                </div>

                <div className="admin-charts-row">
                  {/* Review activity */}
                  {stats.recent_reviews?.length > 0 && (
                    <div className="admin-chart-box">
                      <h3 className="admin-section-title">📈 Review Activity (last 7 days)</h3>
                      <div className="admin-review-bars">
                        {[...stats.recent_reviews].reverse().map((r, i) => (
                          <MiniBar
                            key={i}
                            label={r.date?.slice(5)}
                            value={r.count}
                            max={Math.max(...stats.recent_reviews.map(x => x.count))}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top genres */}
                  {stats.top_genres?.length > 0 && (
                    <div className="admin-chart-box">
                      <h3 className="admin-section-title">🎭 Top Genres (Platform)</h3>
                      <div className="admin-review-bars">
                        {stats.top_genres.map((g, i) => (
                          <MiniBar
                            key={i}
                            label={g.genre}
                            value={g.score}
                            max={stats.top_genres[0].score}
                            color="#f7b731"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Top reviewers */}
                {stats.top_reviewers?.length > 0 && (
                  <div className="admin-chart-box" style={{ marginTop: 16 }}>
                    <h3 className="admin-section-title">⭐ Top Reviewers</h3>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {stats.top_reviewers.map((r, i) => (
                        <div key={i} className="admin-reviewer-chip">
                          <span className="admin-reviewer-rank">#{i + 1}</span>
                          <span>{r.username}</span>
                          <span className="admin-reviewer-count">{r.count} reviews</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          )}

          {/* Users */}
          {tab === "users" && (
            <div>
              <div className="admin-search-wrap">
                <input
                  className="admin-search"
                  placeholder="🔍 Search by username or email..."
                  value={userSearch}
                  onChange={e => handleUserSearch(e.target.value)}
                />
                <span className="admin-count">{userTotal} users</span>
              </div>

              {userLoading ? (
                <div className="admin-loading">⏳ Loading users...</div>
              ) : (
                <>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th title="Favorites">❤️</th>
                          <th title="Reviews">💬</th>
                          <th title="Searches">🔍</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.length === 0 ? (
                          <tr><td colSpan={7} className="admin-empty">No users found.</td></tr>
                        ) : users.map(u => (
                          <tr key={u.id}>
                            <td>
                              <div className="admin-user-cell">
                                <div className="admin-user-avatar">{u.username[0].toUpperCase()}</div>
                                <span>{u.username}</span>
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
                                  title={u.is_admin ? "Revoke Admin" : "Make Admin"}
                                  onClick={() => handleToggleAdmin(u.id, u.username)}
                                >
                                  {u.is_admin ? "⬇️" : "⬆️"}
                                </button>
                                <button
                                  className="admin-btn-danger"
                                  title="Delete User"
                                  onClick={() => handleDeleteUser(u.id, u.username)}
                                >
                                  ❌
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination page={userPage} totalPages={userPages} onPage={setUserPage} />
                </>
              )}
            </div>
          )}

          {/* Reviews  */}
          {tab === "reviews" && (
            <div>
              <div className="admin-search-wrap">
                <input
                  className="admin-search"
                  placeholder="🔍 Search by username or review text..."
                  value={reviewSearch}
                  onChange={e => handleReviewSearch(e.target.value)}
                />
                <span className="admin-count">{reviewTotal} reviews</span>
              </div>

              {reviewLoading ? (
                <div className="admin-loading">⏳ Loading reviews...</div>
              ) : (
                <>
                  <div className="admin-review-list">
                    {reviews.length === 0 ? (
                      <div className="admin-empty">No reviews found.</div>
                    ) : reviews.map(r => (
                      <div key={r.id} className="admin-review-card">
                        <div className="admin-review-header">
                          <div className="admin-user-cell">
                            <div className="admin-user-avatar sm">{r.username[0].toUpperCase()}</div>
                            <span className="admin-review-user">{r.username}</span>
                          </div>
                          <div className="admin-review-meta">
                            <span className="admin-review-stars">
                              {"⭐".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                            </span>
                            <span className="admin-muted">{r.created_at?.slice(0, 10)}</span>
                            <span className="admin-review-movie">IMDb: {r.imdb_id}</span>
                          </div>
                          <button
                            className="admin-btn-danger"
                            title="Delete Review"
                            onClick={() => handleDeleteReview(r.id)}
                          >❌</button>
                        </div>
                        <p className="admin-review-text">"{r.review}"</p>
                      </div>
                    ))}
                  </div>
                  <Pagination page={reviewPage} totalPages={reviewPages} onPage={setReviewPage} />
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default AdminPage;
