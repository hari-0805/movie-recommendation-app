import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getProfile, updateProfile, changePassword } from "../api/movieApi";

function ProfilePage({ onClose, onToast }) {
  const { user, updateUser } = useAuth();

  const [username,      setUsername]      = useState("");
  const [email,         setEmail]         = useState("");
  const [editLoading,   setEditLoading]   = useState(false);
  const [editError,     setEditError]     = useState("");
  const [editSuccess,   setEditSuccess]   = useState("");

  const [currentPw,     setCurrentPw]     = useState("");
  const [newPw,         setNewPw]         = useState("");
  const [confirmPw,     setConfirmPw]     = useState("");
  const [pwLoading,     setPwLoading]     = useState(false);
  const [pwError,       setPwError]       = useState("");
  const [pwSuccess,     setPwSuccess]     = useState("");
  const [showCurrent,   setShowCurrent]   = useState(false);
  const [showNew,       setShowNew]       = useState(false);

  const [stats, setStats]     = useState(null);
  const [activeTab, setActiveTab] = useState("profile"); 

  useEffect(() => {
    getProfile()
      .then((data) => {
        setUsername(data.username);
        setEmail(data.email);
      })
      .catch(() => {
        setUsername(user?.username || "");
        setEmail(user?.email || "");
      });
  }, []);

  
  const pwRules = [
    { label: "At least 6 characters",         pass: newPw.length >= 6 },
    { label: "Matches confirm password",       pass: newPw === confirmPw && newPw.length > 0 },
    { label: "Different from current",         pass: newPw !== currentPw && newPw.length > 0 },
  ];

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setEditError(""); setEditSuccess("");
    if (!username.trim()) { setEditError("Username cannot be empty."); return; }
    setEditLoading(true);
    try {
      const updated = await updateProfile(username.trim(), email.trim());
      updateUser({ ...user, username: updated.username, email: updated.email });
      setEditSuccess("Profile updated successfully!");
      onToast("Profile updated!", "success");
    } catch (err) {
      setEditError(err.response?.data?.detail?.message || err.response?.data?.detail || "Update failed.");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError(""); setPwSuccess("");
    if (newPw.length < 6)      { setPwError("New password must be at least 6 characters."); return; }
    if (newPw !== confirmPw)    { setPwError("Passwords do not match."); return; }
    if (newPw === currentPw)    { setPwError("New password must differ from current password."); return; }
    setPwLoading(true);
    try {
      await changePassword(currentPw, newPw, confirmPw);
      setPwSuccess("Password changed successfully!");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      onToast("Password changed!", "success");
    } catch (err) {
      setPwError(err.response?.data?.detail?.message || err.response?.data?.detail || "Failed to change password.");
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-panel" onClick={(e) => e.stopPropagation()}>

     
        <div className="profile-header">
          <div className="profile-avatar">
            {(username || user?.username || "U")[0].toUpperCase()}
          </div>
          <div>
            <h2 className="profile-name">{username || user?.username}</h2>
            <p className="profile-email-display">{email || user?.email}</p>
          </div>
          <button className="modal-close" onClick={onClose} style={{ marginLeft: "auto" }}>✕</button>
        </div>

 
        <div className="profile-tabs">
          <button
            className={`rec-tab ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
             Edit Profile
          </button>
          <button
            className={`rec-tab ${activeTab === "password" ? "active" : ""}`}
            onClick={() => setActiveTab("password")}
          >
             Change Password
          </button>
        </div>

  
        {activeTab === "profile" && (
          <form onSubmit={handleUpdateProfile} className="profile-form">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={3}
                maxLength={100}
                required
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
            {editError   && <div className="form-error">⚠️ {editError}</div>}
            {editSuccess && <div className="form-success">✅ {editSuccess}</div>}
            <button
              type="submit"
              className="btn-primary"
              disabled={editLoading}
              style={{ width: "100%", marginTop: "8px" }}
            >
              {editLoading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}

      
        {activeTab === "password" && (
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

            {/* Live password rules */}
            {newPw.length > 0 && (
              <div className="pw-rules">
                {pwRules.map((rule) => (
                  <div key={rule.label} className={`pw-rule ${rule.pass ? "pass" : "fail"}`}>
                    {rule.pass ? "✅" : "❌"} {rule.label}
                  </div>
                ))}
              </div>
            )}

            {pwError   && <div className="form-error">⚠️ {pwError}</div>}
            {pwSuccess && <div className="form-success">✅ {pwSuccess}</div>}
            <button
              type="submit"
              className="btn-primary"
              disabled={pwLoading || !pwRules.every((r) => r.pass)}
              style={{ width: "100%", marginTop: "8px" }}
            >
              {pwLoading ? "Changing..." : "Change Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
