import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import "../styles/lead-details/lead-details.css";

const mockLeads = [
  {
    id: 1,
    name: "John Smith",
    company: "ABC Company",
    email: "john@example.com",
    phone: "+1 555 111 2222",
    owner: "John",
    status: "New",
    source: "Website",
  },
  {
    id: 2,
    name: "David Wilson",
    company: "XYZ Corporation",
    email: "david@example.com",
    phone: "+1 555 333 4444",
    owner: "David",
    status: "Contacted",
    source: "Referral",
  },
  {
    id: 3,
    name: "Michael Brown",
    company: "Demo Company",
    email: "michael@example.com",
    phone: "+1 555 555 6666",
    owner: "Michael",
    status: "Qualified",
    source: "Website",
  },
  {
    id: 4,
    name: "Sarah Johnson",
    company: "Global Solutions",
    email: "sarah@example.com",
    phone: "+1 555 777 8888",
    owner: "Sarah",
    status: "Converted",
    source: "Campaign",
  },
];

function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const lead = mockLeads.find(
    (item) => item.id === Number(id)
  );

  const [status, setStatus] = useState(
    lead?.status || "New"
  );

  const [comment, setComment] = useState("");

  const [comments, setComments] = useState([
    {
      id: 1,
      user: "John",
      text: "Initial discussion with the lead.",
      time: "Today, 10:30 AM",
    },
    {
      id: 2,
      user: "David",
      text: "Lead requested more information.",
      time: "Today, 11:15 AM",
    },
  ]);

  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([
    {
      id: 1,
      user: "John",
      text: "I have contacted the lead.",
      time: "10:30 AM",
    },
    {
      id: 2,
      user: "David",
      text: "Great. Please follow up tomorrow.",
      time: "10:42 AM",
    },
  ]);

  if (!lead) {
    return (
      <div className="lead-not-found">
        <h2>Lead not found</h2>

        <button
          className="primary-button"
          onClick={() => navigate("/leads")}
        >
          Back to Leads
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
    <div className="lead-details">

      {/* Header */}
      <div className="lead-details-header">

        <div>
          <button
            className="back-button"
            onClick={() => navigate("/leads")}
          >
            ← Back
          </button>

          <h1>{lead.name}</h1>

          <p>{lead.company}</p>
        </div>

        <div className="lead-header-actions">

          <button
            className="status-button converted"
            onClick={() => setStatus("Converted")}
          >
            Convert
          </button>

          <button
            className="status-button lost"
            onClick={() => setStatus("Lost")}
          >
            Lost
          </button>

        </div>

      </div>


      {/* Main Information */}
      <div className="lead-info-grid">

        <div className="lead-info-card">

          <div className="section-title">
            Lead Information
          </div>

          <div className="info-grid">

            <InfoItem
              label="Lead Name"
              value={lead.name}
            />

            <InfoItem
              label="Company"
              value={lead.company}
            />

            <InfoItem
              label="Email"
              value={lead.email}
            />

            <InfoItem
              label="Phone"
              value={lead.phone}
            />

            <InfoItem
              label="Owner"
              value={lead.owner}
            />

            <InfoItem
              label="Source"
              value={lead.source}
            />

          </div>

        </div>


        {/* Status */}
        <div className="lead-status-card">

          <div className="section-title">
            Current Status
          </div>

          <div
            className={`current-lead-status ${status
              .toLowerCase()
              .replace(/\s+/g, "-")}`}
          >
            {status}
          </div>

          <label>
            Update Lead Status
          </label>

          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
          >
            <option>New</option>
            <option>Contacted</option>
            <option>Qualified</option>
            <option>Converted</option>
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
          Lead Conversation
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
            with this lead.
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

export default LeadDetails;