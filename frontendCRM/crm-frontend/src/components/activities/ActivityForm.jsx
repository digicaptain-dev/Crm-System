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
    deal_id: "",
    activity_type: "task",
    details: "",
  });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // =====================================================
  // HANDLE CHANGE
  // =====================================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setForm(
      (current) => ({
        ...current,
        [name]: value,
      })
    );
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!form.deal_id) {
      setError(
        "Please select a deal."
      );

      return;
    }

    if (!form.activity_type) {
      setError(
        "Please select an activity type."
      );

      return;
    }

    if (!form.details.trim()) {
      setError(
        "Please enter activity details."
      );

      return;
    }

    try {
      setLoading(true);

      const response =
        await api.post(
          "/activities",
          {
            deal_id:
              form.deal_id,

            activity_type:
              form.activity_type,

            details:
              form.details.trim(),
          }
        );

      console.log(
        "Create activity response:",
        response.data
      );

      if (
        !response.data?.success
      ) {
        throw new Error(
          response.data?.message ||
          "Failed to create activity."
        );
      }

      if (onCreated) {
        onCreated(
          response.data.activity
        );
      }

      setForm({
        deal_id: "",
        activity_type: "task",
        details: "",
      });

      onClose?.();

    } catch (error) {
      console.error(
        "Create activity error:",
        error
      );

      setError(
        error.response?.data
          ?.message ||
        error.response?.data
          ?.error ||
        error.message ||
        "Failed to create activity."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="activity-form"
      onSubmit={handleSubmit}
    >

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="activity-form-error">
          {error}
        </div>
      )}

      {/* =================================================
          SELECTED DATE
      ================================================= */}

      {selectedDate && (
        <div className="activity-selected-date">

          <span>
            Selected Date
          </span>

          <strong>
            {selectedDate}
          </strong>

        </div>
      )}

      {/* =================================================
          DEAL
      ================================================= */}

      <div className="form-group">

        <label htmlFor="deal_id">
          Related Deal
        </label>

        <select
          id="deal_id"
          name="deal_id"
          value={form.deal_id}
          onChange={handleChange}
          disabled={loading}
          required
        >

          <option value="">
            Select a deal
          </option>

          {deals.map(
            (deal) => (
              <option
                key={deal.deal_id}
                value={
                  deal.deal_id
                }
              >
                {deal.deal_name ||
                  "Untitled Deal"}
              </option>
            )
          )}

        </select>

        {deals.length === 0 && (
          <small className="form-help">
            No deals are available
            for this user.
          </small>
        )}

      </div>

      {/* =================================================
          ACTIVITY TYPE
      ================================================= */}

      <div className="form-group">

        <label htmlFor="activity_type">
          Activity Type
        </label>

        <select
          id="activity_type"
          name="activity_type"
          value={
            form.activity_type
          }
          onChange={handleChange}
          disabled={loading}
        >

          <option value="task">
            Task
          </option>

          <option value="comment">
            Comment
          </option>

          <option value="stage change">
            Stage Change
          </option>

          <option value="call">
            Call
          </option>

          <option value="meeting">
            Meeting
          </option>

          <option value="message">
            Message
          </option>

          <option value="negotiation">
            Negotiation
          </option>

        </select>

      </div>

      {/* =================================================
          DETAILS
      ================================================= */}

      <div className="form-group">

        <label htmlFor="details">
          Details
        </label>

        <textarea
          id="details"
          name="details"
          value={form.details}
          onChange={handleChange}
          placeholder="Enter activity details..."
          rows="5"
          disabled={loading}
          required
        />

      </div>

      {/* =================================================
          ACTIONS
      ================================================= */}

      <div className="activity-form-actions">

        <button
          type="button"
          className="secondary-button"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="primary-button"
          disabled={
            loading ||
            deals.length === 0
          }
        >
          {loading
            ? "Saving..."
            : "Create Activity"}
        </button>

      </div>

    </form>
  );
}

export default ActivityForm;