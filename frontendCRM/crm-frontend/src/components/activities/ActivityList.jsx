import "../../styles/activities/activity-list.css";

function ActivityList({
  activities = [],
  selectedDate,
}) {
  const selectedActivities = activities
    .filter(
      (activity) =>
        activity.date === selectedDate
    )
    .sort((a, b) =>
      a.time.localeCompare(b.time)
    );

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="activity-list">

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

      {selectedActivities.length === 0 ? (
        <div className="activity-empty">
          <div className="activity-empty-icon">
            ✓
          </div>

          <h3>No activities</h3>

          <p>
            There are no activities scheduled
            for this date.
          </p>
        </div>
      ) : (
        <div className="activity-items">

          {selectedActivities.map((activity) => (
            <div
              className="activity-item"
              key={activity.id}
            >

              <div className="activity-item-top">

                <span
                  className={`activity-type ${activity.type
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
                >
                  {activity.type}
                </span>

                <span
                  className={`activity-status ${activity.status
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
                >
                  {activity.status}
                </span>

              </div>

              <h3 className="activity-title">
                {activity.title}
              </h3>

              <div className="activity-meta">

                <span>
                  🕐 {activity.time}
                </span>

                {activity.owner && (
                  <span>
                    👤 {activity.owner}
                  </span>
                )}

              </div>

              {activity.relatedTo && (
                <div className="activity-related">
                  Related to:{" "}
                  <strong>
                    {activity.relatedTo}
                  </strong>
                </div>
              )}

              {activity.description && (
                <p className="activity-description">
                  {activity.description}
                </p>
              )}

              <div className="activity-actions">

                {activity.status !==
                  "Completed" && (
                  <button
                    type="button"
                    className="activity-action complete"
                  >
                    Mark Complete
                  </button>
                )}

                <button
                  type="button"
                  className="activity-action"
                >
                  View
                </button>

              </div>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}

export default ActivityList;