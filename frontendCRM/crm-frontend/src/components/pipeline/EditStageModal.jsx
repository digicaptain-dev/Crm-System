import { useEffect, useState } from "react";
import "../../styles/pipeline/edit-stage-modal.css";

function EditStageModal({ stage, onClose, onUpdate }) {
  const [form, setForm] = useState({
    stage_name: "",
    description: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (stage) {
      setForm({
        stage_name: stage.stage_name || "",
        description: stage.description || "",
      });

      setError("");
    }
  }, [stage]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const stageName = form.stage_name.trim();

    if (!stageName) {
      setError("Stage name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await onUpdate({
        stage_name: stageName,
        description: form.description.trim(),
      });
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Failed to update stage."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!stage) {
    return null;
  }

  return (
    <div
      className="edit-stage-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <div className="edit-stage-modal">
        {/* Header */}
        <div className="edit-stage-modal-header">
          <div>
            <h2>Edit Stage</h2>
            <p>Update the stage name or description.</p>
          </div>

          <button
            type="button"
            className="edit-stage-modal-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="edit-stage-modal-error">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Stage Name */}
          <div className="edit-stage-form-group">
            <label htmlFor="edit-stage-name">
              Stage Name <span>*</span>
            </label>

            <input
              id="edit-stage-name"
              name="stage_name"
              type="text"
              value={form.stage_name}
              onChange={handleChange}
              placeholder="Enter stage name"
              disabled={saving}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="edit-stage-form-group">
            <label htmlFor="edit-stage-description">
              Description{" "}
              <span className="edit-stage-optional-label">
                (Optional)
              </span>
            </label>

            <textarea
              id="edit-stage-description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter stage description"
              rows={4}
              disabled={saving}
            />
          </div>

          {/* Actions */}
          <div className="edit-stage-modal-actions">
            <button
              type="button"
              className="edit-stage-cancel-btn"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="edit-stage-save-btn"
              disabled={saving}
            >
              {saving ? "Updating..." : "Update Stage"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditStageModal;