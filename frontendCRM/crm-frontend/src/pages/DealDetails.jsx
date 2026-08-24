import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import "../styles/deal-details/deal-details.css";

function DealDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState("");

  const [comment, setComment] = useState("");

  const [comments, setComments] = useState([]);

  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([]);

  // ==========================================
  // FETCH SINGLE DEAL
  // ==========================================

  useEffect(() => {
    const fetchDeal = async () => {
      try {
        setLoading(true);

        console.log("Fetching deal:", id);

        const response = await axios.get(
          `http://localhost:1000/api/deal/${id}`
        );

        console.log(
          "Deal details response:",
          response.data
        );

        const fetchedDeal =
          response.data?.deal || response.data;

        setDeal(fetchedDeal);

        setStatus(
          fetchedDeal?.deal_status || "Open"
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

    if (id) {
      fetchDeal();
    }
  }, [id]);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="deal-details">
        <div className="not-found">
          <h2>Loading deal...</h2>
        </div>
      </div>
    );
  }

  // ==========================================
  // DEAL NOT FOUND
  // ==========================================

  if (!deal) {
    return (
      <div className="not-found">

        <h2>
          Deal not found
        </h2>

        <button
          className="primary-button"
          onClick={() => navigate("/deals")}
        >
          Back to Deals
        </button>

      </div>
    );
  }

  // ==========================================
  // ADD COMMENT
  // ==========================================

  const addComment = (e) => {
    e.preventDefault();

    if (!comment.trim()) {
      return;
    }

    setComments((current) => [
      ...current,

      {
        id: Date.now(),
        user: "You",
        text: comment,
        time: "Just now",
      },
    ]);

    setComment("");
  };

  // ==========================================
  // SEND MESSAGE
  // ==========================================

  const sendMessage = (e) => {
    e.preventDefault();

    if (!message.trim()) {
      return;
    }

    setMessages((current) => [
      ...current,

      {
        id: Date.now(),
        user: "You",
        text: message,
        time: "Just now",
      },
    ]);

    setMessage("");
  };

  // ==========================================
  // UPDATE STATUS
  // ==========================================

  const handleStatusChange = async (newStatus) => {
    try {
      setStatus(newStatus);

      await axios.put(
        `http://localhost:5000/api/deals/${deal.deal_id}`,
        {
          deal_status: newStatus,
        }
      );

      setDeal((current) => ({
        ...current,
        deal_status: newStatus,
      }));

    } catch (error) {
      console.error(
        "Failed to update deal status:",
        error
      );

      // Restore previous value if API fails
      setStatus(
        deal.deal_status || "Open"
      );

      alert(
        error.response?.data?.message ||
          "Failed to update deal status."
      );
    }
  };

  // ==========================================
  // MARK WON
  // ==========================================

  const markAsWon = () => {
    handleStatusChange("Won");
  };

  // ==========================================
  // MARK LOST
  // ==========================================

  const markAsLost = () => {
    handleStatusChange("Lost");
  };

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="deal-details">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="deal-details-header">

        <div>

          <button
            className="back-button"
            onClick={() => navigate("/deals")}
          >
            ← Back
          </button>

          <h1>
            {deal.deal_name ||
              "Untitled Deal"}
          </h1>

          <p>
            {deal.deal_organization ||
              "No organization"}
          </p>

        </div>

        <div className="deal-header-actions">

          <button
            className="status-button won"
            onClick={markAsWon}
          >
            Won
          </button>

          <button
            className="status-button lost"
            onClick={markAsLost}
          >
            Lost
          </button>

        </div>

      </div>

      {/* ======================================
          MAIN INFORMATION
      ====================================== */}

      <div className="deal-info-grid">

        {/* Deal Information */}

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
                deal.deal_value
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

        {/* ==================================
            CURRENT STATUS
        ================================== */}

        <div className="deal-status-card">

          <div className="section-title">
            Current Status
          </div>

          <div className="current-status">
            {status ||
              deal.deal_status ||
              "Open"}
          </div>

          <label>
            Update Status
          </label>

          <select
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

      {/* ======================================
          NOTES
      ====================================== */}

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

      {/* ======================================
          COMMENTS
      ====================================== */}

      <section className="details-section">

        <div className="section-title">
          Comments
        </div>

        <div className="comments-list">

          {comments.length === 0 ? (

            <p className="empty-text">
              No comments yet.
            </p>

          ) : (

            comments.map((item) => (

              <div
                className="comment"
                key={item.id}
              >

                <div className="comment-user">
                  {item.user}
                </div>

                <div className="comment-text">
                  {item.text}
                </div>

                <div className="comment-time">
                  {item.time}
                </div>

              </div>

            ))

          )}

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
            placeholder="Add a comment..."
            rows="3"
          />

          <button
            className="primary-button"
            type="submit"
          >
            Post Comment
          </button>

        </form>

      </section>

      {/* ======================================
          CONVERSATION
      ====================================== */}

      <section className="details-section">

        <div className="section-title">
          Deal Conversation
        </div>

        <div className="conversation">

          {messages.length === 0 ? (

            <p className="empty-text">
              No messages yet.
            </p>

          ) : (

            messages.map((item) => (

              <div
                className="message"
                key={item.id}
              >

                <div className="message-user">
                  {item.user}
                </div>

                <div className="message-text">
                  {item.text}
                </div>

                <div className="message-time">
                  {item.time}
                </div>

              </div>

            ))

          )}

        </div>

        <form
          className="message-form"
          onSubmit={sendMessage}
        >

          <input
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            placeholder="Write a message..."
          />

          <button
            className="primary-button"
            type="submit"
          >
            Send
          </button>

        </form>

      </section>

      {/* ======================================
          SCHEDULE
      ====================================== */}

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

          <button className="primary-button">
            + Schedule
          </button>

        </div>

      </section>

    </div>
  );
}

// ==========================================
// INFO ITEM
// ==========================================

function InfoItem({ label, value }) {
  return (
    <div className="info-item">

      <div className="info-label">
        {label}
      </div>

      <div className="info-value">
        {value || "-"}
      </div>

    </div>
  );
}

export default DealDetails;