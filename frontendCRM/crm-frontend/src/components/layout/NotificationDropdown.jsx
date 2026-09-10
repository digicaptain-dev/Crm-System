import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/layout/notifications.css";

function formatRelativeTime(dateString) {
  if (!dateString) return "";
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
}

function getNotificationIcon(type) {
  switch (type) {
    case "deal_assigned":
      return "👤";
    case "deal_unassigned":
      return "⚠️";
    case "comment":
      return "💬";
    case "meeting":
      return "📅";
    case "task":
      return "✅";
    default:
      return "🔔";
  }
}

function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("all"); // 'all' | 'unread'
  const [loading, setLoading] = useState(false);

  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications?limit=30");
      if (response.data && response.data.success) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(Number(response.data.unreadCount || 0));
      }
    } catch (err) {
      console.warn("[NOTIFICATION FETCH ERROR]", err?.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Auto poll every 20 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 20000);

    const handleRefresh = () => fetchNotifications();
    window.addEventListener("refreshNotifications", handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener("refreshNotifications", handleRefresh);
    };
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Mark single notification as read
  const handleMarkAsRead = async (e, item) => {
    e.stopPropagation();
    if (item.is_read) return;

    try {
      await api.put(`/notifications/${item.notification_id || item.id}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          (n.notification_id === item.notification_id || n.id === item.id)
            ? { ...n, is_read: 1 }
            : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("[MARK READ ERROR]", err);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await api.put("/notifications/mark-all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error("[MARK ALL READ ERROR]", err);
    }
  };

  // Clear all notifications
  const handleClearAll = async () => {
    if (notifications.length === 0) return;
    try {
      await api.delete("/notifications/clear-all");
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("[CLEAR NOTIFS ERROR]", err);
    }
  };

  // Click on a notification item
  const handleItemClick = async (item) => {
    if (!item.is_read) {
      try {
        await api.put(`/notifications/${item.notification_id || item.id}/read`);
        setNotifications((prev) =>
          prev.map((n) =>
            (n.notification_id === item.notification_id || n.id === item.id)
              ? { ...n, is_read: 1 }
              : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.warn(err);
      }
    }

    setIsOpen(false);

    // Route navigation based on entity
    if (item.entity_type === "deal" || item.type === "deal_assigned" || item.type === "deal_unassigned") {
      navigate("/deals");
    } else if (item.entity_type === "schedule" || item.type === "meeting" || item.type === "task") {
      navigate("/activities");
    } else if (item.type === "comment") {
      navigate("/deals");
    }
  };

  const displayedList =
    filter === "unread"
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  return (
    <div className="notification-container" ref={containerRef}>
      {/* Bell Button */}
      <button
        className={`notification-bell-btn ${isOpen ? "active" : ""}`}
        type="button"
        title="Notifications"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="notification-dropdown">
          {/* Header */}
          <div className="notif-header">
            <div className="notif-header-left">
              <h4 className="notif-title">Notifications</h4>
              {unreadCount > 0 && (
                <span className="notif-count-pill">{unreadCount} new</span>
              )}
            </div>

            <button
              className="notif-mark-all-btn"
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark all as read
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="notif-tabs">
            <button
              className={`notif-tab ${filter === "all" ? "active" : ""}`}
              type="button"
              onClick={() => setFilter("all")}
            >
              All ({notifications.length})
            </button>
            <button
              className={`notif-tab ${filter === "unread" ? "active" : ""}`}
              type="button"
              onClick={() => setFilter("unread")}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <ul className="notif-list">
            {displayedList.length === 0 ? (
              <div className="notif-empty">
                <div className="notif-empty-icon">🔕</div>
                <div className="notif-empty-title">
                  {filter === "unread" ? "No unread notifications" : "No notifications yet"}
                </div>
                <div className="notif-empty-desc">
                  You'll be alerted here when deals are assigned, commented, or scheduled.
                </div>
              </div>
            ) : (
              displayedList.map((item) => (
                <li
                  key={item.notification_id || item.id}
                  className={`notif-item ${!item.is_read ? "unread" : ""}`}
                  onClick={() => handleItemClick(item)}
                >
                  {/* Icon */}
                  <div className={`notif-icon-wrap ${item.type || "general"}`}>
                    {getNotificationIcon(item.type)}
                  </div>

                  {/* Body */}
                  <div className="notif-body">
                    <div className="notif-item-title">{item.title}</div>
                    <div className="notif-item-msg">{item.message}</div>
                    <div className="notif-item-time">
                      {formatRelativeTime(item.created_at)}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="notif-item-actions">
                    {!item.is_read ? (
                      <button
                        className="notif-read-check-btn"
                        type="button"
                        title="Mark as read"
                        onClick={(e) => handleMarkAsRead(e, item)}
                      >
                        ✓
                      </button>
                    ) : (
                      <div style={{ width: 8 }} />
                    )}
                    {!item.is_read && <span className="notif-unread-dot" />}
                  </div>
                </li>
              ))
            )}
          </ul>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="notif-footer">
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                Auto-syncing updates
              </span>
              <button
                className="notif-clear-btn"
                type="button"
                onClick={handleClearAll}
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
