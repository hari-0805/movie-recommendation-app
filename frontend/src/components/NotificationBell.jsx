import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  getNotifications, markNotificationRead,
  markAllNotificationsRead, deleteNotification, clearAllNotifications,
} from "../api/movieApi";

const TYPE_ICONS = {
  review_liked:        "⭐",
  collection_followed: "📁",
  new_recommendation:  "🎬",
  review_added:        "💬",
  welcome:             "👋",
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function NotificationBell() {
  const [open,         setOpen]         = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [filter,       setFilter]       = useState("all"); // "all" | "unread"
  const panelRef = useRef(null);
  const pollRef  = useRef(null);

  // ── Load notifications ──────────────────────────────────────────────────────
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getNotifications(20, filter === "unread");
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch { /* silent fail */ }
    finally { setLoading(false); }
  }, [filter]);

  // ── Poll every 30 seconds ───────────────────────────────────────────────────
  useEffect(() => {
    load();
    pollRef.current = setInterval(() => load(true), 30000);
    return () => clearInterval(pollRef.current);
  }, [load]);

  // ── Reload when filter changes ──────────────────────────────────────────────
  useEffect(() => {
    if (open) load();
  }, [filter]);

  // ── Close on outside click ──────────────────────────────────────────────────
  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  async function handleMarkRead(id) {
    await markNotificationRead(id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }

  async function handleDelete(id) {
    const wasUnread = notifications.find(n => n.id === id)?.is_read === false;
    await deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
  }

  async function handleClearAll() {
    if (!window.confirm("Clear all notifications?")) return;
    await clearAllNotifications();
    setNotifications([]);
    setUnreadCount(0);
  }

  const displayed = filter === "unread"
    ? notifications.filter(n => !n.is_read)
    : notifications;

  return (
    <div className="notif-wrap" ref={panelRef}>
      {/* ── Bell button ─────────────────────────────────────────────────────── */}
      <button
        className={`notif-bell-btn ${open ? "active" : ""}`}
        onClick={() => { setOpen(o => !o); if (!open) load(); }}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {/* ── Panel ───────────────────────────────────────────────────────────── */}
      {open && (
        <div className="notif-panel">
          {/* Header */}
          <div className="notif-header">
            <div className="notif-header-left">
              <span className="notif-header-title">🔔 Notifications</span>
              {unreadCount > 0 && (
                <span className="notif-unread-chip">{unreadCount} new</span>
              )}
            </div>
            <div className="notif-header-actions">
              {unreadCount > 0 && (
                <button className="notif-action-btn" onClick={handleMarkAllRead} title="Mark all read">
                  ✓ All
                </button>
              )}
              {notifications.length > 0 && (
                <button className="notif-action-btn danger" onClick={handleClearAll} title="Clear all">
                  🗑️
                </button>
              )}
            </div>
          </div>

          {/* Filter tabs */}
          <div className="notif-filter-tabs">
            <button
              className={`notif-filter-tab ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >All</button>
            <button
              className={`notif-filter-tab ${filter === "unread" ? "active" : ""}`}
              onClick={() => setFilter("unread")}
            >
              Unread
              {unreadCount > 0 && <span className="notif-tab-count">{unreadCount}</span>}
            </button>
          </div>

          {/* Body */}
          <div className="notif-body">
            {loading ? (
              <div className="notif-empty">
                <div className="notif-spinner">⏳</div>
                <p>Loading...</p>
              </div>
            ) : displayed.length === 0 ? (
              <div className="notif-empty">
                <span className="notif-empty-icon">🔕</span>
                <p className="notif-empty-text">
                  {filter === "unread" ? "No unread notifications" : "No notifications yet"}
                </p>
                <p className="notif-empty-sub">We'll notify you when something happens</p>
              </div>
            ) : (
              <div className="notif-list">
                {displayed.map(n => (
                  <div
                    key={n.id}
                    className={`notif-item ${n.is_read ? "read" : "unread"}`}
                    onClick={() => !n.is_read && handleMarkRead(n.id)}
                  >
                    <div className="notif-icon">
                      {TYPE_ICONS[n.type] || "🔔"}
                    </div>
                    <div className="notif-content">
                      <p className="notif-title">{n.title}</p>
                      <p className="notif-message">{n.message}</p>
                      <p className="notif-time">{timeAgo(n.created_at)}</p>
                    </div>
                    <div className="notif-item-actions">
                      {!n.is_read && (
                        <button
                          className="notif-read-btn"
                          title="Mark as read"
                          onClick={e => { e.stopPropagation(); handleMarkRead(n.id); }}
                        >●</button>
                      )}
                      <button
                        className="notif-delete-btn"
                        title="Delete"
                        onClick={e => { e.stopPropagation(); handleDelete(n.id); }}
                      >✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="notif-footer">
              <button className="notif-refresh-btn" onClick={() => load()}>
                🔄 Refresh
              </button>
              <span className="notif-footer-count">{notifications.length} notification{notifications.length !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
