import "../../styles/activities/activity-list.css";

function ActivityList({
  activities = [],
  selectedDate,
}) {

  // =====================================================
  // GET DATE FROM CREATED_AT
  // =====================================================

  const getActivityDate = (activity) => {
    if (!activity.created_at) {
      return null;
    }

    const date = new Date(
      activity.created_at
    );

    return `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;
  };

  // =====================================================
  // FILTER ACTIVITIES
  // =====================================================

  const selectedActivities =
    activities
      .filter(
        (activity) =>
          getActivityDate(activity) ===
          selectedDate
      )
      .sort(
        (a, b) =>
          new Date(b.created_at) -
          new Date(a.created_at)
      );

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString(
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

    return new Date(
      date
    ).toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  // =====================================================
  // ACTIVITY ICON
  // =====================================================

  const getIcon = (type) => {
    switch (type) {
      case "comment":
        return "💭";

      case "stage change":
        return "🔄";

      case "task":
        return "✓";

      default:
        return "📝";
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

  return (
    <div className="activity-list">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="activity-list-header">

        <div>

          <h2>Activities</h2>

          <p>
            {formatDate(selectedDate)}
          </p>

        </div>

        <span className="activity-count">
          {selectedActivities.length}
        </span>

      </div>

      {/* =================================================
          EMPTY
      ================================================= */}

      {selectedActivities.length === 0 ? (

        <div className="activity-empty">

          <div className="activity-empty-icon">
            ✓
          </div>

          <h3>
            No activities
          </h3>

          <p>
            There are no activities recorded
            for this date.
          </p>

        </div>

      ) : (

        <div className="activity-items">

          {selectedActivities.map(
            (activity) => (

              <div
                className="activity-item"
                key={activity.id}
              >

                {/* Icon */}

                <div className="activity-item-icon">
                  {getIcon(
                    activity.activity_type
                  )}
                </div>

                {/* Content */}

                <div className="activity-item-content">

                  <div className="activity-item-top">

                    <span
                      className={`activity-type ${activity.activity_type
                        ?.toLowerCase()
                        .replace(
                          /\s+/g,
                          "-"
                        )}`}
                    >
                      {getLabel(
                        activity.activity_type
                      )}
                    </span>

                    <span className="activity-time">
                      {formatTime(
                        activity.created_at
                      )}
                    </span>

                  </div>

                  <p className="activity-details">
                    {activity.details ||
                      "No details provided."}
                  </p>

                  <div className="activity-meta">

                    <span>
                      👤{" "}
                      {activity.user_name ||
                        activity.user_id ||
                        "Unknown user"}
                    </span>

                    {activity.deal_name && (
                      <span>
                        💼{" "}
                        {activity.deal_name}
                      </span>
                    )}

                  </div>

                </div>

              </div>

            )
          )}

        </div>

      )}

    </div>
  );
}

export default ActivityList;