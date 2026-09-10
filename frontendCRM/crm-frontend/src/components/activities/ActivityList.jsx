import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/activities/activity-list.css";

function ActivityList({
  activities = [],
  selectedDate,
  onClearDateFilter,
  onOpenCreate,
  onDeleteActivity,
}) {
  const navigate = useNavigate();

  const getActivityDate = (activity) => {
    if (!activity.created_at) return null;
    const date = new Date(activity.created_at);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;
  };

  const selectedActivities = useMemo(() => {
    if (!selectedDate) return activities;
    return activities.filter((act) => getActivityDate(act) === selectedDate);
  }, [activities, selectedDate]);

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return "All Recorded Activities";
    try {
      const d = new Date(`${dateStr}T00:00:00`);
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatActivityTime = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return String(dateStr);
    }
  };

  const getActivityIcon = (type) => {
    const t = String(type || "").toLowerCase();
    if (t === "call") {
      return (
        <div className="activity-type-avatar avatar-call">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </div>
      );
    }
    if (t === "meeting") {
      return (
        <div className="activity-type-avatar avatar-meeting">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
      );
    }
    if (t === "task") {
      return (
        <div className="activity-type-avatar avatar-task">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        </div>
      );
    }
    if (t === "stage change" || t === "status change") {
      return (
        <div className="activity-type-avatar avatar-stage-change">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </div>
      );
    }
    if (t === "message") {
      return (
        <div className="activity-type-avatar avatar-message">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
      );
    }
    return (
      <div className="activity-type-avatar avatar-comment">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      </div>
    );
  };

  const getTagClass = (type) => {
    const t = String(type || "").toLowerCase();
    if (t === "call") return "tag-call";
    if (t === "meeting") return "tag-meeting";
    if (t === "task") return "tag-task";
    if (t === "stage change") return "tag-stage-change";
    if (t === "message") return "tag-message";
    if (t === "negotiation") return "tag-negotiation";
    return "tag-comment";
  };

  // =====================================================
  // ACTIVITY CLASS
  // =====================================================

  const getTypeClass = (type) => {
    return (
      type
        ?.toLowerCase()
        .replace(/\s+/g, "-") || "activity"
    );
  };

  // =====================================================
  // SORT ACTIVITIES
  // =====================================================

  const sortedActivities = useMemo(() => {
    return [...activities].sort(
      (a, b) =>
        new Date(b.created_at) -
        new Date(a.created_at)
    );
  }, [activities]);

  // =====================================================
  // GROUP ACTIVITIES BY DATE
  // =====================================================

  const groupedActivities = useMemo(() => {
    const groups = {};

    sortedActivities.forEach((activity) => {
      const date = getActivityDate(activity);

      if (!date) {
        return;
      }

      if (!groups[date]) {
        groups[date] = [];
      }

      groups[date].push(activity);
    });

    return groups;
  }, [sortedActivities]);

  // =====================================================
  // GROUP ORDER
  // =====================================================

  const groupDates = useMemo(() => {
    return Object.keys(groupedActivities).sort(
      (a, b) =>
        new Date(`${b}T00:00:00`) -
        new Date(`${a}T00:00:00`)
    );
  }, [groupedActivities]);

  // =====================================================
  // VIEW DEAL
  // =====================================================

  const handleViewDeal = (dealId) => {
    if (!dealId) {
      return;
    }

    navigate(`/deal/${dealId}`);
  };

  // =====================================================
  // SELECTED DATE HEADER
  // =====================================================

  const headerDate = selectedDate
    ? formatDateLabel(selectedDate)
    : "All Activities";

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="activity-list-container">
      {/* Top Header Row */}
      <div className="activity-list-top-bar">
        <div className="list-top-left">
          <div className="list-top-title-wrap">
            <h2 className="list-top-title">Activity Feed</h2>
            <span className="list-count-badge">{selectedActivities.length}</span>
          </div>
          <p className="list-top-subtitle">{formatDateLabel(selectedDate)}</p>
        </div>

        {selectedDate && (
          <button
            type="button"
            className="btn-show-all-dates"
            onClick={onClearDateFilter}
            title="Show all recorded activities"
          >
            Show All Dates
          </button>
        )}
      </div>

      {/* Empty State */}
      {selectedActivities.length === 0 ? (
        <div className="activity-empty-box">
          <div className="activity-empty-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h3>No Activities Recorded</h3>
          <p>
            {selectedDate
              ? `There are no activities or tasks scheduled for ${selectedDate}.`
              : "No activities match your current search or filter criteria."}
          </p>
          <button type="button" className="btn-empty-add" onClick={onOpenCreate}>
            + Log First Activity
          </button>
        </div>
      ) : (
        /* Activity Stream */
        <div className="activity-feed-list">
          {selectedActivities.map((act) => {
            const rawType = act.activity_type || "Activity";
            const tagClass = getTagClass(rawType);

            return (
              <div className="activity-feed-card" key={act.id || act.created_at}>
                {getActivityIcon(rawType)}

                <div className="activity-card-main">
                  <div className="activity-card-header">
                    <div className="activity-badge-group">
                      <span className={`activity-type-tag ${tagClass}`}>{rawType}</span>
                    </div>
                    <span className="activity-time-text">
                      {formatActivityTime(act.created_at)}
                    </span>
                  </div>

                  <p className="activity-details-text">
                    {act.details || "Activity recorded"}
                  </p>

                  <div className="activity-card-footer">
                    <div className="activity-pills-row">
                      {act.deal_id && (
                        <Link
                          to={`/deal/${act.deal_id}`}
                          className="activity-deal-pill"
                          title="Open Deal Record"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                          </svg>
                          <span>{act.deal_name || "View Deal"}</span>
                        </Link>
                      )}

                      <div className="activity-user-pill">
                        <div className="user-mini-avatar">
                          {(act.user_name || "U").charAt(0).toUpperCase()}
                        </div>
                        <span>{act.user_name || "Team Member"}</span>
                      </div>
                    </div>

                    {onDeleteActivity && act.id && (
                      <div className="activity-actions-wrap">
                        <button
                          type="button"
                          className="btn-card-action"
                          onClick={() => onDeleteActivity(act.id)}
                          title="Delete this activity record"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ActivityList;