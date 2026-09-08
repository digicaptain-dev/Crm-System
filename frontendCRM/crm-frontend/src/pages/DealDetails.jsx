import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../services/api";

import "../styles/deal-details/deal-details.css";

function DealDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState("");

  const [comment, setComment] = useState("");
  const [activities, setActivities] = useState([]);

  const [activityLoading, setActivityLoading] = useState(false);
  const [activitySubmitting, setActivitySubmitting] = useState(false);

  /* =========================
     FETCH DEAL
  ========================= */

  const fetchDeal = async () => {
    try {
      setLoading(true);

      const response = await api.get(`/deal/${id}`);

      const dealData = response.data?.deal || response.data;

      if (!dealData?.deal_id) {
        throw new Error("Invalid deal response");
      }

      setDeal(dealData);
      setStatus(dealData.deal_status || "Open");
    } catch (error) {
      console.error("FETCH DEAL ERROR:", error);

      alert(
        error.response?.data?.message ||
          "Unable to load deal details."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     FETCH ACTIVITIES
  ========================= */

  const fetchActivities = async () => {
    try {
      setActivityLoading(true);

      const response = await api.get(
        `/deals/${id}/activities`
      );

      const activityData =
        response.data?.activities ||
        response.data ||
        [];

      setActivities(
        Array.isArray(activityData)
          ? activityData
          : []
      );
    } catch (error) {
      console.error("FETCH ACTIVITIES ERROR:", error);

      setActivities([]);
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    fetchDeal();
    fetchActivities();
  }, [id]);

  /* =========================
     LOG ACTIVITY
  ========================= */

  const logActivity = async (
    activityType,
    details
  ) => {
    try {
      await api.post("/activities", {
        deal_id: id,
        activity_type: activityType,
        details: details || null,
      });

      await fetchActivities();
    } catch (error) {
      console.error("LOG ACTIVITY ERROR:", error);
    }
  };

  /* =========================
     ADD COMMENT
  ========================= */

  const addComment = async (e) => {
    e.preventDefault();

    const trimmedComment = comment.trim();

    if (!trimmedComment) return;

    try {
      setActivitySubmitting(true);

      await logActivity(
        "comment",
        trimmedComment
      );

      setComment("");
    } catch (error) {
      console.error("ADD COMMENT ERROR:", error);
    } finally {
      setActivitySubmitting(false);
    }
  };

  /* =========================
     STATUS CHANGE
  ========================= */

  const handleStatusChange = async (
    newStatus
  ) => {
    if (!deal) return;

    try {
      await api.put(
        `/deal/${deal.deal_id}`,
        {
          deal_status: newStatus,
        }
      );

      setDeal((previous) => ({
        ...previous,
        deal_status: newStatus,
      }));

      setStatus(newStatus);

      await logActivity(
        "stage change",
        `Deal status changed to ${newStatus}`
      );
    } catch (error) {
      console.error(
        "STATUS CHANGE ERROR:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Unable to update deal status."
      );
    }
  };

  /* =========================
     FORMAT HELPERS
  ========================= */

  const formatCurrency = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "—";
    }

    const numberValue = Number(value);

    if (Number.isNaN(numberValue)) {
      return value;
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: deal?.currency || "USD",
      maximumFractionDigits: 2,
    }).format(numberValue);
  };

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "comment":
        return "💬";

      case "stage change":
        return "↗";

      case "task":
        return "✓";

      default:
        return "•";
    }
  };

  const getActivityLabel = (type) => {
    switch (type) {
      case "comment":
        return "Comment";

      case "stage change":
        return "Stage Change";

      case "task":
        return "Task";

      default:
        return "Activity";
    }
  };

  const getStatusClass = (value) => {
    switch (value) {
      case "Closed Won":
        return "status-won";

      case "Closed Lost":
        return "status-lost";

      case "Removed":
        return "status-removed";

      default:
        return "status-open";
    }
  };

  const getPriorityClass = (value) => {
    switch (value) {
      case "High":
        return "priority-high";

      case "Low":
        return "priority-low";

      default:
        return "priority-medium";
    }
  };

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <div className="deal-details-page">
        <div className="deal-details-loading">
          <div className="loading-spinner"></div>
          <p>Loading deal details...</p>
        </div>
      </div>
    );
  }

  /* =========================
     EMPTY STATE
  ========================= */

  if (!deal) {
    return (
      <div className="deal-details-page">
        <div className="deal-empty-state">
          <div className="empty-icon">!</div>

          <h2>Deal Not Found</h2>

          <p>
            The deal you're looking for could not
            be found or you don't have access to it.
          </p>

          <button
            className="primary-button"
            onClick={() => navigate("/deals")}
          >
            Back to Deals
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="deal-details-page">

      {/* =========================
          HEADER
      ========================= */}

      <header className="deal-header">

        <div className="deal-header-left">

          <button
            className="back-button"
            onClick={() => navigate("/deals")}
            aria-label="Back to deals"
          >
            ←
          </button>

          <div className="deal-header-content">

            <div className="breadcrumb">
              Deals
              <span>/</span>
              Deal Details
            </div>

            <div className="deal-title-row">

              <h1>
                {deal.deal_name || "Untitled Deal"}
              </h1>

              <span
                className={`status-badge ${getStatusClass(
                  status
                )}`}
              >
                <span className="status-dot"></span>
                {status || "Open"}
              </span>

            </div>

            {deal.deal_organization && (
              <div className="deal-organization">
                <span className="organization-icon">
                  ◈
                </span>

                {deal.deal_organization}
              </div>
            )}

          </div>

        </div>

        <div className="deal-header-actions">

          <button
            className="secondary-button"
            onClick={() => navigate("/deals")}
          >
            Back to Deals
          </button>

          <button
            className="primary-button"
            onClick={() =>
              handleStatusChange("Closed Won")
            }
            disabled={status === "Closed Won"}
          >
            Mark as Won
          </button>

        </div>

      </header>

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <main className="deal-main">

        {/* =========================
            SUMMARY CARDS
        ========================= */}

        <section className="deal-summary-grid">

          <div className="summary-card">

            <div className="summary-label">
              Deal Value
            </div>

            <div className="summary-value">
              {formatCurrency(deal.deal_value)}
            </div>

          </div>

          <div className="summary-card">

            <div className="summary-label">
              Probability
            </div>

            <div className="summary-value">
              {deal.probability !== null &&
              deal.probability !== undefined
                ? `${deal.probability}%`
                : "—"}
            </div>

          </div>

          <div className="summary-card">

            <div className="summary-label">
              Priority
            </div>

            <div
              className={`summary-priority ${getPriorityClass(
                deal.deal_priority
              )}`}
            >
              <span className="priority-indicator"></span>

              {deal.deal_priority || "Medium"}
            </div>

          </div>

          <div className="summary-card">

            <div className="summary-label">
              Expected Close
            </div>

            <div className="summary-value">
              {formatDate(deal.close_date)}
            </div>

          </div>

        </section>

        <div className="deal-content-grid">

          {/* =========================
              LEFT COLUMN
          ========================= */}

          <div className="deal-left-column">

            {/* DEAL INFORMATION */}

            <section className="deal-section">

              <div className="section-header">

                <div>
                  <h2>Deal Information</h2>
                  <p>
                    Key information about this opportunity
                  </p>
                </div>

              </div>

              <div className="info-grid">

                <div className="info-item">
                  <span className="info-label">
                    Pipeline
                  </span>

                  <span className="info-value">
                    {deal.pipeline_name || "—"}
                  </span>
                </div>

                <div className="info-item">
                  <span className="info-label">
                    Stage
                  </span>

                  <span className="info-value">
                    {deal.stage_name || "—"}
                  </span>
                </div>

                <div className="info-item">
                  <span className="info-label">
                    Deal Owner
                  </span>

                  <span className="info-value">
                    {deal.owner_name || "—"}
                  </span>
                </div>

                <div className="info-item">
                  <span className="info-label">
                    Assigned To
                  </span>

                  <span className="info-value">
                    {deal.assigned_user_name || "—"}
                  </span>
                </div>

                <div className="info-item">
                  <span className="info-label">
                    Lead Source
                  </span>

                  <span className="info-value">
                    {deal.deal_source || "—"}
                  </span>
                </div>

                <div className="info-item">
                  <span className="info-label">
                    Currency
                  </span>

                  <span className="info-value">
                    {deal.currency || "USD"}
                  </span>
                </div>

                <div className="info-item">
                  <span className="info-label">
                    Time Zone
                  </span>

                  <span className="info-value">
                    {deal.time_zone || "—"}
                  </span>
                </div>

                <div className="info-item">
                  <span className="info-label">
                    Created
                  </span>

                  <span className="info-value">
                    {formatDateTime(
                      deal.creation_date
                    )}
                  </span>
                </div>

              </div>

            </section>

            {/* CUSTOMER */}

            <section className="deal-section">

              <div className="section-header">

                <div>
                  <h2>Customer</h2>
                  <p>
                    Customer and contact information
                  </p>
                </div>

              </div>

              <div className="customer-profile">

                <div className="customer-avatar">
                  {(
                    deal.contact_person ||
                    deal.deal_organization ||
                    "C"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="customer-profile-info">

                  <h3>
                    {deal.contact_person ||
                      "Contact Person"}
                  </h3>

                  <span>
                    {deal.deal_organization ||
                      "Organization not specified"}
                  </span>

                </div>

              </div>

              <div className="customer-details">

                <div className="contact-detail">

                  <span className="contact-icon">
                    ✉
                  </span>

                  <div>
                    <span className="contact-label">
                      Email
                    </span>

                    <span className="contact-value">
                      {deal.customer_email || "—"}
                    </span>
                  </div>

                </div>

                <div className="contact-detail">

                  <span className="contact-icon">
                    ☎
                  </span>

                  <div>
                    <span className="contact-label">
                      Phone
                    </span>

                    <span className="contact-value">
                      {deal.customer_number || "—"}
                    </span>
                  </div>

                </div>

                <div className="contact-detail">

                  <span className="contact-icon">
                    ⌖
                  </span>

                  <div>
                    <span className="contact-label">
                      Address
                    </span>

                    <span className="contact-value">
                      {deal.customer_address || "—"}
                    </span>
                  </div>

                </div>

              </div>

            </section>

            {/* NOTES */}

            <section className="deal-section">

              <div className="section-header">

                <div>
                  <h2>Notes</h2>
                  <p>
                    Additional information about this deal
                  </p>
                </div>

              </div>

              <div className="deal-notes">

                {deal.deal_notes ? (
                  <p>{deal.deal_notes}</p>
                ) : (
                  <span className="empty-text">
                    No notes have been added to this deal.
                  </span>
                )}

              </div>

            </section>

            {/* PRODUCTS / SERVICES */}

            {(deal.products_services ||
              deal.tags) && (
              <section className="deal-section">

                <div className="section-header">

                  <div>
                    <h2>Additional Details</h2>
                    <p>
                      Products, services and tags
                    </p>
                  </div>

                </div>

                {deal.products_services && (
                  <div className="additional-row">

                    <span className="info-label">
                      Products / Services
                    </span>

                    <span className="info-value">
                      {deal.products_services}
                    </span>

                  </div>
                )}

                {deal.tags && (
                  <div className="additional-row">

                    <span className="info-label">
                      Tags
                    </span>

                    <div className="tags-list">

                      {deal.tags
                        .split(",")
                        .map((tag, index) => (
                          <span
                            className="deal-tag"
                            key={`${tag}-${index}`}
                          >
                            {tag.trim()}
                          </span>
                        ))}

                    </div>

                  </div>
                )}

              </section>
            )}

          </div>

          {/* =========================
              RIGHT COLUMN
          ========================= */}

          <aside className="deal-right-column">

            {/* STATUS */}

            <section className="deal-section status-section">

              <div className="section-header">

                <div>
                  <h2>Deal Status</h2>
                  <p>
                    Update the current status
                  </p>
                </div>

              </div>

              <div className="status-actions">

                <button
                  className={`status-action ${
                    status === "Open"
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    handleStatusChange("Open")
                  }
                >
                  <span className="status-action-dot open"></span>
                  Open
                </button>

                <button
                  className={`status-action ${
                    status === "Closed Won"
                      ? "active won"
                      : ""
                  }`}
                  onClick={() =>
                    handleStatusChange(
                      "Closed Won"
                    )
                  }
                >
                  <span className="status-action-dot won"></span>
                  Closed Won
                </button>

                <button
                  className={`status-action ${
                    status === "Closed Lost"
                      ? "active lost"
                      : ""
                  }`}
                  onClick={() =>
                    handleStatusChange(
                      "Closed Lost"
                    )
                  }
                >
                  <span className="status-action-dot lost"></span>
                  Closed Lost
                </button>

                <button
                  className={`status-action ${
                    status === "Removed"
                      ? "active removed"
                      : ""
                  }`}
                  onClick={() =>
                    handleStatusChange("Removed")
                  }
                >
                  <span className="status-action-dot removed"></span>
                  Removed
                </button>

              </div>

            </section>

            {/* ACTIVITY */}

            <section className="deal-section activity-section">

              <div className="section-header">

                <div>
                  <h2>Activity</h2>
                  <p>
                    Recent activity on this deal
                  </p>
                </div>

                <span className="activity-count">
                  {activities.length}
                </span>

              </div>

              {/* COMMENT */}

              <form
                className="comment-form"
                onSubmit={addComment}
              >

                <textarea
                  value={comment}
                  onChange={(e) =>
                    setComment(e.target.value)
                  }
                  placeholder="Write a comment..."
                  rows="3"
                  disabled={activitySubmitting}
                />

                <div className="comment-form-footer">

                  <span>
                    Add an internal note
                  </span>

                  <button
                    type="submit"
                    className="comment-button"
                    disabled={
                      activitySubmitting ||
                      !comment.trim()
                    }
                  >
                    {activitySubmitting
                      ? "Adding..."
                      : "Add Comment"}
                  </button>

                </div>

              </form>

              {/* TIMELINE */}

              <div className="activity-timeline">

                {activityLoading ? (
                  <div className="activity-loading">
                    Loading activity...
                  </div>
                ) : activities.length === 0 ? (
                  <div className="activity-empty">

                    <div className="activity-empty-icon">
                      ○
                    </div>

                    <p>
                      No activity yet
                    </p>

                    <span>
                      Comments and deal updates
                      will appear here.
                    </span>

                  </div>
                ) : (
                  activities.map(
                    (activity, index) => (
                      <div
                        className="activity-item"
                        key={
                          activity.id ||
                          activity.activity_id ||
                          index
                        }
                      >

                        <div className="activity-line">

                          <div className="activity-icon">
                            {getActivityIcon(
                              activity.activity_type
                            )}
                          </div>

                          {index !==
                            activities.length - 1 && (
                            <div className="timeline-line"></div>
                          )}

                        </div>

                        <div className="activity-content">

                          <div className="activity-top">

                            <span className="activity-type">
                              {getActivityLabel(
                                activity.activity_type
                              )}
                            </span>

                            <span className="activity-date">
                              {formatDateTime(
                                activity.created_at
                              )}
                            </span>

                          </div>

                          <p className="activity-details">
                            {activity.details ||
                              "Activity recorded"}
                          </p>

                          {activity.user_name && (
                            <span className="activity-user">
                              by {activity.user_name}
                            </span>
                          )}

                        </div>

                      </div>
                    )
                  )
                )}

              </div>

            </section>

            {/* LAST UPDATED */}

            <div className="last-updated">

              <span className="last-updated-dot"></span>

              Last updated{" "}
              {formatDateTime(
                deal.last_updated
              )}

            </div>

          </aside>

        </div>

      </main>
    </div>
  );
}

export default DealDetails;