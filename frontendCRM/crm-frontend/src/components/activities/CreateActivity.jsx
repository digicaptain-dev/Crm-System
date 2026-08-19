import { useState } from "react";

import "../../styles/activities/create-activity.css";

function CreateActivity({
  onClose,
  onCreate,
  selectedDate,
}) {
  const [form, setForm] = useState({
    type: "Meeting",
    title: "",
    date: selectedDate || "",
    time: "",
    owner: "",
    relatedTo: "",
    description: "",
    status: "Pending",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newActivity = {
      id: Date.now(),
      ...form,
    };

    onCreate(newActivity);

    onClose();
  };

  return (
    <form
      className="create-activity-form"
      onSubmit={handleSubmit}
    >
      {/* Activity Type */}
      <div className="form-group">
        <label>Activity Type</label>

        <select
          name="type"
          value={form.type}
          onChange={handleChange}
        >
          <option value="Meeting">
            Meeting
          </option>

          <option value="Call">
            Call
          </option>

          <option value="Follow-up">
            Follow-up
          </option>

          <option value="Task">
            Task
          </option>
        </select>
      </div>

      {/* Title */}
      <div className="form-group">
        <label>Activity Title</label>

        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Enter activity title"
          required
        />
      </div>

      {/* Date */}
      <div className="form-group">
        <label>Date</label>

        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          required
        />
      </div>

      {/* Time */}
      <div className="form-group">
        <label>Time</label>

        <input
          type="time"
          name="time"
          value={form.time}
          onChange={handleChange}
          required
        />
      </div>

      {/* Owner */}
      <div className="form-group">
        <label>Owner</label>

        <input
          type="text"
          name="owner"
          value={form.owner}
          onChange={handleChange}
          placeholder="Enter activity owner"
        />
      </div>

      {/* Related To */}
      <div className="form-group">
        <label>Related To</label>

        <input
          type="text"
          name="relatedTo"
          value={form.relatedTo}
          onChange={handleChange}
          placeholder="Lead or Deal name"
        />
      </div>

      {/* Description */}
      <div className="form-group">
        <label>Description</label>

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Enter activity details..."
          rows="4"
        />
      </div>

      {/* Status */}
      <div className="form-group">
        <label>Status</label>

        <select
          name="status"
          value={form.status}
          onChange={handleChange}
        >
          <option value="Pending">
            Pending
          </option>

          <option value="Completed">
            Completed
          </option>

          <option value="Cancelled">
            Cancelled
          </option>
        </select>
      </div>

      {/* Actions */}
      <div className="form-actions">

        <button
          type="button"
          className="secondary-button"
          onClick={onClose}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="primary-button"
        >
          Create Activity
        </button>

      </div>
    </form>
  );
}

export default CreateActivity;