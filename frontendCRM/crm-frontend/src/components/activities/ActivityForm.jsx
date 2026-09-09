import { useState } from "react";
import api from "../../services/api";
import "../../styles/activities/activity-form.css";

function ActivityForm({
  selectedDate = "",
  deals = [],
  onClose,
  onCreated,
}) {
  const [form, setForm] = useState({
    deal_id: deals.length > 0 ? deals[0].deal_id : "",
    activity_type: "task",
    details: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activityTypes = [
    { key: "task", label: "Task", icon: "✓" },
    { key: "call", label: "Phone Call", icon: "📞" },
    { key: "meeting", label: "Meeting", icon: "📅" },
    { key: "comment", label: "Note / Note", icon: "💬" },
    { key: "message", label: "Message", icon: "✉️" },
    { key: "negotiation", label: "Negotiation", icon: "🤝" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleTypeSelect = (typeKey) => {
    setForm((current) => ({
      ...current,
      activity_type: typeKey,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.deal_id) {
      setError("Please select a related deal.");
      return;
    }

    if (!form.details.trim()) {
      setError("Please write the activity details or notes.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/activities", {
        deal_id: form.deal_id,
        activity_type: form.activity_type,
        details: form.details.trim(),
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Failed to log activity.");
      }

      if (onCreated) {
        onCreated(response.data.activity);
      }

      onClose?.();
    } catch (err) {
      console.error("Create activity error:", err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to log activity."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="activity-modal-form" onSubmit={handleSubmit}>
      {error && <div className="activity-form-alert">{error}</div>}

      {/* Related Deal */}
      <div className="form-field-block">
        <label className="form-field-label" htmlFor="deal_id">
          Related Deal
        </label>
        <select
          id="deal_id"
          name="deal_id"
          className="form-field-select"
          value={form.deal_id}
          onChange={handleChange}
          disabled={loading}
          required
        >
          <option value="">Select a deal...</option>
          {deals.map((deal) => (
            <option key={deal.deal_id} value={deal.deal_id}>
              {deal.deal_name || "Untitled Deal"}
              {deal.deal_value ? ` ($${Number(deal.deal_value).toLocaleString()})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Activity Type Selection Buttons */}
      <div className="form-field-block">
        <label className="form-field-label">Activity Type</label>
        <div className="activity-type-buttons-grid">
          {activityTypes.map((type) => {
            const isActive = form.activity_type === type.key;
            return (
              <button
                key={type.key}
                type="button"
                className={`type-select-btn ${isActive ? "active-type" : ""}`}
                onClick={() => handleTypeSelect(type.key)}
              >
                <span>{type.icon}</span>
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Details Textarea */}
      <div className="form-field-block">
        <label className="form-field-label" htmlFor="details">
          Details / Notes
        </label>
        <textarea
          id="details"
          name="details"
          className="form-field-textarea"
          value={form.details}
          onChange={handleChange}
          placeholder={
            form.activity_type === "call"
              ? "e.g. Spoke with client about contract terms and budget requirements..."
              : form.activity_type === "meeting"
              ? "e.g. Product walkthrough scheduled to review onboarding questions..."
              : "e.g. Follow up on proposal sent yesterday..."
          }
          rows="4"
          disabled={loading}
          required
        />
      </div>

      {/* Actions */}
      <div className="activity-form-footer">
        <button
          type="button"
          className="modal-btn-cancel"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="modal-btn-submit"
          disabled={loading || deals.length === 0}
        >
          {loading ? "Recording..." : "Log Activity"}
        </button>
      </div>
    </form>
  );
}

export default ActivityForm;