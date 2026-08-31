import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

import "../styles/deal-details/deal-details.css";

function DealDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // =====================================================
  // DEAL STATE
  // =====================================================

  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // STATUS STATE
  // =====================================================

  const [status, setStatus] = useState("");

  // =====================================================
  // COMMENT STATE
  // =====================================================

  const [comment, setComment] = useState("");

  // =====================================================
  // ACTIVITY STATE
  // =====================================================

  const [activities, setActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activitySubmitting, setActivitySubmitting] =
    useState(false);

  // =====================================================
  // GET SINGLE DEAL
  // =====================================================

  const fetchDeal = async () => {
    try {
      setLoading(true);

      console.log("Fetching deal:", id);

      const response = await api.get(`/deal/${id}`);

      console.log(
        "Deal details response:",
        response.data
      );

      const fetchedDeal =
        response.data?.deal ||
        response.data;

      if (!fetchedDeal) {
        setDeal(null);
        return;
      }

      setDeal(fetchedDeal);

      setStatus(
        fetchedDeal.deal_status || "Open"
      );

    } catch (error) {
      console.error(
        "Failed to fetch deal:",
        error
      );

      setDeal(null);

    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // GET ACTIVITIES FOR DEAL
  // Backend:
  // GET /deals/:dealId/activities
  // =====================================================

  const fetchActivities = async () => {
    if (!id) {
      return;
    }

    try {
      setActivityLoading(true);

      console.log(
        "Fetching activities for deal:",
        id
      );

      const response = await api.get(
        `/deals/${id}/activities`
      );

      console.log(
        "Deal activities response:",
        response.data
      );

      const fetchedActivities =
        response.data?.activities || [];

      setActivities(
        Array.isArray(fetchedActivities)
          ? fetchedActivities
          : []
      );

    } catch (error) {
      console.error(
        "Failed to fetch deal activities:",
        error
      );

      setActivities([]);

    } finally {
      setActivityLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    if (!id) {
      return;
    }

    fetchDeal();
    fetchActivities();

  }, [id]);

  // =====================================================
  // CREATE ACTIVITY
  //
  // IMPORTANT:
  // Backend gets user_id from JWT.
  // Therefore we DON'T send user_id here.
  // =====================================================

  const logActivity = async (
    activityType,
    details
  ) => {
    if (!deal?.deal_id) {
      return;
    }

    try {
      setActivitySubmitting(true);

      console.log(
        "Recording activity:",
        {
          deal_id: deal.deal_id,
          activity_type: activityType,
          details,
        }
      );

      const response = await api.post(
        "/activities",
        {
          deal_id: deal.deal_id,
          activity_type: activityType,
          details: details || null,
        }
      );

      console.log(
        "Activity response:",
        response.data
      );

      if (!response.data?.success) {
        alert(
          response.data?.message ||
          response.data?.error ||
          "Failed to record activity."
        );

        return false;
      }

      // Refresh activity timeline
      await fetchActivities();

      return true;

    } catch (error) {
      console.error(
        "Failed to record activity:",
        error
      );

      alert(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to record activity."
      );

      return false;

    } finally {
      setActivitySubmitting(false);
    }
  };

  // =====================================================
  // ADD COMMENT
  // =====================================================

  const addComment = async (e) => {
    e.preventDefault();

    if (!comment.trim()) {
      return;
    }

    const success = await logActivity(
      "comment",
      comment.trim()
    );

    if (success) {
      setComment("");
    }
  };

  // =====================================================
  // UPDATE DEAL STATUS
  // =====================================================

  const handleStatusChange = async (newStatus) => {
    if (!deal?.deal_id) {
      return;
    }

    const previousStatus =
      deal.deal_status || "Open";

    try {
      setActivitySubmitting(true);
      setStatus(newStatus);

      console.log(
        "Updating deal status:",
        newStatus
      );

      const response = await api.put(
        `/deal/${deal.deal_id}`,
        {
          deal_status: newStatus,
        }
      );

      console.log(
        "Status update response:",
        response.data
      );

      if (
        response.data &&
        response.data.success === false
      ) {
        throw new Error(
          response.data.message ||
          "Failed to update status."
        );
      }

      setDeal((current) => ({
        ...current,
        deal_status: newStatus,
      }));

      // Record stage/status change in activity timeline
      await logActivity(
        "stage change",
        `Deal status changed from "${previousStatus}" to "${newStatus}".`
      );

    } catch (error) {
      console.error(
        "Failed to update deal status:",
        error
      );

      setStatus(previousStatus);

      alert(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to update deal status."
      );

    } finally {
      setActivitySubmitting(false);
    }
  };

  // =====================================================
  // MARK WON
  // =====================================================

  const markAsWon = () => {
    handleStatusChange("Won");
  };

  // =====================================================
  // MARK LOST
  // =====================================================

  const markAsLost = () => {
    handleStatusChange("Lost");
  };

  // =====================================================
  // ACTIVITY ICON
  // =====================================================

  const getActivityIcon = (type) => {
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

  const getActivityLabel = (type) => {
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
  // FORMAT DATE
  // =====================================================

  const formatActivityDate = (date) => {
    if (!date) {
      return "-";
    }

    try {
      return new Date(date).toLocaleString();
    } catch {
      return "-";
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="deal-details">
        <div className="not-found">
          <h2>Loading deal...</h2>
        </div>
      </div>
    );
  }

  // =====================================================
  // DEAL NOT FOUND
  // =====================================================

  if (!deal) {
    return (
      <div className="not-found">
        <h2>Deal not found</h2>

        <button
          type="button"
          className="primary-button"
          onClick={() => navigate("/deals")}
        >
          Back to Deals
        </button>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="deal-details">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="deal-details-header">

        <div className="deal-title-area">

          <button
            type="button"
            className="back-button"
            onClick={() => navigate("/deals")}
          >
            ← Back to Deals
          </button>

          <h1>
            {deal.deal_name || "Untitled Deal"}
          </h1>

          <p>
            {deal.deal_organization ||
              "No organization"}
          </p>

        </div>

      </div>

      {/* =================================================
          QUICK ACTIONS
      ================================================= */}

      <div className="deal-quick-actions">

        <div className="quick-actions-left">

          <span className="quick-actions-label">
            Quick Actions
          </span>

        </div>

        <div className="quick-actions-buttons">

          {/* COMMENT */}

          <button
            type="button"
            className="activity-action"
            onClick={() => {
              const text =
                window.prompt(
                  "Enter comment:"
                );

              if (
                text &&
                text.trim()
              ) {
                logActivity(
                  "comment",
                  text.trim()
                );
              }
            }}
            disabled={activitySubmitting}
          >
            <span>💭</span>
            Add Comment
          </button>

          {/* TASK */}

          <button
            type="button"
            className="activity-action"
            onClick={() => {
              const text =
                window.prompt(
                  "Enter task details:"
                );

              if (
                text &&
                text.trim()
              ) {
                logActivity(
                  "task",
                  text.trim()
                );
              }
            }}
            disabled={activitySubmitting}
          >
            <span>✓</span>
            Add Task
          </button>

          {/* WON */}

          <button
            type="button"
            className="status-action won"
            onClick={markAsWon}
            disabled={activitySubmitting}
          >
            ✓ Won
          </button>

          {/* LOST */}

          <button
            type="button"
            className="status-action lost"
            onClick={markAsLost}
            disabled={activitySubmitting}
          >
            ✕ Lost
          </button>

        </div>

      </div>

      {/* =================================================
          MAIN INFORMATION
      ================================================= */}

      <div className="deal-info-grid">

        {/* =================================================
            DEAL INFORMATION
        ================================================= */}

        <div className="deal-info-card">

          <div className="section-title">
            Deal Information
          </div>

          <div className="info-grid">

            <InfoItem
              label="Deal ID"
              value={deal.deal_id}
            />

            <InfoItem
              label="Deal Name"
              value={deal.deal_name}
            />

            <InfoItem
              label="Organization"
              value={
                deal.deal_organization ||
                "-"
              }
            />

            <InfoItem
              label="Email"
              value={
                deal.customer_email ||
                "-"
              }
            />

            <InfoItem
              label="Phone"
              value={
                deal.customer_number ||
                "-"
              }
            />

            <InfoItem
              label="Contact Person"
              value={
                deal.contact_person ||
                "-"
              }
            />

            <InfoItem
              label="Owner"
              value={
                deal.deal_owner ||
                "Unassigned"
              }
            />

            <InfoItem
              label="Value"
              value={
                deal.deal_value !== null &&
                deal.deal_value !== undefined
                  ? `$${Number(
                      deal.deal_value
                    ).toLocaleString()}`
                  : "-"
              }
            />

            <InfoItem
              label="Priority"
              value={
                deal.deal_priority ||
                "-"
              }
            />

            <InfoItem
              label="Stage"
              value={
                deal.deal_stage ??
                "-"
              }
            />

            <InfoItem
              label="Status"
              value={
                deal.deal_status ||
                "-"
              }
            />

            <InfoItem
              label="Pipeline"
              value={
                deal.pipeline_id ||
                "-"
              }
            />

            <InfoItem
              label="Source"
              value={
                deal.deal_source ||
                "-"
              }
            />

            <InfoItem
              label="Probability"
              value={
                deal.probability ??
                "-"
              }
            />

            <InfoItem
              label="Time Zone"
              value={
                deal.time_zone ||
                "-"
              }
            />

            <InfoItem
              label="Customer Address"
              value={
                deal.customer_address ||
                "-"
              }
            />

          </div>

        </div>

        {/* =================================================
            CURRENT STATUS
        ================================================= */}

        <div className="deal-status-card">

          <div className="section-title">
            Current Status
          </div>

          <div
            className={`current-status ${
              (status || "Open")
                .toLowerCase()
            }`}
          >
            {status ||
              deal.deal_status ||
              "Open"}
          </div>

          <label htmlFor="deal-status">
            Update Status
          </label>

          <select
            id="deal-status"
            value={
              status ||
              deal.deal_status ||
              "Open"
            }
            onChange={(e) =>
              handleStatusChange(
                e.target.value
              )
            }
            disabled={activitySubmitting}
          >
            <option value="Open">
              Open
            </option>

            <option value="Won">
              Won
            </option>

            <option value="Lost">
              Lost
            </option>
          </select>

        </div>

      </div>

      {/* =================================================
          NOTES
      ================================================= */}

      <section className="details-section">

        <div className="section-title">
          Deal Notes
        </div>

        <div className="deal-notes">

          {deal.deal_notes ? (
            <p>
              {deal.deal_notes}
            </p>
          ) : (
            <p className="empty-text">
              No notes added to this deal.
            </p>
          )}

        </div>

      </section>

      {/* =================================================
          COMMENTS
      ================================================= */}

      <section className="details-section">

        <div className="section-title">
          Comments
        </div>

        <form
          className="comment-form"
          onSubmit={addComment}
        >

          <textarea
            value={comment}
            onChange={(e) =>
              setComment(e.target.value)
            }
            placeholder="Add a comment about this deal..."
            rows="3"
            disabled={activitySubmitting}
          />

          <button
            type="submit"
            className="primary-button"
            disabled={
              activitySubmitting ||
              !comment.trim()
            }
          >
            {activitySubmitting
              ? "Posting..."
              : "Post Comment"}
          </button>

        </form>

      </section>

      {/* =================================================
          DEAL ACTIVITY TIMELINE
      ================================================= */}

      <section className="details-section">

        <div className="activity-section-header">

          <div>

            <div className="section-title">
              Deal Activity
            </div>

            <p className="activity-subtitle">
              Track everything happening
              on this deal.
            </p>

          </div>

          <span className="activity-count">
            {activities.length}
          </span>

        </div>

        {activityLoading ? (

          <div className="activity-loading">
            Loading activities...
          </div>

        ) : activities.length === 0 ? (

          <div className="activity-empty">

            <div className="activity-empty-icon">
              📋
            </div>

            <h3>
              No activity yet
            </h3>

            <p>
              Comments, tasks and status
              changes will appear here.
            </p>

          </div>

        ) : (

          <div className="activity-timeline">

            {activities.map((activity) => (

              <div
                className="activity-item"
                key={activity.id}
              >

                <div className="activity-icon">
                  {getActivityIcon(
                    activity.activity_type
                  )}
                </div>

                <div className="activity-content">

                  <div className="activity-top">

                    <span className="activity-type">
                      {getActivityLabel(
                        activity.activity_type
                      )}
                    </span>

                    <span className="activity-time">
                      {formatActivityDate(
                        activity.created_at
                      )}
                    </span>

                  </div>

                  <div className="activity-details">
                    {activity.details ||
                      "No details available."}
                  </div>

                  <div className="activity-meta">
                    By:{" "}
                    {activity.user_name ||
                      activity.user_id ||
                      "Unknown"}
                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </section>

      {/* =================================================
          SCHEDULE
      ================================================= */}

      <section className="details-section">

        <div className="section-title">
          Schedule
        </div>

        <div className="schedule-placeholder">

          <div className="calendar-icon">
            📅
          </div>

          <h3>
            Schedule an Activity
          </h3>

          <p>
            Schedule a call, meeting or
            follow-up with this customer.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={() => {
              alert(
                "Scheduling feature will be implemented next."
              );
            }}
          >
            + Schedule
          </button>

        </div>

      </section>

    </div>
  );
}

// =====================================================
// INFO ITEM
// =====================================================

function InfoItem({ label, value }) {
  return (
    <div className="info-item">

      <div className="info-label">
        {label}
      </div>

      <div className="info-value">
        {value || "-" }
      </div>

    </div>
  );
}

export default DealDetails;