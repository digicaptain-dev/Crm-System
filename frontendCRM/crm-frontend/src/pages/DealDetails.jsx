import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import "../styles/deal-details/deal-details.css";

const mockDeals = [
  {
    id: 1,
    name: "ABC Website",
    company: "ABC Company",
    email: "john@example.com",
    phone: "+1 555 123 4567",
    owner: "John",
    value: "$10,000",
    priority: "High",
    pipeline: "Sales",
    stage: "New Leads",
  },
  {
    id: 2,
    name: "XYZ Project",
    company: "XYZ Corporation",
    email: "david@example.com",
    phone: "+1 555 987 6543",
    owner: "David",
    value: "$20,000",
    priority: "Medium",
    pipeline: "Sales",
    stage: "Contacted",
  },
  {
    id: 3,
    name: "Website Redesign",
    company: "Demo Company",
    email: "mike@example.com",
    phone: "+1 555 444 2222",
    owner: "Mike",
    value: "$15,000",
    priority: "Low",
    pipeline: "Sales",
    stage: "Proposal",
  },
];

function DealDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const deal = mockDeals.find(
    (item) => item.id === Number(id)
  );

  const [status, setStatus] = useState(
    deal?.stage || "New Leads"
  );

  const [comment, setComment] = useState("");

  const [comments, setComments] = useState([
    {
      id: 1,
      user: "John",
      text: "Initial discussion with the customer.",
      time: "Today, 10:30 AM",
    },
    {
      id: 2,
      user: "David",
      text: "Customer requested more information.",
      time: "Today, 11:15 AM",
    },
  ]);

  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([
    {
      id: 1,
      user: "John",
      text: "Hello, I have contacted the customer.",
      time: "10:30 AM",
    },
    {
      id: 2,
      user: "David",
      text: "Great. Please update the proposal.",
      time: "10:42 AM",
    },
  ]);

  if (!deal) {
    return (
      <div className="not-found">
        <h2>Deal not found</h2>

        <button
          className="primary-button"
          onClick={() => navigate("/")}
        >
          Back to Deals
        </button>
      </div>
    );
  }

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

  return (
    <div className="deal-details">

      {/* Header */}
      <div className="deal-details-header">

        <div>
          <button
            className="back-button"
            onClick={() => navigate("/")}
          >
            ← Back
          </button>

          <h1>{deal.name}</h1>

          <p>{deal.company}</p>
        </div>

        <div className="deal-header-actions">

          <button
            className="status-button won"
            onClick={() => setStatus("Won")}
          >
            Won
          </button>

          <button
            className="status-button lost"
            onClick={() => setStatus("Lost")}
          >
            Lost
          </button>

        </div>

      </div>

      {/* Main information */}
      <div className="deal-info-grid">

        <div className="deal-info-card">

          <div className="section-title">
            Deal Information
          </div>

          <div className="info-grid">

            <InfoItem
              label="Deal Name"
              value={deal.name}
            />

            <InfoItem
              label="Company"
              value={deal.company}
            />

            <InfoItem
              label="Email"
              value={deal.email}
            />

            <InfoItem
              label="Phone"
              value={deal.phone}
            />

            <InfoItem
              label="Owner"
              value={deal.owner}
            />

            <InfoItem
              label="Value"
              value={deal.value}
            />

            <InfoItem
              label="Priority"
              value={deal.priority}
            />

            <InfoItem
              label="Pipeline"
              value={deal.pipeline}
            />

          </div>

        </div>

        <div className="deal-status-card">

          <div className="section-title">
            Current Status
          </div>

          <div className="current-status">
            {status}
          </div>

          <label>Move Deal</label>

          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
          >
            <option>New Leads</option>
            <option>Contacted</option>
            <option>Proposal</option>
            <option>Won</option>
            <option>Lost</option>
          </select>

        </div>

      </div>

      {/* Comments */}
      <section className="details-section">

        <div className="section-title">
          Comments
        </div>

        <div className="comments-list">

          {comments.map((item) => (
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
          ))}

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

      {/* Conversation */}
      <section className="details-section">

        <div className="section-title">
          Deal Conversation
        </div>

        <div className="conversation">

          {messages.map((item) => (
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
          ))}

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

      {/* Schedule */}
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
            Schedule a call, meeting or follow-up
            with this customer.
          </p>

          <button className="primary-button">
            + Schedule
          </button>

        </div>

      </section>

    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="info-item">
      <div className="info-label">
        {label}
      </div>

      <div className="info-value">
        {value}
      </div>
    </div>
  );
}

export default DealDetails;