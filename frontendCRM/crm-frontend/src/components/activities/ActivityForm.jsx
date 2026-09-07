import { useMemo, useState } from "react";

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const MAX_DETAILS_LENGTH = 2000;

  // =====================================================
  // FORMAT SELECTED DATE
  // =====================================================

  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) {
      return "";
    }

    const date = new Date(
      `${selectedDate}T00:00:00`
    );

    if (Number.isNaN(date.getTime())) {
      return selectedDate;
    }

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDate]);

  // =====================================================
  // SELECTED DEAL
  // =====================================================

  const selectedDeal = useMemo(() => {
    return deals.find(
      (deal) =>
        String(deal.deal_id) ===
        String(form.deal_id)
    );
  }, [deals, form.deal_id]);

  // =====================================================
  // ACTIVITY TYPES
  // =====================================================

  const activityTypes = [
    {
      value: "task",
      label: "Task",
      description: "Action or follow-up required",
    },
    {
      value: "comment",
      label: "Comment",
      description: "Internal note or update",
    },
    {
      value: "stage change",
      label: "Stage Change",
      description: "Pipeline stage update",
    },
  ];

  // =====================================================
  // HANDLE CHANGE
  // =====================================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setError("");

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // =====================================================
  // HANDLE DETAILS CHANGE
  // =====================================================

  const handleDetailsChange = (event) => {
    const value =
      event.target.value.slice(
        0,
        MAX_DETAILS_LENGTH
      );

    setError("");

    setForm((current) => ({
      ...current,
      details: value,
    }));
  };

  // =====================================================
  // VALIDATE
  // =====================================================

  const validateForm = () => {
    if (!form.deal_id) {
      return "Please select a related deal.";
    }

    if (!form.activity_type) {
      return "Please select an activity type.";
    }

    const details = form.details.trim();

    if (!details) {
      return "Please enter activity details.";
    }

    if (details.length < 3) {
      return "Activity details must contain at least 3 characters.";
    }

    return "";
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const payload = {
        deal_id: form.deal_id,
        activity_type: form.activity_type,
        details: form.details.trim(),
      };

      const response = await api.post(
        "/activities",
        payload
      );

      if (!response.data?.success) {
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

      // Reset form
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
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to create activity."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <form
      className="activity-form"
      onSubmit={handleSubmit}
    >
      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div
          className="activity-form-error"
          role="alert"
        >
          <span className="activity-error-icon">
            !
          </span>

          <span>{error}</span>
        </div>
      )}

      {/* =================================================
          SELECTED DATE
      ================================================= */}

      {selectedDate && (
        <div className="activity-selected-date">
          <div className="selected-date-icon">
            <span />
          </div>

          <div className="selected-date-content">
            <span className="selected-date-label">
              Activity Date
            </span>

            <strong>
              {formattedSelectedDate}
            </strong>
          </div>
        </div>
      )}

      {/* =================================================
          RELATED DEAL
      ================================================= */}

      <div className="form-group">
        <label htmlFor="activity-deal">
          Related Deal
          <span className="required-mark">
            *
          </span>
        </label>

        <select
          id="activity-deal"
          name="deal_id"
          value={form.deal_id}
          onChange={handleChange}
          disabled={
            loading ||
            deals.length === 0
          }
          required
        >
          <option value="">
            Select a deal
          </option>

          {deals.map((deal) => (
            <option
              key={deal.deal_id}
              value={deal.deal_id}
            >
              {deal.deal_name ||
                "Untitled Deal"}
            </option>
          ))}
        </select>

        {deals.length === 0 ? (
          <small className="form-help form-help-warning">
            No deals are available for your
            account.
          </small>
        ) : (
          <small className="form-help">
            Select the deal this activity
            belongs to.
          </small>
        )}
      </div>

      {/* =================================================
          SELECTED DEAL PREVIEW
      ================================================= */}

      {selectedDeal && (
        <div className="selected-deal-preview">
          <div className="selected-deal-info">
            <span className="selected-deal-label">
              Selected Deal
            </span>

            <strong>
              {selectedDeal.deal_name ||
                "Untitled Deal"}
            </strong>
          </div>

          {selectedDeal.deal_organization && (
            <span className="selected-deal-organization">
              {selectedDeal.deal_organization}
            </span>
          )}
        </div>
      )}

      {/* =================================================
          ACTIVITY TYPE
      ================================================= */}

      <div className="form-group">
        <label htmlFor="activity-type">
          Activity Type
          <span className="required-mark">
            *
          </span>
        </label>

        <select
          id="activity-type"
          name="activity_type"
          value={form.activity_type}
          onChange={handleChange}
          disabled={loading}
          required
        >
          {activityTypes.map((type) => (
            <option
              key={type.value}
              value={type.value}
            >
              {type.label}
            </option>
          ))}
        </select>

        <small className="form-help">
          {
            activityTypes.find(
              (type) =>
                type.value ===
                form.activity_type
            )?.description
          }
        </small>
      </div>

      {/* =================================================
          DETAILS
      ================================================= */}

      <div className="form-group">
        <div className="form-label-row">
          <label htmlFor="activity-details">
            Details
            <span className="required-mark">
              *
            </span>
          </label>

          <span className="character-count">
            {form.details.length}/
            {MAX_DETAILS_LENGTH}
          </span>
        </div>

        <textarea
          id="activity-details"
          name="details"
          value={form.details}
          onChange={handleDetailsChange}
          placeholder="Enter activity details, notes, or follow-up information..."
          rows={5}
          maxLength={MAX_DETAILS_LENGTH}
          disabled={loading}
          required
        />

        <small className="form-help">
          Add relevant information that your
          team can use for future reference.
        </small>
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
          {loading ? (
            <>
              <span className="button-spinner" />
              Saving...
            </>
          ) : (
            <>
              <span className="button-check">
                ✓
              </span>
              Create Activity
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default ActivityForm;