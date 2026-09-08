import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import "../../styles/activities/activity-list.css";

function ActivityList({
  activities = [],
  selectedDate,
}) {
  const navigate = useNavigate();

  // =====================================================
  // DATE HELPERS
  // =====================================================

  const getActivityDate = (activity) => {
    if (!activity?.created_at) {
      return null;
    }

    const date = new Date(activity.created_at);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) {
      return "All activities";
    }

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Activities";
    }

    return parsedDate.toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (date) => {
    if (!date) {
      return "";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  // =====================================================
  // FORMAT RELATIVE DATE
  // =====================================================

  const formatActivityDate = (date) => {
    if (!date) {
      return "";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  // =====================================================
  // ACTIVITY ICON
  // =====================================================

  const getIcon = (type) => {
    switch (type) {
      case "comment":
        return "C";

      case "stage change":
        return "↗";

      case "task":
        return "✓";

      default:
        return "•";
    }
  };

  // =====================================================
  // ACTIVITY LABEL
  // =====================================================

  const getLabel = (type) => {
    switch (type) {
      case "comment":
        return "Comment";

      case "stage change":
        return "Stage Change";

      case "task":
        return "Task";

      default:
        return type || "Activity";
    }
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
    ? formatDate(selectedDate)
    : "All Activities";

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="activity-list">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="activity-list-header">
        <div className="activity-list-title">
          <h2>Activity Timeline</h2>

          <p>{headerDate}</p>
        </div>

        <div className="activity-list-count">
          <strong>{sortedActivities.length}</strong>

          <span>
            {sortedActivities.length === 1
              ? "activity"
              : "activities"}
          </span>
        </div>
      </div>

      {/* =================================================
          EMPTY STATE
      ================================================= */}

      {sortedActivities.length === 0 ? (
        <div className="activity-empty">
          <div className="activity-empty-icon">
            ✓
          </div>

          <h3>No activities found</h3>

          <p>
            There are no activities matching
            your current filters.
          </p>
        </div>
      ) : (
        /* =================================================
           TIMELINE
        ================================================= */

        <div className="activity-timeline">
          {groupDates.map((date) => (
            <div
              className="activity-date-group"
              key={date}
            >
              {/* =========================================
                  DATE DIVIDER
              ========================================= */}

              <div className="activity-date-heading">
                <span className="activity-date-line" />

                <span className="activity-date-label">
                  {formatDate(date)}
                </span>

                <span className="activity-date-line" />
              </div>

              {/* =========================================
                  ACTIVITIES
              ========================================= */}

              <div className="activity-items">
                {groupedActivities[date].map(
                  (activity) => {
                    const type =
                      activity.activity_type;

                    const typeClass =
                      getTypeClass(type);

                    const dealId =
                      activity.deal_id;

                    const dealName =
                      activity.deal_name;

                    const userName =
                      activity.user_name ||
                      "Unknown user";

                    return (
                      <div
                        className="activity-item"
                        key={
                          activity.id ||
                          `${date}-${activity.created_at}-${Math.random()}`
                        }
                      >
                        {/* =================================
                            TIMELINE INDICATOR
                        ================================= */}

                        <div className="activity-timeline-marker">
                          <div
                            className={`activity-item-icon ${typeClass}`}
                          >
                            {getIcon(type)}
                          </div>

                          <span className="activity-timeline-line" />
                        </div>

                        {/* =================================
                            CONTENT CARD
                        ================================= */}

                        <div className="activity-item-content">
                          {/* Top row */}

                          <div className="activity-item-top">
                            <div className="activity-item-heading">
                              <span
                                className={`activity-type ${typeClass}`}
                              >
                                {getLabel(type)}
                              </span>

                              {dealName && (
                                <span className="activity-deal-label">
                                  Deal activity
                                </span>
                              )}
                            </div>

                            <time
                              className="activity-time"
                              dateTime={
                                activity.created_at
                              }
                            >
                              {formatTime(
                                activity.created_at
                              )}
                            </time>
                          </div>

                          {/* Details */}

                          <p className="activity-details">
                            {activity.details ||
                              "No details provided."}
                          </p>

                          {/* Meta */}

                          <div className="activity-meta">
                            <div className="activity-meta-item">
                              <span className="activity-meta-label">
                                By
                              </span>

                              <span className="activity-meta-value">
                                {userName}
                              </span>
                            </div>

                            {dealName && (
                              <div className="activity-meta-item activity-deal">
                                <span className="activity-meta-label">
                                  Deal
                                </span>

                                {dealId ? (
                                  <button
                                    type="button"
                                    className="activity-deal-link"
                                    onClick={() =>
                                      handleViewDeal(
                                        dealId
                                      )
                                    }
                                  >
                                    {dealName}
                                  </button>
                                ) : (
                                  <span className="activity-meta-value">
                                    {dealName}
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="activity-meta-item">
                              <span className="activity-meta-label">
                                Date
                              </span>

                              <span className="activity-meta-value">
                                {formatActivityDate(
                                  activity.created_at
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Action */}

                          {dealId && (
                            <div className="activity-item-actions">
                              <button
                                type="button"
                                className="activity-view-deal"
                                onClick={() =>
                                  handleViewDeal(
                                    dealId
                                  )
                                }
                              >
                                View Deal
                                <span aria-hidden="true">
                                  →
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActivityList;