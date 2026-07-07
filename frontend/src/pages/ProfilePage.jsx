import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getProfile, updateProfile, changePassword,
} from "../api/movieApi";
import StatsCards       from "../components/profile/StatsCards";
import GenrePreferences from "../components/profile/GenrePreferences";

const TABS = [
  { id: "profile",  label: " Edit Profile" },
  { id: "stats",    label: " Stats" },
  { id: "genres",   label: " Genres" },
  { id: "password", label: " Password" },
];

function ProfilePage({ onClose, onToast }) {
  const { user, updateUser, logout } = useAuth();

  const [username,    setUsername]    = useState("");
  const [email,       setEmail]       = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError,   setEditError]   = useState("");
  const [editMode,    setEditMode]    = useState(false);

  const [currentPw,   setCurrentPw]   = useState("");
  const [newPw,       setNewPw]       = useState("");
  const [confirmPw,   setConfirmPw]   = useState("");
  const [pwLoading,   setPwLoading]   = useState(false);
  const [pwError,     setPwError]     = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);

  const [activeTab,   setActiveTab]   = useState("profile");

  useEffect(() => {
    getProfile()
      .then((data) => { setUsername(data.username); setEmail(data.email); })
      .catch(() => { setUsername(user?.username || ""); setEmail(user?.email || ""); });
  }, []);

  const pwRules = [
    { label: "At least 6 characters",   pass: newPw.length >= 6 },
    { label: "Matches confirm password", pass: newPw === confirmPw && newPw.length > 0 },
    { label: "Different from current",  pass: newPw !== currentPw && newPw.length > 0 },
  ];

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setEditError("");
    if (!username.trim()) { setEditError("Username cannot be empty."); return; }
    setEditLoading(true);
    try {
      const updated = await updateProfile(username.trim(), email.trim());
      updateUser({ ...user, username: updated.username, email: updated.email });
      setEditMode(false);
      onToast("Profile updated successfully!", "success");
    } catch (err) {
      setEditError(err.response?.data?.detail?.message || err.response?.data?.detail || "Update failed.");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError("");
    if (newPw.length < 6)   { setPwError("New password must be at least 6 characters."); return; }
    if (newPw !== confirmPw) { setPwError("Passwords do not match."); return; }
    if (newPw === currentPw) { setPwError("New password must differ from current password."); return; }
    setPwLoading(true);
    try {
      await changePassword(currentPw, newPw, confirmPw);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      onToast("Password changed successfully!", "success");
    } catch (err) {
      setPwError(err.response?.data?.detail?.message || err.response?.data?.detail || "Failed to change password.");
    } finally {
      setPwLoading(false);
    }
  }

  function handleLogout() {
    logout();
    onClose();
    onToast("Logged out successfully", "success");
  }

  const initials = (username || user?.username || "U").slice(0, 2).toUpperCase();

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-panel profile-panel-enhanced" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="profile-header-enhanced">
          <div className="profile-avatar-large">{initials}</div>
          <div className="profile-header-info">
            <h2 className="profile-name-large">{username || user?.username}</h2>
            <p className="profile-email-display">{email || user?.email}</p>
          </div>
          <div className="profile-header-actions">
            <button className="profile-logout-btn" onClick={handleLogout} title="Logout">
               Logout
            </button>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="profile-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`profile-tab ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="profile-tab-content">

          {/* ── Edit Profile ── */}
          {activeTab === "profile" && (
            <div className="profile-section">
              {!editMode ? (
                <div className="profile-view-mode">
                  <div className="profile-field-row">
                    <span className="profile-field-label">Username</span>
                    <span className="profile-field-value">{username}</span>
                  </div>
                  <div className="profile-field-row">
                    <span className="profile-field-label">Email</span>
                    <span className="profile-field-value">{email}</span>
                  </div>
                  <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setEditMode(true)}>
                    ✏️ Edit Profile
                  </button>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="profile-form">
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input
                      className="form-input"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      minLength={3} maxLength={100} required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      className="form-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  {editError && <div className="form-error">⚠️ {editError}</div>}
                  <div className="profile-form-btns">
                    <button type="button" className="btn-secondary" onClick={() => { setEditMode(false); setEditError(""); }}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={editLoading}>
                      {editLoading ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ── Stats ── */}
          {activeTab === "stats" && (
            <div className="profile-section">
              <h3 className="profile-section-title"> Activity Stats</h3>
              <StatsCards />
            </div>
          )}

          {/* ── Genre Preferences ── */}
          {activeTab === "genres" && (
            <div className="profile-section">
              <GenrePreferences onToast={onToast} />
            </div>
          )}

          {/* ── Change Password ── */}
          {activeTab === "password" && (
            <div className="profile-section">
              <h3 className="profile-section-title"> Change Password</h3>
              <form onSubmit={handleChangePassword} className="profile-form">
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <div className="pw-wrap">
                    <input
                      className="form-input"
                      type={showCurrent ? "text" : "password"}
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                      required
                    />
                    <button type="button" className="pw-toggle" onClick={() => setShowCurrent(!showCurrent)}>
                      {showCurrent ? "" : ""}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <div className="pw-wrap">
                    <input
                      className="form-input"
                      type={showNew ? "text" : "password"}
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      required
                    />
                    <button type="button" className="pw-toggle" onClick={() => setShowNew(!showNew)}>
                      {showNew ? "" : ""}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    className="form-input"
                    type="password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    required
                  />
                </div>

                {newPw.length > 0 && (
                  <div className="pw-rules">
                    {pwRules.map((rule) => (
                      <div key={rule.label} className={`pw-rule ${rule.pass ? "pass" : "fail"}`}>
                        {rule.pass ? "✅" : "❌"} {rule.label}
                      </div>
                    ))}
                  </div>
                )}

                {pwError && <div className="form-error">⚠️ {pwError}</div>}
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={pwLoading || !pwRules.every((r) => r.pass)}
                  style={{ width: "100%", marginTop: 8 }}
                >
                  {pwLoading ? "Changing…" : "Change Password"}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
