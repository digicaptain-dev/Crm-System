import { useState } from "react";

import "../../styles/pipeline/add-stage-modal.css";

function AddStageModal({
  pipeline,
  onClose,
  onCreate,
}) {
  const [form, setForm] = useState({
    stage_name: "",
    description: "",
    stage_order: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

    const stageOrder =
      form.stage_order === ""
        ? undefined
        : Number(form.stage_order);

    if (
      stageOrder !== undefined &&
      (!Number.isInteger(stageOrder) ||
        stageOrder < 1)
    ) {
      setError(
        "Stage order must be a positive number."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      await onCreate({
        stage_name: stageName,
        description: form.description.trim(),
        ...(stageOrder !== undefined
          ? { stage_order: stageOrder }
          : {}),
      });
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Failed to create stage."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!pipeline) {
    return null;
  }

  return (
    <div
      className="stage-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          if (!saving) {
            onClose();
          }
        }
      }}
    >
      <div className="stage-modal">
        <div className="stage-modal-header">
          <div>
            <h2>Add Stage</h2>

            <p>
              Add a new stage to{" "}
              <strong>
                {pipeline.pipeline_name}
              </strong>
            </p>
          </div>

          <button
            type="button"
            className="stage-modal-close"
            onClick={onClose}
            disabled={saving}
          >
            ×
          </button>
        </div>

        {error && (
          <div className="stage-modal-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="stage-form-group">
            <label htmlFor="stage_name">
              Stage Name
            </label>

            <input
              id="stage_name"
              type="text"
              name="stage_name"
              value={form.stage_name}
              onChange={handleChange}
              placeholder="e.g. Contract Sent"
              disabled={saving}
              autoFocus
            />
          </div>

          <div className="stage-form-group">
            <label htmlFor="stage_description">
              Description
            </label>

            <textarea
              id="stage_description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter stage description"
              rows={4}
              disabled={saving}
            />
          </div>

          <div className="stage-form-group">
            <label htmlFor="stage_order">
              Stage Order
              <span className="optional-label">
                Optional
              </span>
            </label>

            <input
              id="stage_order"
              type="number"
              name="stage_order"
              value={form.stage_order}
              onChange={handleChange}
              placeholder="Leave empty to add at end"
              min="1"
              disabled={saving}
            />

            <small>
              Leave this empty to automatically place
              the stage at the end of the pipeline.
            </small>
          </div>

          <div className="stage-modal-actions">
            <button
              type="button"
              className="stage-cancel-btn"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="stage-save-btn"
              disabled={
                saving ||
                !form.stage_name.trim()
              }
            >
              {saving
                ? "Creating..."
                : "Create Stage"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddStageModal;